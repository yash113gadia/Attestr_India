import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Lock, Fingerprint, Eye, ChevronRight, ShieldCheck, Camera } from 'lucide-react';
import UploadZone from '../../components/UploadZone';
import HashProgress from '../../components/HashProgress';
import ResultCard from '../../components/ResultCard';
import CompareView from '../../components/CompareView';
import ELAViewer from '../../components/ELAViewer';
import ExifPanel from '../../components/ExifPanel';
import QRScanner from '../../components/QRScanner';
import { hashFile } from '../../lib/hash';
import { extractExif } from '../../lib/exif';
import { verifyMedia, getCustodyTimeline } from '../../lib/api';
import { getFileCategory, getFileMeta } from '../../lib/fileTypes';

const slide = { hidden: { opacity: 0, y: 12 }, show: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.04, duration: 0.25 } }) };

export default function MobileVerify() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const previewRef = useRef(null);
  const [hashing, setHashing] = useState(false);
  const [hashStage, setHashStage] = useState(null);
  const [hashes, setHashes] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [exifData, setExifData] = useState(null);
  const [showForensics, setShowForensics] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [qrVerifying, setQrVerifying] = useState(false);
  const [qrResult, setQrResult] = useState(null);

  function handleQrScan(rawValue) {
    setShowScanner(false);
    try {
      const url = new URL(rawValue);
      const sha256 = url.searchParams.get('sha256');
      if (sha256 && sha256.length >= 16) {
        setQrVerifying(true);
        verifyMedia({ sha256 }).then(res => setQrResult(res))
          .catch(() => setError('Verification failed for scanned QR.'))
          .finally(() => setQrVerifying(false));
      } else {
        setError('Invalid QR code — no SHA-256 hash found.');
      }
    } catch {
      setError('Invalid QR code URL.');
    }
  }

  function cleanupPreview() { if (previewRef.current) { URL.revokeObjectURL(previewRef.current); previewRef.current = null; } }

  async function handleFile(f) {
    cleanupPreview(); setFile(f); setResult(null); setError(null); setShowForensics(false);
    if (f.type.startsWith('image/') || f.type.startsWith('video/')) { const u = URL.createObjectURL(f); setPreview(u); previewRef.current = u; }
    setHashing(true); setHashStage('sha256');
    try {
      const [h, exif] = await Promise.all([hashFile(f), extractExif(f)]);
      setHashes(h); setExifData(exif); setHashStage(null); setHashing(false);
      f._sha256 = h.sha256; setResult(await verifyMedia({ sha256: h.sha256, dHash: h.dHash }));
    } catch { setError('Server unreachable.'); setHashing(false); }
  }

  function reset() { cleanupPreview(); setFile(null); setPreview(null); setHashes(null); setResult(null); setError(null); setExifData(null); setShowForensics(false); }

  return (
    <div className="pb-6">
      <div className="mb-5">
        <h1 className="font-serif text-[26px] text-ink leading-tight tracking-tight">Verify</h1>
        <div className="flex items-center gap-2 mt-2">
          <span className="text-[11px] font-mono text-ink-faint">No sign-in required · instant results</span>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {!file && (
          <motion.div key="upload" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
            <UploadZone onFileSelect={handleFile} />

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

            {qrVerifying && (
              <div className="flex items-center justify-center py-8 gap-2">
                <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                <span className="text-[12px] text-ink-secondary">Verifying…</span>
              </div>
            )}

            {qrResult && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                <ResultCard {...qrResult} />
                <button onClick={() => setQrResult(null)} className="text-[11px] text-ink-faint hover:text-ink transition flex items-center gap-1">
                  <ArrowLeft className="w-3 h-3" /> Clear QR result
                </button>
              </motion.div>
            )}

            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
              {['Instant lookup', 'Fuzzy match', 'Blockchain proof'].map((t) => (
                <span key={t} className="text-[10px] font-mono text-ink-faint border border-rule-light px-2.5 py-1.5 rounded-full shrink-0">{t}</span>
              ))}
            </div>
          </motion.div>
        )}

        {hashing && (
          <motion.div key="hash" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <HashProgress stage={hashStage} />
          </motion.div>
        )}

        {file && result && (
          <motion.div key="result" initial="hidden" animate="show" className="space-y-3">
            {/* File info */}
            <motion.div variants={slide} custom={0} className="border border-rule rounded-sm bg-surface p-3 flex gap-3 items-center">
              {preview && (
                <div className="w-12 h-12 rounded-sm overflow-hidden bg-void shrink-0 border border-rule">
                  {file.type.startsWith('image/') && <img src={preview} alt="" className="w-full h-full object-cover" />}
                  {file.type.startsWith('video/') && <video src={preview} className="w-full h-full object-cover" />}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium text-ink truncate">{file.name}</p>
                <p className="text-[10px] font-mono text-ink-faint mt-0.5 truncate">{hashes?.sha256?.substring(0, 32)}...</p>
              </div>
            </motion.div>

            {/* Verdict */}
            <motion.div variants={slide} custom={1}><ResultCard {...result} /></motion.div>

            {result.block && <motion.div variants={slide} custom={2}><CompareView currentFile={file} block={result.block} /></motion.div>}

            {/* Integrity — collapsed */}
            <motion.div variants={slide} custom={3}>
              <button onClick={() => setShowForensics(!showForensics)}
                className="w-full border border-rule rounded-sm bg-surface px-4 py-3.5 flex items-center justify-between active:bg-surface-raised transition">
                <span className="flex items-center gap-2.5">
                  <Eye className="w-4 h-4 text-ink-faint" strokeWidth={1.5} />
                  <span className="text-[13px] text-ink">Integrity Analysis</span>
                </span>
                <ChevronRight className={`w-4 h-4 text-ink-faint transition-transform duration-200 ${showForensics ? 'rotate-90' : ''}`} />
              </button>
            </motion.div>

            <AnimatePresence>
              {showForensics && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                  className="space-y-3 overflow-hidden">
                  {getFileCategory(file) === 'image' ? (
                    <>
                      <ELAViewer file={file} />
                      <ExifPanel file={file} />
                    </>
                  ) : (
                    <div className="border border-rule rounded-sm bg-surface p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <ShieldCheck className="w-4 h-4 text-verified" strokeWidth={1.5} />
                        <span className="text-[12px] font-medium text-ink">{getFileMeta(file).label} Verification</span>
                      </div>
                      <p className="text-[11px] text-ink-tertiary leading-relaxed">SHA-256 fingerprint comparison confirms this file's integrity against the blockchain record.</p>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            <motion.button variants={slide} custom={4} onClick={reset}
              className="w-full py-3.5 border border-rule rounded-sm text-[13px] text-ink-faint active:bg-surface transition flex items-center justify-center gap-2">
              <ArrowLeft className="w-3.5 h-3.5" /> Verify Another
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {error && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mt-3 border border-danger/20 bg-danger-glow rounded-sm px-4 py-3 text-[12px] text-danger">{error}</motion.div>}
      </AnimatePresence>
    </div>
  );
}
