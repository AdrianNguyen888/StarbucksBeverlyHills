import { NextResponse } from 'next/server';
import { getJob } from '@/lib/workiz';
import { getAllJobs, setAllJobs } from '@/lib/db';

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

        // 3. startTime as HH:MM only
        const newStartTime = toTimeOnly(jobDateTime);
        if (newStartTime && newStartTime !== job.startTime) {
          changes.push(`startTime: ${job.startTime || 'empty'} → ${newStartTime}`);
          job.startTime = newStartTime;
        }
      }

      // 4. stopTime as HH:MM only
      if (jobEndDateTime) {
        const newStopTime = toTimeOnly(jobEndDateTime);
        if (newStopTime && newStopTime !== job.stopTime) {
          changes.push(`stopTime: ${job.stopTime || 'empty'} → ${newStopTime}`);
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
