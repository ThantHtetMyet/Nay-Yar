import React, { useRef, Suspense } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { TextureLoader } from 'three';

// Procedurally load a photorealistic high-resolution Earth map texture
const RealisticEarth = () => {
    const globeRef = useRef();

    // Load the official Three.js high-res Earth satellite texture
    const [colorMap] = useLoader(TextureLoader, [
        'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_atmos_2048.jpg'
    ]);

    // Continuously rotate left to right just like the HDB model
    useFrame(() => {
        if (globeRef.current) {
            globeRef.current.rotation.y += 0.005;
        }
    });

    return (
        <mesh ref={globeRef}>
            <sphereGeometry args={[1.4, 128, 128]} />
            <meshStandardMaterial
                map={colorMap}
                roughness={0.6}
                metalness={0.1}
            />
        </mesh>
    );
};

// The Fallback while the texture loads
const FallbackSphere = () => (
    <mesh>
        <sphereGeometry args={[1.4, 64, 64]} />
        <meshStandardMaterial color="#0f172a" wireframe={true} />
    </mesh>
);

// The Canvas Wrapper
const GlobeIcon = () => {
    return (
        <div style={{ width: '100px', height: '100px', margin: '0 auto 10px auto', cursor: 'grab' }}>
            <Canvas camera={{ position: [0, 0, 4.5], fov: 45 }}>
                {/* Allow the user to drag and rotate the globe */}
                <OrbitControls enableZoom={false} enablePan={false} />

                {/* Perfect lighting to illuminate the Earth texture */}
                <ambientLight intensity={1.5} />
                <directionalLight position={[5, 3, 5]} intensity={2.5} />
                <pointLight position={[-5, -5, -5]} intensity={0.5} />

                {/* React Suspense to handle the asynchronous image loading */}
                <Suspense fallback={<FallbackSphere />}>
                    <RealisticEarth />
                </Suspense>
            </Canvas>
        </div>
    );
};

export default GlobeIcon;
