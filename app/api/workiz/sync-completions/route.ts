import { NextResponse } from 'next/server';
import { getJob } from '@/lib/workiz';
import { getAllJobs, setAllJobs } from '@/lib/db';

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

      let workizRecord: Record<string, string> | null = null;
      try {
        const workizData = await getJob(uuid);
        workizRecord = workizData?.data?.[0] || null;
      } catch {
        continue;
      }

      if (!workizRecord) continue;

      const changes: string[] = [];

      // 1. Sync status
      const workizStatus = workizRecord.Status || '';
      const isComplete = workizStatus === 'Done';
      const newStatus = isComplete ? 'completed' : job.status;
      if (newStatus !== job.status) {
        job.status = newStatus as typeof job.status;
        changes.push(`status: ${job.status} → ${newStatus}`);
      }

      // 2. Sync serviceDate from JobDateTime (e.g. "2026-07-10 23:00:00" → "2026-07-10")
      const jobDateTime = workizRecord.JobDateTime || '';
      if (jobDateTime) {
        const workizDate = jobDateTime.split(' ')[0]; // "YYYY-MM-DD"
        if (workizDate && workizDate !== job.serviceDate) {
          changes.push(`serviceDate: ${job.serviceDate} → ${workizDate}`);
          job.serviceDate = workizDate;
        }
      }

      // 3. Sync startTime / stopTime
      const jobEndDateTime = workizRecord.JobEndDateTime || '';
      if (jobDateTime && job.startTime !== jobDateTime) {
        job.startTime = jobDateTime;
        changes.push(`startTime updated`);
      }
      if (jobEndDateTime && job.stopTime !== jobEndDateTime) {
        job.stopTime = jobEndDateTime;
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
