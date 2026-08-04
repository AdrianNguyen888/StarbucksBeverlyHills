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

export async function generateWorkOrderPDF(data: WorkOrderData): Promise<Uint8Array> {
  // Fetch the base GoSuperClean PDF for this store
  const templateUrl = `/wo-templates/${data.storeNumber}.pdf`;
  const response = await fetch(templateUrl);
  if (!response.ok) {
    throw new Error(`WO template not found for store ${data.storeNumber}`);
  }
  const templateBytes = await response.arrayBuffer();

  const pdfDoc = await PDFDocument.load(templateBytes);
  const pages = pdfDoc.getPages();
  const page = pages[0];
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontSize = 9;

  // PDF coordinate system: origin is BOTTOM-LEFT, y increases upward
  // Page is 612 x 792 pts
  // Convert from pdftotext bbox (top-left origin) to pdf-lib (bottom-left origin):
  // pdf-lib y = 792 - bbox_yMax

  // Field positions (from bbox analysis of the GoSuperClean PDF):
  // Print Name field: fill area starting at x=90, bbox_y≈506-518 → pdf-lib y = 792-518 = 274, draw at y=278
  // Date field: fill area starting at x=270, same row → pdf-lib y=278
  // Time In field: fill area starting at x=90, bbox_y≈536-548 → pdf-lib y = 792-548 = 244, draw at y=248
  // Time Out field: fill area starting at x=270, same row → pdf-lib y=248

  const printNameX = 90;
  const dateX = 240;
  const timeInX = 90;
  const timeOutX = 253;
  const row1Y = 289; // Print Name / Date row
  const row2Y = 259; // Time In / Time Out row

  // Format values
  const techName = data.technician || '';
  const dateStr = formatDateShort(data.serviceDate);
  const timeInStr = formatTime(data.startTime);
  const timeOutStr = formatTime(data.stopTime);

  const textColor = rgb(0, 0, 0);

  // Draw Print Name
  if (techName) {
    page.drawText(techName, { x: printNameX, y: row1Y, size: fontSize, font, color: textColor });
  }

  // Draw Date
  if (dateStr) {
    page.drawText(dateStr, { x: dateX, y: row1Y, size: fontSize, font, color: textColor });
  }

  // Draw Time In
  if (timeInStr) {
    page.drawText(timeInStr, { x: timeInX, y: row2Y, size: fontSize, font, color: textColor });
  }

  // Draw Time Out
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
