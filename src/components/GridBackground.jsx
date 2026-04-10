import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import useIsLight from '../hooks/useIsLight';

function GridPlane({ light }) {
  const ref = useRef();
  useFrame((state) => {
    if (ref.current) ref.current.position.z = -((state.clock.elapsedTime * 0.2) % 1);
  });
  return (
    <group ref={ref}>
      <gridHelper args={[60, 60, light ? '#C7CBD6' : '#242936', light ? '#DDE0E9' : '#1A1E29']} position={[0, -2, 0]} />
    </group>
  );
}

function FloatingDots({ count = 40 }) {
  const ref = useRef();
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 30;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 15;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 15;
    }
    return arr;
  }, [count]);

  useFrame((state) => {
    if (!ref.current) return;
    const arr = ref.current.geometry.attributes.position.array;
    for (let i = 0; i < count; i++) {
      arr[i * 3 + 1] += Math.sin(state.clock.elapsedTime * 0.2 + i) * 0.002;
    }
    ref.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial color="#6366F1" size={0.03} transparent opacity={0.3} sizeAttenuation blending={THREE.AdditiveBlending} depthWrite={false} />
    </points>
  );
}

export default function GridBackground() {
  const light = useIsLight();
  return (
    <div className="fixed inset-0 z-0 pointer-events-none" style={{ opacity: light ? 0.35 : 1 }}>
      <div className="absolute inset-0 bg-gradient-to-b from-void via-void to-surface/50" />
      <Canvas camera={{ position: [0, 2, 12], fov: 45 }} dpr={window.devicePixelRatio} gl={{ alpha: true, antialias: true }} style={{ background: 'transparent' }}>
        <GridPlane light={light} />
        <FloatingDots />
      </Canvas>
    </div>
  );
}
