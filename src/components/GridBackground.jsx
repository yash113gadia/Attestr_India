import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

function GridPlane() {
  const ref = useRef();
  useFrame((state) => {
    if (ref.current) ref.current.position.z = -((state.clock.elapsedTime * 0.2) % 1);
  });
  return (
    <group ref={ref}>
      <gridHelper args={[60, 60, '#242936', '#1A1E29']} position={[0, -2, 0]} />
    </group>
  );
}

function ChakraWireframe() {
  const ref = useRef();
  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.y = state.clock.elapsedTime * 0.1;
      ref.current.rotation.z = state.clock.elapsedTime * 0.05;
    }
  });

  return (
    <group ref={ref} position={[0, 0, -5]}>
      {/* Outer ring */}
      <mesh>
        <torusGeometry args={[10, 0.02, 16, 100]} />
        <meshBasicMaterial color="#6366F1" transparent opacity={0.1} />
      </mesh>
      {/* Inner hub */}
      <mesh>
        <torusGeometry args={[3, 0.01, 16, 100]} />
        <meshBasicMaterial color="#FF9933" transparent opacity={0.05} />
      </mesh>
      {/* Spokes */}
      {[...Array(24)].map((_, i) => (
        <mesh key={i} rotation={[0, 0, (i * Math.PI) / 12]}>
          <boxGeometry args={[20, 0.005, 0.005]} />
          <meshBasicMaterial color="#6366F1" transparent opacity={0.05} />
        </mesh>
      ))}
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
  return (
    <div className="fixed inset-0 z-0 pointer-events-none">
      <div className="absolute inset-0 bg-gradient-to-b from-void via-void to-[#0D0F14]/50" />
      <Canvas camera={{ position: [0, 2, 12], fov: 45 }} dpr={window.devicePixelRatio} gl={{ alpha: true, antialias: true }} style={{ background: 'transparent' }}>
        <GridPlane />
        <ChakraWireframe />
        <FloatingDots />
      </Canvas>
    </div>
  );
}
