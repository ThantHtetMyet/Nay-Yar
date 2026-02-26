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
        <group position={[0, -1.6, 0]}>
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



const DBSBuilding = () => {
    return (
        <group position={[-3.5, -1.6, 0]}>
            {/* Base Platform */}
            <mesh position={[0, 0, 0]} castShadow receiveShadow>
                <boxGeometry args={[2.6, 0.15, 2.6]} />
                <meshStandardMaterial color="#e4e4e7" roughness={0.8} />
            </mesh>

            {/* Main Tower - Dark Blue Glass */}
            <group position={[0, 2.6, 0]}>
                <mesh castShadow receiveShadow>
                    <boxGeometry args={[2.2, 5.2, 2.2]} />
                    <meshStandardMaterial color="#1e3a8a" roughness={0.2} metalness={0.8} />
                </mesh>

                {/* Interior Lights Effect */}
                {[...Array(8)].map((_, i) => (
                    <mesh key={`dbs-light-${i}`} position={[0, -2.0 + i * 0.7, 0]}>
                        <boxGeometry args={[2.1, 0.05, 2.1]} />
                        <meshStandardMaterial color="#fef08a" emissive="#fef08a" emissiveIntensity={2} toneMapped={false} />
                    </mesh>
                ))}
                {/* Random Lit Windows */}
                {[...Array(12)].map((_, i) => {
                    const yPos = -2.0 + (i % 6) * 0.8 + Math.sin(i) * 0.5;
                    const xPos = ((i % 3) - 1) * 0.8;
                    return (
                        <mesh key={`dbs-win-${i}`} position={[xPos, yPos, 1.11]}>
                            <planeGeometry args={[0.4, 0.3]} />
                            <meshStandardMaterial color="#fbbf24" emissive="#fbbf24" emissiveIntensity={3} toneMapped={false} />
                        </mesh>
                    );
                })}

                {/* Horizontal Louvers/Lines */}
                {[...Array(20)].map((_, i) => (
                    <mesh key={`line-${i}`} position={[0, -2.4 + i * 0.25, 0]} castShadow receiveShadow>
                        <boxGeometry args={[2.25, 0.02, 2.25]} />
                        <meshStandardMaterial color="#60a5fa" emissive="#60a5fa" emissiveIntensity={0.2} />
                    </mesh>
                ))}

                {/* DBS Logo Front */}
                <group position={[0, 2.0, 1.11]}>
                    {/* Red Icon Background */}
                    <mesh position={[-0.6, 0, 0]}>
                        <boxGeometry args={[0.4, 0.4, 0.02]} />
                        <meshStandardMaterial color="#dc2626" />
                    </mesh>
                    {/* White X Shape */}
                    <mesh position={[-0.6, 0, 0.02]} rotation={[0, 0, Math.PI / 4]}>
                        <boxGeometry args={[0.3, 0.08, 0.01]} />
                        <meshStandardMaterial color="white" />
                    </mesh>
                    <mesh position={[-0.6, 0, 0.02]} rotation={[0, 0, -Math.PI / 4]}>
                        <boxGeometry args={[0.3, 0.08, 0.01]} />
                        <meshStandardMaterial color="white" />
                    </mesh>

                    {/* DBS Text */}
                    <Text position={[0.4, 0, 0.02]} fontSize={0.5} color="white" fontWeight="bold" letterSpacing={0.05}>
                        DBS
                    </Text>
                </group>

                {/* DBS Logo Back */}
                <group position={[0, 2.0, -1.11]} rotation={[0, Math.PI, 0]}>
                    <mesh position={[-0.6, 0, 0]}>
                        <boxGeometry args={[0.4, 0.4, 0.02]} />
                        <meshStandardMaterial color="#dc2626" />
                    </mesh>
                    <mesh position={[-0.6, 0, 0.02]} rotation={[0, 0, Math.PI / 4]}>
                        <boxGeometry args={[0.3, 0.08, 0.01]} />
                        <meshStandardMaterial color="white" />
                    </mesh>
                    <mesh position={[-0.6, 0, 0.02]} rotation={[0, 0, -Math.PI / 4]}>
                        <boxGeometry args={[0.3, 0.08, 0.01]} />
                        <meshStandardMaterial color="white" />
                    </mesh>
                    <Text position={[0.4, 0, 0.02]} fontSize={0.5} color="white" fontWeight="bold" letterSpacing={0.05}>
                        DBS
                    </Text>
                </group>
            </group>

            {/* Flat Roof */}
            <mesh position={[0, 5.25, 0]} castShadow receiveShadow>
                <boxGeometry args={[2.2, 0.1, 2.2]} />
                <meshStandardMaterial color="#172554" roughness={0.5} />
            </mesh>

            {/* Entrance */}
            <mesh position={[0, 0.6, 1.15]} castShadow receiveShadow>
                <boxGeometry args={[1.2, 1.2, 0.1]} />
                <meshStandardMaterial color="#1e40af" roughness={0.3} metalness={0.6} />
            </mesh>
        </group>
    );
};

const ModernBuilding = () => {
    return (
        <group position={[3.5, -1.6, 0]}>
            {/* Base Platform */}
            <mesh position={[0, 0, 0]} castShadow receiveShadow>
                <boxGeometry args={[2.8, 0.15, 2.8]} />
                <meshStandardMaterial color="#e4e4e7" roughness={0.8} />
            </mesh>

            {/* Main Tower */}
            <group position={[0, 2.6, 0]}>
                {/* Interior Office Lights */}
                {[...Array(6)].map((_, i) => (
                    <mesh key={`shopee-light-${i}`} position={[0, -2.0 + i * 0.8, 0]}>
                        <boxGeometry args={[1.9, 0.05, 1.9]} />
                        <meshStandardMaterial color="#fbbf24" emissive="#fbbf24" emissiveIntensity={1.5} toneMapped={false} />
                    </mesh>
                ))}
                
                {/* Core Structure */}
                <mesh castShadow receiveShadow>
                    <boxGeometry args={[2.0, 5.2, 2.0]} />
                    <meshStandardMaterial color="#0f172a" roughness={0.2} metalness={0.5} />
                </mesh>

                {/* Glass Curtain Wall - Front */}
                <mesh position={[0, 0, 1.01]} castShadow receiveShadow>
                    <boxGeometry args={[1.8, 5.0, 0.05]} />
                    <meshStandardMaterial color="#38bdf8" roughness={0.05} metalness={0.9} transparent opacity={0.6} />
                </mesh>

                {/* Glass Curtain Wall - Back */}
                <mesh position={[0, 0, -1.01]} castShadow receiveShadow>
                    <boxGeometry args={[1.8, 5.0, 0.05]} />
                    <meshStandardMaterial color="#38bdf8" roughness={0.05} metalness={0.9} transparent opacity={0.6} />
                </mesh>

                {/* Glass Curtain Wall - Left */}
                <mesh position={[-1.01, 0, 0]} rotation={[0, Math.PI / 2, 0]} castShadow receiveShadow>
                    <boxGeometry args={[1.8, 5.0, 0.05]} />
                    <meshStandardMaterial color="#38bdf8" roughness={0.05} metalness={0.9} transparent opacity={0.6} />
                </mesh>

                {/* Glass Curtain Wall - Right */}
                <mesh position={[1.01, 0, 0]} rotation={[0, Math.PI / 2, 0]} castShadow receiveShadow>
                    <boxGeometry args={[1.8, 5.0, 0.05]} />
                    <meshStandardMaterial color="#38bdf8" roughness={0.05} metalness={0.9} transparent opacity={0.6} />
                </mesh>

                {/* Horizontal Fins / Sunshades */}
                {[...Array(10)].map((_, i) => (
                    <mesh key={`fin-${i}`} position={[0, -2.2 + i * 0.5, 0]} castShadow receiveShadow>
                        <boxGeometry args={[2.2, 0.05, 2.2]} />
                        <meshStandardMaterial color="#94a3b8" roughness={0.4} metalness={0.8} />
                    </mesh>
                ))}

                {/* Shopee Signage Front */}
                <group position={[0, 1.5, 1.05]}>
                    <mesh castShadow receiveShadow>
                        <boxGeometry args={[1.8, 0.4, 0.05]} />
                        <meshStandardMaterial color="#f8fafc" />
                    </mesh>
                    <Text position={[0, 0, 0.03]} fontSize={0.25} color="#ee4d2d" fontWeight="bold">
                        Shopee
                    </Text>
                </group>

                {/* Shopee Signage Back */}
                <group position={[0, 1.5, -1.05]} rotation={[0, Math.PI, 0]}>
                    <mesh castShadow receiveShadow>
                        <boxGeometry args={[1.8, 0.4, 0.05]} />
                        <meshStandardMaterial color="#f8fafc" />
                    </mesh>
                    <Text position={[0, 0, 0.03]} fontSize={0.25} color="#ee4d2d" fontWeight="bold">
                        Shopee
                    </Text>
                </group>
            </group>

            {/* Entrance Canopy */}
            <mesh position={[0, 0.6, 1.2]} rotation={[0.1, 0, 0]} castShadow receiveShadow>
                <boxGeometry args={[1.2, 0.05, 0.8]} />
                <meshStandardMaterial color="#f8fafc" roughness={0.1} metalness={0.5} />
            </mesh>

            {/* Entrance Pillars */}
            <mesh position={[-0.5, 0.3, 1.4]} castShadow receiveShadow>
                <cylinderGeometry args={[0.05, 0.05, 0.6]} />
                <meshStandardMaterial color="#cbd5e1" metalness={0.8} />
            </mesh>
            <mesh position={[0.5, 0.3, 1.4]} castShadow receiveShadow>
                <cylinderGeometry args={[0.05, 0.05, 0.6]} />
                <meshStandardMaterial color="#cbd5e1" metalness={0.8} />
            </mesh>

            {/* Rooftop Crown */}
            <group position={[0, 5.3, 0]}>
                <mesh position={[0, 0, 0]} castShadow receiveShadow>
                    <boxGeometry args={[1.8, 0.4, 1.8]} />
                    <meshStandardMaterial color="#0f172a" roughness={0.5} />
                </mesh>
                {/* Antenna */}
                <mesh position={[0.5, 0.8, -0.5]} castShadow receiveShadow>
                    <cylinderGeometry args={[0.02, 0.05, 1.6]} />
                    <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={0.5} />
                </mesh>
            </group>

            {/* Landscaping */}
            <group position={[1.0, 0.1, 1.0]}>
                <mesh position={[0, 0.15, 0]} castShadow receiveShadow>
                    <sphereGeometry args={[0.25, 8, 8]} />
                    <meshStandardMaterial color="#166534" roughness={0.9} />
                </mesh>
            </group>
            <group position={[-1.0, 0.1, 1.0]}>
                <mesh position={[0, 0.15, 0]} castShadow receiveShadow>
                    <sphereGeometry args={[0.25, 8, 8]} />
                    <meshStandardMaterial color="#166534" roughness={0.9} />
                </mesh>
            </group>
        </group>
    );
};

const Building3D = () => {
    // Extreme compression of canvas bounds to completely nullify the gap. 
    // Camera pulled drastically back to un-crop the roof frame.
    return (
        <div style={{ width: '100%', height: '210px', cursor: 'grab', marginBottom: '-25px' }}>
            <Canvas camera={{ position: [9, 6, 9], fov: 35 }} shadows>
                <ambientLight intensity={0.7} />
                <directionalLight position={[10, 10, 5]} intensity={1.5} castShadow shadow-mapSize={[2048, 2048]} />
                <pointLight position={[-10, 5, -10]} intensity={0.5} color="#e2e8f0" />

                {/* DBS Building (Left) */}
                <DBSBuilding />

                {/* HDB Building (Center) */}
                <group position={[0, 0, 0]}>
                    <HDBBuilding />
                </group>

                {/* Modern Building (Right) */}
                <ModernBuilding />

                <ContactShadows position={[0, -1.55, 0]} opacity={0.5} scale={30} blur={2.5} far={4} color="#0f172a" />

                <OrbitControls
                    enableZoom={true}
                    enablePan={false}
                    autoRotate={true}
                    autoRotateSpeed={1.0}
                    maxPolarAngle={Math.PI / 2 - 0.05}
                    minPolarAngle={Math.PI / 4}
                />
                <Environment preset="city" />
            </Canvas>
        </div>
    );
};

export default Building3D;