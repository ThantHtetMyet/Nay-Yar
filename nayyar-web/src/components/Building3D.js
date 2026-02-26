import React from 'react';
import * as THREE from 'three';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, ContactShadows, Environment, Text } from '@react-three/drei';

const MarinaBaySands = () => {
    // Arc configuration for the horizontal curve
    const radius = 22;
    const towerAngles = [-0.18, 0, 0.18]; // Increased spacing for better silhouette
    const boatAngleStart = -0.32; // Adjusted to match wider tower spacing
    const boatAngleEnd = 0.25; 
    const segments = 50; 

    return (
        <group position={[0, -3.5, 0]}>
            {/* Left Side Block - Wedge shape */}
            {(() => {
                const angle = towerAngles[0] - 0.06; // Closer to tower 1 base
                const x = Math.sin(angle) * radius;
                const z = Math.cos(angle) * radius - radius + 0.11; // Stick to tower base
                const baseHeight = 0.6; // Reduced height
                const topLength = 3.0; // Make it long enough to look like "all the way"
                const depth = 1.0;
                
                const shape = new THREE.Shape();
                shape.moveTo(0, 0);
                shape.lineTo(topLength, 0);
                shape.lineTo(topLength, baseHeight);
                shape.lineTo(0, 0);

                const extrudeSettings = {
                    steps: 1,
                    depth: depth,
                    bevelEnabled: false
                };

                // Calculate roof properties
                const hypotenuse = Math.sqrt(topLength * topLength + baseHeight * baseHeight);
                const roofAngle = Math.atan2(baseHeight, topLength);

                return (
                    <group position={[x, 0, z]} rotation={[0, -angle, 0]}>
                        {/* Wedge Block */}
                        <mesh position={[0.45 - topLength, 0, -depth / 2]}>
                            <extrudeGeometry args={[shape, extrudeSettings]} />
                            <meshStandardMaterial color="#ffffff" roughness={0.1} metalness={0.9} transparent opacity={0.6} />
                        </mesh>
                        
                        {/* Sloped Roof */}
                        <mesh 
                            position={[0.45 - topLength / 2, baseHeight / 2, 0]} 
                            rotation={[0, 0, roofAngle]}
                        >
                            <boxGeometry args={[hypotenuse + 0.2, 0.1, 1.1]} />
                            <meshStandardMaterial color="#ffffff" />
                        </mesh>
                    </group>
                );
            })()}

            {/* Connecting Sloped Glass Blocks - Wedge shapes */}
            {[0, 1].map((i) => {
                const startAngle = towerAngles[i];
                const endAngle = towerAngles[i+1];
                const midAngle = (startAngle + endAngle) / 2;
                const x = Math.sin(midAngle) * radius;
                const z = Math.cos(midAngle) * radius - radius + 0.11; // Move closer to tower base
                const dist = radius * (endAngle - startAngle) - 1.8; // Reduced width to avoid penetration
                const baseHeight = i === 0 ? 0.9 : 1.3; // Reduced height
                
                const slopeAngle = Math.PI / 16;
                const h_left = baseHeight - (dist / 2) * Math.tan(slopeAngle);
                const h_right = baseHeight + (dist / 2) * Math.tan(slopeAngle);
                const depth = 1.0;

                const shape = new THREE.Shape();
                shape.moveTo(0, 0);
                shape.lineTo(dist, 0);
                shape.lineTo(dist, h_right);
                shape.lineTo(0, h_left);
                shape.lineTo(0, 0);

                const extrudeSettings = { steps: 1, depth: depth, bevelEnabled: false };
                const roofLen = dist / Math.cos(slopeAngle);

                return (
                    <group key={`sloped-block-${i}`} position={[x, 0, z]} rotation={[0, -midAngle, 0]}>
                        <mesh position={[-dist / 2, 0, -depth / 2]}>
                            <extrudeGeometry args={[shape, extrudeSettings]} />
                            <meshStandardMaterial color="#ffffff" roughness={0.1} metalness={0.9} transparent opacity={0.6} />
                        </mesh>
                        <mesh position={[0, baseHeight, 0]} rotation={[0, 0, slopeAngle]}>
                            <boxGeometry args={[roofLen + 0.1, 0.1, 1.1]} />
                            <meshStandardMaterial color="#ffffff" />
                        </mesh>
                       
                    </group>
                );
            })}

            {/* Right Side Small Edge Block - Wedge shape */}
            {(() => {
                const angle = towerAngles[2] + 0.06; // Closer to tower 3 base
                const x = Math.sin(angle) * radius;
                const z = Math.cos(angle) * radius - radius + 0.11; // Stick to tower base
                const dist = 1.3; // Wider to ensure overlap with tower base
                const baseHeight = 1.7; // Reduced from 3.6
                
                const slopeAngle = Math.PI / 16;
                const h_left = baseHeight - (dist / 2) * Math.tan(slopeAngle);
                const h_right = baseHeight + (dist / 2) * Math.tan(slopeAngle);
                const depth = 1.0;

                const shape = new THREE.Shape();
                shape.moveTo(0, 0);
                shape.lineTo(dist, 0);
                shape.lineTo(dist, h_right);
                shape.lineTo(0, h_left);
                shape.lineTo(0, 0);

                const extrudeSettings = { steps: 1, depth: depth, bevelEnabled: false };
                const roofLen = dist / Math.cos(slopeAngle);

                return (
                    <group position={[x, 0, z]} rotation={[0, -angle, 0]}>
                        <mesh position={[-0.45, 0, -depth / 2]}>
                            <extrudeGeometry args={[shape, extrudeSettings]} />
                            <meshStandardMaterial color="#ffffff" roughness={0.1} metalness={0.9} transparent opacity={0.6} />
                        </mesh>
                        <mesh position={[-0.45 + dist / 2, baseHeight, 0]} rotation={[0, 0, slopeAngle]}>
                            <boxGeometry args={[roofLen + 0.2, 0.1, 1.1]} />
                            <meshStandardMaterial color="#ffffff" />
                        </mesh>
                    </group>
                );
            })()}

            {/* Three Main Towers aligned to arc */}
            {towerAngles.map((angle, i) => {
                const x = Math.sin(angle) * radius;
                const z = Math.cos(angle) * radius - radius;
                
                return (
                    <group key={`tower-${i}`} position={[x, 0, z]} rotation={[0, -angle, 0]}>
                        {/* Tower Core (Hollow/Dark Interior) */}
                        <mesh position={[0, 3.5, 0]}>
                            <boxGeometry args={[1.5, 6.9, 1.1]} />
                            <meshStandardMaterial 
                                color="#020617" 
                                roughness={1} 
                                metalness={0} 
                            />
                        </mesh>

                        {/* Interior Room Lights (Very Sparse & Unique for each building) */}
                        <group position={[0, 0, 0]}>
                            {[...Array(24)].map((_, row) => (
                                [...Array(8)].map((_, col) => {
                                    // Use a high-entropy seed that strongly differentiates buildings
                                    const seed = (i + 1) * 7919 + row * 421 + col * 97;
                                    const randomValue = (Math.sin(seed * 1.5) + Math.cos(seed * 2.1) + 2) / 4;
                                    
                                    // Extremely high threshold for very few lights (approx 10-12% rooms lit)
                                    const isLit = randomValue > 0.82; 
                                    
                                    if (!isLit) return null;

                                    const xPos = -0.6 + col * 0.17;
                                    const yPos = 0.35 + row * 0.28;

                                    return (
                                        <group key={`room-light-group-${i}-${row}-${col}`}>
                                            {/* Front-facing neon light */}
                                            <mesh position={[xPos, yPos, 0.615]}>
                                                <planeGeometry args={[0.10, 0.12]} />
                                                <meshBasicMaterial 
                                                    color="#fef3c7" 
                                                    transparent 
                                                    opacity={1} 
                                                />
                                            </mesh>
                                            {/* Back-facing neon light */}
                                            <mesh position={[xPos, yPos, -0.615]} rotation={[0, Math.PI, 0]}>
                                                <planeGeometry args={[0.10, 0.12]} />
                                                <meshBasicMaterial 
                                                    color="#fef3c7" 
                                                    transparent 
                                                    opacity={1} 
                                                />
                                            </mesh>
                                        </group>
                                    );
                                })
                            ))}
                        </group>

                        {/* Front Glass Panel (Blue) */}
                        <mesh position={[0, 3.5, 0.61]} castShadow receiveShadow>
                            <planeGeometry args={[1.5, 6.8]} />
                            <meshStandardMaterial 
                                color="#2563eb" 
                                roughness={0.1} 
                                metalness={0.9} 
                                transparent 
                                opacity={0.6} 
                            />
                        </mesh>

                        {/* Front Room Grid (Horizontal & Vertical) */}
                        <group position={[0, 0, 0.62]}>
                            {/* Horizontal Floor Lines */}
                            {[...Array(25)].map((_, j) => (
                                <mesh key={`floor-line-f-${i}-${j}`} position={[0, 0.2 + j * 0.28, 0]}>
                                    <planeGeometry args={[1.5, 0.015]} />
                                    <meshStandardMaterial color="#60a5fa" emissive="#60a5fa" emissiveIntensity={0.2} />
                                </mesh>
                            ))}
                            {/* Vertical Room Dividers */}
                            {[-0.5, -0.25, 0, 0.25, 0.5].map((xOffset, j) => (
                                <mesh key={`room-col-f-${i}-${j}`} position={[xOffset, 3.5, 0]}>
                                    <planeGeometry args={[0.015, 6.8]} />
                                    <meshStandardMaterial color="#60a5fa" emissive="#60a5fa" emissiveIntensity={0.1} />
                                </mesh>
                            ))}
                        </group>

                        {/* Back Glass Panel (Blue - Matching Front) */}
                        <mesh position={[0, 3.5, -0.61]} rotation={[0, Math.PI, 0]} castShadow receiveShadow>
                            <planeGeometry args={[1.5, 6.8]} />
                            <meshStandardMaterial 
                                color="#2563eb" 
                                roughness={0.1} 
                                metalness={0.9} 
                                transparent 
                                opacity={0.6} 
                            />
                        </mesh>

                        {/* Back Room Grid (Horizontal & Vertical) */}
                        <group position={[0, 0, -0.62]} rotation={[0, Math.PI, 0]}>
                            {/* Horizontal Floor Lines */}
                            {[...Array(25)].map((_, j) => (
                                <mesh key={`floor-line-b-${i}-${j}`} position={[0, 0.2 + j * 0.28, 0]}>
                                    <planeGeometry args={[1.5, 0.015]} />
                                    <meshStandardMaterial color="#60a5fa" emissive="#60a5fa" emissiveIntensity={0.2} />
                                </mesh>
                            ))}
                            {/* Vertical Room Dividers */}
                            {[-0.5, -0.25, 0, 0.25, 0.5].map((xOffset, j) => (
                                <mesh key={`room-col-b-${i}-${j}`} position={[xOffset, 3.5, 0]}>
                                    <planeGeometry args={[0.015, 6.8]} />
                                    <meshStandardMaterial color="#60a5fa" emissive="#60a5fa" emissiveIntensity={0.1} />
                                </mesh>
                            ))}
                        </group>

                        {/* White Vertical Side Frames */}
                        {[-0.8, 0.8].map((side, k) => (
                            <mesh key={`side-frame-${i}-${k}`} position={[side, 3.5, 0]} castShadow receiveShadow>
                                <boxGeometry args={[0.1, 7.0, 1.22]} />
                                <meshStandardMaterial color="#ffffff" roughness={0.1} metalness={0.2} emissive="#ffffff" emissiveIntensity={0.05} />
                            </mesh>
                        ))}
                        
                        {/* Top Cap Structure (Glass part before the boat) */}
                        <group position={[0, 6.95, 0]}>
                            <mesh castShadow receiveShadow>
                                <boxGeometry args={[1.7, 0.3, 1.3]} />
                                <meshStandardMaterial color="#ffffff" roughness={0.1} metalness={0.2} />
                            </mesh>
                            {/* Glass wrap around the top */}
                            <mesh position={[0, 0.1, 0.3]}>
                                <boxGeometry args={[1.6, 0.2, 0.8]} />
                                <meshStandardMaterial color="#93c5fd" transparent opacity={0.6} />
                            </mesh>
                        </group>
                    </group>
                );
            })}

            {/* Skypark (Asymmetric Boat: Extended left cantilever, blunt right end) */}
            <group position={[0, 7.5, 0]}>
                {[...Array(segments)].map((_, i) => {
                    const ratio = i / (segments - 1);
                    const angle = boatAngleStart + ratio * (boatAngleEnd - boatAngleStart);
                    const x = Math.sin(angle) * radius;
                    const z = Math.cos(angle) * radius - radius;
                    const segmentWidth = (radius * (boatAngleEnd - boatAngleStart)) / (segments - 1) + 0.04;

                    // Asymmetric tapering: 
                    // ratio 0 to 0.6: tapered cantilever (left side)
                    // ratio 0.6 to 1.0: blunt (right side)
                    let boatDepth = 1.4; // Reduced from 1.8 for smaller width
                    if (ratio < 0.6) {
                        const taperRatio = ratio / 0.6;
                        const taperFactor = Math.sin(taperRatio * Math.PI / 2);
                        boatDepth = 0.3 + 1.1 * Math.pow(taperFactor, 0.5); // Narrower cantilever
                    }
                    
                    const deckDepth = boatDepth - 0.05;
                    const poolDepth = Math.max(0, boatDepth - 0.7); // Adjusted pool depth for narrower width

                    return (
                        <group key={`boat-seg-${i}`} position={[x, 0, z]} rotation={[0, -angle, 0]}>
                            {/* Curved Boat Hull Segment (Rounded Bottom) */}
                            <group position={[0, -0.05, 0]}>
                                {/* Flat top part of hull */}
                                <mesh castShadow receiveShadow position={[0, 0.1, 0]}>
                                    <boxGeometry args={[segmentWidth, 0.1, boatDepth]} />
                                    <meshStandardMaterial color="#cbd5e1" roughness={0.3} metalness={0.7} />
                                </mesh>
                                {/* Rounded bottom part of hull - Lying flat horizontally */}
                                <mesh castShadow receiveShadow rotation={[0, 0, Math.PI / 2]}>
                                    <cylinderGeometry args={[boatDepth / 2, boatDepth / 2, segmentWidth, 20, 1, false, Math.PI, Math.PI]} />
                                    <meshStandardMaterial color="#cbd5e1" roughness={0.3} metalness={0.7} />
                                </mesh>
                            </group>
                            
                            {/* Top Deck Segment (slightly raised and darker) */}
                            <mesh position={[0, 0.15, 0]} castShadow receiveShadow>
                                <boxGeometry args={[segmentWidth, 0.05, deckDepth]} />
                                <meshStandardMaterial color="#475569" roughness={0.6} />
                            </mesh>

                            {/* Infinity Pool Segment (Mostly on the middle and right part) */}
                            {ratio > 0.15 && ratio < 0.95 && (
                                <group position={[0, 0.17, 0.2]}>
                                    <mesh castShadow receiveShadow>
                                        <boxGeometry args={[segmentWidth, 0.02, poolDepth]} />
                                        <meshStandardMaterial 
                                            color="#0ea5e9" 
                                            roughness={0} 
                                            metalness={0.9} 
                                            transparent 
                                            opacity={0.8}
                                            emissive="#0ea5e9"
                                            emissiveIntensity={0.5}
                                        />
                                    </mesh>
                                    {/* Pool Edge/Railing Segment */}
                                    <mesh position={[0, 0.05, poolDepth/2 + 0.01]} castShadow receiveShadow>
                                        <boxGeometry args={[segmentWidth, 0.1, 0.02]} />
                                        <meshStandardMaterial color="#f8fafc" transparent opacity={0.3} />
                                    </mesh>
                                </group>
                            )}

                            {/* Special detail for the blunt end (right side, ratio 1) */}
                            {i === segments - 1 && (
                                <mesh position={[segmentWidth/2, 0.05, 0]} castShadow receiveShadow>
                                    <boxGeometry args={[0.05, 0.2, boatDepth]} />
                                    <meshStandardMaterial color="#cbd5e1" />
                                </mesh>
                            )}
                        </group>
                    );
                })}

                {/* Structural Trusses/Supports connecting towers to skypark */}
                 {towerAngles.map((angle, i) => {
                     const x = Math.sin(angle) * radius;
                     const z = Math.cos(angle) * radius - radius;
                     return (
                         <group key={`truss-group-${i}`} position={[x, -0.4, z]} rotation={[0, -angle, 0]}>
                             {/* Thin vertical/diagonal connectors to bridge the gap */}
                             {[-0.6, -0.2, 0.2, 0.6].map((xOffset, j) => (
                                 <mesh key={`truss-${j}`} position={[xOffset, 0, 0]}>
                                     <boxGeometry args={[0.04, 0.5, 0.8]} />
                                     <meshStandardMaterial color="#cbd5e1" metalness={0.5} roughness={0.2} />
                                 </mesh>
                             ))}
                         </group>
                     );
                 })}
                
                {/* Rounded Cap ONLY at the tapered cantilever end (left side) */}
                {(() => {
                    const angle = boatAngleStart;
                    const x = Math.sin(angle) * radius;
                    const z = Math.cos(angle) * radius - radius;
                    return (
                        <group position={[x, -0.05, z]} rotation={[0, -angle, 0]}>
                             <mesh castShadow receiveShadow rotation={[0, 0, Math.PI / 2]}>
                                <sphereGeometry args={[0.2, 16, 16, 0, Math.PI, Math.PI/2, Math.PI/2]} />
                                <meshStandardMaterial color="#cbd5e1" roughness={0.3} metalness={0.7} />
                            </mesh>
                        </group>
                    );
                })()}

                {/* Observation Deck Structures (placed along arc) */}
                {towerAngles.map((angle, i) => {
                    const x = Math.sin(angle) * radius;
                    const z = Math.cos(angle) * radius - radius;
                    return (
                        <mesh key={`top-struct-${i}`} position={[x, 0.25, z - 0.1]} rotation={[0, -angle, 0]} castShadow receiveShadow>
                            <boxGeometry args={[1.2, 0.2, 0.4]} />
                            <meshStandardMaterial color="#f8fafc" metalness={0.8} roughness={0.2} />
                        </mesh>
                    );
                })}
            </group>
        </group>
    );
};

const Building3D = () => {
    return (
        <div style={{ width: '100%', height: '220px', cursor: 'grab', marginBottom: '0', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <Canvas camera={{ position: [20, 14, 20], fov: 24 }} shadows gl={{ antialias: true, alpha: true }}>
                <ambientLight intensity={0.4} />
                <directionalLight position={[10, 10, 5]} intensity={1.2} castShadow shadow-mapSize={[2048, 2048]} />
                <pointLight position={[-10, 5, -10]} intensity={0.5} color="#ffffff" />

                <MarinaBaySands />

                <ContactShadows position={[0, -2.5, 0]} opacity={0.4} scale={40} blur={2} far={5} color="#0f172a" />

                <OrbitControls
                    makeDefault
                    target={[0, 1, 0]}
                    enableZoom={true}
                    minDistance={10}
                    maxDistance={40}
                    minPolarAngle={Math.PI / 6}
                    maxPolarAngle={Math.PI / 2.2}
                    enablePan={false}
                    autoRotate={true}
                    autoRotateSpeed={1.0}
                />
                <Environment preset="city" />
            </Canvas>
        </div>
    );
};

export default Building3D;