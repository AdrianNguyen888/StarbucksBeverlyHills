import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

interface WorkOrderData {
  storeNumber: string;
  woNumber: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  storePhone: string;
  serviceDate: string;
  technician: string;
  startTime: string;
  stopTime: string;
}

function getBaseUrl(): string {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  // NEXT_PUBLIC_APP_URL = stable canonical URL (e.g. https://starbucks-beverly-hills.vercel.app)
  // Set this in Vercel env vars to avoid VERCEL_URL (deployment-specific, can redirect HTML)
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }
  // VERCEL_PROJECT_PRODUCTION_URL is always the stable production domain (no deploy-specific hash)
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return 'http://localhost:3000';
}

export async function generateWorkOrderPDF(data: WorkOrderData): Promise<Uint8Array> {
  const baseUrl = getBaseUrl();
  const templateUrl = `${baseUrl}/wo-templates/${data.storeNumber}.pdf`;
  const response = await fetch(templateUrl);
  if (!response.ok) {
    throw new Error(`WO template not found for store ${data.storeNumber} (status ${response.status} from ${templateUrl})`);
  }
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('pdf') && !contentType.includes('octet-stream')) {
    throw new Error(`WO template returned wrong content-type: ${contentType} from ${templateUrl}`);
  }
  const templateBytes = await response.arrayBuffer();

  const pdfDoc = await PDFDocument.load(templateBytes);
  const pages = pdfDoc.getPages();
  const page = pages[0];
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontSize = 9;

  // Coords calibrated from Oct 2026 GoSuperClean Sign Off Sheet PDFs (fitz y -> pdf-lib y = 792 - fitz_y)
  // Signature/Print Name line underline at fitz y=543 -> pdf-lib y=249; text ON the underline
  // Time In/Time Out underline at fitz y=608 -> pdf-lib y=184; text ON the underline
  // Left col x=75 (centered in 163pt field starting x=29), right col x=270 (centered in 130pt field starting x=207)
  // Coordinates in pdf-lib system (bottom-left origin, y increases upward, page height 792)
  // Print Name underline at fitz y=580 -> pdf-lib y=212, text just above at pdf-lib y=215
  // Time In underline at fitz y=610   -> pdf-lib y=182, text just above at pdf-lib y=185
  // Left col x=35, right col x=212
  const printNameX = 35;
  const dateX = 212;
  const timeInX = 35;
  const timeOutX = 212;
  const row1Y = 215; // Print Name / Date row
  const row2Y = 185; // Time In / Time Out row // Time In / Time Out row

  const techName = data.technician || '';
  const dateStr = formatDateShort(data.serviceDate);
  const timeInStr = formatTime(data.startTime);
  const timeOutStr = formatTime(data.stopTime);
  const textColor = rgb(0, 0, 0);

  if (techName) {
    page.drawText(techName, { x: printNameX, y: row1Y, size: fontSize, font, color: textColor });
  }
  if (dateStr) {
    page.drawText(dateStr, { x: dateX, y: row1Y, size: fontSize, font, color: textColor });
  }
  if (timeInStr) {
    page.drawText(timeInStr, { x: timeInX, y: row2Y, size: fontSize, font, color: textColor });
  }
  if (timeOutStr) {
    page.drawText(timeOutStr, { x: timeOutX, y: row2Y, size: fontSize, font, color: textColor });
  }

  return pdfDoc.save();
}

function formatDateShort(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

function formatTime(time: string): string {
  if (!time) return '';
  const [h, m] = time.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${m.toString().padStart(2, '0')} ${ampm}`;
}
