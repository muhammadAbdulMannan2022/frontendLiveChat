
import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Stars, Float, MeshDistortMaterial, Sphere } from '@react-three/drei';
import * as THREE from 'three';

const FloatingOrb = ({ position, color, speed = 1, factor = 1 }: { position: [number, number, number], color: string, speed?: number, factor?: number }) => {
  return (
    <Float speed={speed} rotationIntensity={1} floatIntensity={2}>
      <Sphere args={[1, 32, 32]} position={position}>
        <MeshDistortMaterial
          color={color}
          speed={speed * 2}
          distort={0.4}
          radius={1}
        />
      </Sphere>
    </Float>
  );
};

const GridFloor = () => {
  const meshRef = useRef<THREE.Mesh>(null!);
  useFrame(({ clock }) => {
    meshRef.current.position.z = (clock.getElapsedTime() % 1) * 2;
  });

  return (
    <gridHelper 
      ref={meshRef as any}
      args={[100, 50, '#333', '#111']} 
      rotation={[Math.PI / 2, 0, 0]} 
      position={[0, -5, 0]} 
    />
  );
};

const ThreeBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 -z-10 pointer-events-none">
      <Canvas camera={{ position: [0, 0, 10], fov: 50 }}>
        <color attach="background" args={['#050505']} />
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} color="#6366f1" />
        <pointLight position={[-10, -10, -10]} intensity={1} color="#ec4899" />
        
        <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
        
        <FloatingOrb position={[-5, 3, -2]} color="#6366f1" speed={2} />
        <FloatingOrb position={[6, -2, -3]} color="#ec4899" speed={1.5} factor={0.6} />
        <FloatingOrb position={[0, 5, -8]} color="#10b981" speed={3} factor={1.2} />
        
        <GridFloor />
      </Canvas>
    </div>
  );
};

export default ThreeBackground;
