import React, { useRef, Suspense } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { TextureLoader, BackSide } from 'three';

// Atmospheric glow — rendered on inside face of a slightly larger sphere
const Atmosphere = () => (
    <mesh>
        <sphereGeometry args={[1.53, 64, 64]} />
        <meshStandardMaterial
            color="#1a90d5"
            emissive="#0ea5e9"
            emissiveIntensity={1.2}
            transparent
            opacity={0.10}
            side={BackSide}
            depthWrite={false}
        />
    </mesh>
);

// Outer rim halo — very faint, widens the glow edge
const OuterGlow = () => (
    <mesh>
        <sphereGeometry args={[1.70, 32, 32]} />
        <meshStandardMaterial
            color="#38bdf8"
            emissive="#38bdf8"
            emissiveIntensity={0.5}
            transparent
            opacity={0.04}
            depthWrite={false}
        />
    </mesh>
);

const RealisticEarth = () => {
    const globeRef = useRef();

    const [colorMap] = useLoader(TextureLoader, [
        'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_atmos_2048.jpg',
    ]);

    useFrame(() => {
        if (globeRef.current) globeRef.current.rotation.y += 0.004;
    });

    return (
        <mesh ref={globeRef}>
            <sphereGeometry args={[1.4, 128, 128]} />
            <meshStandardMaterial
                map={colorMap}
                roughness={0.35}
                metalness={0.05}
                // Slight self-illumination so the night side is never pitch black
                emissive="#ffffff"
                emissiveMap={colorMap}
                emissiveIntensity={0.18}
            />
        </mesh>
    );
};

const FallbackSphere = () => (
    <mesh>
        <sphereGeometry args={[1.4, 64, 64]} />
        <meshStandardMaterial color="#1a7fa8" roughness={0.4} />
    </mesh>
);

const GlobeIcon = () => (
    <div style={{ width: '120px', height: '120px', margin: '0 auto 10px auto', cursor: 'grab' }}>
        <Canvas camera={{ position: [0, 0, 4.5], fov: 45 }}>
            <OrbitControls enableZoom={false} enablePan={false} />

            {/* Multi-directional light rig — no dark patches */}
            <ambientLight intensity={3.0} />
            <directionalLight position={[ 5,  3,  5]} intensity={3.5} color="#fff8e7" />
            <directionalLight position={[-4, -2, -4]} intensity={1.8} color="#b3d9ff" />
            <pointLight position={[0,  5, 2]} intensity={1.5} color="#ffffff" />
            <pointLight position={[0, -5, 2]} intensity={0.8} color="#cce8ff" />

            <Suspense fallback={<FallbackSphere />}>
                <RealisticEarth />
                <Atmosphere />
                <OuterGlow />
            </Suspense>
        </Canvas>
    </div>
);

export default GlobeIcon;
