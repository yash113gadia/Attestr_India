/**
 * Utility to generate a "Social Notary Seal" overlay on an image.
 * Uses HTML5 Canvas for client-side generation.
 */

export async function generateNotarySeal(imageFile, metadata) {
  return new Promise((resolve, reject) => {
    const { sha256, timestamp, filename } = metadata;
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        // Set canvas size to match image
        canvas.width = img.width;
        canvas.height = img.height;

        // Draw original image
        ctx.drawImage(img, 0, 0);

        // ── CALCULATE SEAL DIMENSIONS ──
        // Scale seal based on image size (e.g., 20% of width, minimum 200px)
        const sealWidth = Math.max(240, img.width * 0.25);
        const sealHeight = sealWidth * 0.45;
        const padding = sealWidth * 0.08;
        const margin = Math.max(20, img.width * 0.03);

        const x = img.width - sealWidth - margin;
        const y = img.height - sealHeight - margin;

        // ── DRAW GLASS-MORPHISM BACKDROP ──
        ctx.save();
        ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        ctx.shadowBlur = 20;
        ctx.shadowOffsetY = 10;

        // Dark semi-transparent background
        ctx.fillStyle = 'rgba(10, 11, 15, 0.85)';
        ctx.beginPath();
        ctx.roundRect(x, y, sealWidth, sealHeight, 8);
        ctx.fill();
        
        // Subtle border
        ctx.shadowBlur = 0;
        ctx.shadowOffsetY = 0;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.restore();

        // ── DRAW ATTESTR LOGO (Simplified for Canvas) ──
        const logoSize = sealHeight * 0.4;
        const lx = x + padding;
        const ly = y + (sealHeight - logoSize) / 2;
        
        ctx.strokeStyle = '#3B82F6';
        ctx.lineWidth = 2;
        
        // Outer Hexagon
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const angle = (Math.PI / 3) * i - Math.PI / 6;
          const px = lx + logoSize/2 + (logoSize/2 * Math.cos(angle));
          const py = ly + logoSize/2 + (logoSize/2 * Math.sin(angle));
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.stroke();

        // Inner Checkmark
        ctx.beginPath();
        ctx.moveTo(lx + logoSize * 0.4, ly + logoSize * 0.5);
        ctx.lineTo(lx + logoSize * 0.5, ly + logoSize * 0.65);
        ctx.lineTo(lx + logoSize * 0.75, ly + logoSize * 0.35);
        ctx.strokeStyle = '#3B82F6';
        ctx.lineWidth = 3;
        ctx.stroke();

        // ── DRAW TEXT ──
        const textX = lx + logoSize + padding * 0.8;
        
        // Tricolor Strip
        const barW = sealWidth * 0.15;
        const barH = 3;
        ctx.fillStyle = '#FF9933'; ctx.fillRect(x + padding, y + padding - 10, barW/3, barH);
        ctx.fillStyle = '#FFFFFF'; ctx.fillRect(x + padding + barW/3, y + padding - 10, barW/3, barH);
        ctx.fillStyle = '#128807'; ctx.fillRect(x + padding + (barW/3)*2, y + padding - 10, barW/3, barH);

        // Title: BHARAT SOVEREIGN PROOF
        ctx.fillStyle = '#FFFFFF';
        ctx.font = `bold ${Math.round(sealHeight * 0.13)}px Inter, system-ui, sans-serif`;
        ctx.fillText('BHARAT SOVEREIGN PROOF', textX, y + padding + sealHeight * 0.1);

        // Subtitle: NOTARIZED VIA ATTESTR
        ctx.fillStyle = '#FF9933';
        ctx.font = `bold ${Math.round(sealHeight * 0.09)}px JetBrains Mono, monospace`;
        ctx.fillText('SEALED VIA ATTESTR', textX, y + padding + sealHeight * 0.25);

        // Fingerprint Label
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.font = `${Math.round(sealHeight * 0.07)}px JetBrains Mono, monospace`;
        ctx.fillText('SHA-256 FINGERPRINT', textX, y + padding + sealHeight * 0.45);

        // Fingerprint Value
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.font = `${Math.round(sealHeight * 0.08)}px JetBrains Mono, monospace`;
        const shortHash = sha256 ? `${sha256.substring(0, 16)}...${sha256.substring(56)}` : 'UNKNOWN';
        ctx.fillText(shortHash, textX, y + padding + sealHeight * 0.58);

        // Date Label
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.fillText('SEAL DATE', textX, y + padding + sealHeight * 0.72);

        // Date Value
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        const dateStr = timestamp ? new Date(timestamp * 1000).toLocaleString() : new Date().toLocaleString();
        ctx.fillText(dateStr.toUpperCase(), textX, y + padding + sealHeight * 0.85);

        // ── CONVERT TO BLOB ──
        canvas.toBlob((blob) => {
          const url = URL.createObjectURL(blob);
          resolve({ blob, url, filename: `verified_${filename || 'media'}.png` });
        }, 'image/png', 0.95);
      };
      img.onerror = () => reject(new Error('Failed to load image for seal generation'));
      img.src = e.target.result;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(imageFile);
  });
}
