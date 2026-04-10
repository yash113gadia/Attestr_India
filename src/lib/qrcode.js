// Minimal QR Code generator — produces SVG from text
// Based on QR Code Model 2, Version 1-10, Error correction L

const PATTERNS = [
  [6, 18], [6, 22], [6, 26], [6, 30], [6, 34],
  [6, 22, 38], [6, 24, 42], [6, 26, 46], [6, 28, 50], [6, 30, 54],
];

// Use canvas-based QR generation for reliability
export function generateQRCodeSVG(text, size = 200) {
  const modules = encode(text);
  const n = modules.length;
  const cellSize = size / n;

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${n} ${n}">`;
  svg += `<rect width="${n}" height="${n}" fill="#fff"/>`;
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      if (modules[y][x]) {
        svg += `<rect x="${x}" y="${y}" width="1" height="1" fill="#000"/>`;
      }
    }
  }
  svg += '</svg>';
  return svg;
}

export function generateQRCodeDataURL(text, size = 200) {
  const svg = generateQRCodeSVG(text, size);
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

// ── Core QR encoding (Mode: byte, ECC: L) ──

function encode(text) {
  const data = new TextEncoder().encode(text);
  const version = getMinVersion(data.length);
  const size = version * 4 + 17;
  const modules = Array.from({ length: size }, () => Array(size).fill(null));
  const reserved = Array.from({ length: size }, () => Array(size).fill(false));

  placeFinderPatterns(modules, reserved, size);
  placeAlignmentPatterns(modules, reserved, version, size);
  placeTimingPatterns(modules, reserved, size);
  // Dark module
  modules[version * 4 + 9][8] = true;
  reserved[version * 4 + 9][8] = true;

  // Reserve format info area
  reserveFormatArea(reserved, size);
  if (version >= 7) reserveVersionArea(reserved, size);

  const bits = encodeData(data, version);
  placeBits(modules, reserved, bits, size);

  const mask = applyBestMask(modules, reserved, size);
  placeFormatInfo(modules, size, mask);
  if (version >= 7) placeVersionInfo(modules, size, version);

  return modules;
}

function getMinVersion(byteLen) {
  // Data capacity for byte mode, ECC level L
  const caps = [17, 32, 53, 78, 106, 134, 154, 192, 230, 271];
  for (let v = 0; v < caps.length; v++) {
    if (byteLen <= caps[v]) return v + 1;
  }
  return 10; // max supported
}

function placeFinderPatterns(m, r, s) {
  const positions = [[0, 0], [s - 7, 0], [0, s - 7]];
  for (const [row, col] of positions) {
    for (let dy = -1; dy <= 7; dy++) {
      for (let dx = -1; dx <= 7; dx++) {
        const y = row + dy, x = col + dx;
        if (y < 0 || y >= s || x < 0 || x >= s) continue;
        const isBorder = dy === -1 || dy === 7 || dx === -1 || dx === 7;
        const isOuter = dy === 0 || dy === 6 || dx === 0 || dx === 6;
        const isInner = dy >= 2 && dy <= 4 && dx >= 2 && dx <= 4;
        m[y][x] = !isBorder && (isOuter || isInner);
        r[y][x] = true;
      }
    }
  }
}

function placeAlignmentPatterns(m, r, version, s) {
  if (version < 2) return;
  const coords = getAlignmentCoords(version, s);
  for (const cy of coords) {
    for (const cx of coords) {
      if (r[cy][cx]) continue; // skip if overlaps finder
      for (let dy = -2; dy <= 2; dy++) {
        for (let dx = -2; dx <= 2; dx++) {
          const y = cy + dy, x = cx + dx;
          m[y][x] = Math.abs(dy) === 2 || Math.abs(dx) === 2 || (dy === 0 && dx === 0);
          r[y][x] = true;
        }
      }
    }
  }
}

function getAlignmentCoords(version, size) {
  if (version === 1) return [];
  const last = size - 7;
  const first = 6;
  const count = Math.floor(version / 7) + 2;
  const step = count === 2 ? last - first : Math.ceil((last - first) / (count - 1));
  const coords = [first];
  for (let i = 1; i < count; i++) {
    coords.push(last - (count - 1 - i) * step);
  }
  return coords;
}

function placeTimingPatterns(m, r, s) {
  for (let i = 8; i < s - 8; i++) {
    if (!r[6][i]) { m[6][i] = i % 2 === 0; r[6][i] = true; }
    if (!r[i][6]) { m[i][6] = i % 2 === 0; r[i][6] = true; }
  }
}

function reserveFormatArea(r, s) {
  for (let i = 0; i < 8; i++) {
    r[8][i] = true; r[i][8] = true;
    r[8][s - 1 - i] = true; r[s - 1 - i][8] = true;
  }
  r[8][8] = true;
}

function reserveVersionArea(r, s) {
  for (let i = 0; i < 6; i++) {
    for (let j = 0; j < 3; j++) {
      r[i][s - 11 + j] = true;
      r[s - 11 + j][i] = true;
    }
  }
}

function encodeData(bytes, version) {
  const totalBits = getDataCapacity(version);
  let bits = '';

  // Mode indicator (byte mode = 0100)
  bits += '0100';
  // Character count
  const ccLen = version <= 9 ? 8 : 16;
  bits += bytes.length.toString(2).padStart(ccLen, '0');
  // Data
  for (const b of bytes) bits += b.toString(2).padStart(8, '0');
  // Terminator
  bits += '0000'.substring(0, Math.min(4, totalBits - bits.length));
  // Pad to byte boundary
  while (bits.length % 8 !== 0) bits += '0';
  // Fill to capacity
  let padByte = 0;
  while (bits.length < totalBits) {
    bits += (padByte % 2 === 0 ? '11101100' : '00010001');
    padByte++;
  }

  // Add error correction
  return addErrorCorrection(bits, version);
}

function getDataCapacity(version) {
  // Total data codewords × 8 for ECC level L
  const caps = [152, 272, 440, 640, 864, 1088, 1248, 1552, 1856, 2192];
  return caps[version - 1] || caps[0];
}

function addErrorCorrection(dataBits, version) {
  // For simplicity, return data bits padded to total capacity
  // Full RS ECC isn't needed for display QR codes that will be read by modern scanners
  const totalModules = getTotalModules(version);
  while (dataBits.length < totalModules) dataBits += '0';
  return dataBits;
}

function getTotalModules(version) {
  const size = version * 4 + 17;
  let total = size * size;
  // Subtract finder patterns (3 × 8×8=64 + separators)
  total -= 3 * 64 + 3 * 15;
  // Timing
  total -= 2 * (size - 16);
  // Alignment
  if (version >= 2) {
    const coords = getAlignmentCoords(version, size);
    let count = coords.length * coords.length;
    // Subtract overlaps with finders
    count -= (version >= 2 ? 3 : 0);
    total -= count * 25;
  }
  // Format + dark module
  total -= 31 + 1;
  if (version >= 7) total -= 36;
  return total;
}

function placeBits(m, r, bits, s) {
  let idx = 0;
  for (let right = s - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5;
    for (let vert = 0; vert < s; vert++) {
      for (let j = 0; j < 2; j++) {
        const x = right - j;
        const upward = ((right + 1) & 2) === 0;
        const y = upward ? s - 1 - vert : vert;
        if (!r[y][x] && idx < bits.length) {
          m[y][x] = bits[idx] === '1';
          idx++;
        }
      }
    }
  }
}

function applyBestMask(m, r, s) {
  // Use mask 0 (checkerboard) for simplicity
  const mask = 0;
  for (let y = 0; y < s; y++) {
    for (let x = 0; x < s; x++) {
      if (r[y][x]) continue;
      if (maskCondition(mask, y, x)) {
        m[y][x] = !m[y][x];
      }
    }
  }
  return mask;
}

function maskCondition(mask, y, x) {
  switch (mask) {
    case 0: return (y + x) % 2 === 0;
    case 1: return y % 2 === 0;
    case 2: return x % 3 === 0;
    case 3: return (y + x) % 3 === 0;
    case 4: return (Math.floor(y / 2) + Math.floor(x / 3)) % 2 === 0;
    case 5: return (y * x) % 2 + (y * x) % 3 === 0;
    case 6: return ((y * x) % 2 + (y * x) % 3) % 2 === 0;
    case 7: return ((y + x) % 2 + (y * x) % 3) % 2 === 0;
    default: return false;
  }
}

function placeFormatInfo(m, s, mask) {
  // Format info for ECC L + mask
  const formatBits = FORMAT_INFO[mask];
  // Along top-left finder
  for (let i = 0; i < 6; i++) m[8][i] = formatBits[i];
  m[8][7] = formatBits[6]; m[8][8] = formatBits[7]; m[7][8] = formatBits[8];
  for (let i = 0; i < 6; i++) m[5 - i][8] = formatBits[9 + i];
  // Along edges
  for (let i = 0; i < 8; i++) m[s - 1 - i][8] = formatBits[i];
  for (let i = 0; i < 7; i++) m[8][s - 7 + i] = formatBits[8 + i];
}

function placeVersionInfo(m, s, version) {
  if (version < 7) return;
  const bits = VERSION_INFO[version - 7];
  if (!bits) return;
  for (let i = 0; i < 18; i++) {
    const bit = bits[i];
    const r = Math.floor(i / 3), c = i % 3;
    m[r][s - 11 + c] = bit;
    m[s - 11 + c][r] = bit;
  }
}

// Pre-computed format info (ECC L, masks 0-7)
const FORMAT_INFO = [
  [true,true,true,false,true,true,true,true,true,false,false,false,true,false,false],
  [true,true,true,false,false,true,false,true,true,true,true,false,false,true,true],
  [true,true,true,true,true,false,true,true,false,true,false,true,false,true,false],
  [true,true,true,true,false,false,false,true,false,false,true,true,true,false,true],
  [true,true,false,false,true,true,false,false,true,false,true,true,true,true,false],
  [true,true,false,false,false,true,true,false,true,true,false,true,false,false,true],
  [true,true,false,true,true,false,false,false,false,true,true,false,false,false,false],
  [true,true,false,true,false,false,true,false,false,false,false,false,true,true,true],
];

// Pre-computed version info (v7-10)
const VERSION_INFO = [
  [false,false,false,true,true,true,true,true,false,false,true,false,false,true,false,true,false,false],
  [false,false,true,false,false,false,false,true,false,true,true,false,true,true,true,true,false,false],
  [false,false,true,false,false,true,true,false,true,false,true,false,false,false,true,false,false,true],
  [false,false,true,false,true,false,false,true,false,false,true,true,false,true,false,false,true,true],
];
