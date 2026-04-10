// QR Code generator using the 'qrcode' library (proper Reed-Solomon ECC)
import QRCode from 'qrcode';

export function generateQRCodeDataURL(text, size = 200) {
  // Use synchronous canvas-based generation via toDataURL
  // We create a hidden canvas, generate QR, return the data URL
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  
  // QRCode.toCanvas is async, but we need sync for <img src=...>
  // Use QRCode.create() for raw module data and render manually
  const qr = QRCode.create(text, { errorCorrectionLevel: 'M' });
  const modules = qr.modules;
  const moduleCount = modules.size;
  const ctx = canvas.getContext('2d');
  const cellSize = size / (moduleCount + 2); // +2 for quiet zone

  // White background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, size, size);

  // Draw modules
  ctx.fillStyle = '#000000';
  for (let row = 0; row < moduleCount; row++) {
    for (let col = 0; col < moduleCount; col++) {
      if (modules.get(row, col)) {
        ctx.fillRect(
          (col + 1) * cellSize,
          (row + 1) * cellSize,
          cellSize,
          cellSize
        );
      }
    }
  }

  return canvas.toDataURL('image/png');
}
