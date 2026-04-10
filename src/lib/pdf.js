import { jsPDF } from 'jspdf';
import { generateQRCodeDataURL } from './qrcode';

const QR_BASE = 'https://attestr-app.vercel.app';

/**
 * Generate a full custody report PDF
 * @param {Object} data - Verification/registration result with custody info
 * @returns {Blob} PDF blob
 */
export function generateCustodyReport(data) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const W = 210, M = 18;
  let y = M;

  // Colors
  const DARK = [26, 26, 26];
  const GRAY = [120, 120, 120];
  const LIGHT = [200, 200, 200];
  const GREEN = [22, 163, 74];
  const RED = [220, 38, 38];
  const ACCENT = [61, 107, 94];

  // ── Header ──
  doc.setFillColor(250, 250, 250);
  doc.rect(0, 0, W, 48, 'F');
  doc.setDrawColor(...ACCENT);
  doc.setLineWidth(0.8);
  doc.line(M, 46, W - M, 46);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(...DARK);
  doc.text('Attestr', M, 18);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...GRAY);
  doc.text('CHAIN OF CUSTODY REPORT', M, 26);
  doc.text(`Generated: ${new Date().toLocaleString()}`, M, 32);
  doc.text(`Report ID: ATR-${Date.now().toString(36).toUpperCase()}`, M, 38);

  // QR code in top-right
  if (data.block?.data?.sha256 || data.sha256) {
    const sha = data.block?.data?.sha256 || data.sha256;
    try {
      const qrUrl = `${QR_BASE}/verify?sha256=${sha}`;
      const qrDataUrl = generateQRCodeDataURL(qrUrl, 200);
      doc.addImage(qrDataUrl, 'PNG', W - M - 28, 8, 28, 28);
    } catch {}
  }

  y = 56;

  // ── File Identity ──
  sectionHeader(doc, 'FILE IDENTITY', M, y);
  y += 8;

  const block = data.block;
  const filename = block?.data?.filename || data.filename || 'Unknown';
  const mimeType = block?.data?.mimeType || data.mimeType || 'Unknown';
  const fileSize = block?.data?.fileSize || data.fileSize || 0;
  const sha256 = block?.data?.sha256 || data.sha256 || 'N/A';

  y = kvRow(doc, 'Filename', filename, M, y);
  y = kvRow(doc, 'Type', mimeType, M, y);
  y = kvRow(doc, 'Size', fileSize > 1048576 ? (fileSize / 1048576).toFixed(2) + ' MB' : (fileSize / 1024).toFixed(1) + ' KB', M, y);
  y = kvRow(doc, 'SHA-256', sha256, M, y, true);
  if (block?.data?.dHash) y = kvRow(doc, 'Perceptual Hash', block.data.dHash, M, y, true);
  y += 4;

  // ── Registration ──
  sectionHeader(doc, 'REGISTRATION', M, y);
  y += 8;

  const registrant = data.registrant;
  y = kvRow(doc, 'Registered By', registrant?.name || block?.data?.userName || 'Unknown', M, y);
  y = kvRow(doc, 'Registration Date', block?.data?.registeredAt ? new Date(block.data.registeredAt).toLocaleString() : (block?.timestamp ? new Date(block.timestamp).toLocaleString() : 'N/A'), M, y);
  y = kvRow(doc, 'Block #', block?.index?.toString() || 'N/A', M, y);

  if (data.onChain?.transactionHash) {
    y = kvRow(doc, 'Ethereum TX', data.onChain.transactionHash, M, y, true);
    y = kvRow(doc, 'Eth Block', data.onChain.blockNumber?.toString() || 'N/A', M, y);
    y = kvRow(doc, 'Network', 'Sepolia Testnet', M, y);
  }

  // Revocation status
  if (data.isRevoked) {
    y += 2;
    doc.setFillColor(255, 230, 230);
    doc.roundedRect(M, y, W - 2 * M, 8, 1, 1, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...RED);
    doc.text('STATUS: REVOKED', M + 4, y + 5.5);
    y += 12;
  } else {
    y += 2;
    doc.setFillColor(230, 255, 238);
    doc.roundedRect(M, y, W - 2 * M, 8, 1, 1, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...GREEN);
    doc.text('STATUS: VALID & ACTIVE', M + 4, y + 5.5);
    y += 12;
  }

  // ── Attestation Note ──
  if (data.attestationNote || block?.data?.attestationNote) {
    const note = data.attestationNote || block.data.attestationNote;
    sectionHeader(doc, 'ATTESTATION NOTE', M, y);
    y += 8;
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    doc.setTextColor(...DARK);
    const lines = doc.splitTextToSize(`"${note}"`, W - 2 * M);
    doc.text(lines, M, y);
    y += lines.length * 4 + 6;
  }

  // ── Device Attestation ──
  const dev = data.deviceInfo || block?.data?.deviceInfo;
  if (dev) {
    sectionHeader(doc, 'DEVICE ATTESTATION', M, y);
    y += 8;
    y = kvRow(doc, 'Platform', dev.platform || 'N/A', M, y);
    y = kvRow(doc, 'Timezone', dev.timezone || 'N/A', M, y);
    y = kvRow(doc, 'Screen', dev.screenRes || 'N/A', M, y);
    y = kvRow(doc, 'Language', dev.language || 'N/A', M, y);
    y += 4;
  }

  // ── Co-Signers ──
  if (data.coSigners?.length > 0) {
    if (y > 240) { doc.addPage(); y = M; }
    sectionHeader(doc, `CO-ATTESTATIONS (${data.coSigners.length})`, M, y);
    y += 8;
    for (const cs of data.coSigners) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(...DARK);
      doc.text(`• ${cs.name}`, M + 2, y);
      doc.setTextColor(...GRAY);
      doc.text(cs.timestamp ? new Date(cs.timestamp).toLocaleDateString() : '', W - M - 30, y);
      y += 5;
    }
    y += 4;
  }

  // ── Chain of Custody Timeline ──
  const events = data.custodyTimeline || [];
  if (events.length > 0) {
    if (y > 220) { doc.addPage(); y = M; }
    sectionHeader(doc, `CHAIN OF CUSTODY (${events.length} events)`, M, y);
    y += 8;

    for (const evt of events) {
      if (y > 270) { doc.addPage(); y = M; }

      // Event type color
      let color = ACCENT;
      if (evt.type === 'registered') color = GREEN;
      if (evt.type === 'revoked') color = RED;
      if (evt.type === 'custody-transferred') color = [217, 119, 6];

      // Dot
      doc.setFillColor(...color);
      doc.circle(M + 3, y - 1, 1.5, 'F');

      // Line
      doc.setDrawColor(...LIGHT);
      doc.setLineWidth(0.3);
      doc.line(M + 3, y + 1, M + 3, y + 8);

      // Text
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(...DARK);
      let label = evt.type.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      if (evt.by) label += ` by ${evt.by}`;
      if (evt.toName) label += ` → ${evt.toName}`;
      doc.text(label, M + 8, y);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(...GRAY);
      if (evt.timestamp) doc.text(new Date(evt.timestamp).toLocaleString(), M + 8, y + 4);
      if (evt.note) {
        doc.setFont('helvetica', 'italic');
        doc.text(`"${evt.note}"`, M + 8, y + 8);
        y += 4;
      }
      if (evt.reason) {
        doc.setTextColor(...RED);
        doc.text(`Reason: ${evt.reason}`, M + 8, y + 8);
        y += 4;
      }

      y += 10;
    }
    y += 2;
  }

  // ── Verification History ──
  if (data.recentVerifications?.length > 0 || data.verificationCount > 0) {
    if (y > 250) { doc.addPage(); y = M; }
    sectionHeader(doc, `VERIFICATION HISTORY (${data.verificationCount || 0} total)`, M, y);
    y += 8;
    const recent = data.recentVerifications || [];
    for (const v of recent.slice(0, 10)) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(...DARK);
      doc.text(`${v.verifiedByName || 'Anonymous'} via ${v.source || 'web'}`, M + 2, y);
      doc.setTextColor(...GRAY);
      doc.text(v.timestamp ? new Date(v.timestamp).toLocaleString() : '', W - M - 40, y);
      y += 5;
    }
    y += 4;
  }

  // ── Footer ──
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setDrawColor(...LIGHT);
    doc.setLineWidth(0.3);
    doc.line(M, 285, W - M, 285);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...GRAY);
    doc.text('Attestr — Decentralized Media Authenticator', M, 291);
    doc.text(`Page ${i} of ${pageCount}`, W - M - 20, 291);
    doc.text('https://attestr-app.vercel.app', W / 2, 291, { align: 'center' });
  }

  return doc.output('blob');
}

function sectionHeader(doc, text, x, y) {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(61, 107, 94);
  doc.text(text, x, y);
  doc.setDrawColor(61, 107, 94);
  doc.setLineWidth(0.4);
  doc.line(x, y + 2, x + doc.getTextWidth(text), y + 2);
}

function kvRow(doc, label, value, x, y, mono = false) {
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  doc.text(label, x, y);

  doc.setFont(mono ? 'courier' : 'helvetica', 'normal');
  doc.setFontSize(mono ? 7 : 8.5);
  doc.setTextColor(26, 26, 26);

  const maxW = 210 - 2 * x - 40;
  const val = value || 'N/A';
  if (mono && val.length > 50) {
    doc.text(val.substring(0, 50) + '...', x + 38, y);
  } else {
    doc.text(val, x + 38, y);
  }
  return y + 5.5;
}

/**
 * Download custody report as PDF
 */
export function downloadCustodyReport(data) {
  const blob = generateCustodyReport(data);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const filename = data.block?.data?.filename || data.filename || 'attestr-report';
  a.download = `${filename.replace(/\.[^.]+$/, '')}-custody-report.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
