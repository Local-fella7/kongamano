import QRCode from 'qrcode';

export interface QrCanvasOptions {
  registration: Record<string, any>;
  index: number;
  totalCount?: number;
  originUrl?: string;
}

/**
 * Helper function to generate a complete labeled QR badge image on an HTML5 canvas.
 * Label Rule:
 * Header: `${FirstName} ${LastName} - ${PaddedIndex}`
 * If name is missing: `Mwombaji - ${PaddedIndex}` (e.g. Mwombaji - 0001)
 */
export async function generateLabeledQrCanvasBlob(options: QrCanvasOptions): Promise<{ blob: Blob; fileName: string; headerText: string }> {
  const { registration, index, totalCount = 1, originUrl = '' } = options;

  const eventId = registration.event_id || 1;
  const regId = registration.id || index + 1;
  const fullQrUrl = `${originUrl}/scan?code=${encodeURIComponent(rawCode)}`;

  const extractStr = (val: any): string => {
    if (!val) return '';
    if (typeof val === 'string') return val.trim();
    if (typeof val === 'object') {
      const prop = val.name || val.region || val.district || val.title || val.label || Object.values(val)[0] || '';
      return typeof prop === 'string' ? prop.trim() : String(prop).trim();
    }
    return String(val).trim();
  };

  // 1. Determine Year (from event start date or current year)
  let year = 2026;
  if (registration.event?.start_date) {
    const parsed = new Date(registration.event.start_date).getFullYear();
    if (!isNaN(parsed)) year = parsed;
  }

  // 2. Determine Location First Letter (e.g. 'D' for Dodoma, 'M' for default/Mwombaji)
  const region = extractStr(registration.region) || extractStr(registration.district) || extractStr(registration.location);
  const locationLetter = region.length > 0 ? region[0].toUpperCase() : 'M';

  // 3. Padded 5-digit index based on registration ID or batch index
  const baseNumber = Number(registration.id) || (typeof index === 'number' ? index + 1 : 1);
  const paddedIndex = String(baseNumber).padStart(5, '0');
  const headerText = `${year}-${locationLetter}-${paddedIndex}`;

  const firstName = extractStr(registration.first_name);
  const lastName = extractStr(registration.last_name);
  const fullName = `${firstName} ${lastName}`.trim();

  // Sanitize filename for ZIP entry: e.g. 2026-D-00001.png
  const fileName = `${headerText}.png`;

  // 1. Generate base QR Data URL
  const qrDataUrl = await QRCode.toDataURL(fullQrUrl, {
    width: 320,
    margin: 1,
    color: {
      dark: '#0f172a',
      light: '#ffffff',
    },
  });

  // 2. Create offscreen HTML5 Canvas
  const canvasWidth = 420;
  const canvasHeight = 490;
  const canvas = document.createElement('canvas');
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Canvas 2D context not supported');
  }

  // Draw background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  // Draw Outer Border
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 4;
  ctx.strokeRect(2, 2, canvasWidth - 4, canvasHeight - 4);

  // Draw Top Header Banner Background (#43766C theme accent)
  ctx.fillStyle = '#43766C';
  ctx.fillRect(0, 0, canvasWidth, 75);

  // Draw Top Header Text (e.g. 2026-D-00001)
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 24px "Segoe UI", monospace, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(headerText, canvasWidth / 2, 38);

  // Draw QR Image onto Canvas
  const img = new Image();
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = (err) => reject(err);
    img.src = qrDataUrl;
  });

  const qrSize = 320;
  const qrX = (canvasWidth - qrSize) / 2;
  const qrY = 90;
  ctx.drawImage(img, qrX, qrY, qrSize, qrSize);

  // Draw Bottom Footer Banner
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(0, 420, canvasWidth, 70);

  ctx.fillStyle = '#334155';
  ctx.font = 'bold 14px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(rawCode, canvasWidth / 2, 438);

  ctx.fillStyle = '#64748b';
  ctx.font = '12px "Segoe UI", Arial, sans-serif';
  const subText = fullName ? `${fullName} • ${region || 'Delegate'} • Pass` : `ID: ${regId} • ${region || 'Mwombaji'} Pass`;
  ctx.fillText(subText, canvasWidth / 2, 462);

  // Convert canvas to PNG Blob
  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob((b) => resolve(b), 'image/png');
  });

  if (!blob) {
    throw new Error('Failed to render canvas to PNG blob');
  }

  return { blob, fileName, headerText };
}
