import React from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, ContactShadows, Environment, Text } from '@react-three/drei';

const SideWallDecoration = ({ isLeft, blockNumber }) => {
    const sign = isLeft ? -1 : 1;
    const xBase = sign * 0.61;
    const rot = [0, isLeft ? -Math.PI / 2 : Math.PI / 2, 0];

    return (
        <group>
            {/* Red Grid Panels */}
            {[...Array(4)].map((_, r) => (
                [...Array(2)].map((_, c) => (
                    <mesh key={`panel-${r}-${c}`} position={[xBase, -1.85 + r * 1.2, -0.28 + c * 0.56]} castShadow receiveShadow>
                        <boxGeometry args={[0.02, 1.0, 0.45]} />
                        <meshStandardMaterial color="#b91c1c" roughness={0.9} />
                    </mesh>
                ))
            ))}

            {/* Plaque */}
            {blockNumber && (
                <group position={[xBase + sign * 0.04, 1.6, 0]} rotation={rot}>
                    {/* Yellow Border */}
                    <mesh castShadow receiveShadow>
                        <boxGeometry args={[0.9, 0.5, 0.02]} />
                        <meshStandardMaterial color="#eab308" roughness={0.5} />
                    </mesh>
                    {/* Black Inside */}
                    <mesh position={[0, 0, 0.015]} castShadow receiveShadow>
                        <boxGeometry args={[0.85, 0.45, 0.01]} />
                        <meshStandardMaterial color="#111827" roughness={0.5} />
                    </mesh>
                    {/* Text */}
                    <Text position={[0, 0.08, 0.025]} fontSize={0.25} color="#eab308" fontWeight="bold">
                        {blockNumber}
                    </Text>
                    <Text position={[0, -0.1, 0.025]} fontSize={0.06} color="#eab308" fontWeight="bold">
                        JURONG WEST
                    </Text>
                    <Text position={[0, -0.18, 0.025]} fontSize={0.06} color="#eab308" fontWeight="bold">
                        STREET 91
                    </Text>
                </group>
            )}
        </group>
    );
};

const HDBTowerGroup = ({ leftBlock = "914", rightBlock = "915" }) => (
    <group>
        {/* Main Tower 1 (Left) */}
        <group position={[-0.7, 2.5, 0]}>
            {/* White Body */}
            <mesh position={[0, 0, 0]} castShadow receiveShadow>
                <boxGeometry args={[1.2, 5.0, 1.2]} />
                <meshStandardMaterial color="#f8fafc" roughness={0.9} />
            </mesh>

            {/* Red Stripes Front */}
            {[...Array(6)].map((_, i) => (
                <mesh key={`stripe-1-${i}`} position={[0, -2.0 + i * 0.85, 0.61]} castShadow receiveShadow>
                    <boxGeometry args={[1.2, 0.3, 0.05]} />
                    <meshStandardMaterial color="#ef4444" roughness={0.7} />
                </mesh>
            ))}

            {/* Vertical Red Stripe Front */}
            <mesh position={[0.3, 0, 0.62]} castShadow receiveShadow>
                <boxGeometry args={[0.3, 5.0, 0.05]} />
                <meshStandardMaterial color="#ef4444" roughness={0.7} />
            </mesh>

            {/* Windows Front */}
            {[...Array(5)].map((_, i) => (
                <mesh key={`win-1-${i}`} position={[-0.25, -1.6 + i * 0.85, 0.61]} castShadow receiveShadow>
                    <boxGeometry args={[0.4, 0.3, 0.06]} />
                    <meshStandardMaterial color="#38bdf8" roughness={0.2} metalness={0.8} />
                </mesh>
            ))}

            {/* Angled Roof */}
            <mesh position={[0, 2.7, 0]} rotation={[0, 0, -Math.PI / 12]} castShadow receiveShadow>
                <boxGeometry args={[1.3, 0.4, 1.3]} />
                <meshStandardMaterial color="#dc2626" roughness={0.8} />
            </mesh>

            <SideWallDecoration isLeft={true} blockNumber={leftBlock} />
        </group>

        {/* Main Tower 2 (Right) */}
        <group position={[0.7, 2.5, 0]}>
            {/* White Body */}
            <mesh position={[0, 0, 0]} castShadow receiveShadow>
                <boxGeometry args={[1.2, 5.0, 1.2]} />
                <meshStandardMaterial color="#f8fafc" roughness={0.9} />
            </mesh>

            {/* Red Stripes Front */}
            {[...Array(6)].map((_, i) => (
                <mesh key={`stripe-2-${i}`} position={[0, -2.0 + i * 0.85, 0.61]} castShadow receiveShadow>
                    <boxGeometry args={[1.2, 0.3, 0.05]} />
                    <meshStandardMaterial color="#ef4444" roughness={0.7} />
                </mesh>
            ))}

            {/* Vertical Red Stripe Front */}
            <mesh position={[-0.3, 0, 0.62]} castShadow receiveShadow>
                <boxGeometry args={[0.3, 5.0, 0.05]} />
                <meshStandardMaterial color="#ef4444" roughness={0.7} />
            </mesh>

            {/* Windows Front */}
            {[...Array(5)].map((_, i) => (
                <mesh key={`win-2-${i}`} position={[0.25, -1.6 + i * 0.85, 0.61]} castShadow receiveShadow>
                    <boxGeometry args={[0.4, 0.3, 0.06]} />
                    <meshStandardMaterial color="#38bdf8" roughness={0.2} metalness={0.8} />
                </mesh>
            ))}

            {/* Angled Roof */}
            <mesh position={[0, 2.7, 0]} rotation={[0, 0, Math.PI / 12]} castShadow receiveShadow>
                <boxGeometry args={[1.3, 0.4, 1.3]} />
                <meshStandardMaterial color="#dc2626" roughness={0.8} />
            </mesh>

            <SideWallDecoration isLeft={false} blockNumber={rightBlock} />
        </group>

        {/* Connecting Corridor at Bottom */}
        <mesh position={[0, 0.5, 0.2]} castShadow receiveShadow>
            <boxGeometry args={[1.4, 1.0, 0.8]} />
            <meshStandardMaterial color="#e2e8f0" roughness={0.8} />
        </mesh>
    </group>
);

const HDBBuilding = () => {
    return (
        <group position={[0, -1.2, 0]}>
            {/* Base Platform */}
            <mesh position={[0, 0, 0]} castShadow receiveShadow>
                <boxGeometry args={[3.2, 0.1, 3.2]} />
                <meshStandardMaterial color="#e4e4e7" roughness={0.8} />
            </mesh>

            {/* Front Building */}
            <group position={[0, 0, 0.55]}>
                <HDBTowerGroup leftBlock="914" rightBlock="915" />
            </group>

            {/* Back-to-Back Adjacent Building (Rotated 180 degrees) */}
            <group position={[0, 0, -0.55]} rotation={[0, Math.PI, 0]}>
                <HDBTowerGroup leftBlock={false} rightBlock={false} />
            </group>

            {/* Lush Greenery / Trees to match image aesthetic */}
            <group position={[1.2, 0, 1.3]}>
                <mesh position={[0, 0.2, 0]} castShadow receiveShadow>
                    <cylinderGeometry args={[0.08, 0.08, 0.4]} />
                    <meshStandardMaterial color="#78350f" />
                </mesh>
                <mesh position={[0, 0.6, 0]} castShadow receiveShadow>
                    <sphereGeometry args={[0.4, 16, 16]} />
                    <meshStandardMaterial color="#166534" roughness={0.9} />
                </mesh>
                <mesh position={[0.3, 0.5, 0.3]} castShadow receiveShadow>
                    <sphereGeometry args={[0.25, 16, 16]} />
                    <meshStandardMaterial color="#15803d" roughness={0.9} />
                </mesh>
            </group>

            <group position={[-1.3, 0, 1.2]}>
                <mesh position={[0, 0.2, 0]} castShadow receiveShadow>
                    <cylinderGeometry args={[0.06, 0.06, 0.4]} />
                    <meshStandardMaterial color="#78350f" />
                </mesh>
                <mesh position={[0, 0.5, 0]} castShadow receiveShadow>
                    <sphereGeometry args={[0.35, 16, 16]} />
                    <meshStandardMaterial color="#166534" roughness={0.9} />
                </mesh>
            </group>

            {/* Extra trees for the back side! */}
            <group position={[1.2, 0, -1.3]}>
                <mesh position={[0, 0.2, 0]} castShadow receiveShadow>
                    <cylinderGeometry args={[0.08, 0.08, 0.4]} />
                    <meshStandardMaterial color="#78350f" />
                </mesh>
                <mesh position={[0, 0.6, 0]} castShadow receiveShadow>
                    <sphereGeometry args={[0.4, 16, 16]} />
                    <meshStandardMaterial color="#166534" roughness={0.9} />
                </mesh>
            </group>
        </group>
    );
};

const RollsRoyce = () => {
    return (
        <group position={[0, -1.15, 1.4]} rotation={[0, -Math.PI / 5, 0]}>
            {/* Main Car Body - Long and Boxy */}
            <mesh position={[0, 0.15, 0]} castShadow receiveShadow>
                <boxGeometry args={[1.1, 0.22, 0.45]} />
                <meshStandardMaterial color="#0f172a" roughness={0.1} metalness={0.8} /> {/* Glossy Black */}
            </mesh>

            {/* Cabin - Squared off */}
            <mesh position={[-0.15, 0.38, 0]} castShadow receiveShadow>
                <boxGeometry args={[0.5, 0.24, 0.4]} />
                <meshStandardMaterial color="#f8fafc" roughness={0.05} metalness={0.9} transparent opacity={0.85} /> {/* Tinted Silver Glass */}
            </mesh>

            {/* Roof - Black */}
            <mesh position={[-0.15, 0.51, 0]} castShadow receiveShadow>
                <boxGeometry args={[0.52, 0.05, 0.42]} />
                <meshStandardMaterial color="#0f172a" roughness={0.1} metalness={0.8} />
            </mesh>

            {/* Iconic Upright Front Grille (Chrome) */}
            <mesh position={[0.56, 0.16, 0]} castShadow receiveShadow>
                <boxGeometry args={[0.05, 0.22, 0.2]} />
                <meshStandardMaterial color="#e2e8f0" roughness={0.2} metalness={1} />
            </mesh>

            {/* Silver Hood Trim */}
            <mesh position={[0.33, 0.265, 0]} castShadow receiveShadow>
                <boxGeometry args={[0.45, 0.02, 0.2]} />
                <meshStandardMaterial color="#e2e8f0" roughness={0.2} metalness={1} />
            </mesh>

            {/* Wheels - Larger and more prominent */}
            {[-0.35, 0.35].map((x, i) =>
                [-0.22, 0.22].map((z, j) => (
                    <group key={`wheel-${i}-${j}`} position={[x, 0.08, z]}>
                        <mesh rotation={[Math.PI / 2, 0, 0]} castShadow receiveShadow>
                            <cylinderGeometry args={[0.1, 0.1, 0.06, 16]} />
                            <meshStandardMaterial color="#1e293b" roughness={0.9} /> {/* Tire */}
                        </mesh>
                        <mesh rotation={[Math.PI / 2, 0, 0]} castShadow receiveShadow>
                            <cylinderGeometry args={[0.06, 0.06, 0.07, 16]} />
                            <meshStandardMaterial color="#e2e8f0" roughness={0.2} metalness={0.9} /> {/* Silver Rim */}
                        </mesh>
                    </group>
                ))
            )}

            {/* Headlights - Classic Round */}
            <mesh position={[0.551, 0.15, 0.15]} rotation={[0, Math.PI / 2, 0]}>
                <circleGeometry args={[0.04, 16]} />
                <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={1} />
            </mesh>
            <mesh position={[0.551, 0.15, -0.15]} rotation={[0, Math.PI / 2, 0]}>
                <circleGeometry args={[0.04, 16]} />
                <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={1} />
            </mesh>

            {/* Taillights */}
            <mesh position={[-0.551, 0.15, 0.18]} rotation={[0, -Math.PI / 2, 0]}>
                <circleGeometry args={[0.03, 16]} />
                <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={1} />
            </mesh>
            <mesh position={[-0.551, 0.15, -0.18]} rotation={[0, -Math.PI / 2, 0]}>
                <circleGeometry args={[0.03, 16]} />
                <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={1} />
            </mesh>
        </group>
    );
};

const Building3D = () => {
    // Extreme compression of canvas bounds to completely nullify the gap. 
    // Camera pulled drastically back to un-crop the roof frame.
    return (
        <div style={{ width: '100%', height: '210px', cursor: 'grab', marginBottom: '-15px' }}>
            <Canvas camera={{ position: [10, 6, 11], fov: 35 }} shadows>
                <ambientLight intensity={0.7} />
                <directionalLight position={[10, 10, 5]} intensity={1.5} castShadow shadow-mapSize={[1024, 1024]} />
                <pointLight position={[-10, 5, -10]} intensity={0.5} color="#e2e8f0" />

                <HDBBuilding />
                <RollsRoyce />

                <ContactShadows position={[0, -1.15, 0]} opacity={0.6} scale={15} blur={2.5} far={4} color="#0f172a" />

                <OrbitControls
                    enableZoom={true}
                    enablePan={false}
                    autoRotate={true}
                    autoRotateSpeed={1.5}
                    maxPolarAngle={Math.PI / 2 - 0.05}
                    minPolarAngle={Math.PI / 4}
                />
                <Environment preset="city" />
            </Canvas>
        </div>
    );
};

export default Building3D;
