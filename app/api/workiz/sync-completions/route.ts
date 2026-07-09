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
      before: string;
      after: string;
      changed: boolean;
    }[] = [];

    for (const job of jobs) {
      const uuid = job.workizJobId;
      if (!uuid) continue;

      let workizStatus = '';
      try {
        const workizData = await getJob(uuid);
        const record = workizData?.data?.[0];
        workizStatus = record?.Status || '';
      } catch {
        // Skip if Workiz call fails for this job
        continue;
      }

      const isComplete = workizStatus === 'Done';
      const newStatus = isComplete ? 'completed' : job.status;
      const changed = newStatus !== job.status;

      if (changed) {
        job.status = newStatus as typeof job.status;
        job.updatedAt = new Date().toISOString();
        updatedCount++;
      }

      results.push({
        id: job.id,
        storeNumber: job.storeNumber,
        workizUuid: uuid,
        before: changed ? job.status : job.status,
        after: newStatus,
        changed,
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
