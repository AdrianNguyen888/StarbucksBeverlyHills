import { NextResponse } from 'next/server';
import { createClient } from 'redis';
import { Job } from '@/lib/types';

const REDIS_URL = process.env.REDIS_URL || '';
const JOBS_KEY = 'starbucks:jobs';

const WORKIZ_TOKEN = process.env.WORKIZ_API_TOKEN || '';
const WORKIZ_SECRET = process.env.WORKIZ_API_SECRET || '';
const WORKIZ_BASE = 'https://api.workiz.com/api/v1';

async function getJobFromWorkiz(uuid: string): Promise<{ status: string; startTime: string; endTime: string } | null> {
  const url = `${WORKIZ_BASE}/${WORKIZ_TOKEN}/job/get/${uuid}/?auth_secret=${WORKIZ_SECRET}`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = await res.json();
  if (!data.flag || !data.data?.length) return null;
  const job = data.data[0];
  return {
    status: job.Status || '',
    startTime: job.JobDateTime || '',
    endTime: job.JobEndDateTime || '',
  };
}

export async function GET() {
  if (!REDIS_URL) {
    return NextResponse.json({ error: 'REDIS_URL not configured' }, { status: 500 });
  }
  if (!WORKIZ_TOKEN || !WORKIZ_SECRET) {
    return NextResponse.json({ error: 'WORKIZ_API_TOKEN or WORKIZ_API_SECRET not configured' }, { status: 500 });
  }

  const client = createClient({ url: REDIS_URL });
  client.on('error', (err) => console.error('Redis error:', err));
  await client.connect();

  try {
    const raw = await client.get(JOBS_KEY);
    const jobs: Job[] = raw ? JSON.parse(raw) : [];

    let updatedCount = 0;
    const results: { id: string; storeNumber: string; workizUuid: string; before: string; after: string; changed: boolean }[] = [];

    for (const job of jobs) {
      const uuid = job.workizJobId;
      if (!uuid) continue;

      const workizData = await getJobFromWorkiz(uuid);
      if (!workizData) continue;

      const isComplete = workizData.status === 'Done';
      const newStatus: Job['status'] = isComplete ? 'completed' : job.status === 'completed' ? 'completed' : job.status;

      const changed = newStatus !== job.status;
      if (changed) {
        job.status = newStatus;
        job.updatedAt = new Date().toISOString();
        updatedCount++;
      }

      results.push({
        id: job.id,
        storeNumber: job.storeNumber,
        workizUuid: uuid,
        before: changed ? (isComplete ? 'in-progress' : job.status) : job.status,
        after: newStatus,
        changed,
      });
    }

    if (updatedCount > 0) {
      await client.set(JOBS_KEY, JSON.stringify(jobs));
    }

    return NextResponse.json({
      success: true,
      totalJobs: jobs.length,
      jobsWithWorkizId: results.length,
      updatedCount,
      results,
    });
  } finally {
    await client.disconnect();
  }
}
