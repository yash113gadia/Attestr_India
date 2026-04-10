import { lazy, Suspense, useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, Fingerprint, Blocks, Camera, Search, ShieldCheck, Lock,
  ExternalLink, ArrowRight, Monitor, Chrome, Terminal, Eye,
  Globe, TrendingUp, Activity, Hash, AlertTriangle, Bot,
  FolderOpen, HardDrive, RotateCcw, Image, Check, X, CircleDot,
  ArrowUpFromLine, Link2, Loader2, Upload
} from 'lucide-react';
import Logo from '../components/Logo';
import Stat from '../components/Stat';
import ResultCard from '../components/ResultCard';
import ErrorBoundary from '../components/ErrorBoundary';
import { hashFile } from '../lib/hash';
import { registerMedia, verifyMedia, registerByUrl } from '../lib/api';

const GridBackground = lazy(() => import('../components/GridBackground'));
const BlockchainOrb = lazy(() => import('../components/BlockchainOrb'));

const CONTRACT = '0x37FCD33D5FF07cfa3A75D27B4ec4cF09e458dfac';
const ETHERSCAN = `https://sepolia.etherscan.io/address/${CONTRACT}`;
const getApiBase = () => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  if (!import.meta.env.DEV) return '/api';
  // If we're on 5173 (Vite), the backend is likely 3001
  return `http://${window.location.hostname}:3001/api`;
};
const API_BASE = getApiBase();

const fade = (d = 0) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { delay: d, duration: 0.5 } },
});

const sectionFade = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-60px' },
  transition: { duration: 0.6 },
};

/* ═══════════════════════════════════════════════════════════
   PRODUCT 1: WEB PLATFORM — Live Register + Verify
   ═══════════════════════════════════════════════════════════ */
function LiveWebDemo() {
  const [mode, setMode] = useState('register'); // register | verify | url
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [hashing, setHashing] = useState(false);
  const [hashStage, setHashStage] = useState(null);
  const [hashes, setHashes] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [urlInput, setUrlInput] = useState('');
  const inputRef = useRef(null);

  function reset() {
    setFile(null); setPreview(null); setHashing(false); setHashStage(null);
    setHashes(null); setSubmitting(false); setResult(null); setError(null); setUrlInput('');
  }

  async function handleFile(f) {
    reset();
    setFile(f);
    if (f.type.startsWith('image/') || f.type.startsWith('video/')) setPreview(URL.createObjectURL(f));
    setHashing(true); setHashStage('sha256');
    try {
      const h = await hashFile(f);
      setHashes(h); setHashStage(null); setHashing(false);

      if (mode === 'verify') {
        setSubmitting(true);
        const r = await verifyMedia({ sha256: h.sha256, dHash: h.dHash });
        setResult({ ...r, _mode: 'verify' });
        setSubmitting(false);
      }
    } catch (e) { setError(e.message); setHashing(false); }
  }

  async function handleRegister() {
    if (!hashes || !file) return;
    setSubmitting(true); setError(null);
    try {
      const r = await registerMedia({
        sha256: hashes.sha256, dHash: hashes.dHash,
        filename: file.name, fileSize: file.size, mimeType: file.type,
      });
      if (r.error) setResult({ status: 'similar', message: r.error, block: r.block, onChain: r.onChain, _mode: 'register' });
      else setResult({ status: 'registered', message: `${file.name} registered on Ethereum Sepolia.`, block: r.block, onChain: r.onChain, _mode: 'register' });
    } catch (e) { setError(e.message); }
    setSubmitting(false);
  }

  async function handleUrlRegister() {
    if (!urlInput) return;
    setSubmitting(true); setError(null); setResult(null);
    setPreview(urlInput);
    try {
      const r = await registerByUrl({ url: urlInput });
      if (r.error) {
        setResult({ status: 'similar', message: r.error, block: null, onChain: null, _mode: 'url' });
      } else {
        setResult({
          status: 'registered',
          message: `File registered on Ethereum Sepolia. SHA-256: ${r.sha256?.substring(0, 16)}...`,
          block: r.block,
          onChain: r.onChain,
          _mode: 'url',
        });
      }
    } catch (e) { setError(e.message); }
    setSubmitting(false);
  }

  const steps = [
    { key: 'sha256', label: 'SHA-256 cryptographic hash' },
    { key: 'dhash', label: 'Perceptual fingerprint (dHash)' },
  ];

  return (
    <div className="border border-rule rounded-sm overflow-hidden">
      {/* Tab bar */}
      <div className="bg-surface-raised border-b border-rule flex">
        {[
          { key: 'register', label: 'Register', icon: Upload },
          { key: 'url', label: 'Register URL', icon: Link2 },
          { key: 'verify', label: 'Verify', icon: ShieldCheck },
        ].map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => { setMode(key); reset(); }}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-[13px] font-medium transition border-b-2 ${
              mode === key ? 'text-accent border-accent bg-accent/5' : 'text-ink-tertiary border-transparent hover:text-ink-secondary'
            }`}>
            <Icon className="w-4 h-4" strokeWidth={1.5} /> {label}
          </button>
        ))}
      </div>

      <div className="bg-[#0A0B0F] p-6">

        {/* ── URL Register mode ── */}
        {mode === 'url' && !result && (
          <div className="space-y-4">
            <div className="flex gap-2">
              <div className="flex-1 flex items-center gap-2 bg-surface border border-rule rounded-sm px-3 py-2.5">
                <Link2 className="w-4 h-4 text-ink-faint shrink-0" strokeWidth={1.5} />
                <input
                  type="text"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleUrlRegister()}
                  placeholder="Paste any file URL to register..."
                  className="flex-1 bg-transparent text-[12px] text-ink font-mono outline-none placeholder:text-ink-faint"
                />
              </div>
              <button onClick={handleUrlRegister} disabled={!urlInput || submitting}
                className="flex items-center gap-2 bg-white text-void text-[12px] font-medium px-4 py-2.5 rounded-sm hover:bg-ink transition disabled:opacity-40">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Blocks className="w-4 h-4" strokeWidth={1.5} />}
                Register
              </button>
            </div>
            {preview && (
              <div className="w-full h-[160px] rounded-sm border border-rule overflow-hidden bg-surface">
                <img src={preview} alt="" className="w-full h-full object-contain" onError={() => setPreview(null)} />
              </div>
            )}
            {submitting && (
              <div className="flex items-center justify-center gap-3 py-4">
                <Loader2 className="w-5 h-5 text-accent animate-spin" />
                <span className="text-[13px] text-ink-secondary">Fetching file → hashing → writing to Ethereum...</span>
              </div>
            )}
            <p className="text-[11px] text-ink-faint text-center">
              The server fetches the file, computes SHA-256, and registers it on Ethereum Sepolia.
              The extension will then recognize this exact file on any webpage.
            </p>
          </div>
        )}

        {/* ── File upload zone (register / verify modes) ── */}
        {mode !== 'url' && !file && !result && (
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); e.dataTransfer.files?.[0] && handleFile(e.dataTransfer.files[0]); }}
            onClick={() => inputRef.current?.click()}
            className="cursor-pointer border border-dashed border-rule rounded-sm py-16 text-center hover:border-ink-faint transition"
          >
            <input ref={inputRef} type="file" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} className="hidden" />
            <ArrowUpFromLine className="w-5 h-5 mx-auto mb-3 text-ink-faint" strokeWidth={1.5} />
            <p className="text-[13px] text-ink-secondary">
              Drop a file to <span className="text-accent font-medium">{mode}</span>, or <span className="text-accent cursor-pointer">browse</span>
            </p>
            <p className="text-[11px] text-ink-tertiary mt-1 font-mono">IMG · VID · PDF · DOC · CODE · ANY</p>
          </div>
        )}

        {/* File selected — show progress */}
        {mode !== 'url' && file && !result && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              {preview && file.type.startsWith('image/') && (
                <img src={preview} alt="" className="w-16 h-16 rounded-sm object-cover border border-rule" />
              )}
              {preview && file.type.startsWith('video/') && (
                <video src={preview} className="w-16 h-16 rounded-sm object-cover border border-rule" muted />
              )}
              <div className="min-w-0 flex-1">
                <p className="text-[13px] text-ink font-medium truncate">{file.name}</p>
                <p className="text-[11px] text-ink-faint font-mono">
                  {file.type} · {file.size > 1048576 ? (file.size / 1048576).toFixed(1) + ' MB' : (file.size / 1024).toFixed(0) + ' KB'}
                </p>
              </div>
              <button onClick={reset} className="text-[11px] text-ink-faint hover:text-ink-tertiary transition">Reset</button>
            </div>

            {hashing && (
              <div className="border border-rule rounded-sm bg-surface p-4">
                <div className="flex items-center gap-2 mb-3">
                  <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.5, repeat: Infinity }} className="w-2 h-2 rounded-full bg-accent" />
                  <p className="text-[12px] text-ink">Computing fingerprints</p>
                  <p className="text-[10px] text-ink-faint font-mono ml-auto">local only</p>
                </div>
                {steps.map((s, i) => {
                  const active = s.key === hashStage;
                  const done = hashStage === 'dhash' && i === 0;
                  return (
                    <div key={s.key} className="flex items-center gap-2 py-1.5 text-[11px] font-mono">
                      <span className={active ? 'text-accent' : done ? 'text-verified' : 'text-ink-faint'}>
                        {done ? '✓' : active ? '●' : '○'}
                      </span>
                      <span className={active ? 'text-ink' : done ? 'text-verified' : 'text-ink-tertiary'}>{s.label}</span>
                      {active && <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ duration: 1, repeat: Infinity }} className="text-accent ml-auto">processing</motion.span>}
                    </div>
                  );
                })}
              </div>
            )}

            {hashes && !submitting && mode === 'register' && (
              <div className="space-y-3">
                <div className="border border-rule rounded-sm bg-surface p-4 font-mono text-[11px] space-y-1.5">
                  <div className="flex"><span className="text-ink-faint w-14">sha256</span><span className="text-ink truncate">{hashes.sha256}</span></div>
                  <div className="flex"><span className="text-ink-faint w-14">dHash</span><span className="text-ink truncate">{hashes.dHash || 'n/a'}</span></div>
                </div>
                <button onClick={handleRegister}
                  className="w-full flex items-center justify-center gap-2 bg-white text-void text-[13px] font-medium py-3 rounded-sm hover:bg-ink transition">
                  <Blocks className="w-4 h-4" strokeWidth={1.5} /> Register on Ethereum
                </button>
              </div>
            )}

            {submitting && (
              <div className="flex items-center justify-center gap-3 py-6">
                <Loader2 className="w-5 h-5 text-accent animate-spin" />
                <span className="text-[13px] text-ink-secondary">
                  {mode === 'register' ? 'Writing to Ethereum Sepolia...' : 'Checking blockchain...'}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Result */}
        {result && (
          <div className="space-y-4">
            {preview && mode === 'url' && (
              <div className="w-full h-[120px] rounded-sm border border-rule overflow-hidden bg-surface">
                <img src={preview} alt="" className="w-full h-full object-contain" onError={() => {}} />
              </div>
            )}
            <ResultCard {...result} />
            <button onClick={reset}
              className="w-full text-[12px] text-ink-tertiary hover:text-ink transition py-2 border border-rule rounded-sm">
              {mode === 'verify' ? 'Verify Another' : 'Register Another'}
            </button>
          </div>
        )}

        {error && (
          <div className="mt-3 border border-danger/20 bg-danger-glow rounded-sm px-4 py-3 text-[12px] text-danger">{error}</div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   PRODUCT 2: DESKTOP AGENT — Live terminal with real API
   ═══════════════════════════════════════════════════════════ */
function LiveAgentDemo() {
  const [lines, setLines] = useState([
    { text: '  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', cls: 'text-[#06B6D4]', id: 'h1' },
    { text: '    Attestr Desktop Agent', cls: 'text-ink font-bold', id: 'h2' },
    { text: '    Watched folder auto-registration', cls: 'text-ink-faint', id: 'h3' },
    { text: '  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', cls: 'text-[#06B6D4]', id: 'h4' },
    { text: '', cls: '', id: 'h5' },
    { text: `  ● ${new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}  Watching: ~/Demo/Drop-Zone`, cls: 'text-[#06B6D4]', id: 'w1' },
    { text: `  ● ${new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}  API: ${API_BASE}`, cls: 'text-[#06B6D4]', id: 'w2' },
    { text: `  ● ${new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}  Waiting for new files...`, cls: 'text-[#06B6D4]', id: 'w3' },
    { text: '', cls: '', id: 'w4' },
  ]);
  const [sessionCount, setSessionCount] = useState(0);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  function log(text, cls) {
    const time = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setLines(prev => [...prev, { text: `  ${text.charAt(0)} ${time}  ${text.substring(2)}`, cls, id: Date.now() + Math.random() }]);
  }

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [lines]);

  async function handleFileDrop(f) {
    const name = f.name;
    const sizeStr = f.size > 1048576 ? `${(f.size / 1048576).toFixed(1)} MB` : `${(f.size / 1024).toFixed(0)} KB`;

    log(`● New file detected: ${name}`, 'text-[#06B6D4]');
    log(`# Hashing ${name} (${sizeStr})...`, 'text-[#A855F7]');

    try {
      const hashes = await hashFile(f);
      log(`# SHA-256: ${hashes.sha256.substring(0, 24)}...`, 'text-[#A855F7]');
      log(`● Registering on blockchain...`, 'text-[#06B6D4]');

      const r = await registerMedia({
        sha256: hashes.sha256, dHash: hashes.dHash || hashes.sha256.substring(0, 64),
        filename: f.name, fileSize: f.size, mimeType: f.type,
      });

      if (r.error) {
        log(`! Already registered: ${name}`, 'text-[#EAB308]');
      } else {
        setSessionCount(c => c + 1);
        log(`✓ Registered: ${name}`, 'text-[#22C55E] font-medium');
        if (r.onChain?.etherscanUrl) {
          log(`✓ Etherscan: ${r.onChain.etherscanUrl.replace('https://', '')}`, 'text-[#22C55E]');
        }
        log(`● Total registered this session: ${sessionCount + 1}`, 'text-[#06B6D4]');
      }
    } catch (err) {
      log(`✗ Error: ${err.message}`, 'text-[#EF4444]');
    }

    setLines(prev => [...prev, { text: '', cls: '', id: Date.now() }]);
    log(`● Waiting for new files...`, 'text-[#06B6D4]');
  }

  return (
    <div className="border border-rule rounded-sm overflow-hidden"
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f) handleFileDrop(f); }}
    >
      {/* Title bar */}
      <div className="bg-surface-raised border-b border-rule px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <span className="w-3 h-3 rounded-full bg-[#FF5F57]" />
            <span className="w-3 h-3 rounded-full bg-[#FEBC2E]" />
            <span className="w-3 h-3 rounded-full bg-[#28C840]" />
          </div>
          <span className="text-[11px] font-mono text-ink-faint ml-2">node agent.js ~/Demo/Drop-Zone</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-verified animate-pulse" />
          <span className="text-[10px] font-mono text-verified">live</span>
        </div>
      </div>

      {/* Terminal body */}
      <div ref={scrollRef}
        className="bg-[#0A0B0F] p-4 h-[380px] overflow-y-auto font-mono text-[11px] leading-[1.7]">
        {lines.map((line) => (
          <motion.div key={line.id} initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.15 }} className={line.cls || 'text-ink-faint'}>
            {line.text || '\u00A0'}
          </motion.div>
        ))}
        <span className="inline-block w-2 h-4 bg-accent/60 animate-pulse ml-1" />
      </div>

      {/* Drop zone prompt */}
      <div
        onClick={() => inputRef.current?.click()}
        className="border-t border-rule bg-surface-raised px-4 py-3 text-center cursor-pointer hover:bg-surface-hover transition"
      >
        <input ref={inputRef} type="file" multiple
          onChange={(e) => { for (const f of e.target.files) handleFileDrop(f); e.target.value = ''; }}
          className="hidden" />
        <p className="text-[12px] text-ink-tertiary">
          <span className="text-accent font-medium">Drop files here</span> or click to add — they'll register on the real blockchain
        </p>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   PRODUCT 3: CHROME EXTENSION — Live URL verification
   ═══════════════════════════════════════════════════════════ */
function LiveExtensionDemo() {
  const [url, setUrl] = useState('');
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [imgPreview, setImgPreview] = useState(null);
  const [history, setHistory] = useState([]);

  async function verifyUrl(imageUrl) {
    if (!imageUrl) return;
    setChecking(true); setResult(null); setError(null); setImgPreview(imageUrl);

    try {
      // Fetch the image and compute SHA-256 — exactly like the extension does
      const res = await fetch(imageUrl);
      if (!res.ok) throw new Error(`Failed to fetch image (${res.status})`);
      const buffer = await res.arrayBuffer();
      const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const sha256 = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      // Verify against the blockchain
      const verifyRes = await verifyMedia({ sha256, dHash: sha256.substring(0, 64) });

      const entry = {
        url: imageUrl,
        sha256,
        status: verifyRes.status === 'verified' || verifyRes.status === 'similar' ? 'verified' : 'unverified',
        message: verifyRes.message,
        time: Date.now(),
      };

      setResult(entry);
      setHistory(prev => [entry, ...prev].slice(0, 10));
    } catch (err) {
      setError(err.message);
    }
    setChecking(false);
  }

  const badgeColor = checking ? 'bg-accent' : result?.status === 'verified' ? 'bg-verified' : result?.status === 'unverified' ? 'bg-danger' : null;
  const badgeIcon = checking ? '?' : result?.status === 'verified' ? '✓' : result?.status === 'unverified' ? '✗' : null;

  return (
    <div className="space-y-4">
      {/* Browser mockup */}
      <div className="border border-rule rounded-sm overflow-hidden">
        {/* Chrome title bar */}
        <div className="bg-surface-raised border-b border-rule px-4 py-2.5 flex items-center gap-2">
          <div className="flex gap-1.5">
            <span className="w-3 h-3 rounded-full bg-[#FF5F57]" />
            <span className="w-3 h-3 rounded-full bg-[#FEBC2E]" />
            <span className="w-3 h-3 rounded-full bg-[#28C840]" />
          </div>
          <div className="flex-1 mx-3 bg-surface border border-rule rounded-md px-3 py-1 text-[11px] font-mono text-ink-faint truncate">
            any-website.com — right-click any image → "Verify with Attestr"
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-verified animate-pulse" />
            <span className="text-[10px] font-mono text-verified">live</span>
          </div>
        </div>

        <div className="bg-[#0A0B0F] p-5">
          {/* URL input — simulating what the extension does */}
          <div className="flex gap-2 mb-4">
            <div className="flex-1 flex items-center gap-2 bg-surface border border-rule rounded-sm px-3 py-2">
              <Link2 className="w-4 h-4 text-ink-faint shrink-0" strokeWidth={1.5} />
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && verifyUrl(url)}
                placeholder="Paste any image URL to verify..."
                className="flex-1 bg-transparent text-[12px] text-ink font-mono outline-none placeholder:text-ink-faint"
              />
            </div>
            <button onClick={() => verifyUrl(url)} disabled={!url || checking}
              className="flex items-center gap-2 bg-accent text-white text-[12px] font-medium px-4 py-2 rounded-sm hover:bg-accent/80 transition disabled:opacity-40">
              {checking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" strokeWidth={1.5} />}
              Verify
            </button>
          </div>

          {/* Image preview with badge overlay */}
          {(imgPreview || checking) && (
            <div className="relative mb-4">
              <div className="w-full h-[180px] rounded-sm border border-rule overflow-hidden bg-surface flex items-center justify-center">
                {imgPreview ? (
                  <img src={imgPreview} alt="" className="w-full h-full object-contain"
                    onError={() => setImgPreview(null)} />
                ) : (
                  <Image className="w-10 h-10 text-ink-faint" strokeWidth={1} />
                )}
              </div>
              {/* Badge overlay — just like the real extension */}
              <AnimatePresence>
                {badgeColor && (
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                    className={`absolute top-3 right-3 w-7 h-7 rounded-full ${badgeColor} text-white flex items-center justify-center text-[16px] font-bold shadow-lg`}>
                    {checking ? (
                      <motion.span animate={{ opacity: [1, 0.4, 1] }} transition={{ repeat: Infinity, duration: 1 }}>?</motion.span>
                    ) : badgeIcon}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Status */}
          {checking && (
            <div className="flex items-center gap-2 text-[11px] font-mono text-accent">
              <CircleDot className="w-3 h-3 animate-spin" /> Fetching image → SHA-256 → checking blockchain...
            </div>
          )}
          {result && !checking && (
            <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
              className={`flex items-start gap-3 p-3 rounded-sm border ${result.status === 'verified' ? 'border-verified/20 bg-verified-glow' : 'border-danger/20 bg-danger-glow'}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[12px] font-bold text-white ${result.status === 'verified' ? 'bg-verified' : 'bg-danger'}`}>
                {result.status === 'verified' ? '✓' : '✗'}
              </span>
              <div>
                <p className={`text-[12px] font-medium ${result.status === 'verified' ? 'text-verified' : 'text-danger'}`}>
                  {result.status === 'verified' ? 'Verified on Blockchain' : 'Not Found on Blockchain'}
                </p>
                <p className="text-[11px] text-ink-tertiary mt-0.5">{result.message}</p>
                <p className="text-[10px] font-mono text-ink-faint mt-1">sha256: {result.sha256?.substring(0, 32)}...</p>
              </div>
            </motion.div>
          )}
          {error && !checking && (
            <div className="border border-danger/20 bg-danger-glow rounded-sm px-3 py-2 text-[11px] text-danger">{error}</div>
          )}
        </div>
      </div>

      {/* Verification history — like the extension popup */}
      {history.length > 0 && (
        <div className="border border-rule rounded-sm overflow-hidden">
          <div className="bg-surface-raised border-b border-rule px-4 py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded bg-accent flex items-center justify-center">
                <Shield className="w-3 h-3 text-white" strokeWidth={2} />
              </div>
              <span className="text-[13px] font-semibold text-ink">Extension Popup</span>
            </div>
            <span className="text-[9px] font-mono text-accent bg-accent/10 px-2 py-0.5 rounded-full">MEDIA VERIFIER</span>
          </div>
          <div className="bg-[#0A0B0F] px-4 py-3">
            <p className="text-[10px] font-mono text-ink-faint tracking-wider uppercase mb-2">Recent Verifications</p>
            <div className="space-y-1.5 max-h-[200px] overflow-y-auto">
              {history.map((item, i) => (
                <div key={i} className="flex items-center gap-2.5 bg-surface border border-rule rounded-md px-3 py-2">
                  <div className="w-8 h-8 rounded bg-surface-raised overflow-hidden shrink-0">
                    <img src={item.url} alt="" className="w-full h-full object-cover" onError={(e) => { e.target.style.display = 'none'; }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`flex items-center gap-1.5 text-[11px] font-semibold ${item.status === 'verified' ? 'text-verified' : 'text-danger'}`}>
                      <span className={`w-[6px] h-[6px] rounded-full ${item.status === 'verified' ? 'bg-verified' : 'bg-danger'}`} />
                      {item.status === 'verified' ? 'Verified on Blockchain' : 'Not Found'}
                    </div>
                    <p className="text-[10px] font-mono text-ink-faint truncate">{item.sha256?.substring(0, 16)}...{item.sha256?.substring(56)}</p>
                  </div>
                  <span className="text-[10px] text-ink-faint shrink-0">now</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   MAIN DEMO PAGE
   ═══════════════════════════════════════════════════════════ */
export default function DemoPage() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetch(`${API_BASE}/activity`).then(r => r.json()).then(setStats).catch(() => {});
  }, []);

  return (
    <div className="bg-void text-ink min-h-screen relative">
      <ErrorBoundary>
        <Suspense fallback={null}>
          <GridBackground />
        </Suspense>
      </ErrorBoundary>

      <div className="relative z-10">
        {/* ── HEADER BAR ── */}
        <div className="fixed top-0 inset-x-0 z-50 bg-void/80 backdrop-blur-2xl border-b border-rule">
        <div className="max-w-[1200px] mx-auto px-4 md:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Logo size={22} />
            <span className="font-serif text-[17px] text-ink tracking-tight">Attestr</span>
            <span className="font-serif text-[11px] text-ink-faint tracking-wide ml-0.5">प्रमाण</span>
            <span className="text-[10px] font-mono text-accent bg-accent/10 px-2.5 py-1 rounded-full ml-1">DEMO</span>
          </div>
          <div className="flex items-center gap-6">
            <a href={ETHERSCAN} target="_blank" rel="noopener" className="hidden sm:flex text-[11px] font-mono text-ink-tertiary hover:text-accent transition items-center gap-1.5">
              Etherscan <ExternalLink className="w-3 h-3" />
            </a>
            <Link to="/" className="text-[13px] text-ink-tertiary hover:text-ink transition">Home</Link>
          </div>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-4 md:px-8 pt-24 pb-20">

        {/* ── HERO ── */}
        <motion.div {...fade(0.1)} className="text-center mb-16">
          <div className="inline-flex items-center gap-2 text-[10px] font-mono text-ink-tertiary tracking-widest uppercase mb-6 border border-rule px-4 py-1.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-verified animate-pulse" />
            Innovate Bharat 2026 · CSBC114 · Cybersecurity &amp; Blockchain
          </div>
          <h1 className="font-serif text-[52px] md:text-[64px] leading-[0.95] tracking-tight mb-5">
            Attestr
          </h1>
          <p className="text-[17px] text-ink-secondary max-w-xl mx-auto leading-relaxed">
            Bharat's sovereign media ledger. Create immutable proofs of existence and 
            verify national digital integrity — powered by Aatmanirbhar infrastructure.
          </p>
          <p className="text-[13px] text-ink-faint mt-3 font-mono flex items-center justify-center gap-2">
            <span className="flex items-center gap-1">
              <span className="w-2 h-1.5 bg-[#FF9933]" />
              <span className="w-2 h-1.5 bg-white" />
              <span className="w-2 h-1.5 bg-[#128807]" />
            </span>
            Innovate Bharat 2026 · Team Ctrl+Alt+Diablo
          </p>
        </motion.div>

        {/* ── LIVE STATS ── */}
        <motion.section {...fade(0.25)} className="mb-16">
          <p className="text-[11px] font-mono text-kesari tracking-widest uppercase mb-4 font-bold">National Ledger Stats</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-rule rounded-sm overflow-hidden border border-rule">
            <Stat icon={TrendingUp} label="Bharat Seals" value={stats?.onChain?.totalRegistered ?? '...'} color="text-kesari" delay={0.1} />
            <Stat icon={Blocks} label="Ledger Height" value={stats?.chainLength ?? '...'} delay={0.2} />
            <Stat icon={ShieldCheck} label="Sovereign Integrity" value={stats?.chainValid ? 'Valid' : '...'} color="text-emerald" delay={0.3} />
            <Stat icon={Globe} label="Network" value="Bharat-Secured" delay={0.4} />
          </div>
          {stats?.onChain && (
            <div className="mt-3 border border-accent/15 bg-accent-glow rounded-sm px-5 py-3 flex items-center gap-6 text-[11px] font-mono flex-wrap">
              <span><span className="text-ink-faint">notary contract </span><span className="text-ink-secondary">{CONTRACT.substring(0, 22)}...</span></span>
              <span className="flex items-center gap-1.5 ml-auto">
                <span className="w-1.5 h-1.5 rounded-full bg-verified animate-pulse" />
                <span className="text-verified">live on Ethereum Sepolia</span>
              </span>
            </div>
          )}
        </motion.section>

        {/* ── THE PROBLEM ── */}
        <motion.section {...sectionFade} className="mb-16">
          <p className="text-[11px] font-mono text-accent tracking-widest uppercase mb-4">The Problem</p>
          <div className="border border-rule rounded-sm bg-surface p-8">
            <h2 className="font-serif text-[28px] tracking-tight mb-4">Digital provenance is broken.</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-[13px] text-ink-secondary leading-relaxed">
              <div className="flex gap-3">
                <AlertTriangle className="w-5 h-5 text-caution shrink-0 mt-0.5" strokeWidth={1.5} />
                <p><span className="text-ink font-medium">Post-truth era</span> — media can be manipulated in seconds. Once a file is edited, its origin is lost.</p>
              </div>
              <div className="flex gap-3">
                <Eye className="w-5 h-5 text-danger shrink-0 mt-0.5" strokeWidth={1.5} />
                <p><span className="text-ink font-medium">Tampered evidence</span> undermines legal proceedings, journalism, and personal records.</p>
              </div>
              <div className="flex gap-3">
                <Lock className="w-5 h-5 text-accent shrink-0 mt-0.5" strokeWidth={1.5} />
                <p><span className="text-ink font-medium">No Proof of Existence</span> — proving you held a specific file at a specific time is nearly impossible.</p>
              </div>
            </div>
          </div>
        </motion.section>

        {/* ── THE SOLUTION ── */}
        <motion.section {...sectionFade} className="mb-16">
          <p className="text-[11px] font-mono text-accent tracking-widest uppercase mb-4">Our Solution</p>
          <div className="border border-rule rounded-sm bg-surface p-8">
            <h2 className="font-serif text-[28px] tracking-tight mb-6">Attestr: The Immutable Ledger.</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { icon: Fingerprint, title: 'Fuzzy Notarization', desc: 'SHA-256 for byte-level proof + perceptual dHash that recognizes the same content across compression and resizing.' },
                { icon: Blocks, title: 'Ethereum Notary Seal', desc: 'Hashes permanently anchored on Sepolia. Publicly verifiable. Immutable proof of existence at block time.' },
                { icon: Search, title: 'Integrity Inspection', desc: 'Deep metadata extraction (EXIF) and Error Level Analysis (ELA) for images; byte-level integrity checks for all file types.' },
                { icon: Lock, title: 'Zero-Knowledge Privacy', desc: 'Files never leave your device. Only cryptographic fingerprints cross the network. Complete privacy by design.' },
              ].map((f) => (
                <div key={f.title} className="flex gap-3 p-4 bg-surface-raised rounded-sm">
                  <f.icon className="w-5 h-5 text-accent shrink-0 mt-0.5" strokeWidth={1.5} />
                  <div>
                    <p className="text-[14px] text-ink font-medium">{f.title}</p>
                    <p className="text-[12px] text-ink-tertiary mt-1 leading-relaxed">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.section>

        {/* ── ARCHITECTURE ── */}
        <motion.section {...sectionFade} className="mb-16">
          <p className="text-[11px] font-mono text-accent tracking-widest uppercase mb-4">Architecture</p>
          <div className="border border-rule rounded-sm bg-surface p-6 md:p-8 font-mono text-[12px] space-y-5 overflow-x-auto">
            <div className="flex items-center gap-4">
              <span className="text-accent w-24 shrink-0 text-[11px]">CLIENT</span>
              <div className="flex-1 grid grid-cols-4 gap-2">
                {['Upload / Camera', 'SHA-256 Worker', 'dHash (Images)', 'ELA / Forensics'].map((b) => (
                  <div key={b} className="border border-rule bg-surface-raised px-3 py-2.5 text-center text-ink-secondary text-[11px]">{b}</div>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-4 text-ink-faint">
              <span className="w-24 shrink-0" />
              <div className="flex-1 text-center text-[10px] tracking-wider">── hash + metadata only ──</div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-caution w-24 shrink-0 text-[11px]">API</span>
              <div className="flex-1 grid grid-cols-4 gap-2">
                {['POST /register', 'POST /verify', 'GET /status', 'GET /chain'].map((b) => (
                  <div key={b} className="border border-rule bg-surface-raised px-3 py-2.5 text-center text-ink-secondary text-[11px]">{b}</div>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-4 text-ink-faint">
              <span className="w-24 shrink-0" />
              <div className="flex-1 text-center text-[10px] tracking-wider">── ethers.js ──</div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-verified w-24 shrink-0 text-[11px]">CHAIN</span>
              <div className="flex-1 border border-verified/20 bg-verified-glow px-4 py-2.5 text-center text-verified text-[11px]">
                Ethereum Sepolia · MediaRegistry.sol · Immutable Ledger
              </div>
            </div>
            <div className="border-t border-rule pt-4 text-ink-tertiary text-[11px]">
              Files never leave the browser. Only cryptographic notarizations are recorded on-chain.
            </div>
          </div>
        </motion.section>

        {/* ═══════════════════════════════════════════════════
           THREE LIVE PRODUCTS
           ═══════════════════════════════════════════════════ */}

        <motion.div {...sectionFade} className="mb-6">
          <div className="text-center mb-10">
            <p className="text-[11px] font-mono text-accent tracking-widest uppercase mb-3">3 Products, 1 API, 1 Blockchain</p>
            <h2 className="font-serif text-[36px] tracking-tight">Try them all. Live.</h2>
            <p className="text-[14px] text-ink-tertiary mt-2">Everything below hits the real Ethereum Sepolia smart contract.</p>
          </div>
        </motion.div>

        {/* ── PRODUCT 1: WEB PLATFORM ── */}
        <motion.section {...sectionFade} className="mb-16">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-7 h-7 rounded-sm bg-accent/15 flex items-center justify-center">
              <Monitor className="w-4 h-4 text-accent" strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-[11px] font-mono text-accent tracking-widest uppercase">Product 1</p>
              <h3 className="text-[18px] font-serif text-ink tracking-tight">Web Notary</h3>
            </div>
            <Link to="/register" className="ml-auto text-[11px] text-ink-tertiary hover:text-accent transition flex items-center gap-1">
              Full version <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-[1fr_280px] gap-6">
            <LiveWebDemo />
            <div className="space-y-3">
              <div className="border border-rule rounded-sm bg-surface p-4 text-[12px] text-ink-tertiary leading-relaxed">
                <p className="text-ink font-medium mb-2">How it works</p>
                <ol className="space-y-1.5 list-decimal list-inside">
                  <li>Upload or capture a file</li>
                  <li>Fingerprint computed <span className="text-accent">locally</span></li>
                  <li>Hash anchored to Ethereum via API</li>
                  <li>Get immutable Etherscan proof</li>
                </ol>
              </div>
              <div className="border border-rule rounded-sm bg-surface p-4 text-[12px]">
                <p className="text-ink-faint font-mono text-[11px] mb-1">Also includes</p>
                <p className="text-ink-tertiary">ELA &amp; EXIF for images, byte-level integrity for all files, camera capture</p>
              </div>
            </div>
          </div>
        </motion.section>

        {/* ── PRODUCT 2: DESKTOP AGENT ── */}
        <motion.section {...sectionFade} className="mb-16">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-7 h-7 rounded-sm bg-[#A855F7]/15 flex items-center justify-center">
              <Terminal className="w-4 h-4 text-[#A855F7]" strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-[11px] font-mono text-[#A855F7] tracking-widest uppercase">Product 2</p>
              <h3 className="text-[18px] font-serif text-ink tracking-tight">Auto-Notary Agent</h3>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-[1fr_280px] gap-6">
            <LiveAgentDemo />
            <div className="space-y-3">
              <div className="border border-rule rounded-sm bg-surface p-4 text-[12px] text-ink-tertiary leading-relaxed">
                <p className="text-ink font-medium mb-2">How it works</p>
                <ol className="space-y-1.5 list-decimal list-inside">
                  <li>Watch any folder locally</li>
                  <li>Automatic fingerprinting on-the-fly</li>
                  <li>Instant blockchain settlement</li>
                  <li>Real-time Etherscan logging</li>
                </ol>
              </div>
              <div className="border border-rule rounded-sm bg-surface p-4 text-[12px]">
                <p className="text-ink-faint font-mono text-[11px] mb-1">Use cases</p>
                <p className="text-ink-tertiary">Newsroom ingestion, legal evidence logging, automated photo archiving, sync folder notarization</p>
              </div>
              <a href="/downloads/attestr-agent.js" download="attestr-agent.js"
                className="flex items-center justify-center gap-2 w-full bg-[#A855F7]/10 border border-[#A855F7]/20 text-[#A855F7] text-[12px] font-medium py-2.5 rounded-sm hover:bg-[#A855F7]/20 transition">
                <ArrowUpFromLine className="w-3.5 h-3.5 rotate-180" strokeWidth={2} /> Download agent.js
              </a>
            </div>
          </div>
        </motion.section>

        {/* ── PRODUCT 3: CHROME EXTENSION ── */}
        <motion.section {...sectionFade} className="mb-16">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-7 h-7 rounded-sm bg-verified/15 flex items-center justify-center">
              <Chrome className="w-4 h-4 text-verified" strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-[11px] font-mono text-verified tracking-widest uppercase">Product 3</p>
              <h3 className="text-[18px] font-serif text-ink tracking-tight">Verification Extension</h3>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-[1fr_280px] gap-6">
            <LiveExtensionDemo />
            <div className="space-y-3">
              <div className="border border-rule rounded-sm bg-surface p-4 text-[12px] text-ink-tertiary leading-relaxed">
                <p className="text-ink font-medium mb-2">How it works</p>
                <ol className="space-y-1.5 list-decimal list-inside">
                  <li>Right-click web media</li>
                  <li>Select <span className="text-verified font-medium">"Verify with Attestr"</span></li>
                  <li>Instant blockchain lookup</li>
                  <li>Badge: <span className="text-verified">Notarized</span> or <span className="text-danger">Unverified</span></li>
                </ol>
              </div>
              <div className="border border-rule rounded-sm bg-surface p-4 text-[12px]">
                <p className="text-ink-faint font-mono text-[11px] mb-1">Integrity First</p>
                <p className="text-ink-tertiary">The extension proves if the image you see on a website is the exact file that was notarized on-chain.</p>
              </div>
              <a href="/downloads/attestr-extension.zip" download="attestr-extension.zip"
                className="flex items-center justify-center gap-2 w-full bg-verified/10 border border-verified/20 text-verified text-[12px] font-medium py-2.5 rounded-sm hover:bg-verified/20 transition">
                <ArrowUpFromLine className="w-3.5 h-3.5 rotate-180" strokeWidth={2} /> Download Extension (.zip)
              </a>
            </div>
          </div>
        </motion.section>

        {/* ── ALL SURFACES TABLE ── */}
        <motion.section {...sectionFade} className="mb-16">
          <p className="text-[11px] font-mono text-accent tracking-widest uppercase mb-4">All Surfaces, One API</p>
          <div className="border border-rule rounded-sm bg-surface p-6 md:p-8 font-mono text-[12px] space-y-4">
            <div className="grid grid-cols-[80px_1fr_120px] gap-3 text-[10px] text-ink-faint tracking-widest border-b border-rule pb-3">
              <span>SURFACE</span><span>DESCRIPTION</span><span className="text-right">ENDPOINT</span>
            </div>
            {[
              { surface: 'Web App', desc: 'React 19 SPA — register, verify, explore, activity feed', endpoint: '/api/*', color: 'text-accent' },
              { surface: 'Agent', desc: 'Node.js CLI — watches folders, auto-registers new files', endpoint: '/api/register', color: 'text-[#A855F7]' },
              { surface: 'Extension', desc: 'Chrome Manifest V3 — right-click verify any web media', endpoint: '/api/verify', color: 'text-verified' },
              { surface: 'External', desc: 'Any HTTP client — cURL, Postman, third-party integrations', endpoint: '/api/*', color: 'text-ink-secondary' },
            ].map((r) => (
              <div key={r.surface} className="grid grid-cols-[80px_1fr_120px] gap-3 items-center">
                <span className={`text-[12px] font-medium ${r.color}`}>{r.surface}</span>
                <span className="text-ink-tertiary text-[12px]">{r.desc}</span>
                <span className="text-ink-faint text-[11px] text-right">{r.endpoint}</span>
              </div>
            ))}
            <div className="border-t border-rule pt-3 text-ink-tertiary text-[11px]">
              All surfaces hit the same Vercel production deployment. Same smart contract. Same blockchain.
            </div>
          </div>
        </motion.section>

        {/* ── TECH STACK ── */}
        <motion.section {...sectionFade} className="mb-16">
          <p className="text-[11px] font-mono text-accent tracking-widest uppercase mb-4">Tech Stack</p>
          <div className="border border-rule rounded-sm bg-surface overflow-hidden">
            <div className="grid grid-cols-[100px_1fr] md:grid-cols-[140px_1fr] divide-y divide-rule text-[13px]">
              {[
                ['Frontend', 'React 19, Vite 8, Tailwind CSS 4, Three.js, Framer Motion'],
                ['Backend', 'Express 5, Vercel Serverless Functions'],
                ['Blockchain', 'Solidity 0.8.24, Hardhat 3, Ethers.js 6, Ethereum Sepolia'],
                ['Security', 'SHA-256 Hashing, Perceptual dHash, Web Crypto API'],
                ['Auth', 'Firebase Authentication (Google OAuth)'],
                ['Analysis', 'Error Level Analysis (ELA), EXIF Metadata Forensics'],
                ['Agent', 'Node.js CLI with fs.watch file watcher'],
                ['Extension', 'Chrome Manifest V3, Content Scripts'],
              ].map(([label, tech]) => (
                <div key={label} className="grid grid-cols-subgrid col-span-2">
                  <div className="px-5 py-3 bg-surface-raised text-[12px] text-ink-tertiary font-mono">{label}</div>
                  <div className="px-5 py-3 text-ink-secondary">{tech}</div>
                </div>
              ))}
            </div>
          </div>
        </motion.section>

        {/* ── FOOTER ── */}
        <motion.div {...sectionFade} className="text-center border-t border-rule pt-12">
          <Logo size={32} className="mx-auto mb-3" />
          <p className="font-serif text-[24px] tracking-tight mb-2">Attestr <span className="text-[16px] text-ink-faint">प्रमाण</span></p>
          <p className="text-[13px] text-ink-tertiary mb-1">Decentralized File Notary</p>
          <p className="text-[11px] text-ink-faint font-mono">
            Team Ctrl+Alt+Diablo · CSBC114 · Innovate Bharat 2026
          </p>
          <div className="flex items-center justify-center gap-4 mt-6">
            <a href={ETHERSCAN} target="_blank" rel="noopener" className="text-[11px] font-mono text-accent hover:text-accent/80 transition flex items-center gap-1.5">
              View Contract on Etherscan <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </motion.div>
      </div>
    </div>
  </div>
);
}
