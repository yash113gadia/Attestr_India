/**
 * Universal Notary Certificate Generator
 * Creates a downloadable certificate image for ANY file type.
 * Uses HTML5 Canvas — no server required.
 */

export async function generateCertificate(metadata) {
  const { sha256, filename, fileSize, mimeType, timestamp, transactionHash, blockNumber, registeredBy } = metadata;

  const W = 1200;
  const H = 800;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  // ── Background ──
  ctx.fillStyle = '#06070A';
  ctx.fillRect(0, 0, W, H);

  // Subtle grid
  ctx.strokeStyle = 'rgba(255,255,255,0.03)';
  ctx.lineWidth = 0.5;
  for (let x = 0; x < W; x += 40) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
  }
  for (let y = 0; y < H; y += 40) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
  }

  // ── Tricolor top bar ──
  const barH = 4;
  ctx.fillStyle = '#FF9933'; ctx.fillRect(0, 0, W / 3, barH);
  ctx.fillStyle = '#FFFFFF'; ctx.fillRect(W / 3, 0, W / 3, barH);
  ctx.fillStyle = '#128807'; ctx.fillRect((W / 3) * 2, 0, W / 3, barH);

  // ── Ashoka Chakra watermark ──
  ctx.save();
  ctx.globalAlpha = 0.025;
  ctx.strokeStyle = '#6366F1';
  ctx.lineWidth = 1.5;
  const cx = W / 2, cy = H / 2, r = 280;
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath(); ctx.arc(cx, cy, r * 0.85, 0, Math.PI * 2); ctx.stroke();
  for (let i = 0; i < 24; i++) {
    const angle = (i * Math.PI) / 12;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + r * Math.cos(angle), cy + r * Math.sin(angle));
    ctx.stroke();
  }
  ctx.restore();

  // ── Border frame ──
  ctx.strokeStyle = 'rgba(99, 102, 241, 0.15)';
  ctx.lineWidth = 1;
  ctx.strokeRect(30, 30, W - 60, H - 60);

  // ── Corner ornaments ──
  const ornSize = 20;
  const orn = [[32, 32], [W - 32, 32], [32, H - 32], [W - 32, H - 32]];
  ctx.strokeStyle = '#FF9933';
  ctx.lineWidth = 2;
  for (const [ox, oy] of orn) {
    ctx.beginPath();
    ctx.moveTo(ox - ornSize, oy);
    ctx.lineTo(ox, oy);
    ctx.lineTo(ox, oy + (oy < H / 2 ? ornSize : -ornSize));
    ctx.stroke();
  }

  // ── Header ──
  ctx.fillStyle = '#FF9933';
  ctx.font = 'bold 11px "JetBrains Mono", monospace';
  ctx.letterSpacing = '4px';
  ctx.fillText('BHARAT DIGITAL NOTARY', 60, 72);
  ctx.letterSpacing = '0px';

  // Title
  ctx.fillStyle = '#E2E4E9';
  ctx.font = '48px "Instrument Serif", Georgia, serif';
  ctx.fillText('Certificate of Attestation', 60, 130);

  // Hindi subtitle
  ctx.fillStyle = 'rgba(255, 153, 51, 0.6)';
  ctx.font = '18px sans-serif';
  ctx.fillText('प्रमाण पत्र', 60, 158);

  // Divider
  ctx.fillStyle = 'rgba(255,255,255,0.1)';
  ctx.fillRect(60, 175, W - 120, 1);

  // ── File info ──
  const col1 = 60;
  const col2 = 400;
  let y = 210;
  const rowH = 50;

  function drawField(label, value, x, yPos) {
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.font = '10px "JetBrains Mono", monospace';
    ctx.fillText(label.toUpperCase(), x, yPos);
    ctx.fillStyle = '#E2E4E9';
    ctx.font = '14px "DM Sans", system-ui, sans-serif';
    ctx.fillText(value || '—', x, yPos + 20);
  }

  drawField('filename', filename || 'unknown', col1, y);
  drawField('file type', mimeType || 'unknown', col2, y);
  y += rowH;
  
  const sizeStr = fileSize ? (fileSize > 1048576 ? (fileSize / 1048576).toFixed(2) + ' MB' : (fileSize / 1024).toFixed(1) + ' KB') : '—';
  drawField('file size', sizeStr, col1, y);
  const dateStr = timestamp ? new Date(timestamp * 1000).toLocaleString() : new Date().toLocaleString();
  drawField('notarization date', dateStr, col2, y);
  y += rowH;

  if (registeredBy) {
    drawField('registered by', registeredBy, col1, y);
    y += rowH;
  }

  // ── SHA-256 full hash ──
  y += 10;
  ctx.fillStyle = 'rgba(255,255,255,0.1)';
  ctx.fillRect(60, y, W - 120, 1);
  y += 20;

  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.font = '10px "JetBrains Mono", monospace';
  ctx.fillText('SHA-256 FINGERPRINT', col1, y);
  y += 22;
  ctx.fillStyle = '#6366F1';
  ctx.font = '15px "JetBrains Mono", monospace';
  ctx.fillText(sha256 || '—', col1, y);

  // ── Blockchain proof ──
  if (transactionHash) {
    y += 40;
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.font = '10px "JetBrains Mono", monospace';
    ctx.fillText('ETHEREUM SEPOLIA TRANSACTION', col1, y);
    y += 22;
    ctx.fillStyle = '#128807';
    ctx.font = '13px "JetBrains Mono", monospace';
    ctx.fillText(transactionHash, col1, y);

    if (blockNumber) {
      y += 25;
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.font = '10px "JetBrains Mono", monospace';
      ctx.fillText('BLOCK NUMBER', col1, y);
      ctx.fillStyle = '#E2E4E9';
      ctx.font = '14px "JetBrains Mono", monospace';
      ctx.fillText(String(blockNumber), col1 + 140, y);
    }
  }

  // ── Footer ──
  // Tricolor bottom bar
  ctx.fillStyle = '#FF9933'; ctx.fillRect(0, H - barH, W / 3, barH);
  ctx.fillStyle = '#FFFFFF'; ctx.fillRect(W / 3, H - barH, W / 3, barH);
  ctx.fillStyle = '#128807'; ctx.fillRect((W / 3) * 2, H - barH, W / 3, barH);

  // Footer text
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  ctx.font = '10px "JetBrains Mono", monospace';
  ctx.fillText('Attestr प्रमाण · Bharat Sovereign Notary · attestr.in', 60, H - 25);

  ctx.fillStyle = 'rgba(255,255,255,0.15)';
  ctx.font = '9px "JetBrains Mono", monospace';
  const verifyText = 'Verify at attestr.in/verify · This certificate is cryptographically linked to the Ethereum blockchain';
  ctx.fillText(verifyText, 60, H - 50);

  // Seal stamp in bottom right
  ctx.save();
  ctx.globalAlpha = 0.15;
  const stampX = W - 140, stampY = H - 140, stampR = 50;
  ctx.beginPath(); ctx.arc(stampX, stampY, stampR, 0, Math.PI * 2); ctx.closePath();
  ctx.strokeStyle = '#128807'; ctx.lineWidth = 3; ctx.stroke();
  ctx.beginPath(); ctx.arc(stampX, stampY, stampR - 8, 0, Math.PI * 2); ctx.closePath();
  ctx.stroke();
  for (let i = 0; i < 24; i++) {
    const angle = (i * Math.PI) / 12;
    ctx.beginPath();
    ctx.moveTo(stampX, stampY);
    ctx.lineTo(stampX + (stampR - 8) * Math.cos(angle), stampY + (stampR - 8) * Math.sin(angle));
    ctx.stroke();
  }
  ctx.restore();

  ctx.fillStyle = 'rgba(18, 136, 7, 0.3)';
  ctx.font = 'bold 8px "JetBrains Mono", monospace';
  ctx.save();
  ctx.translate(stampX, stampY);
  ctx.fillText('VERIFIED', -20, 3);
  ctx.restore();

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      const cleanName = (filename || 'file').replace(/\.[^.]+$/, '');
      resolve({ blob, url, filename: `Attestr_Certificate_${cleanName}.png` });
    }, 'image/png', 0.95);
  });
}
