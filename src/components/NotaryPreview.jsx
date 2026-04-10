import { Suspense, useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { useGLTF, Stage, PresentationControls, Environment } from '@react-three/drei';
import { FileText, Music, FileDigit, Box, Loader2 } from 'lucide-react';

function Model({ url }) {
  const { scene } = useGLTF(url);
  return <primitive object={scene} />;
}

export default function NotaryPreview({ file, previewUrl }) {
  const [error, setError] = useState(false);
  const isImage = file?.type?.startsWith('image/');
  const isVideo = file?.type?.startsWith('video/');
  const isAudio = file?.type?.startsWith('audio/');
  const isPDF = file?.type?.includes('pdf') || file?.name?.endsWith('.pdf');
  const is3D = file?.name?.endsWith('.glb') || file?.name?.endsWith('.obj') || file?.name?.endsWith('.stl');
  const isCode = file?.name?.match(/\.(js|py|sol|cpp|html|css|json)$/i);

  if (isImage && previewUrl) {
    return <img src={previewUrl} alt="" className="w-full h-full object-cover" />;
  }

  if (isVideo && previewUrl) {
    return <video src={previewUrl} className="w-full h-full object-cover" controls />;
  }

  if (isAudio && previewUrl) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-void-dark p-4 gap-3">
        <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center border border-accent/20">
          <Music className="w-6 h-6 text-accent" strokeWidth={1.5} />
        </div>
        <audio src={previewUrl} controls className="w-full h-8 scale-90 opacity-80" />
      </div>
    );
  }

  if (is3D && previewUrl && file?.name?.endsWith('.glb')) {
    return (
      <div className="w-full h-full bg-void-dark relative">
        <Canvas dpr={[1, 2]} camera={{ fov: 45 }} className="w-full h-full">
          <Suspense fallback={null}>
            <Stage environment="city" intensity={0.5} contactShadow={false}>
              <PresentationControls speed={1.5} global zoom={0.7} polar={[-0.1, Math.PI / 4]}>
                <Model url={previewUrl} />
              </PresentationControls>
            </Stage>
          </Suspense>
        </Canvas>
        <div className="absolute bottom-2 right-2 px-2 py-1 bg-void/60 backdrop-blur rounded-[2px] border border-rule-light pointer-events-none">
          <p className="text-[9px] font-mono text-ink-tertiary uppercase tracking-wider">Interactive 3D Preview</p>
        </div>
      </div>
    );
  }

  // Fallback icons for other types
  const Icon = isPDF ? FileText : is3D ? Box : isCode ? FileDigit : FileDigit;
  
  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-void-dark gap-2">
      <Icon className="w-8 h-8 md:w-12 md:h-12 text-accent/40" strokeWidth={1} />
      <span className="text-[9px] font-mono text-ink-faint uppercase tracking-widest">{file?.name?.split('.').pop()} FILE</span>
    </div>
  );
}
