import { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, X, QrCode, Loader2, SwitchCamera, Flashlight, ZoomIn, CheckCircle2 } from 'lucide-react';

export default function QRScanner({ onScan, onClose }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [error, setError] = useState(null);
  const [scanning, setScanning] = useState(true);
  const [detected, setDetected] = useState(false);
  const [facingMode, setFacingMode] = useState('environment');
  const [torch, setTorch] = useState(false);
  const [hasTorch, setHasTorch] = useState(false);
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);
  const scanInterval = useRef(null);

  const stopCamera = useCallback(() => {
    if (scanInterval.current) clearInterval(scanInterval.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  }, []);

  const startCamera = useCallback(async (facing) => {
    stopCamera();
    setError(null);

    try {
      // Check for multiple cameras
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(d => d.kind === 'videoinput');
      setHasMultipleCameras(videoDevices.length > 1);

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facing, width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }

      // Check torch capability
      const track = stream.getVideoTracks()[0];
      const caps = track.getCapabilities?.();
      setHasTorch(!!caps?.torch);

      // Use BarcodeDetector if available
      if ('BarcodeDetector' in window) {
        const detector = new BarcodeDetector({ formats: ['qr_code'] });
        scanInterval.current = setInterval(async () => {
          if (!videoRef.current || videoRef.current.readyState < 2) return;
          try {
            const barcodes = await detector.detect(videoRef.current);
            if (barcodes.length > 0) {
              const url = barcodes[0].rawValue;
              setScanning(false);
              setDetected(true);
              // Brief visual feedback before closing
              setTimeout(() => {
                stopCamera();
                onScan(url);
              }, 400);
            }
          } catch {}
        }, 200);
      } else {
        setError('QR scanning not supported in this browser. Try Chrome or Safari.');
      }
    } catch (err) {
      setError('Camera access denied. Please allow camera permissions.');
    }
  }, [onScan, stopCamera]);

  useEffect(() => {
    let cancelled = false;
    if (!cancelled) startCamera(facingMode);
    return () => { cancelled = true; stopCamera(); };
  }, []);

  function switchCamera() {
    const next = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(next);
    startCamera(next);
  }

  async function toggleTorch() {
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track) return;
    try {
      await track.applyConstraints({ advanced: [{ torch: !torch }] });
      setTorch(!torch);
    } catch {}
  }

  return (
    <div className="border border-rule rounded-lg bg-surface overflow-hidden shadow-lg">
      {/* Header */}
      <div className="px-4 py-2.5 border-b border-rule-light flex items-center justify-between bg-surface-raised">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-danger animate-pulse" />
          <span className="text-[11px] font-medium text-ink">Camera Active</span>
        </div>
        <div className="flex items-center gap-1">
          {hasTorch && (
            <button
              onClick={toggleTorch}
              className={`p-1.5 rounded-md transition ${torch ? 'bg-accent/20 text-accent' : 'text-ink-faint hover:text-ink hover:bg-surface'}`}
              title="Toggle flashlight"
            >
              <Flashlight className="w-4 h-4" strokeWidth={1.5} />
            </button>
          )}
          {hasMultipleCameras && (
            <button
              onClick={switchCamera}
              className="p-1.5 rounded-md text-ink-faint hover:text-ink hover:bg-surface transition"
              title="Switch camera"
            >
              <SwitchCamera className="w-4 h-4" strokeWidth={1.5} />
            </button>
          )}
          <button onClick={() => { stopCamera(); onClose(); }} className="p-1.5 rounded-md text-ink-faint hover:text-danger hover:bg-danger/10 transition ml-1">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Viewfinder */}
      <div className="relative aspect-[4/3] bg-black flex items-center justify-center overflow-hidden">
        {error ? (
          <div className="text-center px-6">
            <Camera className="w-10 h-10 text-ink-faint mx-auto mb-3" strokeWidth={1} />
            <p className="text-[13px] text-danger font-medium mb-1">Camera Unavailable</p>
            <p className="text-[11px] text-ink-faint">{error}</p>
            <button
              onClick={() => startCamera(facingMode)}
              className="mt-3 text-[11px] text-accent hover:text-accent/80 font-medium transition"
            >
              Try Again
            </button>
          </div>
        ) : (
          <>
            <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />

            {/* Dimmed overlay outside scan area */}
            <div className="absolute inset-0 pointer-events-none">
              {/* Top dim */}
              <div className="absolute top-0 left-0 right-0 h-[calc(50%-80px)] bg-black/40" />
              {/* Bottom dim */}
              <div className="absolute bottom-0 left-0 right-0 h-[calc(50%-80px)] bg-black/40" />
              {/* Left dim */}
              <div className="absolute top-[calc(50%-80px)] left-0 w-[calc(50%-80px)] h-[160px] bg-black/40" />
              {/* Right dim */}
              <div className="absolute top-[calc(50%-80px)] right-0 w-[calc(50%-80px)] h-[160px] bg-black/40" />
            </div>

            {/* Scan frame + corners */}
            {scanning && !detected && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-40 h-40 relative">
                  {/* Corner brackets */}
                  <div className="absolute -top-[1px] -left-[1px] w-8 h-8 border-t-[3px] border-l-[3px] border-accent rounded-tl-md" />
                  <div className="absolute -top-[1px] -right-[1px] w-8 h-8 border-t-[3px] border-r-[3px] border-accent rounded-tr-md" />
                  <div className="absolute -bottom-[1px] -left-[1px] w-8 h-8 border-b-[3px] border-l-[3px] border-accent rounded-bl-md" />
                  <div className="absolute -bottom-[1px] -right-[1px] w-8 h-8 border-b-[3px] border-r-[3px] border-accent rounded-br-md" />
                  {/* Scanning laser line */}
                  <div className="absolute left-2 right-2 h-0.5 bg-gradient-to-r from-transparent via-accent to-transparent rounded-full animate-[scan_2s_ease-in-out_infinite]" />
                </div>
              </div>
            )}

            {/* Detection success overlay */}
            {detected && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 pointer-events-none">
                <div className="flex flex-col items-center gap-2 animate-[fadeIn_0.2s_ease-out]">
                  <CheckCircle2 className="w-12 h-12 text-verified" strokeWidth={1.5} />
                  <span className="text-[13px] font-medium text-white">QR Code Detected!</span>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer hint */}
      <div className="px-4 py-2.5 flex items-center justify-center gap-2 bg-surface-raised border-t border-rule-light">
        <QrCode className="w-3.5 h-3.5 text-ink-faint" strokeWidth={1.5} />
        <p className="text-[11px] text-ink-faint">
          {detected ? 'Verifying...' : 'Align QR code within the frame'}
        </p>
      </div>
    </div>
  );
}
