import { Suspense, useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

const Particles = () => {
  const meshRef = useRef<THREE.Points>(null);
  const count = 1500;

  const [positions, sizes] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const sz = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 20;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 20;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 10;
      sz[i] = Math.random() * 2 + 0.5;
    }
    return [pos, sz];
  }, []);

  useFrame((state) => {
    if (!meshRef.current) return;
    const geo = meshRef.current.geometry;
    const posAttr = geo.getAttribute("position");
    for (let i = 0; i < count; i++) {
      const y = posAttr.getY(i);
      posAttr.setY(i, y - 0.003);
      if (y < -10) posAttr.setY(i, 10);
    }
    posAttr.needsUpdate = true;
    meshRef.current.rotation.y = state.clock.elapsedTime * 0.01;
  });

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
          count={count}
        />
        <bufferAttribute
          attach="attributes-size"
          args={[sizes, 1]}
          count={count}
        />
      </bufferGeometry>
      <pointsMaterial
        color="#00ffb4"
        size={0.03}
        transparent
        opacity={0.15}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
};

const WireframeTorus = () => {
  const meshRef = useRef<THREE.Mesh>(null);
  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.x += 0.001;
      meshRef.current.rotation.y += 0.0015;
    }
  });
  return (
    <mesh ref={meshRef}>
      <torusKnotGeometry args={[3, 0.8, 128, 16]} />
      <meshBasicMaterial color="#00ffb4" wireframe transparent opacity={0.05} />
    </mesh>
  );
};

export const ParticleBackground = () => (
  <div className="absolute inset-0 -z-10">
    <Canvas camera={{ position: [0, 0, 8], fov: 60 }} dpr={[1, 1.5]}>
      <Suspense fallback={null}>
        <Particles />
        <WireframeTorus />
      </Suspense>
    </Canvas>
  </div>
);
