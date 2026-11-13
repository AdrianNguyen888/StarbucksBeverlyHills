import { NextRequest, NextResponse } from 'next/server';
import { getAllJobs } from '@/lib/db';
import { getJob, updateJob } from '@/lib/workiz';

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { jobKvId?: string; invoiceNumber?: string };
    const jobKvId = body.jobKvId?.trim();
    const invoiceNumber = body.invoiceNumber?.trim();

    if (!jobKvId || !invoiceNumber) {
      return NextResponse.json(
        { success: false, error: 'jobKvId and invoiceNumber are required' },
        { status: 400 },
      );
    }

    const jobs = await getAllJobs();
    const job = jobs.find((item) => item.id === jobKvId);
    if (!job) {
      return NextResponse.json({ success: false, error: 'Job not found' }, { status: 404 });
    }
    if (!job.workizJobId) {
      return NextResponse.json(
        { success: false, error: 'No workizJobId for this job' },
        { status: 400 },
      );
    }

    const workizResponse = await getJob(job.workizJobId);
    const workizJob = workizResponse?.data?.[0] ?? workizResponse?.data ?? workizResponse;
    const currentNotes = typeof workizJob?.JobNotes === 'string' ? workizJob.JobNotes : '';

    if (currentNotes.includes(invoiceNumber)) {
      return NextResponse.json({ success: true, written: false });
    }

    await updateJob(job.workizJobId, {
      JobNotes: `${currentNotes}\nInvoice #: ${invoiceNumber}`,
    });

    return NextResponse.json({ success: true, written: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
