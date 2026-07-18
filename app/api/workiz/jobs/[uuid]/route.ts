import { NextRequest, NextResponse } from 'next/server';
import { getJob } from '@/lib/workiz';

// GET /api/workiz/jobs/[uuid]
// Returns the Workiz job and parses woNumber from LastName field (format: "WO-XXXXXXX")
export async function GET(_req: NextRequest, { params }: { params: Promise<{ uuid: string }> }) {
  try {
    const { uuid } = await params;
    const result = await getJob(uuid);

    // Workiz wraps the job in data[] array
    const jobData = result?.data?.[0] ?? result?.data ?? result;

    // Parse WO number from LastName field — format is "WO-1964259" or "WO1964259"
    const lastName: string = jobData?.LastName || '';
    const woMatch = lastName.match(/WO[-\s]?(\d+)/i);
    const woNumber = woMatch ? woMatch[1] : undefined;

    return NextResponse.json({ success: true, workizJob: jobData, woNumber });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
