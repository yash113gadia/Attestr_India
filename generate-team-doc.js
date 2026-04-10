import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  WidthType, AlignmentType, HeadingLevel, BorderStyle, ShadingType,
  TableLayoutType, convertInchesToTwip, PageBreak, TabStopPosition, TabStopType,
} from 'docx';
import { writeFileSync } from 'fs';

// ── Colors ──
const ACCENT = '3B82F6';
const GREEN = '22C55E';
const RED = 'EF4444';
const AMBER = 'EAB308';
const DARK = '08090C';
const DARK2 = '0F1117';
const WHITE = 'E8E9ED';
const GRAY = '5C5F73';
const LIGHT = '9A9DB0';
const BLACK = '1A1A1A';

// ── Helpers ──
const spacer = (s = 200) => new Paragraph({ spacing: { after: s } });

const sectionLabel = (num, label) =>
  new Paragraph({
    spacing: { before: 500, after: 100 },
    children: [
      new TextRun({ text: `${num} — `, font: 'Consolas', size: 20, color: ACCENT, bold: true }),
      new TextRun({ text: label.toUpperCase(), font: 'Consolas', size: 20, color: ACCENT, bold: true, characterSpacing: 80 }),
    ],
  });

const heading = (text, level = HeadingLevel.HEADING_1) =>
  new Paragraph({
    heading: level,
    spacing: { before: 100, after: 120 },
    children: [new TextRun({ text, bold: true, font: 'Georgia', size: level === HeadingLevel.HEADING_1 ? 36 : level === HeadingLevel.HEADING_2 ? 28 : 24, color: BLACK })],
  });

const body = (text) =>
  new Paragraph({
    spacing: { after: 140 },
    children: [new TextRun({ text, font: 'Calibri', size: 22, color: '333333' })],
    lineSpacing: { line: 276 },
  });

const bullet = (text, bold = '') =>
  new Paragraph({
    bullet: { level: 0 },
    spacing: { after: 60 },
    children: [
      ...(bold ? [new TextRun({ text: bold + ' ', bold: true, font: 'Calibri', size: 22, color: '111111' })] : []),
      new TextRun({ text, font: 'Calibri', size: 22, color: '444444' }),
    ],
  });

const codeLine = (text) =>
  new Paragraph({
    spacing: { after: 40 },
    children: [new TextRun({ text, font: 'Consolas', size: 18, color: '444444' })],
    shading: { type: ShadingType.SOLID, color: 'F5F5F5', fill: 'F5F5F5' },
  });

const thinBorder = { style: BorderStyle.SINGLE, size: 1, color: 'DDDDDD' };
const borders = { top: thinBorder, bottom: thinBorder, left: thinBorder, right: thinBorder };
const noBorder = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };

const headerCell = (text, width = 25) =>
  new TableCell({
    borders,
    shading: { type: ShadingType.SOLID, color: 'F0F0F0', fill: 'F0F0F0' },
    width: { size: width, type: WidthType.PERCENTAGE },
    children: [new Paragraph({ spacing: { before: 40, after: 40 }, children: [new TextRun({ text, bold: true, font: 'Calibri', size: 18, color: '333333' })] })],
  });

const cell = (text, color = '333333', mono = false) =>
  new TableCell({
    borders,
    children: [new Paragraph({ spacing: { before: 30, after: 30 }, children: [new TextRun({ text, font: mono ? 'Consolas' : 'Calibri', size: 18, color })] })],
  });

// ══════════════════════════════════════════════════════════
// DOCUMENT
// ══════════════════════════════════════════════════════════
const doc = new Document({
  styles: { default: { document: { run: { font: 'Calibri', size: 22 } } } },
  sections: [{
    properties: {
      page: { margin: { top: convertInchesToTwip(0.7), bottom: convertInchesToTwip(0.7), left: convertInchesToTwip(0.9), right: convertInchesToTwip(0.9) } },
    },
    children: [

      // ═══════ COVER PAGE ═══════
      spacer(1500),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 80 }, children: [new TextRun({ text: 'INNOVATE BHARAT HACKATHON 2026', font: 'Consolas', size: 18, color: ACCENT, bold: true, characterSpacing: 120 })] }),
      spacer(300),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 40 }, children: [
        new TextRun({ text: 'Attestr', font: 'Georgia', size: 80, bold: true, color: BLACK }),
      ]}),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 300 }, children: [new TextRun({ text: 'DECENTRALIZED MEDIA AUTHENTICATOR', font: 'Consolas', size: 20, color: GRAY, characterSpacing: 100 })] }),
      spacer(200),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 40 }, children: [new TextRun({ text: 'Comprehensive Project Documentation', font: 'Calibri', size: 24, color: '666666' })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 40 }, children: [new TextRun({ text: 'For Team Ctrl+Alt+Diablo', font: 'Calibri', size: 22, color: '888888' })] }),
      spacer(600),

      // Team info
      new Table({
        layout: TableLayoutType.FIXED,
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [new TableRow({ children: [
          new TableCell({ borders: { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder }, width: { size: 25, type: WidthType.PERCENTAGE }, children: [
            new Paragraph({ spacing: { after: 20 }, children: [new TextRun({ text: 'TEAM', font: 'Consolas', size: 14, color: GRAY })] }),
            new Paragraph({ children: [new TextRun({ text: 'Ctrl+Alt+Diablo', font: 'Calibri', size: 22, bold: true, color: BLACK })] }),
          ]}),
          new TableCell({ borders: { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder }, width: { size: 25, type: WidthType.PERCENTAGE }, children: [
            new Paragraph({ spacing: { after: 20 }, children: [new TextRun({ text: 'TEAM ID', font: 'Consolas', size: 14, color: GRAY })] }),
            new Paragraph({ children: [new TextRun({ text: 'CSBC114', font: 'Calibri', size: 22, bold: true, color: BLACK })] }),
          ]}),
          new TableCell({ borders: { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder }, width: { size: 25, type: WidthType.PERCENTAGE }, children: [
            new Paragraph({ spacing: { after: 20 }, children: [new TextRun({ text: 'TRACK', font: 'Consolas', size: 14, color: GRAY })] }),
            new Paragraph({ children: [new TextRun({ text: 'Cybersecurity & Blockchain', font: 'Calibri', size: 20, bold: true, color: BLACK })] }),
          ]}),
          new TableCell({ borders: { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder }, width: { size: 25, type: WidthType.PERCENTAGE }, children: [
            new Paragraph({ spacing: { after: 20 }, children: [new TextRun({ text: 'PANEL', font: 'Consolas', size: 14, color: GRAY })] }),
            new Paragraph({ children: [new TextRun({ text: 'Panel 6', font: 'Calibri', size: 22, bold: true, color: BLACK })] }),
          ]}),
        ]})]
      }),
      spacer(200),
      new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Team Members: Yash Gadia • Sweta Kumari • Priyanshi Shrotriya • Shreyansh Khemka', font: 'Calibri', size: 20, color: '888888' })] }),
      spacer(200),
      new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Sharda University • Department of Computer Science & Engineering', font: 'Calibri', size: 18, color: 'AAAAAA' })] }),

      new Paragraph({ children: [new PageBreak()] }),

      // ═══════ TABLE OF CONTENTS ═══════
      heading('Table of Contents', HeadingLevel.HEADING_1),
      spacer(100),
      ...[
        '01 — What is Attestr?',
        '02 — The Problem We Solve',
        '03 — How It Works (Technical Deep Dive)',
        '04 — Architecture & System Design',
        '05 — Smart Contract (Solidity)',
        '06 — Cryptographic Hashing',
        '07 — AI Detection System',
        '08 — Forensic Analysis (ELA & EXIF)',
        '09 — Technology Stack',
        '10 — Features List',
        '11 — Market Landscape & Competitors',
        '12 — Our Differentiators',
        '13 — Security & Tamper Resistance',
        '14 — Cost Analysis',
        '15 — Business Model & Revenue',
        '16 — Scalability Plan',
        '17 — Integration Roadmap',
        '18 — Deployment & Infrastructure',
        '19 — URLs & Access',
        '20 — How to Run Locally',
        '21 — Demo Script (6 Minutes)',
        '22 — Q&A Preparation',
      ].map((item) => body(item)),

      new Paragraph({ children: [new PageBreak()] }),

      // ═══════ 01 — WHAT IS ATTESTR ═══════
      sectionLabel('01', 'What is Attestr?'),
      heading('What is Attestr?', HeadingLevel.HEADING_1),
      body('Attestr is a universal digital notary and decentralized media authentication platform. It allows journalists, legal professionals, and enterprises to prove that digital evidence — whether a photo, voice recording, 3D model, or legal document — is real and untampered.'),
      body('When you upload a file through Attestr, the platform generates a unique cryptographic fingerprint entirely in your browser. The original file never leaves your device. This fingerprint is then permanently recorded on the Ethereum blockchain. If that file is ever questioned, anyone can verify its integrity instantly against the on-chain ledger.'),
      body('Unlike existing solutions that focus solely on image forensics or require special hardware, Attestr serves as a comprehensive Evidence Locker. It features an intelligent ingest engine that supports and visualizes diverse file types, from interactive 3D spatial media (.glb) and audio waveforms (.mp3/.wav) to raw forensic photography (.cr2) and legal PDFs.'),
      body('For visual media, the platform includes built-in forensic analysis like Error Level Analysis and AI detection. For data and documents, it enforces strict cryptographic integrity. One sentence: Attestr turns "I think this is real" into "I can mathematically prove this is real."'),

      new Paragraph({ children: [new PageBreak()] }),

      // ═══════ 02 — THE PROBLEM ═══════
      sectionLabel('02', 'The Problem We Solve'),
      heading('The Problem', HeadingLevel.HEADING_1),
      body('In an era of AI-generated deepfakes, voice clones, and sophisticated digital manipulation, there is no reliable, accessible way to verify the authenticity of digital evidence. The threat surface has expanded beyond just photos:'),
      spacer(80),
      bullet('AI Voice Clones: Tools like ElevenLabs can clone a voice from a 3-second sample, rendering audio evidence in court highly suspect.'),
      bullet('Document Tampering: Contract fraud and invoice manipulation cost the industry billions. A single altered digit in a PDF can change a financial outcome.'),
      bullet('Spatial Media Fraud: As AR/VR and 3D modeling grow, intellectual property theft and misrepresented engineering data are becoming critical issues.'),
      spacer(100),
      heading('Why Detection Alone Fails', HeadingLevel.HEADING_2),
      body('Most competitors focus on AI detection — trying to guess if content is fake. This is a losing arms race:'),
      bullet('Every better detector gets a better generator.'),
      bullet('Detection accuracy degrades as AI models improve.'),
      bullet('You cannot "detect" a forged signature in a PDF reliably without an original baseline.'),
      body('Attestr takes a fundamentally different approach: we establish PROVENANCE. A cryptographic hash on a blockchain is permanent math. It doesn\'t degrade. It doesn\'t have false positives. It either matches or it doesn\'t.'),

      new Paragraph({ children: [new PageBreak()] }),

      // ═══════ 03 — HOW IT WORKS ═══════
      sectionLabel('03', 'How It Works'),
      heading('Technical Deep Dive', HeadingLevel.HEADING_1),
      spacer(80),
      heading('Step 1: Evidence Ingest', HeadingLevel.HEADING_2),
      body('User uploads a file. Attestr intelligently categorizes and visualizes it: Interactive 3D models (Three.js), Audio waveforms, RAW photos, Legal PDFs, Source Code, or standard media.'),
      spacer(60),
      heading('Step 2: Client-Side Hashing', HeadingLevel.HEADING_2),
      body('The file is processed ENTIRELY in the user\'s browser using Web Workers:'),
      bullet('SHA-256 (Cryptographic Hash) via SubtleCrypto API — produces a unique 64-character hex fingerprint. This is the ultimate integrity proof for legal documents, code, and data.', 'SHA-256:'),
      bullet('dHash (Perceptual Hash) — a 256-bit difference hash for images/video that captures visual structure, surviving compression and screenshots.', 'Perceptual Hash:'),
      body('CRITICAL PRIVACY: The raw file NEVER leaves the browser. This private-by-design architecture is mandatory for legal and enterprise adoption.'),
      spacer(60),
      heading('Step 3: Blockchain Notarization', HeadingLevel.HEADING_2),
      body('The hash is sent to our Express API server, which:'),
      bullet('Stores it on a local proof-of-work blockchain (in-memory + persisted to disk)'),
      bullet('Simultaneously submits it to the Ethereum Sepolia smart contract via ethers.js'),
      bullet('The smart contract stores: SHA-256 hash, dHash, filename, file size, MIME type, registrant address, block timestamp'),
      spacer(60),
      heading('Step 4: Verification & Forensics', HeadingLevel.HEADING_2),
      body('When verifying, Attestr adapts its intelligence based on the file type:'),
      bullet('Notary Integrity Check: For documents, audio, and code, it strictly enforces the SHA-256 exact match to prove zero tampering occurred.'),
      bullet('Forensic Analysis: For images, it enables ELA (Error Level Analysis), EXIF inspection, and AI Deepfake Detection.'),

      new Paragraph({ children: [new PageBreak()] }),

      // ═══════ 04 — ARCHITECTURE ═══════
      sectionLabel('04', 'Architecture & System Design'),
      heading('System Architecture', HeadingLevel.HEADING_1),
      spacer(80),
      codeLine('┌─────────────────────── CLIENT (BROWSER) ───────────────────────┐'),
      codeLine('│  Upload/Camera  │  SHA-256 Worker  │  dHash Worker  │  ELA/EXIF │'),
      codeLine('└────────────────────────────────────────────────────────────────┘'),
      codeLine('                    ↓  hash + metadata only  ↓                    '),
      codeLine('┌─────────────────────── API SERVER ─────────────────────────────┐'),
      codeLine('│   POST /api/register   │   POST /api/verify   │  GET /api/chain│'),
      codeLine('│   POST /api/ai-detect  │   GET /api/activity  │  GET /api/status│'),
      codeLine('└────────────────────────────────────────────────────────────────┘'),
      codeLine('                              ↓                                   '),
      codeLine('┌─────────────────── ETHEREUM SEPOLIA ──────────────────────────┐'),
      codeLine('│  Smart Contract: 0x37FCD33D5FF07cfa3A75D27B4ec4cF09e458dfac   │'),
      codeLine('│  Proof-of-Work  •  SHA-256 linked blocks  •  Immutable        │'),
      codeLine('└────────────────────────────────────────────────────────────────┘'),
      spacer(100),
      body('Key architectural decisions:'),
      bullet('Client-side hashing — the most computationally expensive work runs on the user\'s device, not our servers'),
      bullet('Only hashes touch the network — 64 characters, not 5MB images'),
      bullet('Serverless deployment — Vercel functions spin up on request, zero idle cost'),
      bullet('Dual storage — local chain for fast reads, Ethereum for permanent proof'),
      bullet('Reads are free — verification only reads from blockchain, no gas cost'),

      new Paragraph({ children: [new PageBreak()] }),

      // ═══════ 05 — SMART CONTRACT ═══════
      sectionLabel('05', 'Smart Contract'),
      heading('Solidity Smart Contract', HeadingLevel.HEADING_1),
      body('Contract deployed at: 0x37FCD33D5FF07cfa3A75D27B4ec4cF09e458dfac on Ethereum Sepolia'),
      body('Etherscan: https://sepolia.etherscan.io/address/0x37FCD33D5FF07cfa3A75D27B4ec4cF09e458dfac'),
      spacer(80),
      body('The MediaRegistry contract stores:'),
      bullet('sha256Hash (bytes32) — the cryptographic fingerprint'),
      bullet('dHash (bytes8) — the perceptual fingerprint'),
      bullet('filename, fileSize, mimeType — file metadata'),
      bullet('registeredBy (address) — the wallet that registered it'),
      bullet('timestamp — set by the Ethereum network, not by us'),
      bullet('blockNumber — which Ethereum block contains the record'),
      spacer(80),
      body('Functions:'),
      bullet('register() — stores a new media hash on-chain. Reverts if already registered.'),
      bullet('verify() — checks if a hash exists. Returns the full record. View-only, no gas cost.'),
      bullet('totalRegistered() — returns count of all registered media.'),
      bullet('allHashes(index) — enumerate all hashes by index.'),
      spacer(80),
      body('Events:'),
      bullet('MediaRegistered(sha256Hash, dHash, filename, registeredBy, timestamp) — emitted on every registration, indexable by hash and registrant.'),

      new Paragraph({ children: [new PageBreak()] }),

      // ═══════ 06 — CRYPTOGRAPHIC HASHING ═══════
      sectionLabel('06', 'Cryptographic Hashing'),
      heading('Dual-Hash Verification System', HeadingLevel.HEADING_1),
      spacer(80),
      heading('SHA-256 (Exact Match)', HeadingLevel.HEADING_2),
      body('SHA-256 produces a 256-bit (64 hex character) hash that is unique to the exact byte content of a file. Properties:'),
      bullet('Deterministic — same input always produces same output'),
      bullet('Avalanche effect — changing 1 bit of input changes ~50% of output bits'),
      bullet('One-way — cannot reverse-engineer the original file from the hash'),
      bullet('Collision resistant — finding two different files with the same hash requires ~2^128 attempts (physically impossible)'),
      body('Used by: every bank, government, military, Bitcoin, Ethereum, SSL/TLS, PGP. This is the most battle-tested algorithm in existence.'),
      spacer(100),
      heading('dHash (Perceptual Match)', HeadingLevel.HEADING_2),
      body('A 256-bit perceptual hash (16x16 grid) that captures the visual structure of an image:'),
      bullet('Image scaled to 17x16 grayscale'),
      bullet('Adjacent pixels compared left-to-right — 1 if left < right, 0 if not'),
      bullet('Produces a 256-bit binary hash converted to 64 hex characters'),
      bullet('Hamming distance measures similarity — threshold of 15 bits (out of 256) required for a match'),
      spacer(80),
      body('Why we need both:'),
      bullet('SHA-256 alone fails if someone re-saves a JPEG (compression changes bytes, different hash)'),
      bullet('dHash alone has false positives for visually similar but different images'),
      bullet('Together: SHA-256 catches exact copies, dHash catches re-compressed/resized/screenshotted versions'),

      new Paragraph({ children: [new PageBreak()] }),

      // ═══════ 07 — AI DETECTION ═══════
      sectionLabel('07', 'AI Detection System'),
      heading('AI-Generated Content Detection', HeadingLevel.HEADING_1),
      body('Two-layer analysis combining ML models and local forensic heuristics:'),
      spacer(80),
      heading('Layer 1: ML Vision Transformers (50% weight)', HeadingLevel.HEADING_2),
      bullet('ViT Vision Transformer (umm-maybe/AI-image-detector) — fine-tuned ViT model, weight: 2x'),
      bullet('ResNet Classifier (haywoodsloan/ai-image-detector-deploy) — ResNet-based, weight: 2x'),
      body('Models are called via HuggingFace Inference API from our server. Image is sent as binary, labels returned as human/artificial with confidence scores.'),
      spacer(80),
      heading('Layer 2: Local Forensic Heuristics (50% weight)', HeadingLevel.HEADING_2),
      bullet('Metadata Analysis (weight 25%) — missing EXIF, no camera info, AI software signatures (DALL-E, Midjourney, etc), sparse metadata'),
      bullet('Pixel Statistics (weight 20%) — channel balance, skewness, variance uniformity'),
      bullet('Noise Analysis (weight 20%) — average noise level, noise uniformity coefficient of variation'),
      bullet('Color Distribution (weight 15%) — histogram gaps, unique color count, concentration'),
      bullet('Edge Coherence (weight 20%) — Sobel edge detection, sharpness uniformity, strong edge ratio'),
      bullet('Benford\'s Law (weight 15%) — chi-squared test on first digits of gradient magnitudes'),
      bullet('Frequency Analysis (weight 15%) — power spectrum falloff, autocorrelation for GAN artifacts'),
      spacer(80),
      heading('Honest Assessment', HeadingLevel.HEADING_2),
      body('ML model accuracy with free HuggingFace models is approximately 57%. This is supplementary, not definitive. Our core value proposition is PROVENANCE (cryptographic proof), not detection. Detection is an arms race. Provenance is permanent math.'),

      new Paragraph({ children: [new PageBreak()] }),

      // ═══════ 08 — FORENSICS ═══════
      sectionLabel('08', 'Forensic Analysis'),
      heading('ELA & EXIF', HeadingLevel.HEADING_1),
      spacer(80),
      heading('Error Level Analysis (ELA)', HeadingLevel.HEADING_2),
      body('How it works:'),
      bullet('Original image loaded onto a canvas'),
      bullet('Re-compressed as JPEG at quality=95'),
      bullet('Pixel-by-pixel difference computed between original and re-compressed version'),
      bullet('Differences amplified by a user-adjustable scale factor (1x-30x)'),
      bullet('Result displayed as a heatmap — bright areas indicate compression inconsistencies'),
      body('An original photo has been compressed uniformly — every part has the same error level. If someone edits part of the image, the edited region has been compressed fewer times and shows up brighter.'),
      spacer(80),
      heading('EXIF Metadata Inspection', HeadingLevel.HEADING_2),
      body('Extracts and categorizes metadata using the exifr library:'),
      bullet('Camera info — make, model, lens, focal length, aperture, ISO, shutter speed'),
      bullet('Datetime — date taken, date modified, date created'),
      bullet('Location — GPS latitude, longitude, altitude'),
      bullet('Software — editing software signatures (flags Photoshop, Lightroom, AI tools)'),
      body('Suspicious field detection:'),
      bullet('Software field present = file may have been processed'),
      bullet('ModifyDate ≠ DateTimeOriginal = post-processing detected'),
      bullet('No EXIF at all = metadata was stripped or file is synthetic'),

      new Paragraph({ children: [new PageBreak()] }),

      // ═══════ 09 — TECH STACK ═══════
      sectionLabel('09', 'Technology Stack'),
      heading('Technology Stack', HeadingLevel.HEADING_1),
      spacer(80),

      new Table({
        layout: TableLayoutType.FIXED,
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({ children: [headerCell('LAYER', 20), headerCell('TECHNOLOGY', 30), headerCell('PURPOSE', 50)] }),
          ...[
            ['Frontend', 'React 19', 'UI components and state management'],
            ['Frontend', 'Vite 8', 'Build tool and dev server'],
            ['Frontend', 'Tailwind CSS 4', 'Utility-first styling'],
            ['Frontend', 'Framer Motion', 'Animations and transitions'],
            ['Frontend', 'Three.js / R3F', '3D visualizations on landing page'],
            ['Frontend', 'React Router 7', 'Client-side routing'],
            ['Frontend', 'Lucide React', 'Icon system'],
            ['Backend', 'Node.js', 'Server runtime'],
            ['Backend', 'Express 5', 'API framework (local dev)'],
            ['Backend', 'Vercel Serverless', 'Production API functions'],
            ['Blockchain', 'Solidity 0.8.24', 'Smart contract language'],
            ['Blockchain', 'Ethereum Sepolia', 'Testnet blockchain'],
            ['Blockchain', 'ethers.js 6', 'Blockchain interaction library'],
            ['Crypto', 'SubtleCrypto API', 'SHA-256 hashing in browser'],
            ['Crypto', 'Web Workers', 'Off-main-thread hash computation'],
            ['Crypto', 'Custom dHash', '256-bit perceptual hashing'],
            ['Forensics', 'Canvas API', 'Error Level Analysis'],
            ['Forensics', 'exifr', 'EXIF metadata extraction'],
            ['AI', 'HuggingFace Inference', 'ML model API for AI detection'],
            ['Auth', 'Firebase Auth', 'Google sign-in'],
            ['Deployment', 'Vercel', 'Frontend CDN + serverless functions'],
            ['Deployment', 'GitHub', 'Version control + CI/CD trigger'],
          ].map(([layer, tech, purpose]) => new TableRow({ children: [cell(layer), cell(tech, '333333', true), cell(purpose)] })),
        ],
      }),

      new Paragraph({ children: [new PageBreak()] }),

      // ═══════ 10 — FEATURES ═══════
      sectionLabel('10', 'Features List'),
      heading('Complete Feature Set', HeadingLevel.HEADING_1),
      spacer(80),
      heading('Core Features', HeadingLevel.HEADING_2),
      bullet('Universal Evidence Ingest — drag-and-drop support for Images, Video, Audio, PDFs, 3D Models, Code, and Data'),
      bullet('Interactive Previews — built-in audio waveform player and Three.js 3D model rotation viewer'),
      bullet('Client-side SHA-256 cryptographic hashing — files never leave the browser'),
      bullet('256-bit perceptual hash (dHash) — survives compression and social media re-uploads for visual media'),
      bullet('Blockchain registration with proof-of-work on Ethereum Sepolia'),
      bullet('Instant verification — exact match for documents/data + fuzzy perceptual matching for images'),
      bullet('Etherscan-verifiable transaction receipts for every registration'),
      spacer(60),
      heading('Forensic & Notary Analysis', HeadingLevel.HEADING_2),
      bullet('Notary Integrity Check — establishes immutable chain of custody for legal and corporate documents'),
      bullet('Error Level Analysis with adjustable amplification slider (1x-30x) for images'),
      bullet('EXIF metadata extraction with suspicious field flagging'),
      bullet('AI-generated content detection (ML + 7 forensic heuristics)'),
      spacer(60),
      heading('Platform Features', HeadingLevel.HEADING_2),
      bullet('Google OAuth authentication via Firebase'),
      bullet('My Media page — view all files registered under your account'),
      bullet('Public Activity feed — anonymized registration feed showing platform usage'),
      bullet('Blockchain Explorer — browse chain blocks and on-chain records'),
      bullet('Public REST API with interactive documentation'),
      bullet('Chrome extension — right-click any image to verify'),
      spacer(60),
      heading('Design & UX', HeadingLevel.HEADING_2),
      bullet('Separate desktop and mobile UIs (not just responsive — different component trees)'),
      bullet('Desktop: sidebar layout, 3D hero, grid background'),
      bullet('Mobile: bottom tab bar, swipeable cards, accordion sections, touch-optimized'),
      bullet('Dark theme with Instrument Serif headings, JetBrains Mono for data'),
      bullet('3D animated shield scene on landing page (Three.js)'),
      bullet('Page transitions via Framer Motion AnimatePresence'),

      new Paragraph({ children: [new PageBreak()] }),

      // ═══════ 11 — COMPETITORS ═══════
      sectionLabel('11', 'Market Landscape'),
      heading('Existing Solutions & Limitations', HeadingLevel.HEADING_1),
      spacer(80),

      new Table({
        layout: TableLayoutType.FIXED,
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({ children: [headerCell('SOLUTION', 25), headerCell('HOW IT WORKS', 30), headerCell('BLOCKCHAIN?', 15), headerCell('KEY LIMITATION', 30)] }),
          ...[
            ['C2PA (Adobe, MS, Google)', 'Embeds signed metadata via PKI', 'No — PKI', 'Metadata stripped by screenshots'],
            ['Truepic ($26M)', 'Hardware-level signing', 'Abandoned', 'Requires special hardware'],
            ['Numbers Protocol', 'Mobile app + EVM chain', 'Yes — own token', 'Requires their app'],
            ['OpenOrigins ($4.5M)', 'Hash → Hyperledger', 'Permissioned', 'Not truly decentralized'],
            ['SWEAR', 'Frame-level fingerprinting', 'Hyperledger', 'Permissioned, capture-only'],
            ['Reality Defender (YC)', 'AI detection only', 'No', 'No provenance proof'],
            ['Starling Lab (Stanford)', 'IPFS + Filecoin', 'Yes', 'Research, not a product'],
            ['ProofMode', 'Mobile app, PGP signing', 'Optional', 'Android only, basic UX'],
          ].map(([sol, how, bc, lim]) => new TableRow({ children: [cell(sol, '333333', false), cell(how), cell(bc, bc.includes('No') || bc === 'Abandoned' ? RED : bc.includes('Permissioned') ? AMBER : GREEN, true), cell(lim, RED)] })),
        ],
      }),

      new Paragraph({ children: [new PageBreak()] }),

      // ═══════ 12 — DIFFERENTIATORS ═══════
      sectionLabel('12', 'Our Differentiators'),
      heading('What Makes Attestr Different', HeadingLevel.HEADING_1),
      spacer(80),
      bullet('Works in any browser — no hardware, no app downloads, no wallet needed.', 'Zero Friction —'),
      bullet('Perceptual hashing survives screenshots, compression, social media re-uploads. C2PA metadata gets stripped.', 'Screenshot Resilient —'),
      bullet('Public Ethereum with proof-of-work — not a permissioned Hyperledger controlled by one company.', 'Truly Decentralized —'),
      bullet('SHA-256 + dHash computed in Web Workers. Raw media never touches any server. Ever.', 'Client-Side Privacy —'),
      bullet('ELA and EXIF analysis works on any image, even unregistered ones.', 'Retroactive Analysis —'),
      bullet('$0 to operate on free tiers. $0.001/registration on Polygon mainnet. 93% gross margins.', 'Near-Zero Cost —'),
      bullet('/api/v1/verify and /api/v1/register — any app can integrate in one API call.', 'API-First Platform —'),
      bullet('Right-click any image on any website → verify against the blockchain.', 'Chrome Extension —'),

      new Paragraph({ children: [new PageBreak()] }),

      // ═══════ 13 — SECURITY ═══════
      sectionLabel('13', 'Security & Tamper Resistance'),
      heading('Can It Be Tampered With?', HeadingLevel.HEADING_1),
      spacer(80),

      new Table({
        layout: TableLayoutType.FIXED,
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({ children: [headerCell('ATTACK VECTOR', 35), headerCell('POSSIBLE?', 15), headerCell('WHY / MITIGATION', 50)] }),
          ...[
            ['Tamper with blockchain record', 'No', 'Would need 51% of Ethereum validators (~$20B staked ETH)'],
            ['Register a fake and claim it\'s real', 'Yes, but useless', 'Timestamp comparison — real content was registered first'],
            ['Reverse-engineer file from hash', 'No', 'SHA-256 is one-way. Mathematically impossible.'],
            ['Find two files with same hash', 'No', '2^128 attempts needed — would take 10 trillion trillion years'],
            ['Intercept hash in transit', 'Useless', 'Hash is useless without the original file'],
            ['Attestr tampers with records', 'No', 'Records are on public Ethereum — we don\'t control the chain'],
            ['Compromise server private key', 'Possible', 'Only affects new registrations. All past records are permanent.'],
            ['Quantum computing breaks SHA-256', 'Decades away', 'Ethereum will migrate to quantum-resistant hashing first'],
          ].map(([attack, possible, why]) => new TableRow({ children: [cell(attack), cell(possible, possible === 'No' ? GREEN : possible.includes('Yes') ? AMBER : RED, true), cell(why)] })),
        ],
      }),

      new Paragraph({ children: [new PageBreak()] }),

      // ═══════ 14 — COST ═══════
      sectionLabel('14', 'Cost Analysis'),
      heading('Cost to Operate', HeadingLevel.HEADING_1),
      spacer(80),
      heading('Current Costs (Hackathon)', HeadingLevel.HEADING_2),
      body('Total monthly cost: $0. Everything runs on free tiers — Vercel, Firebase, Ethereum Sepolia (testnet), HuggingFace.'),
      spacer(80),
      heading('Production Costs (At Scale)', HeadingLevel.HEADING_2),

      new Table({
        layout: TableLayoutType.FIXED,
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({ children: [headerCell('COMPONENT', 30), headerCell('FREE TIER', 25), headerCell('AT 10K USERS/MO', 25), headerCell('COST', 20)] }),
          ...[
            ['Vercel hosting', '100GB bandwidth', 'Pro plan', '$20/mo'],
            ['Firebase Auth', '10K/month', '~10K auths', '~$0'],
            ['Polygon Mainnet', '—', '10K registrations', '$10/mo'],
            ['HuggingFace Pro', 'Rate limited', 'Faster inference', '$9/mo'],
            ['Custom domain', '—', '1 domain', '$1/mo'],
            ['TOTAL', '', '', '~$40/mo'],
          ].map(([comp, free, usage, cost]) => new TableRow({ children: [cell(comp, '333333', false), cell(free), cell(usage), cell(cost, comp === 'TOTAL' ? ACCENT : '333333', true)] })),
        ],
      }),

      spacer(100),
      heading('Unit Economics', HeadingLevel.HEADING_2),
      bullet('Cost per registration (Polygon): $0.001'),
      bullet('Cost per AI detection: $0.001'),
      bullet('Cost per verification: $0.000 (read-only, no gas)'),
      bullet('Price per Pro user: $29/month (50 registrations)'),
      bullet('Cost to serve Pro user: ~$0.05'),
      bullet('Gross profit per user: ~$27/month'),
      bullet('Gross margin: ~93%'),

      new Paragraph({ children: [new PageBreak()] }),

      // ═══════ 15 — BUSINESS MODEL ═══════
      sectionLabel('15', 'Business Model'),
      heading('Revenue Model', HeadingLevel.HEADING_1),
      spacer(80),

      new Table({
        layout: TableLayoutType.FIXED,
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({ children: [headerCell('TIER', 15), headerCell('PRICE', 15), headerCell('INCLUDES', 70)] }),
          ...[
            ['Free', '$0', '5 verifications/month, basic ELA, no blockchain registration'],
            ['Pro', '$29/mo', 'Unlimited verify, 50 registrations/month, AI detection, EXIF, Etherscan links'],
            ['Team', '$99/mo', 'Unlimited everything, API access, bulk upload, team accounts, audit logs'],
            ['Enterprise', 'Custom', 'Dedicated contract, SLA, custom chain (Polygon/mainnet), white-label'],
          ].map(([tier, price, inc]) => new TableRow({ children: [cell(tier, ACCENT, true), cell(price, '333333', true), cell(inc)] })),
        ],
      }),

      spacer(100),
      heading('Additional Revenue Streams', HeadingLevel.HEADING_2),
      bullet('"Attestr Certified" badge for websites/publications — annual fee', 'Certification Badges —'),
      bullet('Downloadable PDF proof for legal proceedings — per-report fee', 'Forensic Reports —'),
      bullet('Claims verification API — per-check fee', 'Insurance Integration —'),
      bullet('Government contracts for verifying political media during elections', 'Election Monitoring —'),
      bullet('Universities using Attestr for research integrity', 'Academic Licensing —'),

      spacer(100),
      heading('Target Customers (Go-to-Market Order)', HeadingLevel.HEADING_2),
      bullet('$29/mo, self-serve, immediate need', '1. Freelance journalists & fact-checkers —'),
      bullet('$99-500/mo per team, need provenance for published media', '2. Newsrooms (Reuters, AP, BBC) —'),
      bullet('$200+/mo, need tamper-proof evidence chains', '3. Law firms & legal discovery —'),
      bullet('Claims fraud detection, high willingness to pay', '4. Insurance companies —'),
      bullet('Long sales cycle but massive contracts', '5. Government/defense —'),

      new Paragraph({ children: [new PageBreak()] }),

      // ═══════ 16 — SCALABILITY ═══════
      sectionLabel('16', 'Scalability Plan'),
      heading('Technical Scaling Roadmap', HeadingLevel.HEADING_1),
      spacer(80),

      new Table({
        layout: TableLayoutType.FIXED,
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({ children: [headerCell('COMPONENT', 25), headerCell('NOW', 25), headerCell('6 MONTHS', 25), headerCell('12 MONTHS', 25)] }),
          ...[
            ['Blockchain', 'Sepolia testnet', 'Polygon mainnet', 'Multi-chain'],
            ['Database', 'In-memory + file', 'PostgreSQL + Redis', 'Distributed DB'],
            ['AI Detection', 'Free HuggingFace', 'Self-hosted models', 'Custom-trained'],
            ['Auth', 'Firebase', 'Auth0 / Clerk', 'SSO / SAML'],
            ['Hosting', 'Vercel serverless', 'AWS ECS / Railway', 'Kubernetes'],
            ['Contract', 'Single contract', 'Per-org contracts', 'Cross-chain bridge'],
          ].map(([comp, now, six, twelve]) => new TableRow({ children: [cell(comp, '333333', true), cell(now), cell(six), cell(twelve)] })),
        ],
      }),

      spacer(100),
      heading('Funding Path', HeadingLevel.HEADING_2),
      bullet('$0 — Hackathon prize money. Working prototype (done).', 'Now:'),
      bullet('$10-25K — Polygon/Ethereum grants. On-chain deployment + user traction.', 'Month 1-3:'),
      bullet('$50-100K — Angel investors / MEITY startup scheme. 1,000 registrations + 1 newsroom pilot.', 'Month 3-6:'),
      bullet('$500K-1M — Seed round / Y Combinator. Revenue + growth metrics.', 'Month 6-12:'),

      new Paragraph({ children: [new PageBreak()] }),

      // ═══════ 17 — INTEGRATIONS ═══════
      sectionLabel('17', 'Integration Roadmap'),
      heading('Making It Automatic', HeadingLevel.HEADING_1),
      body('The goal is to make Attestr invisible infrastructure — not a tool users open, but a layer that works automatically:'),
      spacer(80),
      bullet('Android/iOS SDK hooks into camera pipeline. Every photo registered at capture — user never opens Attestr.', '1. Camera SDK (capture-time) —'),
      bullet('WordPress/Drupal plugin. Every uploaded image auto-registered. Articles show "Verified by Attestr" badge.', '2. CMS Plugins (publish-time) —'),
      bullet('AWS Lambda trigger on S3 upload. Every file a law firm uploads is auto-fingerprinted.', '3. Cloud Storage Hooks (upload-time) —'),
      bullet('REST API that platforms call before displaying media. Returns verified/unverified/AI-generated.', '4. Social Media API (display-time) —'),
      bullet('Telegram bot auto-scans forwarded media. Warns users before they spread unverified content.', '5. Messaging Bots (share-time) —'),
      bullet('Scans every image on every webpage. Shows green/red overlay. Already built.', '6. Chrome Extension (browse-time) —'),
      bullet('Auto-scans email attachments. Adds verification header to incoming media.', '7. Email Security Gateway —'),

      new Paragraph({ children: [new PageBreak()] }),

      // ═══════ 18 — DEPLOYMENT ═══════
      sectionLabel('18', 'Deployment & Infrastructure'),
      heading('Current Deployment', HeadingLevel.HEADING_1),
      spacer(80),
      bullet('Vercel — static frontend (CDN) + serverless API functions', 'Hosting:'),
      bullet('Ethereum Sepolia testnet via public RPC', 'Blockchain:'),
      bullet('Firebase (Google OAuth)', 'Auth:'),
      bullet('HuggingFace Inference API', 'AI:'),
      bullet('GitHub (private repo) → auto-deploys to Vercel on push', 'CI/CD:'),
      spacer(100),
      heading('Environment Variables', HeadingLevel.HEADING_2),
      bullet('PRIVATE_KEY — Ethereum wallet private key for signing transactions'),
      bullet('SEPOLIA_RPC_URL — RPC endpoint for Sepolia network'),
      bullet('HF_TOKEN — HuggingFace API token for ML inference'),
      body('All stored in Vercel environment variables (encrypted) and local .env file (gitignored).'),

      new Paragraph({ children: [new PageBreak()] }),

      // ═══════ 19 — URLS ═══════
      sectionLabel('19', 'URLs & Access'),
      heading('Live URLs', HeadingLevel.HEADING_1),
      spacer(80),
      bullet('https://hackathon-six-eosin.vercel.app', 'Production Website:'),
      bullet('https://hackathon-six-eosin.vercel.app/docs', 'API Documentation:'),
      bullet('https://hackathon-six-eosin.vercel.app/api/v1/verify', 'Public API:'),
      bullet('https://sepolia.etherscan.io/address/0x37FCD33D5FF07cfa3A75D27B4ec4cF09e458dfac', 'Smart Contract (Etherscan):'),
      bullet('https://github.com/yash113gadia/attestr (PRIVATE)', 'GitHub Repository:'),
      bullet('/extension/ folder in the repo — load as unpacked Chrome extension', 'Chrome Extension:'),

      new Paragraph({ children: [new PageBreak()] }),

      // ═══════ 20 — HOW TO RUN ═══════
      sectionLabel('20', 'How to Run Locally'),
      heading('Local Development', HeadingLevel.HEADING_1),
      spacer(80),
      heading('Prerequisites', HeadingLevel.HEADING_2),
      bullet('Node.js >= 18'),
      bullet('npm'),
      bullet('A .env file with PRIVATE_KEY, SEPOLIA_RPC_URL, HF_TOKEN'),
      spacer(60),
      heading('Setup', HeadingLevel.HEADING_2),
      codeLine('git clone https://github.com/yash113gadia/attestr.git'),
      codeLine('cd attestr'),
      codeLine('npm install --legacy-peer-deps'),
      spacer(60),
      heading('Run', HeadingLevel.HEADING_2),
      codeLine('# Terminal 1 — Backend server'),
      codeLine('npm run server'),
      codeLine(''),
      codeLine('# Terminal 2 — Frontend dev server'),
      codeLine('npm run dev'),
      codeLine(''),
      codeLine('# Open http://localhost:5173'),
      spacer(60),
      heading('Deploy', HeadingLevel.HEADING_2),
      codeLine('git add -A && git commit -m "message" && git push'),
      codeLine('# Vercel auto-deploys from GitHub'),

      new Paragraph({ children: [new PageBreak()] }),

      // ═══════ 21 — DEMO SCRIPT ═══════
      sectionLabel('21', 'Demo Script'),
      heading('6-Minute Presentation Flow', HeadingLevel.HEADING_1),
      spacer(80),
      heading('Minute 0-1: The Problem (slides)', HeadingLevel.HEADING_2),
      body('"96% of deepfakes are AI-generated. A single fake image tanked the S&P 500 by $500 billion. And no one can reliably prove whether a photo is real. That\'s the problem."'),
      spacer(60),
      heading('Minute 1-2: Our Approach (slides)', HeadingLevel.HEADING_2),
      body('"We don\'t detect fakes — we prove originals. Attestr creates a cryptographic fingerprint of your media and records it permanently on the Ethereum blockchain. We turn \'I think this is real\' into mathematical proof."'),
      spacer(60),
      heading('Minute 2-4: Live Demo', HeadingLevel.HEADING_2),
      bullet('Open the website. Show the landing page briefly.'),
      bullet('Sign in with Google.'),
      bullet('Upload a photo → watch the hashing animation → click Register.'),
      bullet('Show the Etherscan link — click it, show the blockchain record.'),
      bullet('Go to Verify → upload the SAME photo → show VERIFIED result.'),
      bullet('Open the photo in any editor, change 1 pixel, save. Upload the modified version → show NOT VERIFIED.'),
      bullet('Show ELA analysis, EXIF metadata, AI detection results.'),
      bullet('Show the Activity page — anonymized public feed.'),
      bullet('If time: show the API docs page, mention the Chrome extension.'),
      spacer(60),
      heading('Minute 4-5: Architecture & Business (slides)', HeadingLevel.HEADING_2),
      body('"Client-side hashing — your file never leaves the browser. Public Ethereum — we can\'t tamper even if we wanted to. Public API for integration. Chrome extension for verification anywhere. $0 to operate today, 93% margins at scale."'),
      spacer(60),
      heading('Minute 5-6: Why Us (slides)', HeadingLevel.HEADING_2),
      body('"Truepic raised $26M and needs special hardware. OpenOrigins uses a permissioned blockchain. We made it work in any browser, on public Ethereum, for free. The best security tool is the one people actually use."'),

      new Paragraph({ children: [new PageBreak()] }),

      // ═══════ 22 — Q&A PREP ═══════
      sectionLabel('22', 'Q&A Preparation'),
      heading('Anticipated Questions & Answers', HeadingLevel.HEADING_1),
      spacer(80),

      ...[
        ['What if someone registers a fake image or document?', 'They can, but it doesn\'t help them. The real evidence will have an earlier blockchain timestamp. Timestamp order is immutable — they can\'t backdate.'],
        ['Why Ethereum and not your own blockchain?', 'Trust. A private chain means you have to trust us. Public Ethereum has thousands of validators and has never been compromised. We inherit that trust for free.'],
        ['How do you handle non-image files like PDFs and 3D models?', 'For documents, code, and 3D models, we use strict SHA-256 cryptographic hashing. This provides an exact-match "Notary Integrity Check." If even a single byte is altered in a legal PDF, the verification will fail. We also provide native in-browser previews (like Three.js for 3D models) so the user can see exactly what they are notarizing.'],
        ['How accurate is the AI detection?', 'Honestly, our ML models are ~57% accurate with free APIs. But AI detection isn\'t our core value — provenance is. Detection is an arms race. A cryptographic hash is permanent math.'],
        ['What happens if Attestr shuts down?', 'All records are on public Ethereum. Anyone can verify by going directly to Etherscan. We don\'t need to exist for the records to be valid.'],
        ['How is this different from C2PA?', 'C2PA embeds metadata that gets stripped by screenshots and social media uploads. Our perceptual hash is based on image content, not metadata — it survives re-encoding.'],
        ['Can this work for video and audio?', 'Yes — SHA-256 works on any file. Audio and video receive exact-match verification, establishing a provable chain of custody against AI Voice Clones and Deepfakes.'],
        ['How do you handle scale?', 'Serverless architecture means auto-scaling. Moving to Polygon mainnet ($0.001/tx) for production. The heaviest computation runs on the user\'s device, not ours.'],
        ['What\'s the InnovateBharat relevance?', 'India\'s Election Commission flagged deepfakes as a top threat for 2026 elections. Furthermore, corporate fraud and document tampering are massive issues. Attestr directly addresses evidence authenticity across all mediums — a critical national issue.'],
      ].flatMap(([q, a]) => [
        new Paragraph({ spacing: { before: 200, after: 60 }, children: [new TextRun({ text: 'Q: ' + q, bold: true, font: 'Calibri', size: 22, color: ACCENT })] }),
        new Paragraph({ spacing: { after: 100 }, children: [new TextRun({ text: 'A: ' + a, font: 'Calibri', size: 22, color: '444444' })] }),
      ]),

      spacer(400),

      // Footer
      new Paragraph({ alignment: AlignmentType.CENTER, children: [
        new TextRun({ text: 'Attestr', font: 'Georgia', size: 24, bold: true, color: ACCENT }),
        new TextRun({ text: '  •  Team Ctrl+Alt+Diablo  •  CSBC114  •  Innovate Bharat 2026', font: 'Calibri', size: 20, color: GRAY }),
      ]}),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 60 }, children: [new TextRun({ text: 'Sharda University  •  Department of Computer Science & Engineering', font: 'Calibri', size: 18, color: 'AAAAAA' })] }),
    ],
  }],
});

const buffer = await Packer.toBuffer(doc);
writeFileSync('Attestr_Team_Documentation.docx', buffer);
console.log('Generated: Attestr_Team_Documentation.docx');
console.log('Pages: ~25');
