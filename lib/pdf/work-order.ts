import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import fs from 'fs';
import path from 'path';

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

export async function generateWorkOrderPDF(data: WorkOrderData): Promise<Uint8Array> {
  let templateBytes: Buffer | ArrayBuffer;

  // Strategy 1: direct filesystem read (works locally and with outputFileTracingIncludes on Vercel)
  const templatePath = path.join(process.cwd(), 'public', 'wo-templates', `${data.storeNumber}.pdf`);
  try {
    templateBytes = fs.readFileSync(templatePath);
  } catch {
    // Strategy 2: fetch from the app's own public URL (Vercel CDN always has public/ files)
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/wo-templates/${data.storeNumber}.pdf`);
    if (!response.ok) {
      throw new Error(`WO template not found for store ${data.storeNumber}`);
    }
    templateBytes = await response.arrayBuffer();
  }

  const pdfDoc = await PDFDocument.load(templateBytes);
  const pages = pdfDoc.getPages();
  const page = pages[0];
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontSize = 9;

  // PDF coordinate system: origin is BOTTOM-LEFT, y increases upward
  // Field positions derived from bbox analysis of the GoSuperClean Sign Off Sheet PDF:
  const printNameX = 90;
  const dateX = 240;
  const timeInX = 90;
  const timeOutX = 253;
  const row1Y = 289; // Print Name / Date row
  const row2Y = 259; // Time In / Time Out row

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
