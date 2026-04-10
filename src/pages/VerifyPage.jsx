import { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, ShieldCheck, Lock, Fingerprint, Eye, Search, Blocks, AlertTriangle, UserX, Bot,
  FileText, Music, FileDigit, FileBadge, Shield, Box, Code, Table, Camera, QrCode, Loader2
} from 'lucide-react';
import ELAViewer from '../components/ELAViewer';
import ExifPanel from '../components/ExifPanel';
import NotaryPreview from '../components/NotaryPreview';
import { extractExif } from '../lib/exif';
import ScanGraphic from '../components/ScanGraphic';
import UploadZone from '../components/UploadZone';
import HashProgress from '../components/HashProgress';
import ResultCard from '../components/ResultCard';
import CompareView from '../components/CompareView';
import { hashFile } from '../lib/hash';
import { verifyMedia, getCustodyTimeline } from '../lib/api';
import { getFileCategory, getFileMeta, getIntegrityFeatures } from '../lib/fileTypes';
import QRScanner from '../components/QRScanner';
import CustodyActions from '../components/CustodyActions';

const fade = { hidden: { opacity: 0, y: 10 }, show: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.35 } }) };

export default function VerifyPage() {
  const [searchParams] = useSearchParams();
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const previewRef = useRef(null);
  const [hashing, setHashing] = useState(false);
  const [hashStage, setHashStage] = useState(null);
  const [hashes, setHashes] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [exifData, setExifData] = useState(null);
  const [qrVerifying, setQrVerifying] = useState(false);
  const [qrResult, setQrResult] = useState(null);
  const [showScanner, setShowScanner] = useState(false);

  function handleQrScan(rawValue) {
    setShowScanner(false);
    try {
      const url = new URL(rawValue);
      const sha256 = url.searchParams.get('sha256');
      if (sha256 && sha256.length >= 16) {
        setQrVerifying(true);
        Promise.all([
          verifyMedia({ sha256 }),
          getCustodyTimeline(sha256).catch(() => null),
        ]).then(([verifyRes, custody]) => {
          if (custody) {
            verifyRes.custodyTimeline = custody.events || [];
            verifyRes.coSigners = custody.coSigners || [];
            verifyRes.isRevoked = custody.isRevoked || false;
            verifyRes.currentCustodian = custody.currentCustodian || null;
          }
          setQrResult(verifyRes);
        }).catch(() => setError('Verification failed for scanned QR.')).finally(() => setQrVerifying(false));
      } else {
        setError('Invalid QR code — no SHA-256 hash found.');
      }
    } catch {
      setError('Invalid QR code URL.');
    }
  }

  // Auto-verify from QR code URL (?sha256=...)
  useEffect(() => {
    const sha256 = searchParams.get('sha256');
    if (!sha256 || sha256.length < 16) return;
    setQrVerifying(true);
    Promise.all([
      verifyMedia({ sha256 }),
      getCustodyTimeline(sha256).catch(() => null),
    ]).then(([verifyRes, custody]) => {
      if (custody) {
        verifyRes.custodyTimeline = custody.events || [];
        verifyRes.coSigners = custody.coSigners || [];
        verifyRes.isRevoked = custody.isRevoked || false;
        verifyRes.currentCustodian = custody.currentCustodian || null;
      }
      setQrResult(verifyRes);
    }).catch(() => setError('Verification failed for this hash.')).finally(() => setQrVerifying(false));
  }, [searchParams]);

  function cleanupPreview() { if (previewRef.current) { URL.revokeObjectURL(previewRef.current); previewRef.current = null; } }

  async function handleFile(f) {
    cleanupPreview(); setFile(f); setResult(null); setError(null);
    const u = URL.createObjectURL(f); setPreview(u); previewRef.current = u;
    setHashing(true); setHashStage('sha256');
    try {
      const [h, exif] = await Promise.all([hashFile(f), extractExif(f)]);
      setHashes(h); setExifData(exif); setHashStage(null); setHashing(false);
      f._sha256 = h.sha256; setResult(await verifyMedia({ sha256: h.sha256, dHash: h.dHash }));
    }
    catch { setError('Server unreachable.'); setHashing(false); }
  }

  function reset() { cleanupPreview(); setFile(null); setPreview(null); setHashes(null); setResult(null); setError(null); }

  return (
    <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-6 md:gap-12">
      {/* ── Sidebar ── */}
      <motion.aside initial="hidden" animate="show" className="pt-1">
        <motion.h1 variants={fade} custom={0} className="font-serif text-[28px] md:text-[32px] text-ink leading-none tracking-tight">Verify</motion.h1>
        <motion.p variants={fade} custom={1} className="text-[13px] text-ink-tertiary mt-3 md:mt-4 leading-relaxed">
          Check any file against the blockchain ledger. No account needed — verification is open to everyone.
        </motion.p>

        {/* Steps — hidden on mobile */}
        <motion.div variants={fade} custom={2} className="hidden md:block mt-10 space-y-5 text-[12px]">
          {[
            { step: 'Upload the file', detail: 'Any file type supported' },
            { step: 'Automatic matching', detail: 'Exact + perceptual comparison' },
            { step: 'Integrity analysis', detail: 'Forensics for images, hash check for all' },
          ].map((s, i) => (
            <div key={i} className="flex items-start gap-3">
              <span className="font-mono text-verified text-[11px] mt-px font-medium">0{i + 1}</span>
              <div>
                <span className="text-ink">{s.step}</span>
                <p className="text-ink-faint text-[11px] mt-0.5">{s.detail}</p>
              </div>
            </div>
          ))}
        </motion.div>

        {/* Verification types — hidden on mobile */}
        <motion.div variants={fade} custom={3} className="hidden md:block mt-10 border border-rule rounded-sm bg-surface p-4">
          <p className="text-[10px] font-mono text-ink-faint tracking-widest mb-3">MATCH TYPES</p>
          <div className="space-y-3">
            {[
                  { icon: ShieldCheck, color: 'text-verified', label: 'Verified & intact', desc: 'SHA-256 hash matches a registered record exactly' },
                  { icon: AlertTriangle, color: 'text-caution', label: 'Similar match', desc: 'Perceptual hash close — possible re-encode or edit' },
                  { icon: UserX, color: 'text-danger', label: 'Not found', desc: 'No matching record found on the ledger' },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <item.icon className={`w-3.5 h-3.5 ${item.color} mt-0.5 shrink-0`} strokeWidth={1.5} />
                <div>
                  <p className="text-[11px] text-ink">{item.label}</p>
                  <p className="text-[10px] text-ink-faint">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* How matching works — hidden on mobile */}
        <motion.div variants={fade} custom={4} className="hidden md:block mt-4 border border-rule rounded-sm bg-surface p-4">
          <p className="text-[10px] font-mono text-ink-faint tracking-widest mb-3">DUAL VERIFICATION</p>
          <div className="space-y-2">
            {[
                  { icon: Lock, label: 'SHA-256 — exact byte-level match (all files)' },
                  { icon: Fingerprint, label: 'dHash — visual similarity for images' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-[11px]">
                <item.icon className="w-3 h-3 text-accent shrink-0" strokeWidth={1.5} />
                <span className="text-ink-secondary">{item.label}</span>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div variants={fade} custom={5} className="hidden md:block">
          <ScanGraphic variant="verify" />
        </motion.div>
      </motion.aside>

      {/* ── Main ── */}
      <div className="min-w-0">
        <AnimatePresence mode="wait">
          {/* QR / Hash-based verification result */}
          {(qrVerifying || qrResult) && !file && (
            <motion.div key="qr-result" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
              <div className="border border-accent/30 bg-accent/5 rounded-sm p-4 flex items-center gap-3 mb-4">
                <QrCode className="w-5 h-5 text-accent shrink-0" strokeWidth={1.5} />
                <div>
                  <p className="text-[12px] font-medium text-ink">QR Code Verification</p>
                  <p className="text-[11px] text-ink-tertiary font-mono truncate max-w-[400px]">SHA-256: {searchParams.get('sha256')}</p>
                </div>
              </div>

              {qrVerifying && (
                <div className="flex items-center justify-center py-16 gap-3">
                  <Loader2 className="w-5 h-5 text-accent animate-spin" />
                  <span className="text-[13px] text-ink-secondary">Verifying hash against ledger…</span>
                </div>
              )}

              {qrResult && <ResultCard {...qrResult} />}

              {/* Custody actions for QR-verified files */}
              {qrResult && (qrResult.status === 'verified' || qrResult.status === 'similar') && (
                <CustodyActions sha256={searchParams.get('sha256')} block={qrResult.block} onUpdate={() => {
                  const sha256 = searchParams.get('sha256');
                  setQrVerifying(true);
                  Promise.all([verifyMedia({ sha256 }), getCustodyTimeline(sha256).catch(() => null)])
                    .then(([v, c]) => { if (c) { v.custodyTimeline = c.events || []; v.coSigners = c.coSigners || []; v.isRevoked = c.isRevoked || false; v.currentCustodian = c.currentCustodian || null; } setQrResult(v); })
                    .finally(() => setQrVerifying(false));
                }} />
              )}

              <button onClick={() => { setQrResult(null); window.history.replaceState({}, '', '/verify'); }} className="flex items-center gap-1.5 text-[12px] text-ink-faint hover:text-ink transition mt-2">
                <ArrowLeft className="w-3 h-3" /> Verify a file instead
              </button>
            </motion.div>
          )}

          {/* Upload zone */}
          {!file && !qrResult && !qrVerifying && (
            <motion.div key="upload" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
              <UploadZone onFileSelect={handleFile} />

              <div className="flex items-center justify-between">
                <span className="text-[11px] text-ink-faint font-mono">No sign-in required</span>
                <span className="text-[11px] text-ink-faint font-mono">max 100MB</span>
              </div>

              {/* QR Camera Scanner Button */}
              <button
                onClick={() => setShowScanner(s => !s)}
                className={`w-full flex items-center justify-center gap-2.5 py-3 px-4 rounded-sm border transition text-[13px] font-medium ${
                  showScanner
                    ? 'bg-accent/10 border-accent/40 text-accent'
                    : 'bg-surface border-rule hover:border-accent/40 text-ink-secondary hover:text-accent'
                }`}
              >
                <Camera className="w-4.5 h-4.5" strokeWidth={1.5} />
                {showScanner ? 'Close Camera' : 'Scan QR Code with Camera'}
              </button>

              {showScanner && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                  <QRScanner onScan={handleQrScan} onClose={() => setShowScanner(false)} />
                </motion.div>
              )}

              {/* Info cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
                {[
                  { icon: Search, title: 'Instant lookup', desc: 'Hash compared against entire blockchain ledger' },
                  { icon: Fingerprint, title: 'Fuzzy matching', desc: 'Detects visual matches even after compression (images)' },
                  { icon: ShieldCheck, title: 'Forensic analysis', desc: 'ELA and EXIF for images, byte integrity for all files' },
                ].map((f, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + i * 0.08 }}
                    className="border border-rule rounded-sm bg-surface p-4 group hover:border-ink-faint transition"
                  >
                    <f.icon className="w-4 h-4 text-ink-faint mb-2.5 group-hover:text-verified transition-colors" strokeWidth={1.5} />
                    <p className="text-[12px] font-medium text-ink mb-0.5">{f.title}</p>
                    <p className="text-[11px] text-ink-faint leading-relaxed">{f.desc}</p>
                  </motion.div>
                ))}
              </div>

              {/* How it works inline */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="border border-rule rounded-sm bg-surface overflow-hidden"
              >
                <div className="px-4 md:px-5 py-3 border-b border-rule-light">
                  <span className="text-[10px] font-mono text-ink-faint tracking-widest">VERIFICATION PROCESS</span>
                </div>
                <div className="px-3 md:px-5 py-3 flex flex-wrap md:flex-nowrap items-center gap-0">
                  {[
                    { label: 'Upload', sub: 'file' },
                    { label: 'Hash', sub: 'client-side' },
                    { label: 'Compare', sub: 'blockchain' },
                    { label: 'Analyze', sub: 'forensics' },
                    { label: 'Result', sub: 'instant' },
                  ].map((step, i) => (
                    <div key={i} className="flex items-center">
                      <div className="text-center px-1.5 md:px-2">
                        <p className="text-[10px] md:text-[11px] font-medium text-ink">{step.label}</p>
                        <p className="text-[8px] md:text-[9px] font-mono text-ink-faint">{step.sub}</p>
                      </div>
                      {i < 4 && (
                        <div className="flex items-center text-ink-faint mx-0.5 md:mx-1">
                          <div className="w-3 md:w-6 h-px bg-rule" />
                          <div className="w-0 h-0 border-t-[2px] border-t-transparent border-b-[2px] border-b-transparent border-l-[3px] border-l-rule" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* Hashing */}
          {hashing && (
            <motion.div key="hash" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <HashProgress stage={hashStage} />
            </motion.div>
          )}

          {/* Results */}
          {file && result && (
            <motion.div key="result" initial="hidden" animate="show" className="space-y-4">
              {/* File card */}
              <motion.div variants={fade} custom={0} className="border border-rule rounded-sm bg-surface overflow-hidden">
                <div className="px-4 md:px-5 py-3 border-b border-rule-light flex items-center justify-between">
                  <span className="text-[10px] font-mono text-ink-tertiary tracking-widest uppercase">Verification Report</span>
                  <span className="text-[10px] font-mono text-ink-faint hidden sm:inline">{new Date().toLocaleString()}</span>
                </div>
                <div className="p-4 md:p-5 flex gap-4 md:gap-5">
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}
                    className="w-20 h-20 md:w-28 md:h-28 rounded-sm overflow-hidden bg-void shrink-0 border border-rule flex items-center justify-center">
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
                    {hashes && (
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
                    )}
                  </div>
                </div>
              </motion.div>

              {/* Verdict */}
              <motion.div variants={fade} custom={1}><ResultCard {...result} file={file} /></motion.div>

              {/* Custody actions — for verified/similar files */}
              {(result.status === 'verified' || result.status === 'similar') && result.block?.data?.sha256 && (
                <motion.div variants={fade} custom={1.5}>
                  <CustodyActions sha256={result.block.data.sha256} block={result.block} onUpdate={() => handleFile(file)} />
                </motion.div>
              )}

              {/* Comparison — only for images */}
              {result.block && file.type.startsWith('image/') && <motion.div variants={fade} custom={2}><CompareView currentFile={file} block={result.block} /></motion.div>}

              {/* Integrity section — adaptive per file type */}
              {(() => {
                const category = getFileCategory(file);
                const meta = getFileMeta(file);
                const isImage = category === 'image';

                return (
                  <>
                    <motion.div variants={fade} custom={3}>
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
                        <motion.div variants={fade} custom={5}><ELAViewer file={file} /></motion.div>
                        <motion.div variants={fade} custom={6}><ExifPanel file={file} /></motion.div>
                      </>
                    )}

                    {/* Structured integrity panel for non-images */}
                    {!isImage && (
                      <motion.div variants={fade} custom={4} className="border border-rule rounded-sm bg-surface p-5">
                        <div className="flex items-center gap-3 mb-4">
                          <meta.icon className={`w-5 h-5 ${meta.color}`} strokeWidth={1.5} />
                          <span className="text-[12px] font-medium text-ink">{meta.label} Verification Report</span>
                        </div>
                        <div className="space-y-4">
                          <div className="flex items-start gap-4">
                            <div className="w-8 h-8 rounded-full bg-void border border-rule flex items-center justify-center shrink-0">
                              <ShieldCheck className="w-4 h-4 text-verified" strokeWidth={1.5} />
                            </div>
                            <div>
                              <p className="text-[12px] text-ink font-medium">
                                {result.status === 'verified' ? 'File Verified & Intact' : result.status === 'similar' ? 'Similar File Found' : 'File Not Registered'}
                              </p>
                              <p className="text-[11px] text-ink-tertiary leading-relaxed mt-1">
                                {result.status === 'verified' 
                                  ? "The SHA-256 fingerprint matches the blockchain record exactly. This file has not been modified since registration."
                                  : result.status === 'similar'
                                  ? "A similar file was found on the ledger. The file may have been re-encoded or slightly modified."
                                  : "No matching record was found. This file has not been registered on the Attestr ledger."}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-start gap-4">
                            <div className="w-8 h-8 rounded-full bg-void border border-rule flex items-center justify-center shrink-0">
                              <Lock className="w-4 h-4 text-accent" strokeWidth={1.5} />
                            </div>
                            <div>
                              <p className="text-[12px] text-ink font-medium">Privacy-First Verification</p>
                              <p className="text-[11px] text-ink-tertiary leading-relaxed mt-1">Verification was performed locally via SHA-256. The original file was not uploaded to our servers.</p>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </>
                );
              })()}

              <motion.button variants={fade} custom={6} onClick={reset} className="flex items-center gap-1.5 text-[12px] text-ink-faint hover:text-ink transition mt-2">
                <ArrowLeft className="w-3 h-3" /> Verify another file
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
