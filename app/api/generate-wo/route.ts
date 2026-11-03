import { NextRequest, NextResponse } from 'next/server';
import { generateWorkOrderPDF } from '@/lib/pdf/work-order';

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const pdfBytes = await generateWorkOrderPDF(data);
    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="WO_${data.storeNumber}.pdf"`,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
