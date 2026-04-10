import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Camera as CameraIcon, ArrowLeft, Shield, Lock, Fingerprint, Blocks, Zap, Eye, FileCheck, Link2, Loader2,
  FileText, Music, FileDigit, FileBadge, FileArchive, Box, Code, Table, Camera, ShieldCheck, XCircle, AlertTriangle
} from 'lucide-react';
import ScanGraphic from '../components/ScanGraphic';
import UploadZone from '../components/UploadZone';
import CameraCapture from '../components/CameraCapture';
import HashProgress from '../components/HashProgress';
import { getFileCategory, getFileMeta, getIntegrityFeatures } from '../lib/fileTypes';
import ResultCard from '../components/ResultCard';
import ELAViewer from '../components/ELAViewer';
import ExifPanel from '../components/ExifPanel';
import NotaryPreview from '../components/NotaryPreview';
import { hashFile } from '../lib/hash';
import { extractExif } from '../lib/exif';
import { registerMedia, registerByUrl } from '../lib/api';
import { useAuth } from '../components/AuthProvider';
import { signInWithGoogle } from '../lib/firebase';
import { useToast } from '../components/Toast';

const fade = { hidden: { opacity: 0, y: 10 }, show: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.35 } }) };

export default function RegisterPage() {
  const user = useAuth();
  const toast = useToast();
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const previewRef = useRef(null);
  const [hashing, setHashing] = useState(false);
  const [hashStage, setHashStage] = useState(null);
  const [hashes, setHashes] = useState(null);
  const [result, setResult] = useState(null);
  const [showCamera, setShowCamera] = useState(false);
  const [error, setError] = useState(null);
  const [registering, setRegistering] = useState(false);
  const [exifData, setExifData] = useState(null);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [urlSubmitting, setUrlSubmitting] = useState(false);
  const [attested, setAttested] = useState(false);
  const [attestationNote, setAttestationNote] = useState('');

  // Batch mode
  const [batchMode, setBatchMode] = useState(false);
  const [batchFiles, setBatchFiles] = useState([]); // { file, status: 'pending'|'hashing'|'registering'|'done'|'error'|'duplicate', result?, error? }
  const [batchRunning, setBatchRunning] = useState(false);

  // Device attestation — capture once
  const deviceInfo = {
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    language: navigator.language,
    screenRes: `${screen.width}x${screen.height}`,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    capturedAt: new Date().toISOString(),
  };

  function cleanupPreview() { if (previewRef.current) { URL.revokeObjectURL(previewRef.current); previewRef.current = null; } }

  async function handleFile(f) {
    cleanupPreview(); setFile(f); setResult(null); setError(null); setShowCamera(false);
    const u = URL.createObjectURL(f); setPreview(u); previewRef.current = u;
    setHashing(true); setHashStage('sha256');
    try {
      const [h, exif] = await Promise.all([hashFile(f), extractExif(f)]);
      setHashes(h); setExifData(exif); setHashStage(null); setHashing(false);
    } catch (e) { setError('Hash failed: ' + e.message); setHashing(false); }
  }

  async function handleRegister() {
    if (!hashes) return; setError(null); setRegistering(true);
    try {
      const r = await registerMedia({ sha256: hashes.sha256, dHash: hashes.dHash, filename: file.name, fileSize: file.size, mimeType: file.type, userId: user?.uid, userName: user?.displayName, userPhoto: user?.photoURL, attestationNote: attestationNote || null, deviceInfo });
      if (r.error) { setResult({ status: 'similar', message: r.error, block: r.block, onChain: r.onChain }); toast.warning('Duplicate detected'); }
      else { setResult({ status: 'registered', message: `Fingerprint recorded.${r.onChain?.transactionHash ? ' Confirmed on Ethereum Sepolia.' : ''}`, block: r.block, onChain: r.onChain }); toast.success('File registered on blockchain'); }
    } catch { setError('Server unreachable.'); toast.error('Server unreachable'); }
    setRegistering(false);
  }

  async function handleUrlRegister() {
    if (!urlInput) return;
    setUrlSubmitting(true); setError(null); setResult(null);
    try {
      const r = await registerByUrl({ url: urlInput, userId: user?.uid, userName: user?.displayName, userPhoto: user?.photoURL, attestationNote: attestationNote || null });
      if (r.error) {
        setResult({ status: 'similar', message: r.error, onChain: null });
      } else {
        setResult({ status: 'registered', message: `File registered on Ethereum Sepolia. SHA-256: ${r.sha256?.substring(0, 20)}...`, block: r.block, onChain: r.onChain });
      }
      setShowUrlInput(false);
    } catch (e) { setError(e.message); }
    setUrlSubmitting(false);
  }

  function reset() { cleanupPreview(); setFile(null); setPreview(null); setHashes(null); setResult(null); setError(null); setShowUrlInput(false); setUrlInput(''); setBatchFiles([]); setBatchRunning(false); }

  function handleBatchFiles(files) {
    const items = files.map(f => ({ file: f, status: 'pending', result: null, error: null }));
    setBatchFiles(items);
    setBatchMode(true);
  }

  async function runBatch() {
    setBatchRunning(true);
    const updated = [...batchFiles];
    let successCount = 0, errorCount = 0;

    for (let i = 0; i < updated.length; i++) {
      const item = updated[i];
      if (item.status !== 'pending') continue;

      // Hash
      updated[i] = { ...item, status: 'hashing' };
      setBatchFiles([...updated]);

      try {
        const h = await hashFile(item.file);
        updated[i] = { ...updated[i], status: 'registering' };
        setBatchFiles([...updated]);

        const r = await registerMedia({
          sha256: h.sha256, dHash: h.dHash, filename: item.file.name,
          fileSize: item.file.size, mimeType: item.file.type,
          userId: user?.uid, userName: user?.displayName, userPhoto: user?.photoURL,
          attestationNote: attestationNote || null, deviceInfo,
        });

        if (r.error) {
          updated[i] = { ...updated[i], status: 'duplicate', result: r, error: r.error };
          errorCount++;
        } else {
          updated[i] = { ...updated[i], status: 'done', result: r };
          successCount++;
        }
      } catch (e) {
        updated[i] = { ...updated[i], status: 'error', error: e.message || 'Failed' };
        errorCount++;
      }
      setBatchFiles([...updated]);
    }

    setBatchRunning(false);
    if (successCount > 0) toast.success(`${successCount} file${successCount > 1 ? 's' : ''} registered`);
    if (errorCount > 0) toast.warning(`${errorCount} file${errorCount > 1 ? 's' : ''} had issues`);
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-6 md:gap-12">
      {/* ── Sidebar ── */}
      <motion.aside initial="hidden" animate="show" className="pt-1">
        <motion.h1 variants={fade} custom={0} className="font-serif text-[28px] md:text-[32px] text-ink leading-none tracking-tight">Register</motion.h1>
        <motion.p variants={fade} custom={1} className="text-[13px] text-ink-tertiary mt-3 md:mt-4 leading-relaxed">
          Create a tamper-proof record of any file. Hashed locally — nothing ever leaves your device.
        </motion.p>

        {/* Steps — hidden on mobile */}
        <motion.div variants={fade} custom={2} className="hidden md:block mt-10 space-y-5 text-[12px]">
          {[
            { step: 'Upload or capture', detail: 'Any file type — img, vid, doc, code, 3D' },
            { step: 'Fingerprint locally', detail: 'SHA-256 + perceptual hash (images)' },
            { step: 'Write to Ethereum', detail: 'Immutable on-chain proof' },
          ].map((s, i) => (
            <div key={i} className="flex items-start gap-3">
              <span className="font-mono text-accent text-[11px] mt-px font-medium">0{i + 1}</span>
              <div>
                <span className="text-ink">{s.step}</span>
                <p className="text-ink-faint text-[11px] mt-0.5">{s.detail}</p>
              </div>
            </div>
          ))}
        </motion.div>

        {/* What happens panel — hidden on mobile */}
        <motion.div variants={fade} custom={3} className="hidden md:block mt-10 border border-rule rounded-sm bg-surface p-4">
          <p className="text-[10px] font-mono text-ink-faint tracking-widest mb-3">WHAT GETS STORED</p>
          <div className="space-y-2.5">
            {[
              { icon: Lock, label: 'SHA-256 hash', desc: 'Exact cryptographic fingerprint' },
              { icon: Fingerprint, label: 'Perceptual hash', desc: 'Visual matching for images' },
              { icon: FileCheck, label: 'File metadata', desc: 'Name, size, type, timestamp' },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <item.icon className="w-3.5 h-3.5 text-ink-faint mt-0.5 shrink-0" strokeWidth={1.5} />
                <div>
                  <p className="text-[11px] text-ink">{item.label}</p>
                  <p className="text-[10px] text-ink-faint">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* What doesn't get stored — hidden on mobile */}
        <motion.div variants={fade} custom={4} className="hidden md:block mt-4 border border-rule rounded-sm bg-surface p-4">
          <p className="text-[10px] font-mono text-ink-faint tracking-widest mb-3">WHAT STAYS PRIVATE</p>
          <div className="space-y-2">
            {[
              'Original file — never uploaded',
              'File content — only hash stored',
              'Location data — stripped before chain',
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-[11px]">
                <Shield className="w-3 h-3 text-verified shrink-0" strokeWidth={1.5} />
                <span className="text-ink-secondary">{item}</span>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div variants={fade} custom={5} className="hidden md:block">
          <ScanGraphic variant="register" />
        </motion.div>
      </motion.aside>

      {/* ── Main ── */}
      <div className="min-w-0">
        <AnimatePresence mode="wait">
          {/* Auth gate */}
          {!user && user !== undefined && !file && (
            <motion.div key="auth" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="border border-rule rounded-sm bg-surface p-8 md:p-12 text-center">
              <Shield className="w-8 h-8 text-ink-faint mx-auto mb-4" strokeWidth={1.5} />
              <p className="text-[14px] text-ink mb-1">Sign in to register content</p>
              <p className="text-[12px] text-ink-tertiary mb-6 max-w-xs mx-auto">Authentication links registrations to your identity for provenance tracking.</p>
              <button onClick={signInWithGoogle}
                className="bg-white text-void text-[13px] font-medium px-6 py-2.5 rounded-sm hover:bg-ink transition">
                Continue with Google
              </button>
            </motion.div>
          )}

          {/* URL registration result (no file involved) */}
          {!file && result && (
            <motion.div key="url-result" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
              <ResultCard {...result} />
              <button onClick={reset} className="flex items-center gap-1.5 text-[12px] text-ink-faint hover:text-ink transition">
                <ArrowLeft className="w-3 h-3" /> Start over
              </button>
            </motion.div>
          )}

          {/* Upload zone */}
          {(user || user === undefined) && !file && !showCamera && !result && !batchMode && (
            <motion.div key="upload" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
              <UploadZone onFileSelect={handleFile} />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button onClick={() => setShowCamera(true)} className="text-[12px] text-ink-faint hover:text-ink-secondary transition">
                    <CameraIcon className="w-3.5 h-3.5 inline mr-1 -mt-px" />capture image
                  </button>
                  <button onClick={() => setShowUrlInput(!showUrlInput)} className="text-[12px] text-ink-faint hover:text-ink-secondary transition">
                    <Link2 className="w-3.5 h-3.5 inline mr-1 -mt-px" />register from URL
                  </button>
                  <button onClick={() => setBatchMode(true)} className="text-[12px] text-ink-faint hover:text-ink-secondary transition">
                    <FileText className="w-3.5 h-3.5 inline mr-1 -mt-px" />batch upload
                  </button>
                </div>
                <span className="text-[11px] text-ink-faint font-mono">any file · max 100MB</span>
              </div>

              {showUrlInput && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="border border-rule rounded-sm bg-surface p-4">
                  <p className="text-[11px] font-mono text-ink-faint tracking-widest mb-3">REGISTER FILE BY URL</p>
                  <div className="flex gap-2">
                    <div className="flex-1 flex items-center gap-2 bg-void border border-rule rounded-sm px-3 py-2">
                      <Link2 className="w-4 h-4 text-ink-faint shrink-0" strokeWidth={1.5} />
                      <input
                        type="text"
                        value={urlInput}
                        onChange={(e) => setUrlInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleUrlRegister()}
                        placeholder="https://example.com/file.jpg"
                        className="flex-1 bg-transparent text-[12px] text-ink font-mono outline-none placeholder:text-ink-faint"
                      />
                    </div>
                    <button onClick={handleUrlRegister} disabled={!urlInput || urlSubmitting}
                      className="flex items-center gap-2 bg-white text-void text-[12px] font-medium px-4 py-2 rounded-sm hover:bg-ink transition disabled:opacity-40">
                      {urlSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Blocks className="w-4 h-4" strokeWidth={1.5} />}
                      Register
                    </button>
                  </div>
                  <p className="text-[10px] text-ink-faint mt-2">Server fetches the file, computes SHA-256, and registers on Ethereum. The Chrome extension will recognize this content on any webpage.</p>
                </motion.div>
              )}

              {/* Feature highlights */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
                {[
                  { icon: Lock, title: 'Client-side hashing', desc: 'SHA-256 computed entirely in your browser' },
                  { icon: Blocks, title: 'Ethereum settlement', desc: 'Proof permanently recorded on Sepolia' },
                  { icon: Eye, title: 'Forensic analysis', desc: 'ELA and EXIF for images, byte integrity for all' },
                ].map((f, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + i * 0.08 }}
                    className="border border-rule rounded-sm bg-surface p-4 group hover:border-ink-faint transition"
                  >
                    <f.icon className="w-4 h-4 text-ink-faint mb-2.5 group-hover:text-accent transition-colors" strokeWidth={1.5} />
                    <p className="text-[12px] font-medium text-ink mb-0.5">{f.title}</p>
                    <p className="text-[11px] text-ink-faint leading-relaxed">{f.desc}</p>
                  </motion.div>
                ))}
              </div>

              {/* Recent activity / trust signals */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="border border-rule rounded-sm bg-surface px-4 md:px-5 py-3 flex flex-wrap items-center gap-3 md:gap-4"
              >
                <Zap className="w-3.5 h-3.5 text-accent shrink-0" strokeWidth={1.5} />
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] font-mono text-ink-tertiary">
                  <span>Network: <span className="text-accent">Ethereum Sepolia</span></span>
                  <span className="hidden sm:inline text-ink-faint">·</span>
                  <span>Contract: <span className="text-ink-secondary">active</span></span>
                  <span className="hidden sm:inline text-ink-faint">·</span>
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-verified animate-pulse" />
                    <span className="text-verified">online</span>
                  </span>
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* Batch mode */}
          {batchMode && !file && (
            <motion.div key="batch" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
              {batchFiles.length === 0 ? (
                <UploadZone onFileSelect={handleBatchFiles} multiple />
              ) : (
                <>
                  <div className="border border-rule rounded-sm bg-surface overflow-hidden">
                    <div className="px-4 md:px-5 py-3 border-b border-rule-light flex items-center justify-between">
                      <span className="text-[10px] font-mono text-ink-tertiary tracking-widest uppercase">BATCH REGISTRATION · {batchFiles.length} FILES</span>
                      <div className="flex items-center gap-2 text-[10px] font-mono">
                        <span className="text-verified">{batchFiles.filter(b => b.status === 'done').length} done</span>
                        {batchFiles.some(b => b.status === 'error' || b.status === 'duplicate') && (
                          <span className="text-caution">{batchFiles.filter(b => b.status === 'error' || b.status === 'duplicate').length} issues</span>
                        )}
                      </div>
                    </div>
                    <div className="divide-y divide-rule-light max-h-[400px] overflow-y-auto">
                      {batchFiles.map((item, i) => (
                        <div key={i} className="px-4 md:px-5 py-3 flex items-center gap-3">
                          <div className="w-6 text-center">
                            {item.status === 'pending' && <span className="text-[10px] font-mono text-ink-faint">{i + 1}</span>}
                            {item.status === 'hashing' && <Loader2 className="w-3.5 h-3.5 text-accent animate-spin mx-auto" />}
                            {item.status === 'registering' && <Loader2 className="w-3.5 h-3.5 text-caution animate-spin mx-auto" />}
                            {item.status === 'done' && <ShieldCheck className="w-3.5 h-3.5 text-verified mx-auto" />}
                            {item.status === 'duplicate' && <AlertTriangle className="w-3.5 h-3.5 text-caution mx-auto" />}
                            {item.status === 'error' && <XCircle className="w-3.5 h-3.5 text-danger mx-auto" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[12px] text-ink truncate">{item.file.name}</p>
                            <p className="text-[10px] text-ink-faint font-mono">
                              {item.file.type} · {item.file.size > 1048576 ? (item.file.size / 1048576).toFixed(1) + ' MB' : (item.file.size / 1024).toFixed(1) + ' KB'}
                              {item.error && <span className="text-caution ml-2">— {item.error}</span>}
                              {item.status === 'done' && item.result?.onChain?.transactionHash && <span className="text-verified ml-2">— on-chain ✓</span>}
                            </p>
                          </div>
                          <span className="text-[9px] font-mono text-ink-faint uppercase">
                            {item.status === 'hashing' ? 'hashing...' : item.status === 'registering' ? 'writing...' : item.status}
                          </span>
                        </div>
                      ))}
                    </div>
                    {/* Progress bar */}
                    {batchRunning && (
                      <div className="h-1 bg-void">
                        <div className="h-full bg-accent transition-all" style={{ width: `${Math.round(batchFiles.filter(b => b.status !== 'pending').length / batchFiles.length * 100)}%` }} />
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    {!batchRunning && batchFiles.some(b => b.status === 'pending') && (
                      <button onClick={runBatch}
                        className="flex items-center gap-2 bg-white text-void text-[12px] font-medium px-5 py-2.5 rounded-sm hover:bg-ink transition">
                        <Blocks className="w-4 h-4" strokeWidth={1.5} /> Register {batchFiles.filter(b => b.status === 'pending').length} Files
                      </button>
                    )}
                    <button onClick={reset} className="flex items-center gap-1.5 text-[12px] text-ink-faint hover:text-ink transition">
                      <ArrowLeft className="w-3 h-3" /> {batchRunning ? 'Processing...' : 'Start over'}
                    </button>
                  </div>
                </>
              )}
              {batchFiles.length === 0 && (
                <button onClick={() => { setBatchMode(false); setBatchFiles([]); }} className="flex items-center gap-1.5 text-[12px] text-ink-faint hover:text-ink transition">
                  <ArrowLeft className="w-3 h-3" /> Single file mode
                </button>
              )}
            </motion.div>
          )}

          {/* Camera */}
          {showCamera && !file && (
            <motion.div key="cam" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <CameraCapture onCapture={handleFile} onClose={() => setShowCamera(false)} />
            </motion.div>
          )}

          {/* Hashing */}
          {hashing && (
            <motion.div key="hash" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <HashProgress stage={hashStage} />
            </motion.div>
          )}

          {/* File + Results */}
          {file && hashes && !hashing && (
            <motion.div key="result" initial="hidden" animate="show" className="space-y-4">
              {/* File card */}
              <motion.div variants={fade} custom={0} className="border border-rule rounded-sm bg-surface overflow-hidden">
                <div className="px-4 md:px-5 py-3 border-b border-rule-light flex items-center justify-between">
                  <span className="text-[10px] font-mono text-ink-tertiary tracking-widest uppercase">File Identity (Notary)</span>
                  <span className="text-[10px] font-mono text-ink-faint hidden sm:inline">{new Date().toLocaleString()}</span>
                </div>
                <div className="p-4 md:p-5 flex gap-4 md:gap-5">
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}
                    className="w-20 h-20 md:w-32 md:h-32 rounded-sm overflow-hidden bg-void shrink-0 border border-rule flex items-center justify-center">
                    <NotaryPreview file={file} previewUrl={preview} />
                  </motion.div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-[13px] font-medium text-ink truncate">{file.name}</p>
                      <span className="text-[9px] px-1.5 py-px border border-accent/30 text-accent font-mono uppercase rounded-full">
                        {file.name.split('.').pop()}
                      </span>
                    </div>
                    <p className="text-[11px] text-ink-faint font-mono mt-0.5">
                      {file.type} · {file.size > 1048576 ? (file.size / 1048576).toFixed(2) + ' MB' : (file.size / 1024).toFixed(1) + ' KB'}
                    </p>

                    {/* Hash results */}
                    <div className="mt-3 space-y-2 font-mono text-[10px]">
                      <div className="flex items-start gap-2">
                        <Lock className="w-3 h-3 text-accent mt-0.5 shrink-0" strokeWidth={1.5} />
                        <div className="min-w-0">
                          <span className="text-ink-faint tracking-wider">SHA-256</span>
                          <p className="text-ink text-[11px] truncate mt-px">{hashes.sha256}</p>
                        </div>
                      </div>
                      {hashes.dHash && (
                        <div className="flex items-start gap-2">
                          <Fingerprint className="w-3 h-3 text-accent mt-0.5 shrink-0" strokeWidth={1.5} />
                          <div>
                            <span className="text-ink-faint tracking-wider">PERCEPTUAL</span>
                            <p className="text-ink text-[11px] mt-px">{hashes.dHash}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action bar */}
                {!result && (
                  <div className="border-t border-rule-light px-4 md:px-5 py-4">
                    <div className="bg-accent/5 border border-accent/15 rounded-sm p-4 mb-4">
                      <label className="flex items-start gap-3 cursor-pointer group text-left">
                        <div className="relative flex items-center justify-center mt-0.5">
                          <input 
                            type="checkbox" 
                            checked={attested} 
                            onChange={(e) => setAttested(e.target.checked)}
                            className="peer appearance-none w-4 h-4 border border-accent/40 rounded-xs checked:bg-accent transition-all"
                          />
                          <ShieldCheck className="absolute w-3 h-3 text-white opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity" />
                        </div>
                        <div className="flex-1">
                          <p className="text-[12px] text-ink font-medium leading-none mb-1 group-hover:text-accent transition-colors">Attest to File Integrity</p>
                          <p className="text-[11px] text-ink-tertiary leading-relaxed">
                            I certify that this file is authentic and unaltered. I understand this cryptographic 
                            fingerprint will be <span className="text-accent font-mono">permanently</span> linked 
                            to my identity on the Ethereum blockchain.
                          </p>
                        </div>
                      </label>
                    </div>

                    {/* Attestation Note */}
                    <div className="mb-4">
                      <label className="block text-[10px] font-mono text-ink-faint tracking-widest uppercase mb-1.5">Attestation Note (optional)</label>
                      <textarea
                        value={attestationNote}
                        onChange={(e) => setAttestationNote(e.target.value)}
                        placeholder="e.g. Original photo taken at Rajghat, Delhi on 26 Jan 2026. I certify this is unedited."
                        maxLength={500}
                        rows={2}
                        className="w-full bg-void border border-rule rounded-sm px-3 py-2 text-[12px] text-ink font-mono outline-none placeholder:text-ink-faint resize-none focus:border-accent/40 transition"
                      />
                      <p className="text-[9px] text-ink-faint mt-1">{attestationNote.length}/500 — publicly visible on verification</p>
                    </div>

                    {/* Device Attestation Info */}
                    <div className="mb-4 bg-void/50 border border-rule-light rounded-sm p-3">
                      <p className="text-[9px] font-mono text-ink-faint tracking-widest uppercase mb-1.5">Device Attestation</p>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] font-mono text-ink-tertiary">
                        <span>{deviceInfo.platform}</span>
                        <span>{deviceInfo.timezone}</span>
                        <span>{deviceInfo.screenRes}</span>
                        <span className="text-verified">● captured</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <button onClick={handleRegister} disabled={registering || !attested}
                        className="flex-1 py-3 bg-white text-void text-[13px] font-medium rounded-sm hover:bg-ink transition disabled:opacity-30 disabled:grayscale disabled:cursor-not-allowed flex items-center justify-center gap-2">
                        {registering ? (
                          <motion.span animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1.2, repeat: Infinity }}>
                            Anchoring to Ledger...
                          </motion.span>
                        ) : (
                          <>
                            <Blocks className="w-3.5 h-3.5" />
                            Notarize on Ledger
                          </>
                        )}
                      </button>
                      <button onClick={reset} className="px-4 py-3 border border-rule text-[13px] text-ink-tertiary rounded-sm hover:text-ink hover:border-ink-faint transition">
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>

              {/* Result */}
              {result && <motion.div variants={fade} custom={1}><ResultCard {...result} file={file} /></motion.div>}

              {/* Integrity section — adaptive per file type */}
              {(() => {
                const category = getFileCategory(file);
                const meta = getFileMeta(file);
                const features = getIntegrityFeatures(category);
                const isImage = category === 'image';
                const isVideo = category === 'video';
                const isAudio = category === 'audio';

                return (
                  <>
                    <motion.div variants={fade} custom={2}>
                      <div className="flex items-center gap-2 mb-3 mt-6">
                        <Eye className="w-4 h-4 text-ink-faint" strokeWidth={1.5} />
                        <span className="text-[11px] font-mono text-ink-tertiary tracking-widest uppercase">
                          {isImage ? 'Integrity Analysis' : `${meta.label} Integrity Check`}
                        </span>
                        <span className={`text-[9px] px-1.5 py-px border border-rule ${meta.color} font-mono uppercase rounded-full ml-auto`}>
                          {meta.tag}
                        </span>
                      </div>
                    </motion.div>

                    {/* ELA + EXIF for images */}
                    {isImage && (
                      <>
                        <motion.div variants={fade} custom={4}><ELAViewer file={file} /></motion.div>
                        <motion.div variants={fade} custom={5}><ExifPanel file={file} /></motion.div>
                      </>
                    )}

                    {/* For non-images: rich integrity panel */}
                    {!isImage && (
                      <motion.div variants={fade} custom={3} className="border border-rule rounded-sm bg-surface p-5">
                        <div className="flex items-center gap-3 mb-4">
                          <meta.icon className={`w-5 h-5 ${meta.color}`} strokeWidth={1.5} />
                          <span className="text-[12px] font-medium text-ink">{meta.label} Notary Analysis</span>
                        </div>
                        <div className="space-y-4">
                          {features.map((feat, i) => (
                            <div key={feat.key} className="flex items-start gap-4">
                              <div className="w-8 h-8 rounded-full bg-void border border-rule flex items-center justify-center shrink-0">
                                {feat.key === 'sha256' && <Lock className="w-4 h-4 text-accent" strokeWidth={1.5} />}
                                {feat.key === 'dhash' && <Fingerprint className="w-4 h-4 text-accent" strokeWidth={1.5} />}
                                {feat.key === 'integrity' && <ShieldCheck className="w-4 h-4 text-verified" strokeWidth={1.5} />}
                              </div>
                              <div>
                                <p className="text-[12px] text-ink font-medium">{feat.label}</p>
                                <p className="text-[11px] text-ink-tertiary leading-relaxed mt-0.5">{feat.desc}</p>
                              </div>
                            </div>
                          ))}
                          {/* File-type specific notes */}
                          {isVideo && (
                            <div className="mt-2 pt-3 border-t border-rule-light">
                              <p className="text-[10px] text-ink-faint font-mono">Note: Video files are fingerprinted via SHA-256. Frame-level perceptual analysis is available for image frames.</p>
                            </div>
                          )}
                          {isAudio && (
                            <div className="mt-2 pt-3 border-t border-rule-light">
                              <p className="text-[10px] text-ink-faint font-mono">Note: Audio files are fingerprinted via SHA-256. Any re-encoding or bitrate change will produce a different hash.</p>
                            </div>
                          )}
                          {(category === 'document' || category === 'code' || category === 'data') && (
                            <div className="mt-2 pt-3 border-t border-rule-light">
                              <p className="text-[10px] text-ink-faint font-mono">Note: Even a single character change will produce a completely different SHA-256 fingerprint, ensuring tamper detection.</p>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </>
                );
              })()}

              <motion.button variants={fade} custom={5} onClick={reset} className="flex items-center gap-1.5 text-[12px] text-ink-faint hover:text-ink transition mt-2">
                <ArrowLeft className="w-3 h-3" /> Start over
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {error && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mt-4 border border-danger/20 bg-danger-glow rounded-sm px-4 py-3 text-[12px] text-danger">{error}</motion.div>}
        </AnimatePresence>
      </div>
    </div>
  );
}
