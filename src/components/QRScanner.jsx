import { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, X, QrCode, Loader2 } from 'lucide-react';

export default function QRScanner({ onScan, onClose }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [error, setError] = useState(null);
  const [scanning, setScanning] = useState(true);
  const scanInterval = useRef(null);

  const stopCamera = useCallback(() => {
    if (scanInterval.current) clearInterval(scanInterval.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } }
        });
        if (cancelled) { stream.getTracks().forEach(t => t.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }

        // Use BarcodeDetector if available (Chrome, Edge, Safari)
        if ('BarcodeDetector' in window) {
          const detector = new BarcodeDetector({ formats: ['qr_code'] });
          scanInterval.current = setInterval(async () => {
            if (!videoRef.current || videoRef.current.readyState < 2) return;
            try {
              const barcodes = await detector.detect(videoRef.current);
              if (barcodes.length > 0) {
                const url = barcodes[0].rawValue;
                setScanning(false);
                stopCamera();
                onScan(url);
              }
            } catch {}
          }, 300);
        } else {
          setError('QR scanning not supported in this browser. Try Chrome or Safari.');
        }
      } catch (err) {
        if (!cancelled) setError('Camera access denied. Please allow camera permissions.');
      }
    }

    startCamera();
    return () => { cancelled = true; stopCamera(); };
  }, [onScan, stopCamera]);

  return (
    <div className="border border-rule rounded-sm bg-surface overflow-hidden">
      <div className="px-4 py-3 border-b border-rule-light flex items-center justify-between">
        <div className="flex items-center gap-2">
          <QrCode className="w-4 h-4 text-accent" strokeWidth={1.5} />
          <span className="text-[10px] font-mono text-ink-faint tracking-widest uppercase">QR Scanner</span>
        </div>
        <button onClick={() => { stopCamera(); onClose(); }} className="text-ink-faint hover:text-ink transition">
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="relative aspect-[4/3] bg-void flex items-center justify-center">
        {error ? (
          <div className="text-center px-6">
            <Camera className="w-8 h-8 text-ink-faint mx-auto mb-3" strokeWidth={1} />
            <p className="text-[12px] text-danger">{error}</p>
          </div>
        ) : (
          <>
            <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
            {scanning && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-48 h-48 border-2 border-accent/50 rounded-sm relative">
                  <div className="absolute -top-0.5 -left-0.5 w-6 h-6 border-t-2 border-l-2 border-accent rounded-tl-sm" />
                  <div className="absolute -top-0.5 -right-0.5 w-6 h-6 border-t-2 border-r-2 border-accent rounded-tr-sm" />
                  <div className="absolute -bottom-0.5 -left-0.5 w-6 h-6 border-b-2 border-l-2 border-accent rounded-bl-sm" />
                  <div className="absolute -bottom-0.5 -right-0.5 w-6 h-6 border-b-2 border-r-2 border-accent rounded-br-sm" />
                  <div className="absolute top-1/2 left-0 right-0 h-px bg-accent/40 animate-pulse" />
                </div>
              </div>
            )}
          </>
        )}
      </div>
      <p className="text-[11px] text-ink-faint text-center py-2">Point your camera at an Attestr QR code</p>
    </div>
  );
}
