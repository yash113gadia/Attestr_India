import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { ArrowUpFromLine } from 'lucide-react';

export default function UploadZone({ onFileSelect, multiple = false, accept = 'image/*,video/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,audio/*,text/plain,.csv,.xlsx,.json,.glb,.obj,.stl,.js,.py,.sol,.cpp,.html,.css,.zip,.rar,.tar.gz,.cr2,.nef,.arw,.dng' }) {
  const [drag, setDrag] = useState(false);
  const ref = useRef(null);

  function handleFiles(fileList) {
    if (!fileList?.length) return;
    if (multiple) {
      onFileSelect(Array.from(fileList));
    } else {
      onFileSelect(fileList[0]);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      onDragEnter={(e) => { e.preventDefault(); setDrag(true); }}
      onDragLeave={(e) => { e.preventDefault(); setDrag(false); }}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => { e.preventDefault(); setDrag(false); handleFiles(e.dataTransfer.files); }}
      onClick={() => ref.current?.click()}
      className={`cursor-pointer border border-dashed rounded-sm py-20 text-center transition-all duration-200 ${
        drag ? 'border-accent bg-accent-glow' : 'border-rule hover:border-ink-faint'
      }`}
    >
      <input ref={ref} type="file" accept={accept} multiple={multiple} onChange={(e) => handleFiles(e.target.files)} className="hidden" />
      <ArrowUpFromLine className={`w-5 h-5 mx-auto mb-4 ${drag ? 'text-accent' : 'text-ink-faint'}`} strokeWidth={1.5} />
      <p className="text-[13px] text-ink-secondary">
        Drop {multiple ? 'files' : 'any file'} here, or <span className="text-accent cursor-pointer">browse</span>
      </p>
      <p className="text-[10px] text-ink-tertiary mt-2 font-mono uppercase tracking-[0.15em] border-t border-rule pt-2">
        IMG · VID · AUD · PDF · DOC · 3D · CODE · RAW · DATA{multiple ? ' · BATCH' : ''}
      </p>
    </motion.div>
  );
}
