"use client";

import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { MeshDistortMaterial, Sphere } from "@react-three/drei";
import { MathUtils } from "three";
import type { Mesh } from "three";

type SpiritCharacter3DProps = {
  isSpeaking: boolean;
  audioVolume: number;
};

type DistortMaterialHandle = {
  distort: number;
  speed: number;
};

function SpiritCore({ audioVolume, isSpeaking }: SpiritCharacter3DProps) {
  const innerCoreRef = useRef<Mesh>(null);
  const outerShellRef = useRef<Mesh>(null);
  const distortMaterialRef = useRef<DistortMaterialHandle>(null);

  useFrame((state, delta) => {
    const innerCore = innerCoreRef.current;
    const outerShell = outerShellRef.current;
    const distortMaterial = distortMaterialRef.current;

    if (!innerCore || !outerShell || !distortMaterial) {
      return;
    }

    const time = state.clock.elapsedTime;
    const normalizedVolume = Math.max(0, audioVolume - 1);
    const reactiveBoost = isSpeaking ? 1 : 0;
    const energy = Math.min(1, normalizedVolume * 0.7 + reactiveBoost * 0.65);
    const idleWave = Math.sin(time * 1.2) * 0.5 + 0.5;

    const targetRotationSpeedX = 0.06 + energy * 0.34;
    const targetRotationSpeedY = 0.1 + energy * 0.5;
    const targetDistort = 0.14 + idleWave * 0.04 + energy * 0.36;
    const targetDistortSpeed = 0.8 + energy * 4.2;
    const targetInnerScale = 0.94 + idleWave * 0.03 + energy * 0.12;
    const targetOuterScale = 0.9 + idleWave * 0.025 + energy * 0.08;

    outerShell.rotation.x += targetRotationSpeedX * delta;
    outerShell.rotation.y += targetRotationSpeedY * delta;
    const nextOuterScale = MathUtils.lerp(outerShell.scale.x, targetOuterScale, Math.min(1, delta * 3));
    outerShell.scale.setScalar(nextOuterScale);

    innerCore.rotation.y -= (0.07 + energy * 0.16) * delta;
    const nextScale = MathUtils.lerp(innerCore.scale.x, targetInnerScale, Math.min(1, delta * 4));
    innerCore.scale.setScalar(nextScale);

    distortMaterial.distort += (targetDistort - distortMaterial.distort) * Math.min(1, delta * 5);
    distortMaterial.speed +=
      (targetDistortSpeed - distortMaterial.speed) * Math.min(1, delta * 5);
  });

  return (
    <>
      <ambientLight intensity={0.7} />

      <Sphere args={[0.95, 64, 64]} ref={innerCoreRef}>
        <meshBasicMaterial color="#6ee7b7" toneMapped={false} />
      </Sphere>

      <Sphere args={[2.05, 96, 96]} ref={outerShellRef}>
        <MeshDistortMaterial
          color="#34d399"
          distort={0.16}
          opacity={0.8}
          ref={distortMaterialRef}
          speed={0.8}
          toneMapped={false}
          transparent
          wireframe
        />
      </Sphere>
    </>
  );
}

export default function SpiritCharacter3D(props: SpiritCharacter3DProps) {
  return (
    <div className="relative h-full w-full">
      <div className="pointer-events-none absolute inset-0 rounded-full bg-[radial-gradient(circle,rgba(110,231,183,0.22)_0%,rgba(52,211,153,0.08)_38%,transparent_72%)] blur-3xl" />
      <Canvas
        camera={{ fov: 34, position: [0, 0, 8.8] }}
        className="h-full w-full"
        dpr={[1, 2]}
        gl={{ alpha: true, antialias: true }}
      >
        <SpiritCore {...props} />
      </Canvas>
    </div>
  );
}
