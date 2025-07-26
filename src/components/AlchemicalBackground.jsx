
import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Points, PointMaterial } from '@react-three/drei';
import * as THREE from 'three';

const AlchemicalBackground = () => {
  return (
    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: -1 }}>
      <Canvas camera={{ position: [0, 0, 5] }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} />
        <Grid />
        <Sparkles />
      </Canvas>
    </div>
  );
};

const Grid = () => {
  const grid = useMemo(() => {
    const size = 20;
    const divisions = 20;
    return new THREE.GridHelper(size, divisions, '#444', '#222');
  }, []);
  return <primitive object={grid} />;
};

const Sparkles = () => {
  const ref = useRef();
  const { positions, colors } = useMemo(() => {
    const count = 5000;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions.set([
        (Math.random() - 0.5) * 20,
        (Math.random() - 0.5) * 20,
        (Math.random() - 0.5) * 20
      ], i * 3);
      colors.set([
        1.0, // R
        0.8, // G
        0.2  // B
      ], i * 3);
    }
    return { positions, colors };
  }, []);

  useFrame((state, delta) => {
    ref.current.rotation.x += delta / 20;
    ref.current.rotation.y += delta / 30;
  });

  return (
    <Points ref={ref} positions={positions} stride={3} frustumCulled={false}>
      <PointMaterial
        transparent
        vertexColors
        size={0.02}
        sizeAttenuation={true}
        depthWrite={false}
      />
    </Points>
  );
};

export default AlchemicalBackground;
