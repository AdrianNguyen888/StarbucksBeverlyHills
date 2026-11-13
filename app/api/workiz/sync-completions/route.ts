import { NextResponse } from 'next/server';
import { getInvoiceAll, getJob } from '@/lib/workiz';
import { getAllJobs, setAllJobs } from '@/lib/db';

const COMPANYCAM_BASE = 'https://api.companycam.com/v2';
const LA_TIME_ZONE = 'America/Los_Angeles';

interface CompanyCamProject {
  id: string | number;
  name?: string;
}

interface CompanyCamPhoto {
  captured_at?: number;
  labels?: Array<{
    name?: string;
    display_value?: string;
    value?: string;
  }>;
}

function responseItems<T>(payload: unknown): T[] {
  if (Array.isArray(payload)) return payload as T[];
  if (!payload || typeof payload !== 'object') return [];

  const record = payload as Record<string, unknown>;
  for (const key of ['data', 'results', 'projects', 'photos', 'invoices']) {
    if (Array.isArray(record[key])) return record[key] as T[];
  }
  return [];
}

function formatLaTime(timestampSeconds: number): string {
  return new Date(timestampSeconds * 1000).toLocaleTimeString('en-US', {
    timeZone: LA_TIME_ZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

async function getCompanyCamTimes(storeNumber: string): Promise<{ startTime: string; stopTime: string } | null> {
  const token = process.env.COMPANYCAM_API_TOKEN;
  if (!token) return null;

  try {
    const headers = { Authorization: `Bearer ${token}`, Accept: 'application/json' };
    const projectResponse = await fetch(
      `${COMPANYCAM_BASE}/projects?query=${encodeURIComponent(storeNumber)}`,
      { headers },
    );
    if (!projectResponse.ok) return null;

    const projects = responseItems<CompanyCamProject>(await projectResponse.json());
    const project = projects.find((item) => item.name?.includes(storeNumber));
    if (!project) return null;

    const photoResponse = await fetch(
      `${COMPANYCAM_BASE}/projects/${encodeURIComponent(String(project.id))}/photos?page=1&per_page=200`,
      { headers },
    );
    if (!photoResponse.ok) return null;

    const photos = responseItems<CompanyCamPhoto>(await photoResponse.json());
    const tagged = photos.filter(
      (photo) =>
        typeof photo.captured_at === 'number' &&
        photo.captured_at > 0 &&
        photo.labels?.some((label) =>
          /before|after/i.test(label.name || label.display_value || label.value || ''),
        ),
    );
    if (tagged.length === 0) return null;

    const mostRecent = Math.max(...tagged.map((photo) => photo.captured_at as number));
    const windowStart = mostRecent - 6 * 60 * 60;
    const timestamps = tagged
      .map((photo) => photo.captured_at as number)
      .filter((timestamp) => timestamp >= windowStart)
      .sort((a, b) => a - b);
    if (timestamps.length === 0) return null;

    return {
      startTime: formatLaTime(timestamps[0]),
      stopTime: formatLaTime(timestamps[timestamps.length - 1]),
    };
  } catch {
    return null;
  }
}

function getInvoiceNumber(record: Record<string, unknown>, allowGenericNumber = true): string {
  for (const [key, value] of Object.entries(record)) {
    const isInvoiceNumber = /^(invoice[_\s-]*(number|num|no)|display[_\s-]*number)$/i.test(key);
    const isGenericNumber = allowGenericNumber && /^number$/i.test(key);
    if (!isInvoiceNumber && !isGenericNumber) continue;
    if (typeof value === 'string' || typeof value === 'number') {
      const number = String(value).trim();
      if (number) return number;
    }
  }
  return '';
}

function invoiceMatchesJob(
  invoice: Record<string, unknown>,
  uuid: string,
  serialId: string,
): boolean {
  const matchValues = new Set([uuid, serialId].filter(Boolean).map((value) => value.toLowerCase()));
  if (matchValues.size === 0) return false;

  return Object.entries(invoice).some(([key, value]) => {
    if (!/(job|uuid|serial)/i.test(key)) return false;
    if (typeof value !== 'string' && typeof value !== 'number') return false;
    return matchValues.has(String(value).trim().toLowerCase());
  });
}

async function findInvoiceNumber(
  workizRecord: Record<string, unknown>,
  uuid: string,
): Promise<string> {
  const directNumber = getInvoiceNumber(workizRecord, false);
  if (directNumber) return directNumber;

  try {
    const response = await getInvoiceAll(50);
    const invoices = responseItems<Record<string, unknown>>(response);
    const serialId = String(workizRecord.SerialId || workizRecord.SerialID || '').trim();
    const invoice = invoices.find((item) => invoiceMatchesJob(item, uuid, serialId));
    return invoice ? getInvoiceNumber(invoice) : '';
  } catch {
    return '';
  }
}

// Parse "YYYY-MM-DD HH:MM:SS" → "HH:MM" (time only, for <input type="time">)
function toTimeOnly(datetime: string): string {
  if (!datetime) return '';
  const parts = datetime.split(' ');
  if (parts.length < 2) return '';
  return parts[1].substring(0, 5); // "HH:MM"
}

// Parse "YYYY-MM-DD HH:MM:SS" → "YYYY-MM-DD"
function toDateOnly(datetime: string): string {
  if (!datetime) return '';
  return datetime.split(' ')[0];
}

export async function GET() {
  try {
    const jobs = await getAllJobs();

    let updatedCount = 0;
    const results: {
      id: string;
      storeNumber: string;
      workizUuid: string;
      changes: string[];
    }[] = [];

    for (const job of jobs) {
      const uuid = job.workizJobId;
      if (!uuid) continue;

      let workizRecord: Record<string, unknown> | null = null;
      try {
        const workizData = await getJob(uuid);
        workizRecord = (workizData?.data?.[0] as Record<string, unknown>) || null;
      } catch {
        continue;
      }

      if (!workizRecord) continue;

      const changes: string[] = [];

      // 1. Status
      const workizStatus = (workizRecord.Status as string) || '';
      const newStatus = workizStatus === 'Done' ? 'completed' : job.status;
      if (newStatus !== job.status) {
        changes.push(`status: ${job.status} → ${newStatus}`);
        job.status = newStatus as typeof job.status;
      }

      // 2. serviceDate from JobDateTime
      const jobDateTime = (workizRecord.JobDateTime as string) || '';
      const jobEndDateTime = (workizRecord.JobEndDateTime as string) || '';

      if (jobDateTime) {
        const workizDate = toDateOnly(jobDateTime);
        if (workizDate && workizDate !== job.serviceDate) {
          changes.push(`serviceDate: ${job.serviceDate} → ${workizDate}`);
          job.serviceDate = workizDate;
        }
      }

      // 3. Actual start/stop times from recent Before/After CompanyCam photos.
      if (newStatus === 'completed' && (!job.startTime || !job.stopTime)) {
        const companyCamTimes = await getCompanyCamTimes(job.storeNumber);
        if (companyCamTimes) {
          if (!job.startTime) {
            changes.push(`startTime: empty → ${companyCamTimes.startTime} (CompanyCam)`);
            job.startTime = companyCamTimes.startTime;
          }
          if (!job.stopTime) {
            changes.push(`stopTime: empty → ${companyCamTimes.stopTime} (CompanyCam)`);
            job.stopTime = companyCamTimes.stopTime;
          }
        }
      }

      // 4. Fall back to Workiz scheduled times only when no actual/manual value exists.
      if (!job.startTime && jobDateTime) {
        const newStartTime = toTimeOnly(jobDateTime);
        if (newStartTime) {
          changes.push(`startTime: empty → ${newStartTime} (scheduled)`);
          job.startTime = newStartTime;
        }
      }

      if (!job.stopTime && jobEndDateTime) {
        const newStopTime = toTimeOnly(jobEndDateTime);
        if (newStopTime) {
          changes.push(`stopTime: empty → ${newStopTime} (scheduled)`);
          job.stopTime = newStopTime;
        }
      }

      // 5. assignedTech from Team array — use first tech name
      const team = workizRecord.Team as Array<{ id: number; Name: string }> | undefined;
      if (team && team.length > 0) {
        const techName = team[0].Name;
        if (techName && techName !== job.assignedTech) {
          changes.push(`assignedTech: ${job.assignedTech || 'Unassigned'} → ${techName}`);
          job.assignedTech = techName;
        }
      }

      // 6. Invoice number from Workiz, when exposed by the job or invoice list.
      if (!job.invoiceNumber) {
        const invoiceNumber = await findInvoiceNumber(workizRecord, uuid);
        if (invoiceNumber) {
          changes.push(`invoiceNumber: empty → ${invoiceNumber}`);
          job.invoiceNumber = invoiceNumber;
        }
      }

      if (changes.length > 0) {
        job.updatedAt = new Date().toISOString();
        updatedCount++;
      }

      results.push({
        id: job.id,
        storeNumber: job.storeNumber,
        workizUuid: uuid,
        changes,
      });
    }

    if (updatedCount > 0) {
      await setAllJobs(jobs);
    }

    return NextResponse.json({
      success: true,
      totalJobs: jobs.length,
      jobsChecked: results.length,
      updatedCount,
      results,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
