import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { ethers } from 'ethers';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { createHash, randomBytes } from 'crypto';
import admin from 'firebase-admin';
import blockchain, { setFirestore } from './server/blockchain.js';

// ── Firebase Admin Setup ──
const SERVICE_ACCOUNT_PATH = './firebase-service-account.json';
let db = null; // Firestore reference
if (existsSync(SERVICE_ACCOUNT_PATH)) {
  const serviceAccount = JSON.parse(readFileSync(SERVICE_ACCOUNT_PATH, 'utf8'));
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
  db = admin.firestore();
  console.log('Firebase Admin: initialized (Firestore enabled)');
} else if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
  try {
    const decoded = Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64').toString('utf8');
    // Ensure no literal newlines or control characters break JSON.parse
    const jsonString = decoded.replace(/[\u0000-\u001F\u007F-\u009F]/g, (match) => {
      if (match === '\n') return '\\n';
      if (match === '\r') return '\\r';
      if (match === '\t') return '\\t';
      return '';
    });
    admin.initializeApp({ credential: admin.credential.cert(JSON.parse(jsonString)) });
    db = admin.firestore();
    console.log('Firebase Admin: initialized from env (Firestore enabled)');
  } catch (err) {
    console.error('Firebase Admin init failed:', err.message);
    process.exit(1); // Exit so Railway knows the deploy failed
  }
} else {
  console.warn('Firebase Admin: service account not found — auth disabled');
}

// Connect Firestore to blockchain module & restore chain if local file is empty
if (db) {
  setFirestore(db);
  blockchain.loadFromFirestore().catch(() => {});
}

// ── Verification Audit Log ──
const AUDIT_FILE = 'data/audit-log.json';
let auditLog = {}; // keyed by sha256 → array of { verifiedBy, verifiedByName, source, timestamp }
try {
  if (existsSync(AUDIT_FILE)) {
    auditLog = JSON.parse(readFileSync(AUDIT_FILE, 'utf8'));
  }
} catch { auditLog = {}; }

function saveAuditLog() {
  try {
    if (!existsSync('data')) mkdirSync('data', { recursive: true });
    writeFileSync(AUDIT_FILE, JSON.stringify(auditLog, null, 2));
  } catch (err) { console.warn('Failed to save audit log:', err.message); }
}

function logVerification(sha256, { userId, userName, source }) {
  if (!auditLog[sha256]) auditLog[sha256] = [];
  auditLog[sha256].push({
    verifiedBy: userId || 'anonymous',
    verifiedByName: userName || 'Anonymous',
    source: source || 'web',
    timestamp: new Date().toISOString(),
  });
  // Cap at 100 entries per file
  if (auditLog[sha256].length > 100) auditLog[sha256] = auditLog[sha256].slice(-100);
  saveAuditLog();
  // Firestore sync (fire-and-forget)
  if (db) {
    const entry = auditLog[sha256].at(-1);
    db.collection('auditLogs').doc(sha256).collection('entries').add(entry).catch(() => {});
  }
}

// ── Chain of Custody Event Log ──
const EVENTS_FILE = 'data/events-log.json';
let eventsLog = {}; // keyed by sha256 → array of events
try {
  if (existsSync(EVENTS_FILE)) {
    eventsLog = JSON.parse(readFileSync(EVENTS_FILE, 'utf8'));
  }
} catch { eventsLog = {}; }

function saveEventsLog() {
  try {
    if (!existsSync('data')) mkdirSync('data', { recursive: true });
    writeFileSync(EVENTS_FILE, JSON.stringify(eventsLog, null, 2));
  } catch (err) { console.warn('Failed to save events log:', err.message); }
}

function logEvent(sha256, event) {
  if (!eventsLog[sha256]) eventsLog[sha256] = [];
  eventsLog[sha256].push({ ...event, timestamp: new Date().toISOString() });
  if (eventsLog[sha256].length > 200) eventsLog[sha256] = eventsLog[sha256].slice(-200);
  saveEventsLog();
  // Firestore sync (fire-and-forget)
  if (db) {
    const entry = eventsLog[sha256].at(-1);
    db.collection('eventsLog').doc(sha256).collection('entries').add(entry).catch(() => {});
  }
}

// ── Auth Middleware (optional — extracts user if token present) ──
async function optionalAuth(req, _res, next) {
  req.authUser = null;
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ') && admin.apps.length > 0) {
    try {
      const token = authHeader.split('Bearer ')[1];
      const decoded = await admin.auth().verifyIdToken(token);
      req.authUser = {
        uid: decoded.uid,
        name: decoded.name || decoded.email?.split('@')[0] || 'Anonymous',
        email: decoded.email || null,
        photo: decoded.picture || null,
      };
    } catch { /* token invalid — proceed as anonymous */ }
  }
  next();
}

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json({ limit: '50mb' }));

// ── Sepolia Contract Setup ──
let contract = null;
let wallet = null;
let provider = null;
const SEPOLIA_RPC = process.env.SEPOLIA_RPC_URL || 'https://rpc.sepolia.org';
const PRIVATE_KEY = process.env.PRIVATE_KEY;

if (PRIVATE_KEY && existsSync('artifacts/deployment.json') && existsSync('artifacts/MediaRegistry.json')) {
  try {
    const deployment = JSON.parse(readFileSync('artifacts/deployment.json', 'utf8'));
    const artifact = JSON.parse(readFileSync('artifacts/MediaRegistry.json', 'utf8'));
    provider = new ethers.JsonRpcProvider(SEPOLIA_RPC);
    wallet = new ethers.Wallet(PRIVATE_KEY, provider);
    contract = new ethers.Contract(deployment.address, artifact.abi, wallet);
    console.log(`Sepolia contract: ${deployment.address}`);
    console.log(`Etherscan: ${deployment.etherscanUrl}`);
  } catch (err) {
    console.warn('Failed to load Sepolia contract:', err.message);
    console.log('Falling back to local blockchain only.');
  }
} else {
  console.log('No Sepolia config found. Using local blockchain only.');
  if (!PRIVATE_KEY) console.log('  Set PRIVATE_KEY env var to enable Sepolia.');
  if (!existsSync('artifacts/deployment.json')) console.log('  Run: node scripts/deploy.js');
}

// ── Register by URL ──
app.post('/api/register-url', optionalAuth, async (req, res) => {
  const { url } = req.body;
  // Prefer verified auth identity, fallback to request body
  const userId = req.authUser?.uid || req.body.userId || 'anonymous';
  const userName = req.authUser?.name || req.body.userName || 'Anonymous';
  const userPhoto = req.authUser?.photo || req.body.userPhoto || null;
  const userEmail = req.authUser?.email || null;
  if (!url) return res.status(400).json({ error: 'url is required' });

  try {
    // Fetch the image
    const imgRes = await fetch(url, {
      headers: { 'User-Agent': 'Attestr/1.0' },
      signal: AbortSignal.timeout(15000),
    });
    if (!imgRes.ok) return res.status(400).json({ error: `Failed to fetch image (${imgRes.status})` });

    const buffer = await imgRes.arrayBuffer();
    const mimeType = imgRes.headers.get('content-type') || 'image/unknown';
    const fileSize = buffer.byteLength;

    // Extract filename from URL
    let filename = 'unknown';
    try { filename = new URL(url).pathname.split('/').pop() || 'unknown'; } catch {}

    // SHA-256
    const { createHash } = await import('crypto');
    const sha256 = createHash('sha256').update(Buffer.from(buffer)).digest('hex');

    // dHash derived from SHA-256 (no canvas on server)
    const dHash = sha256.substring(0, 64);

    // Check duplicates
    const existing = blockchain.findBySha256(sha256);
    if (existing) {
      const regBy = existing.data?.userName || 'unknown';
      const regTime = new Date(existing.timestamp);
      return res.status(409).json({
        error: `This exact image was already registered by ${regBy} on ${regTime.toLocaleDateString()}.`,
        sha256,
      });
    }

    // Register locally
    const attestationNote = req.body.attestationNote || null;
    const block = blockchain.addBlock({
      sha256, dHash, filename, fileSize, mimeType,
      userId, userName, userPhoto, userEmail,
      url, attestationNote, registeredAt: new Date().toISOString(),
    });

    // Log chain of custody event
    logEvent(sha256, { type: 'registered', by: userName, byId: userId, source: 'url', note: attestationNote });

    // Register on Sepolia
    let onChain = null;
    if (contract) {
      try {
        const sha256Bytes = '0x' + sha256;
        const dHashHex = '0x' + dHash.substring(0, 16).padEnd(16, '0');
        const tx = await contract.register(sha256Bytes, dHashHex, filename, fileSize, mimeType);
        const receipt = await tx.wait();
        onChain = {
          transactionHash: receipt.hash,
          blockNumber: Number(receipt.blockNumber),
          etherscanUrl: `https://sepolia.etherscan.io/tx/${receipt.hash}`,
          network: 'sepolia',
          gasUsed: receipt.gasUsed.toString(),
        };
      } catch (err) {
        onChain = { error: err.reason || err.message };
      }
    }

    res.json({ success: true, sha256, dHash, filename, fileSize, mimeType, url, block, onChain });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── Register ──
app.post('/api/register', optionalAuth, async (req, res) => {
  const { sha256, dHash, filename, fileSize, mimeType } = req.body;
  // Prefer verified auth identity, fallback to request body
  const userId = req.authUser?.uid || req.body.userId || 'anonymous';
  const userName = req.authUser?.name || req.body.userName || 'Anonymous';
  const userPhoto = req.authUser?.photo || req.body.userPhoto || null;
  const userEmail = req.authUser?.email || null;

  if (!sha256 || !dHash) {
    return res.status(400).json({ error: 'sha256 and dHash are required' });
  }

  // Check 1: Exact hash match — same file already registered
  const existing = blockchain.findBySha256(sha256);
  if (existing) {
    const regBy = existing.data?.userName || 'unknown';
    const regTime = new Date(existing.timestamp);
    return res.status(409).json({
      error: `This exact file was already registered by ${regBy} on ${regTime.toLocaleDateString()} at ${regTime.toLocaleTimeString()}.`,
      block: existing,
    });
  }

  // Check 2: Perceptual match — visually similar content already registered
  // Only run perceptual matching for images (video dHashes are SHA-256-derived, not perceptual)
  const isImage = mimeType && mimeType.startsWith('image/');
  if (dHash && isImage) {
    const similar = blockchain.findByDHash(dHash);
    if (similar && similar.block.data?.mimeType?.startsWith('image/')) {
      const totalBits = similar.block.data.dHash.length * 4;
      const similarity = Math.round(((totalBits - similar.distance) / totalBits) * 100);
      const regBy = similar.block.data?.userName || 'unknown';
      const regTime = new Date(similar.block.timestamp);
      return res.status(409).json({
        error: `Visually similar content (${similarity}% match) was already registered by ${regBy} on ${regTime.toLocaleDateString()} at ${regTime.toLocaleTimeString()}. File: ${similar.block.data?.filename}`,
        block: similar.block,
        similarity,
      });
    }
  }

  // Check 3: On-chain exact match (Sepolia)
  if (contract) {
    try {
      const [existsOnChain] = await contract.verify('0x' + sha256);
      if (existsOnChain) {
        return res.status(409).json({
          error: 'This exact file is already registered on Ethereum Sepolia.',
        });
      }
    } catch {}
  }

  // All checks passed — register
  const attestationNote = req.body.attestationNote || null;
  const deviceInfo = req.body.deviceInfo || null;
  const block = blockchain.addBlock({
    sha256,
    dHash,
    filename: filename || 'unknown',
    fileSize: fileSize || 0,
    mimeType: mimeType || 'unknown',
    userId,
    userName,
    userPhoto,
    userEmail,
    attestationNote,
    deviceInfo,
    registeredAt: new Date().toISOString(),
  });

  // Log chain of custody event
  logEvent(sha256, { type: 'registered', by: userName, byId: userId, source: 'web', note: attestationNote, device: deviceInfo });

  // Also register on Sepolia if available
  let onChain = null;
  if (contract) {
    try {
      const sha256Bytes = '0x' + sha256;
      const dHashHex = '0x' + dHash.padEnd(16, '0');
      const tx = await contract.register(
        sha256Bytes,
        dHashHex,
        filename || 'unknown',
        fileSize || 0,
        mimeType || 'unknown'
      );
      const receipt = await tx.wait();
      onChain = {
        transactionHash: receipt.hash,
        blockNumber: Number(receipt.blockNumber),
        etherscanUrl: `https://sepolia.etherscan.io/tx/${receipt.hash}`,
        network: 'sepolia',
        gasUsed: receipt.gasUsed.toString(),
      };
      console.log(`On-chain tx: ${receipt.hash}`);
    } catch (err) {
      console.warn('Sepolia registration failed:', err.reason || err.message);
      onChain = { error: err.reason || err.message };
    }
  }

  res.json({ success: true, block, onChain });
});

// ── Verify ──
app.post('/api/verify', optionalAuth, async (req, res) => {
  const { sha256, dHash, source } = req.body;

  if (!sha256) {
    return res.status(400).json({ error: 'sha256 is required' });
  }

  // Count total registrations for context
  const chain = blockchain.getChain();
  const totalRegistrations = chain.length - 1;

  // Check on-chain first if available
  let onChain = null;
  if (contract) {
    try {
      const sha256Bytes = '0x' + sha256;
      const [exists, record] = await contract.verify(sha256Bytes);
      if (exists) {
        const registeredAt = new Date(Number(record.timestamp) * 1000);
        onChain = {
          verified: true,
          filename: record.filename,
          fileSize: Number(record.fileSize),
          mimeType: record.mimeType,
          registeredBy: record.registeredBy,
          timestamp: Number(record.timestamp),
          blockNumber: Number(record.blockNumber),
          network: 'sepolia',
          registeredAt: registeredAt.toISOString(),
        };
      }
    } catch (err) {
      console.warn('Sepolia verify failed:', err.message);
    }
  }

  // Check local chain
  const exactMatch = blockchain.findBySha256(sha256);

  if (exactMatch || onChain?.verified) {
    // Build registrant identity from local chain (has name + photo)
    const registrant = {
      name: exactMatch?.data?.userName || 'Unknown',
      photo: exactMatch?.data?.userPhoto || null,
      wallet: onChain?.registeredBy || null,
    };
    const displayName = registrant.name !== 'Unknown' && registrant.name !== 'Anonymous'
      ? registrant.name
      : onChain?.registeredBy
        ? `${onChain.registeredBy.substring(0, 6)}...${onChain.registeredBy.substring(38)}`
        : 'unknown';
    const regTime = onChain?.registeredAt
      ? new Date(onChain.registeredAt)
      : exactMatch ? new Date(exactMatch.timestamp) : null;
    const timeStr = regTime ? formatTimeAgo(regTime) : 'unknown time';

    // Log this verification
    logVerification(sha256, {
      userId: req.authUser?.uid || req.body.verifierUserId,
      userName: req.authUser?.name || req.body.verifierUserName,
      source: source || 'web',
    });
    const verifications = auditLog[sha256] || [];

    const events = eventsLog[sha256] || [];
    return res.json({
      status: 'verified',
      message: `Exact match found. First registered ${timeStr} by ${displayName}.`,
      block: exactMatch || null,
      onChain,
      similarity: 100,
      totalRegistrations,
      registrant,
      verificationCount: verifications.length,
      recentVerifications: verifications.slice(-5).reverse(),
      attestationNote: exactMatch?.data?.attestationNote || null,
      custodyTimeline: events,
      coSigners: events.filter(e => e.type === 'co-attested').map(e => ({ name: e.by, photo: e.photo, timestamp: e.timestamp })),
      isRevoked: events.some(e => e.type === 'revoked'),
      currentCustodian: (() => { const transfers = events.filter(e => e.type === 'custody-transferred'); return transfers.length > 0 ? { name: transfers[transfers.length - 1].toName, id: transfers[transfers.length - 1].toId } : { name: registrant.name, id: exactMatch?.data?.userId }; })(),
    });
  }

  // Perceptual match (local only)
  if (dHash) {
    const perceptualMatch = blockchain.findByDHash(dHash);
    if (perceptualMatch) {
      const totalBits = perceptualMatch.block.data.dHash.length * 4;
      const similarity = Math.round(((totalBits - perceptualMatch.distance) / totalBits) * 100);
      const regUser = perceptualMatch.block.data?.userName || 'unknown';
      const regTime = new Date(perceptualMatch.block.timestamp);
      const matchSha = perceptualMatch.block.data?.sha256;

      // Build registrant identity
      const registrant = {
        name: perceptualMatch.block.data?.userName || 'Unknown',
        photo: perceptualMatch.block.data?.userPhoto || null,
        wallet: onChain?.registeredBy || null,
      };

      // Log verification
      if (matchSha) {
        logVerification(matchSha, {
          userId: req.authUser?.uid || req.body.verifierUserId,
          userName: req.authUser?.name || req.body.verifierUserName,
          source: source || 'web',
        });
      }
      const verifications = matchSha ? (auditLog[matchSha] || []) : [];

      const events = matchSha ? (eventsLog[matchSha] || []) : [];
      return res.json({
        status: 'similar',
        message: `Content matches a registered file (${similarity}% similar), registered ${formatTimeAgo(regTime)} by ${regUser}. The file may have been re-compressed, resized, or screenshotted.`,
        block: perceptualMatch.block,
        onChain,
        similarity,
        hammingDistance: perceptualMatch.distance,
        totalRegistrations,
        registrant,
        verificationCount: verifications.length,
        recentVerifications: verifications.slice(-5).reverse(),
        attestationNote: perceptualMatch.block.data?.attestationNote || null,
        custodyTimeline: events,
        coSigners: events.filter(e => e.type === 'co-attested').map(e => ({ name: e.by, photo: e.photo, timestamp: e.timestamp })),
        isRevoked: events.some(e => e.type === 'revoked'),
        currentCustodian: (() => { const transfers = events.filter(e => e.type === 'custody-transferred'); return transfers.length > 0 ? { name: transfers[transfers.length - 1].toName, id: transfers[transfers.length - 1].toId } : { name: registrant.name, id: perceptualMatch.block.data?.userId }; })(),
      });
    }
  }

  res.json({
    status: 'unverified',
    message: `No matching media found. This file has not been registered on the blockchain.${totalRegistrations > 0 ? ` ${totalRegistrations} files are currently registered.` : ''}`,
    onChain: null,
    similarity: 0,
    totalRegistrations,
  });
});

function formatTimeAgo(date) {
  const diff = Date.now() - date.getTime();
  if (diff < 60000) return 'just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)} minutes ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} hours ago`;
  return `on ${date.toLocaleDateString()} at ${date.toLocaleTimeString()}`;
}

// ── Chain explorer ──
app.get('/api/chain', async (req, res) => {
  let onChainStats = null;
  if (contract) {
    try {
      const total = await contract.totalRegistered();
      const balance = await provider.getBalance(wallet.address);
      onChainStats = {
        network: 'sepolia',
        contractAddress: await contract.getAddress(),
        totalRegistered: Number(total),
        walletBalance: ethers.formatEther(balance),
      };
    } catch (err) {
      console.warn('Failed to get on-chain stats:', err.message);
    }
  }

  res.json({
    chain: blockchain.getChain(),
    length: blockchain.getChain().length,
    valid: blockchain.isChainValid(),
    onChain: onChainStats,
  });
});

// ── User's media (auth-gated on frontend) ──
app.get('/api/my-media/:userId', (req, res) => {
  const { userId } = req.params;
  const chain = blockchain.getChain();
  const userBlocks = chain.filter((b) => b.data?.userId === userId);
  res.json({
    blocks: userBlocks,
    count: userBlocks.length,
  });
});

// ── Public activity feed (anonymous) ──
app.get('/api/activity', async (req, res) => {
  const chain = blockchain.getChain();
  // Return all non-genesis blocks, anonymized
  const activity = chain
    .filter((b) => b.data && !b.data.message)
    .map((b) => {
      // Censor filename — show extension only
      const ext = b.data.filename?.includes('.') ? b.data.filename.split('.').pop() : '?';
      const nameLen = b.data.filename?.split('.')[0]?.length || 0;
      const censored = '•'.repeat(Math.min(nameLen, 8)) + '.' + ext;

      return {
        index: b.index,
        hash: b.hash,
        timestamp: b.timestamp,
        filename: censored,
        fileSize: b.data.fileSize,
        mimeType: b.data.mimeType,
        registeredBy: b.data.userId ? b.data.userId.substring(0, 2) + '••••' : 'anon',
      };
    })
    .reverse();

  let onChainStats = null;
  if (contract) {
    try {
      const total = await contract.totalRegistered();
      onChainStats = {
        totalRegistered: Number(total),
        network: 'sepolia',
        contractAddress: await contract.getAddress(),
      };
    } catch {}
  }

  res.json({
    activity,
    totalRegistrations: activity.length,
    chainLength: chain.length,
    chainValid: blockchain.isChainValid(),
    onChain: onChainStats,
  });
});

// ── Block lookup ──
app.get('/api/block/:sha256', (req, res) => {
  const block = blockchain.findBySha256(req.params.sha256);
  if (!block) {
    return res.status(404).json({ error: 'Block not found' });
  }
  res.json(block);
});

// ── Status ──
app.get('/api/status', async (req, res) => {
  const status = {
    localChain: {
      blocks: blockchain.getChain().length,
      valid: blockchain.isChainValid(),
    },
    sepolia: null,
  };

  if (contract) {
    try {
      const total = await contract.totalRegistered();
      const balance = await provider.getBalance(wallet.address);
      status.sepolia = {
        connected: true,
        contract: await contract.getAddress(),
        totalRegistered: Number(total),
        walletBalance: ethers.formatEther(balance),
        network: 'sepolia',
      };
    } catch {
      status.sepolia = { connected: false };
    }
  }

  res.json(status);
});

// ── Tier 3: Multi-party Co-attestation ──
app.post('/api/co-attest', optionalAuth, (req, res) => {
  const { sha256 } = req.body;
  if (!sha256) return res.status(400).json({ error: 'sha256 is required' });
  if (!req.authUser) return res.status(401).json({ error: 'Authentication required to co-attest' });

  const block = blockchain.findBySha256(sha256);
  if (!block) return res.status(404).json({ error: 'File not found on the ledger' });

  // Prevent self co-attestation
  if (block.data?.userId === req.authUser.uid) {
    return res.status(400).json({ error: 'You are the original registrant — co-attestation is for additional signers' });
  }

  // Prevent duplicate co-attestation
  const events = eventsLog[sha256] || [];
  const alreadyCoAttested = events.some(e => e.type === 'co-attested' && e.byId === req.authUser.uid);
  if (alreadyCoAttested) {
    return res.status(409).json({ error: 'You have already co-attested this file' });
  }

  const note = req.body.note || null;
  logEvent(sha256, {
    type: 'co-attested',
    by: req.authUser.name,
    byId: req.authUser.uid,
    photo: req.authUser.photo,
    note,
  });

  const allCoSigners = (eventsLog[sha256] || [])
    .filter(e => e.type === 'co-attested')
    .map(e => ({ name: e.by, photo: e.photo, timestamp: e.timestamp }));

  res.json({ success: true, coSigners: allCoSigners, message: `Co-attestation by ${req.authUser.name} recorded.` });
});

// ── Tier 3: Custody Transfer ──
app.post('/api/transfer-custody', optionalAuth, async (req, res) => {
  const { sha256, toEmail } = req.body;
  if (!sha256 || !toEmail) return res.status(400).json({ error: 'sha256 and toEmail are required' });
  if (!req.authUser) return res.status(401).json({ error: 'Authentication required to transfer custody' });

  const block = blockchain.findBySha256(sha256);
  if (!block) return res.status(404).json({ error: 'File not found on the ledger' });

  // Only current custodian can transfer
  const events = eventsLog[sha256] || [];
  const transfers = events.filter(e => e.type === 'custody-transferred');
  const currentCustodianId = transfers.length > 0 ? transfers[transfers.length - 1].toId : block.data?.userId;
  if (currentCustodianId !== req.authUser.uid) {
    return res.status(403).json({ error: 'Only the current custodian can transfer custody' });
  }

  // Resolve recipient by email via Firebase
  let recipient = { uid: toEmail, name: toEmail };
  if (admin.apps.length > 0) {
    try {
      const recipientUser = await admin.auth().getUserByEmail(toEmail);
      recipient = { uid: recipientUser.uid, name: recipientUser.displayName || toEmail };
    } catch {
      // User may not exist in Firebase — record email as identifier
    }
  }

  const note = req.body.note || null;
  logEvent(sha256, {
    type: 'custody-transferred',
    by: req.authUser.name,
    byId: req.authUser.uid,
    toName: recipient.name,
    toId: recipient.uid,
    toEmail,
    note,
  });

  res.json({ success: true, message: `Custody transferred to ${recipient.name}.`, newCustodian: recipient });
});

// ── Tier 3: Revocation ──
app.post('/api/revoke', optionalAuth, (req, res) => {
  const { sha256, reason } = req.body;
  if (!sha256) return res.status(400).json({ error: 'sha256 is required' });
  if (!req.authUser) return res.status(401).json({ error: 'Authentication required to revoke' });

  const block = blockchain.findBySha256(sha256);
  if (!block) return res.status(404).json({ error: 'File not found on the ledger' });

  // Only original registrant can revoke
  if (block.data?.userId !== req.authUser.uid) {
    return res.status(403).json({ error: 'Only the original registrant can revoke an attestation' });
  }

  const events = eventsLog[sha256] || [];
  const alreadyRevoked = events.some(e => e.type === 'revoked');
  if (alreadyRevoked) {
    return res.status(409).json({ error: 'This attestation has already been revoked' });
  }

  logEvent(sha256, {
    type: 'revoked',
    by: req.authUser.name,
    byId: req.authUser.uid,
    reason: reason || 'No reason provided',
  });

  res.json({ success: true, message: 'Attestation revoked. The file will now show as revoked on verification.' });
});

// ── Tier 3: Chain of Custody Timeline ──
app.get('/api/custody/:sha256', (req, res) => {
  const sha256 = req.params.sha256;
  const block = blockchain.findBySha256(sha256);
  if (!block) return res.status(404).json({ error: 'File not found' });

  const events = eventsLog[sha256] || [];
  const verifications = auditLog[sha256] || [];

  res.json({
    sha256,
    filename: block.data?.filename,
    registrant: {
      name: block.data?.userName || 'Unknown',
      photo: block.data?.userPhoto || null,
      registeredAt: block.data?.registeredAt || new Date(block.timestamp).toISOString(),
    },
    attestationNote: block.data?.attestationNote || null,
    deviceInfo: block.data?.deviceInfo || null,
    events,
    verifications: verifications.slice(-20).reverse(),
    coSigners: events.filter(e => e.type === 'co-attested').map(e => ({ name: e.by, photo: e.photo, timestamp: e.timestamp, note: e.note })),
    isRevoked: events.some(e => e.type === 'revoked'),
    revocationReason: events.find(e => e.type === 'revoked')?.reason || null,
    currentCustodian: (() => {
      const transfers = events.filter(e => e.type === 'custody-transferred');
      return transfers.length > 0
        ? { name: transfers[transfers.length - 1].toName, id: transfers[transfers.length - 1].toId }
        : { name: block.data?.userName || 'Unknown', id: block.data?.userId };
    })(),
  });
});

// ── API Key Management ──
async function validateApiKey(key) {
  if (!key || !db) return null;
  try {
    const snap = await db.collection('apiKeys').where('key', '==', key).where('active', '==', true).limit(1).get();
    if (snap.empty) return null;
    const doc = snap.docs[0];
    // Increment usage count
    await doc.ref.update({ usageCount: admin.firestore.FieldValue.increment(1), lastUsed: new Date().toISOString() });
    return doc.data();
  } catch { return null; }
}

// Generate API Key
app.post('/api/keys/generate', optionalAuth, async (req, res) => {
  if (!req.authUser) return res.status(401).json({ error: 'Authentication required' });
  if (!db) return res.status(503).json({ error: 'Firestore not available' });

  const { label } = req.body;
  const key = 'atr_' + randomBytes(24).toString('hex');

  try {
    // Limit to 5 keys per user
    const existing = await db.collection('apiKeys').where('userId', '==', req.authUser.uid).where('active', '==', true).get();
    if (existing.size >= 5) return res.status(429).json({ error: 'Maximum 5 active API keys per account' });

    await db.collection('apiKeys').add({
      key,
      userId: req.authUser.uid,
      userName: req.authUser.name,
      label: label || 'Default',
      active: true,
      usageCount: 0,
      createdAt: new Date().toISOString(),
      lastUsed: null,
    });

    res.json({ success: true, key, label: label || 'Default' });
  } catch (e) {
    res.status(500).json({ error: 'Failed to generate key: ' + e.message });
  }
});

// List user's API keys
app.get('/api/keys', optionalAuth, async (req, res) => {
  if (!req.authUser) return res.status(401).json({ error: 'Authentication required' });
  if (!db) return res.status(503).json({ error: 'Firestore not available' });

  try {
    const snap = await db.collection('apiKeys').where('userId', '==', req.authUser.uid).get();
    const keys = snap.docs.map(d => {
      const data = d.data();
      return {
        id: d.id,
        label: data.label,
        keyPreview: data.key.substring(0, 8) + '...' + data.key.substring(data.key.length - 4),
        active: data.active,
        usageCount: data.usageCount,
        createdAt: data.createdAt,
        lastUsed: data.lastUsed,
      };
    });
    res.json({ keys });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Revoke API key
app.delete('/api/keys/:id', optionalAuth, async (req, res) => {
  if (!req.authUser) return res.status(401).json({ error: 'Authentication required' });
  if (!db) return res.status(503).json({ error: 'Firestore not available' });

  try {
    const docRef = db.collection('apiKeys').doc(req.params.id);
    const doc = await docRef.get();
    if (!doc.exists || doc.data().userId !== req.authUser.uid) {
      return res.status(404).json({ error: 'Key not found' });
    }
    await docRef.update({ active: false });
    res.json({ success: true, message: 'API key revoked' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── Public API v1 ──
app.post('/api/v1/verify', async (req, res) => {
  const { image, includeAI = false } = req.body || {};
  if (!image) return res.status(400).json({ error: 'image is required (base64 or URL)' });

  try {
    let imageBuffer, mimeType = 'application/octet-stream';
    const isUrl = typeof image === 'string' && (image.startsWith('http://') || image.startsWith('https://'));

    if (isUrl) {
      const fetched = await fetch(image, { signal: AbortSignal.timeout(15000) });
      if (!fetched.ok) return res.status(400).json({ error: `Failed to fetch: ${fetched.status}` });
      mimeType = fetched.headers.get('content-type') || mimeType;
      imageBuffer = Buffer.from(await fetched.arrayBuffer());
    } else {
      const raw = image.replace(/^data:[^;]+;base64,/, '');
      const match = image.match(/^data:([^;]+);base64,/);
      if (match) mimeType = match[1];
      imageBuffer = Buffer.from(raw, 'base64');
    }

    const sha256 = createHash('sha256').update(imageBuffer).digest('hex');
    const dHash = sha256.substring(0, 64);
    const fileSize = imageBuffer.length;

    // Local chain check
    const exactMatch = blockchain.findBySha256(sha256);

    // On-chain check
    let onChainResult = null;
    if (contract) {
      try {
        const [exists, record] = await contract.verify('0x' + sha256);
        if (exists) {
          onChainResult = {
            verified: true, filename: record.filename, fileSize: Number(record.fileSize),
            mimeType: record.mimeType, registeredBy: record.registeredBy,
            timestamp: Number(record.timestamp), blockNumber: Number(record.blockNumber), network: 'sepolia',
          };
        }
      } catch {}
    }

    res.json({
      sha256, dHash, meta: { fileSize, mimeType },
      blockchain: onChainResult || { verified: !!exactMatch },
      localMatch: exactMatch ? { filename: exactMatch.data?.filename, registeredBy: exactMatch.data?.userName, timestamp: exactMatch.timestamp } : null,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/v1/register', async (req, res) => {
  // API key required
  const apiKey = req.headers['x-api-key'];
  const keyData = await validateApiKey(apiKey);
  if (!keyData) return res.status(401).json({ error: 'Valid API key required. Generate one at /docs.' });

  const { image, filename } = req.body || {};
  if (!image) return res.status(400).json({ error: 'image is required (base64 or URL)' });

  try {
    let imageBuffer, mimeType = 'application/octet-stream';
    const isUrl = typeof image === 'string' && (image.startsWith('http://') || image.startsWith('https://'));

    if (isUrl) {
      const fetched = await fetch(image, { signal: AbortSignal.timeout(15000) });
      if (!fetched.ok) return res.status(400).json({ error: `Failed to fetch: ${fetched.status}` });
      mimeType = fetched.headers.get('content-type') || mimeType;
      imageBuffer = Buffer.from(await fetched.arrayBuffer());
    } else {
      const raw = image.replace(/^data:[^;]+;base64,/, '');
      const match = image.match(/^data:([^;]+);base64,/);
      if (match) mimeType = match[1];
      imageBuffer = Buffer.from(raw, 'base64');
    }

    const sha256 = createHash('sha256').update(imageBuffer).digest('hex');
    const dHash = sha256.substring(0, 64);
    const fileSize = imageBuffer.length;
    const resolvedFilename = filename || 'api-upload';

    // Duplicate check
    const existing = blockchain.findBySha256(sha256);
    if (existing) return res.status(409).json({ error: 'Media already registered' });

    // Register locally
    const block = blockchain.addBlock({
      sha256, dHash, filename: resolvedFilename, fileSize, mimeType,
      userId: keyData.userId, userName: keyData.userName, userPhoto: null, userEmail: null,
      attestationNote: `Registered via API (${keyData.label})`,
      registeredAt: new Date().toISOString(),
    });

    logEvent(sha256, { type: 'registered', by: keyData.userName, byId: keyData.userId, source: 'api-v1' });

    // On-chain
    let onChain = null;
    if (contract) {
      try {
        const tx = await contract.register('0x' + sha256, '0x' + dHash.substring(0, 16).padEnd(16, '0'), resolvedFilename, fileSize, mimeType);
        const receipt = await tx.wait();
        onChain = { transactionHash: receipt.hash, blockNumber: Number(receipt.blockNumber), etherscanUrl: `https://sepolia.etherscan.io/tx/${receipt.hash}`, network: 'sepolia', gasUsed: receipt.gasUsed.toString() };
      } catch (err) { onChain = { error: err.reason || err.message }; }
    }

    res.json({ success: true, sha256, dHash, meta: { fileSize, mimeType, filename: resolvedFilename }, onChain });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── Health Check ──
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', uptime: process.uptime(), blocks: blockchain.getChain().length, sepolia: !!contract });
});

// ── Serve static frontend in production ──
import { fileURLToPath } from 'url';
import pathModule from 'path';
const __dirname = pathModule.dirname(fileURLToPath(import.meta.url));
const distPath = pathModule.join(__dirname, 'dist');

app.use(express.static(distPath));
app.get('{*path}', (_req, res) => {
  res.sendFile(pathModule.join(distPath, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
  console.log(`Local chain: ${blockchain.getChain().length} blocks | Valid: ${blockchain.isChainValid()}`);
  console.log(`Sepolia: ${contract ? 'ENABLED' : 'DISABLED (local only)'}`);
});
