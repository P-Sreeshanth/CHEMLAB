import React, { useState, useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { 
  OrbitControls, 
  Text,
  Environment,
  useTexture
} from '@react-three/drei';
import { 
  XR, 
  Controllers,
  Hands,
  VRButton,
  useXR 
} from '@react-three/xr';
import * as THREE from 'three'; // Import THREE
import {
  Container,
  Grid,
  Paper,
  Typography,
  Slider,
  Button,
  Box,
  CircularProgress,
  Alert,
  TextField,
  Snackbar,
} from '@mui/material';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { useParams } from 'react-router-dom'; // Import useParams

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const VRGuide = ({ position, text }) => {
  return (
    <group position={position}>
      <Text
        color="white"
        fontSize={0.2}
        maxWidth={1}
        lineHeight={1}
        letterSpacing={0.02}
        textAlign="center"
        font="https://fonts.gstatic.com/s/raleway/v14/1Ptsg8zYS_SKggPNwC4Q4FqL_KWxWMT.woff2"
        anchorX="center"
        anchorY="middle"
      >
        {text}
      </Text>
    </group>
  );
};

// Particle system for reaction effects
const ReactionParticles = ({ activeReaction, progress }) => {
  const particlesRef = useRef();
  const particleCount = 1000;
  
  useEffect(() => {
    if (!particlesRef.current) return;
    
    const particles = particlesRef.current.geometry.attributes.position.array;
    const colors = particlesRef.current.geometry.attributes.color.array;
    
    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      if (activeReaction === 'Hydrogen Peroxide and Potassium Iodide') {
        // Bubbling effect
        particles[i3 + 1] += Math.sin(Date.now() * 0.001 + i) * 0.01;
        colors[i3] = 0.9; // R
        colors[i3 + 1] = 0.9; // G
        colors[i3 + 2] = 1.0; // B
      } else if (activeReaction === 'Copper Sulfate and Ammonia') {
        // Swirling effect
        const angle = Date.now() * 0.0005 + i;
        particles[i3] = Math.cos(angle) * 0.5;
        particles[i3 + 2] = Math.sin(angle) * 0.5;
        colors[i3] = 0.0; // R
        colors[i3 + 1] = 0.5; // G
        colors[i3 + 2] = 1.0; // B
      }
    }
    
    particlesRef.current.geometry.attributes.position.needsUpdate = true;
    particlesRef.current.geometry.attributes.color.needsUpdate = true;
  }, [activeReaction, progress]);

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particleCount}
          array={new Float32Array(particleCount * 3)}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={particleCount}
          array={new Float32Array(particleCount * 3)}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.05}
        vertexColors
        transparent
        opacity={0.6}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};

// Lab environment
const LabEnvironment = () => {
  return (
    <group>
      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]}>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color="#808080" /> {/* Gray floor */}
      </mesh>
      
      {/* Walls */}
      <mesh position={[0, 2, -10]}>
        <planeGeometry args={[20, 8]} />
        <meshStandardMaterial color="#f0f0f0" /> {/* Light gray wall */}
      </mesh>
      
      {/* Ceiling */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 6, 0]}>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color="#ffffff" /> {/* White ceiling */}
      </mesh>
      
      {/* Lab equipment */}
      <mesh position={[-3, -1.5, -3]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#808080" /> {/* Gray equipment */}
      </mesh>
      
      {/* Ambient lighting */}
      <ambientLight intensity={0.5} />
      <pointLight position={[0, 5, 0]} intensity={0.5} />
    </group>
  );
};

const Flask = ({ temperature, progress, selectedChemicals, flaskStage, onVRMix }) => {
  const flaskRef = useRef();
  const liquidRef = useRef();
  const precipitateRef = useRef();
  const foamRef = useRef(); // Ref for the foam mesh
  const { player } = useXR();
  const [isShaking, setIsShaking] = useState(false);
  const shakeRef = useRef(0);
  const lastShakeTime = useRef(0); // To prevent multiple triggers from one shake
  
  const [liquidColor, setLiquidColor] = useState(new THREE.Color('#ffffff'));
  const previousFlaskStage = useRef('empty');
  
  // Determine the active reaction
  const sortedSelectedChemicals = [...selectedChemicals].sort();
  const reactions = {
    'Sodium Thiosulfate and Hydrochloric Acid': ['Hydrochloric Acid', 'Sodium Thiosulfate'].sort(),
    'Copper Sulfate and Ammonia': ['Ammonia', 'Copper Sulfate'].sort(),
    'Silver Nitrate and Sodium Chloride': ['Silver Nitrate', 'Sodium Chloride'].sort(),
    'Iron(III) Chloride and Potassium Thiocyanate': ['Iron(III) Chloride', 'Potassium Thiocyanate'].sort(),
    'Lead(II) Nitrate and Potassium Iodide': ['Lead(II) Nitrate', 'Potassium Iodide'].sort(),
    'Hydrogen Peroxide and Potassium Iodide': ['Hydrogen Peroxide', 'Potassium Iodide'].sort(),
  };

  let activeReaction = null;
  for (const reactionName in reactions) {
    if (JSON.stringify(reactions[reactionName]) === JSON.stringify(sortedSelectedChemicals)) {
      activeReaction = reactionName;
      break;
    }
  }
  
  // Function to get the target color for a given stage and selection
  const getTargetColor = () => {
    if (flaskStage === 'empty') return new THREE.Color('#ffffff');
    
    const chemical1 = chemicals.find(chem => chem.name === selectedChemicals[0]);
    const chemical2 = selectedChemicals.length > 1 ? chemicals.find(chem => chem.name === selectedChemicals[1]) : null;

    if (flaskStage === 'one_chemical') {
      return chemical1 ? new THREE.Color(chemical1.color) : new THREE.Color('#ffffff');
    } else if (flaskStage === 'two_chemicals_selected') {
      if (chemical1 && chemical2) {
        const color1 = new THREE.Color(chemical1.color);
        const color2 = new THREE.Color(chemical2.color);
        // Simple average color blending
        return new THREE.Color().lerpColors(color1, color2, 0.5);
      } else if (chemical1) {
        return new THREE.Color(chemical1.color);
      } else if (chemical2) {
        return new THREE.Color(chemical2.color);
      } else {
        return new THREE.Color('#e0e0e0'); // Light grey placeholder
      }
    } else if (flaskStage === 'reacted') {
       // Return the final reaction color based on activeReaction
      if (activeReaction === 'Sodium Thiosulfate and Hydrochloric Acid') {
        return new THREE.Color('#ff4500'); // Final reddish color
      } else if (activeReaction === 'Copper Sulfate and Ammonia') {
        return new THREE.Color('#00008b'); // Stay deep blue
      } else if (activeReaction === 'Silver Nitrate and Sodium Chloride') {
         return new THREE.Color('#ffffff'); // White precipitate, liquid remains clear
      } else if (activeReaction === 'Iron(III) Chloride and Potassium Thiocyanate') {
        return new THREE.Color('#8b0000'); // dark red (blood-red)
      } else if (activeReaction === 'Lead(II) Nitrate and Potassium Iodide') {
         return new THREE.Color('#ffff00'); // Yellow precipitate, liquid remains clear
      } else if (activeReaction === 'Hydrogen Peroxide and Potassium Iodide') {
         return new THREE.Color('#f0f8ff'); // Off-white/foamy color, liquid remains mostly clear
      } else {
        return new THREE.Color('#ffffff'); // Default clear
      }
    } else if (flaskStage === 'mixing') {
        // Could return a swirling or intermediate color
        if (chemical1 && chemical2) {
          const color1 = new THREE.Color(chemical1.color);
          const color2 = new THREE.Color(chemical2.color);
          // A simple blend, or could add a more complex effect
           return new THREE.Color().lerpColors(color1, color2, 0.5);
        } else {
           return new THREE.Color('#e0e0e0'); // Light grey placeholder
        }
    }
    return new THREE.Color('#ffffff'); // Default clear
  };

  // Smooth color transition using useFrame
  useFrame(() => {
    if (liquidRef.current) {
      const targetColor = getTargetColor();
      // Smoothly interpolate the color
      liquidRef.current.material.color.lerp(targetColor, 0.05); // Interpolate by 5% each frame
    }
  });

  // Calculate liquid level based on reaction progress (assuming consumption)
  const liquidLevel = 2.5; // Keep liquid level constant in instant reaction
  
  // Update precipitate and foam visibility based on stage and reaction
  useEffect(() => {
    if (precipitateRef.current && foamRef.current) {
      if (flaskStage === 'reacted') { // Only show precipitate/foam after reaction
        if (activeReaction === 'Copper Sulfate and Ammonia') {
          // Precipitate forms then dissolves (final state is deep blue solution with no precipitate visible)
          precipitateRef.current.visible = false; // Hide precipitate in final state
          foamRef.current.visible = false; // Hide foam
        } else if (activeReaction === 'Silver Nitrate and Sodium Chloride') {
           precipitateRef.current.visible = true; // Visible in final state
           foamRef.current.visible = false; // Hide foam
           if (precipitateRef.current.visible) {
              const scale = 1; 
              precipitateRef.current.scale.set(scale, scale, scale);
              precipitateRef.current.position.y = (liquidLevel - 1.5);
           }
        } else if (activeReaction === 'Lead(II) Nitrate and Potassium Iodide') {
           precipitateRef.current.visible = true; // Visible in final state
           foamRef.current.visible = false; // Hide foam
           if (precipitateRef.current.visible) {
              const scale = 1;
              precipitateRef.current.scale.set(scale, scale, scale);
              precipitateRef.current.position.y = (liquidLevel - 1.5);
           }
        } else if (activeReaction === 'Hydrogen Peroxide and Potassium Iodide') {
            precipitateRef.current.visible = false; // Hide precipitate
            foamRef.current.visible = true; // Show foam in final state
             if (foamRef.current.visible) {
               const foamHeight = 3; 
               foamRef.current.scale.set(1, foamHeight / 2, 1);
               foamRef.current.position.y = (liquidLevel - 1.5) + foamHeight / 2;
             }
        }
        else {
          // Hide both for reactions without either or initial state
          precipitateRef.current.visible = false;
          foamRef.current.visible = false;
        }
      } else { // Hide precipitate/foam in other stages
         precipitateRef.current.visible = false;
         foamRef.current.visible = false;
      }
    }
     // Also reset precipitate/foam when flask stage changes away from 'reacted'
     if (previousFlaskStage.current === 'reacted' && flaskStage !== 'reacted') {
       if (precipitateRef.current) precipitateRef.current.visible = false;
       if (foamRef.current) foamRef.current.visible = false;
     }
    previousFlaskStage.current = flaskStage;
  }, [flaskStage, activeReaction, liquidLevel]); // Depend on flaskStage and activeReaction

  // Hand gesture detection for mixing
  useEffect(() => {
    if (!player || flaskStage === 'reacted') return; // Don't detect shake if already reacted

    let animationFrameId;
    let lastPosition = null;

    const checkShaking = (timestamp) => {
       if (!player || !player.grip) return; // Ensure player and grip exist

      const currentPosition = new THREE.Vector3().copy(player.grip.position); // Get a copy of the grip position
      if (lastPosition) {
        const movement = currentPosition.distanceTo(lastPosition);
        shakeRef.current += movement; // Accumulate movement

        const now = Date.now();
        // Trigger mix if accumulated movement is high and enough time has passed since last trigger
        if (shakeRef.current > 1.0 && (now - lastShakeTime.current > 2000)) { // Increased threshold and added time check
           console.log('Shaking detected, triggering mix!');
           setIsShaking(true); // Trigger particle effect for a moment
           onVRMix(); // Call the function passed from the parent
           shakeRef.current = 0; // Reset accumulated movement
           lastShakeTime.current = now; // Record trigger time

           setTimeout(() => setIsShaking(false), 1000); // Stop particle effect after 1 second
        }
      }
      lastPosition = currentPosition; // Update last position

      animationFrameId = requestAnimationFrame(checkShaking);
    };

    // Start checking shaking when player/grip is available and flaskStage is not 'reacted'
    if (player && player.grip && flaskStage !== 'reacted') {
       animationFrameId = requestAnimationFrame(checkShaking);
    }

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [player, flaskStage, onVRMix]); // Depend on player, flaskStage, and onVRMix

  const handleGrab = (e) => {
    if (e.target.inputSource) {
      const controller = e.target.inputSource;
      controller.gamepad?.hapticActuators?.[0]?.pulse(0.3, 50);
      
      // Start tracking hand movement for shaking
      const startPosition = controller.grip.position;
      const checkShaking = () => {
        const currentPosition = controller.grip.position;
        const movement = currentPosition.distanceTo(startPosition);
        shakeRef.current = movement;
        
        if (movement > 0.5) {
          setIsShaking(true);
        }
      };
      
      controller.addEventListener('moved', checkShaking);
    }
  };

  const handleRelease = (e) => {
    if (e.target.inputSource) {
      const controller = e.target.inputSource;
      controller.gamepad?.hapticActuators?.[0]?.pulse(0.2, 30); // Very light haptic feedback
      console.log(`Controller released the flask`);
    }
  };

  return (
    <group 
      ref={flaskRef}
      onPointerDown={handleGrab}
      onPointerUp={handleRelease}
    >
      {/* Flask body */}
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[1, 1, 3, 32]} />
        <meshStandardMaterial color="#ffffff" transparent opacity={0.3} />
      </mesh>
      {/* Liquid */}
      <mesh 
        ref={liquidRef} 
        position={[0, liquidLevel - 1.5, 0]}
        onPointerDown={handleGrab}
        onPointerUp={handleRelease}
      >
        <cylinderGeometry args={[0.9, 0.9, 2, 32]} />
        <meshStandardMaterial 
          color={liquidColor} 
          transparent 
          opacity={0.7}
          metalness={0.1}
          roughness={0.2}
        />
      </mesh>
       {/* Precipitate */}
       <mesh ref={precipitateRef} position={[0, liquidLevel - 1.5, 0]} visible={false}>
         <sphereGeometry args={[0.8, 16, 16]} />
         <meshStandardMaterial color={activeReaction === 'Silver Nitrate and Sodium Chloride' ? '#ffffff' : activeReaction === 'Lead(II) Nitrate and Potassium Iodide' ? '#ffff00' : '#add8e6'} roughness={0.8} metalness={0.1} />{/* Set color based on reaction */}
       </mesh>
        {/* Foam (for Hydrogen Peroxide and Potassium Iodide) */}
        <mesh ref={foamRef} position={[0, liquidLevel - 1.5, 0]} visible={false}>
          <cylinderGeometry args={[0.9, 0.9, 0.1, 32]} /> {/* Small initial height */}
          <meshStandardMaterial color={'#f0f8ff'} transparent opacity={0.8} />
        </mesh>
      {/* Flask neck */}
      <mesh position={[0, 1.5, 0]}>
        <cylinderGeometry args={[0.3, 0.3, 0.5, 32]} />
        <meshStandardMaterial color="#ffffff" transparent opacity={0.3} />
      </mesh>
      {isShaking && (
        <ReactionParticles 
          activeReaction={activeReaction} 
          progress={progress} 
        />
      )}
    </group>
  );
};

const chemicals = [
  { name: 'Sodium Thiosulfate', color: '#ffffff' },
  { name: 'Hydrochloric Acid', color: '#ffffff' },
  { name: 'Copper Sulfate', color: '#4682B4' },
  { name: 'Ammonia', color: '#f0f8ff' },
  { name: 'Silver Nitrate', color: '#ffffff' },
  { name: 'Sodium Chloride', color: '#ffffff' },
  { name: 'Iron(III) Chloride', color: '#a0522d' },
  { name: 'Potassium Thiocyanate', color: '#ffffff' },
  { name: 'Lead(II) Nitrate', color: '#ffffff' },
  { name: 'Potassium Iodide', color: '#ffffff' },
  { name: 'Hydrogen Peroxide', color: '#ffffff' },
];

const ChemicalButton = ({ chemical, isSelected, onSelect, position }) => {
  const handleClick = (e) => {
    // Check if the event is from a VR controller or a standard pointer
    if (e.target.inputSource) {
      // VR controller interaction with haptic feedback
      const controller = e.target.inputSource;
      const hand = controller.handedness;
      controller.gamepad?.hapticActuators?.[0]?.pulse(0.5, 100); // Haptic feedback
      console.log(`${hand} controller selected ${chemical.name}`);
    } else {
      // Standard pointer interaction (e.g., mouse click)
      console.log(`Mouse clicked on ${chemical.name}`);
    }
    // Always call onSelect regardless of input method
    onSelect(chemical.name);
  };

  return (
    <group position={position}>
      <mesh onClick={handleClick}>
        <sphereGeometry args={[0.2, 32, 32]} />
        <meshStandardMaterial
          color={isSelected ? '#4CAF50' : chemical.color}
          metalness={0.5}
          roughness={0.2}
        />
      </mesh>
      <Text
        position={[0, -0.3, 0]}
        color="white"
        fontSize={0.1}
        maxWidth={0.5}
        textAlign="center"
        anchorX="center"
        anchorY="middle"
      >
        {chemical.name}
      </Text>
    </group>
  );
};

const VRContent = ({ temperature, progress, selectedChemicals, chemicals, showVRGuides, handleChemicalSelect, flaskStage, onVRMix }) => {
  const { isPresenting } = useXR();

  return (
    <>
      <LabEnvironment />
      <ambientLight intensity={0.7} />
      <pointLight position={[10, 10, 10]} intensity={0.8} />
      <pointLight position={[-10, 10, -10]} intensity={0.5} />
      <Flask temperature={temperature} progress={progress} selectedChemicals={selectedChemicals} flaskStage={flaskStage} onVRMix={onVRMix} />
      {isPresenting ? (
        <>
          <Controllers />
          <Hands />
          {chemicals.map((chemical, index) => (
            <ChemicalButton
              key={chemical.name}
              chemical={chemical}
              isSelected={selectedChemicals.includes(chemical.name)}
              onSelect={handleChemicalSelect}
              position={[
                Math.cos(index * Math.PI / 6) * 2,
                Math.sin(index * Math.PI / 6) * 2,
                -2
              ]}
            />
          ))}
          {showVRGuides && (
            <>
              <VRGuide position={[0, 2, -2]} text="Grab the flask to mix chemicals" />
              <VRGuide position={[0, -2, -2]} text="Select chemicals to start reaction" />
              <VRGuide position={[2, 0, -2]} text="Shake the flask to mix" />
            </>
          )}
        </>
      ) : (
        <OrbitControls />
      )}
    </>
  );
};

const ExperimentSimulator = () => {
  const { experimentId } = useParams(); // Get experimentId from URL
  const [temperature, setTemperature] = useState(25);
  const [reactionTime, setReactionTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showInstructions, setShowInstructions] = useState(true);
  const [selectedChemicals, setSelectedChemicals] = useState([]);
  const [data, setData] = useState({
    labels: [],
    datasets: [
      {
        label: 'Reaction Rate',
        data: [],
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1,
      },
    ],
  });
  const [isVRMode, setIsVRMode] = useState(false);
  const [showVRGuides, setShowVRGuides] = useState(true);
  const [flaskStage, setFlaskStage] = useState('empty'); // 'empty', 'one_chemical', 'two_chemicals_selected', 'mixing', 'reacted'
  const [reactionEquation, setReactionEquation] = useState('');
  const [reactionObservation, setReactionObservation] = useState('');
  const [studentName, setStudentName] = useState('');
  const [submissionSuccess, setSubmissionSuccess] = useState(null);
  const [submissionError, setSubmissionError] = useState(null);

  const calculateReactionTime = (temp) => {
    // Using Arrhenius equation approximation (simplified for demo)
    // Actual kinetics would be more complex and reaction-specific
    const k = Math.exp(-5000 / (temp + 273.15));
    return 1 / k;
  };

  const handleTemperatureChange = (event, newValue) => {
    setTemperature(newValue);
  };

  const handleChemicalSelect = (chemicalName) => {
    setSelectedChemicals(prevSelected => {
      const newSelected = prevSelected.includes(chemicalName)
        ? prevSelected.filter(name => name !== chemicalName)
        : [...prevSelected, chemicalName];
      
      // Update flask stage based on number of selected chemicals
      if (newSelected.length === 0) {
        setFlaskStage('empty');
      } else if (newSelected.length === 1) {
        setFlaskStage('one_chemical');
      } else if (newSelected.length === 2) {
        setFlaskStage('two_chemicals_selected');
      } else {
        setFlaskStage('empty'); // Reset if more than 2 selected (should be prevented by button disable)
      }

      // Reset reaction details when chemicals are changed
      setReactionEquation('');
      setReactionObservation('');

      return newSelected;
    });
  };

  // Handle drop event
  const handleDrop = (e) => {
    e.preventDefault();
    const chemicalName = e.dataTransfer.getData('chemicalName');
    if (chemicalName && selectedChemicals.length < 2) { // Limit to 2 chemicals for now
      handleChemicalSelect(chemicalName);
    }
  };

  // Prevent default for drag over to allow dropping
  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const startExperiment = () => {
    // Only start if two chemicals are selected and not already running/reacted
    if (selectedChemicals.length !== 2 || isRunning || flaskStage === 'reacted') {
      if (selectedChemicals.length !== 2) alert('Please select exactly two chemicals to mix.');
      return; // Prevent starting if conditions not met
    }

    // Sort the selected chemicals to easily compare combinations
    const sortedSelectedChemicals = [...selectedChemicals].sort();

    // Define possible reactions and their required chemicals (sorted)
    const reactions = {
      'Sodium Thiosulfate and Hydrochloric Acid': ['Hydrochloric Acid', 'Sodium Thiosulfate'].sort(),
      'Copper Sulfate and Ammonia': ['Ammonia', 'Copper Sulfate'].sort(),
      'Silver Nitrate and Sodium Chloride': ['Silver Nitrate', 'Sodium Chloride'].sort(),
      'Iron(III) Chloride and Potassium Thiocyanate': ['Iron(III) Chloride', 'Potassium Thiocyanate'].sort(),
      'Lead(II) Nitrate and Potassium Iodide': ['Lead(II) Nitrate', 'Potassium Iodide'].sort(),
      'Hydrogen Peroxide and Potassium Iodide': ['Hydrogen Peroxide', 'Potassium Iodide'].sort(),
      // Add more reactions here
    };

    let recognizedReaction = null;
    for (const reactionName in reactions) {
      if (JSON.stringify(reactions[reactionName]) === JSON.stringify(sortedSelectedChemicals)) {
        recognizedReaction = reactionName;
        break;
      }
    }

    if (recognizedReaction) {
      setIsRunning(true);
      setProgress(0);
      setReactionTime(0);
      setShowInstructions(false);
      setFlaskStage('mixing');
      setData({
        labels: [],
        datasets: [
          {
            label: 'Reaction Data',
            data: [],
            borderColor: 'rgb(75, 192, 192)',
            tension: 0.1,
          },
        ],
      });

      const reactionDetails = {
        'Sodium Thiosulfate and Hydrochloric Acid': {
          equation: 'Na2S2O3(aq) + 2 HCl(aq) → 2 NaCl(aq) + SO2(g) + S(s) + H2O(l)',
          observation: 'A cloudy white precipitate of sulfur forms, and sulfur dioxide gas is produced (pungent smell).',
        },
        'Copper Sulfate and Ammonia': {
          equation: 'CuSO4(aq) + 2 NH3(aq) + 2 H2O(l) → Cu(OH)2(s) + (NH4)2SO4(aq)  followed by  Cu(OH)2(s) + 4 NH3(aq) → [Cu(NH3)4(H2O)2]SO4(aq)',
          observation: 'A pale blue precipitate forms, which then dissolves in excess ammonia to form a deep blue solution.',
        },
        'Silver Nitrate and Sodium Chloride': {
          equation: 'AgNO3(aq) + NaCl(aq) → AgCl(s) + NaNO3(aq)',
          observation: 'A white, curdy precipitate of silver chloride forms.',
        },
        'Iron(III) Chloride and Potassium Thiocyanate': {
          equation: 'FeCl3(aq) + 3 KSCN(aq) → Fe(SCN)3(aq) + 3 KCl(aq)',
          observation: 'The solution turns blood-red due to the formation of iron(III) thiocyanate.',
        },
        'Lead(II) Nitrate and Potassium Iodide': {
          equation: 'Pb(NO3)2(aq) + 2 KI(aq) → PbI2(s) + 2 KNO3(aq)',
          observation: 'A bright yellow precipitate of lead(II) iodide forms.',
        },
        'Hydrogen Peroxide and Potassium Iodide': {
          equation: '2 H2O2(aq) + 2 KI(aq) → I2(aq) + 2 KOH(aq) + O2(g)', // Simplified, catalytic decomposition
          observation: 'Rapid effervescence (bubbling) due to oxygen gas production, and the solution may turn slightly brown from iodine.',
        },
      };

      setTimeout(() => {
        setProgress(100);
        setIsRunning(false);
        setFlaskStage('reacted');

        const details = reactionDetails[recognizedReaction];
        if (details) {
          setReactionEquation(details.equation);
          setReactionObservation(details.observation);
        }

        setData(prev => ({
            labels: ['Start', 'End'],
            datasets: [
              {
                ...prev.datasets[0],
                data: [0, 100],
                label: recognizedReaction
              },
            ],
          }));
      }, 1500);

    } else {
      alert('Selected chemicals do not match a known reaction or combination.');
      setIsRunning(false);
      setProgress(0);
      setReactionTime(0);
      setFlaskStage('empty');
      setReactionEquation('');
      setReactionObservation('');
      setData({
        labels: [],
        datasets: [
          {
            label: 'Reaction Rate',
            data: [],
            borderColor: 'rgb(75, 192, 192)',
            tension: 0.1,
          },
        ],
      });
    }
  };

  useEffect(() => {

  }, [selectedChemicals, temperature]);

  const handleSubmitSubmission = async () => {
    if (!studentName) {
      setSubmissionError('Please enter your name before submitting.');
      return;
    }
    if (selectedChemicals.length < 2 || !reactionEquation) {
         setSubmissionError('Please perform the experiment before submitting.');
         return;
    }

    // Use the experimentId from the URL
    const submissionExperimentId = experimentId; // Use the experimentId from useParams

    const submissionData = {
      experimentId: submissionExperimentId, // Use the obtained ID
      studentName: studentName,
      submissionDate: new Date().toISOString().split('T')[0],
      status: 'Pending Evaluation',
      totalMarks: null,
      evaluation: {}, 
      overallFeedback: '', 
      simulatedResults: {
          finalFlaskStage: flaskStage,
          finalProgress: progress,
          temperature: temperature,
          chemicalsUsed: selectedChemicals,
          reactionEquation: reactionEquation,
          reactionObservation: reactionObservation,
      }
    };

    try {
      const response = await fetch('http://localhost:5000/api/submissions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submissionData),
      });

      if (!response.ok) {
        throw new Error('Failed to submit experiment');
      }

      const result = await response.json();
      console.log('Submission successful:', result);
      setSubmissionSuccess('Experiment submitted successfully!');
    } catch (error) {
      console.error('Submission error:', error);
      setSubmissionError('Error submitting experiment: ' + error.message);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Snackbar open={!!submissionError} autoHideDuration={6000} onClose={() => setSubmissionError(null)}>
        <Alert severity="error" onClose={() => setSubmissionError(null)}>{submissionError}</Alert>
      </Snackbar>
      <Snackbar open={!!submissionSuccess} autoHideDuration={6000} onClose={() => setSubmissionSuccess(null)}>
        <Alert severity="success" onClose={() => setSubmissionSuccess(null)}>{submissionSuccess}</Alert>
      </Snackbar>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '500px' }} onDrop={handleDrop} onDragOver={handleDragOver}>
            <Canvas camera={{ position: [0, 0, 5] }}>
              <XR>
                <VRContent
                  temperature={temperature}
                  progress={progress}
                  selectedChemicals={selectedChemicals}
                  chemicals={chemicals}
                  showVRGuides={showVRGuides}
                  handleChemicalSelect={handleChemicalSelect}
                  flaskStage={flaskStage}
                  onVRMix={startExperiment}
                />
              </XR>
            </Canvas>
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center', gap: 2 }}>
              <Button
                variant="contained"
                color="secondary"
                onClick={() => setIsVRMode(!isVRMode)}
              >
                {isVRMode ? 'Exit VR' : 'Enter VR'}
              </Button>
              {isVRMode && (
                <>
                  <VRButton />
                  <Button
                    variant="outlined"
                    color="primary"
                    onClick={() => setShowVRGuides(!showVRGuides)}
                  >
                    {showVRGuides ? 'Hide Guides' : 'Show Guides'}
                  </Button>
                </>
              )}
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Temperature Control
            </Typography>
            <Slider
              value={temperature}
              onChange={handleTemperatureChange}
              min={20}
              max={60}
              step={1}
              marks
              valueLabelDisplay="auto"
              disabled={isRunning}
            />
            <Typography variant="body1" gutterBottom>
              Current Temperature: {temperature}°C
            </Typography>
            
            {/* Chemical Selection */}
            <Box sx={{ mt: 3 }}>
              <Typography variant="h6" gutterBottom>
                {isVRMode ? 'VR Chemical Selection' : 'Drag Chemicals to Flask'}
              </Typography>
              {!isVRMode && (
                <Box>
                  {chemicals.map((chemical) => (
                    <Button
                      key={chemical.name}
                      draggable="true"
                      onDragStart={(e) => e.dataTransfer.setData('chemicalName', chemical.name)}
                      variant={selectedChemicals.includes(chemical.name) ? 'contained' : 'outlined'}
                      sx={{ mr: 1, mb: 1 }}
                    >
                      {chemical.name}
                    </Button>
                  ))}
                </Box>
              )}
              {/* Display Selected Chemicals */}
              {selectedChemicals.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body1">
                    Selected: {selectedChemicals.join(', ')}
                  </Typography>
                </Box>
              )}
            </Box>

            <Box sx={{ mt: 2 }}>
              <Button
                variant="contained"
                color="primary"
                onClick={startExperiment}
                disabled={isRunning || selectedChemicals.length === 0 || selectedChemicals.length > 2} // Disable if no chemicals or more than 2 are selected
              >
                Mix Selected
              </Button>
            </Box>
            
            {/* Display Reaction Details */}
            {reactionEquation && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="h6">Reaction:</Typography>
                <Typography variant="body1">{reactionEquation}</Typography>
              </Box>
            )}
            {reactionObservation && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="h6">Observation:</Typography>
                <Typography variant="body1">{reactionObservation}</Typography>
              </Box>
            )}

            <Typography variant="h6" sx={{ mt: 3 }} gutterBottom>
              Reaction Data
            </Typography>
            <Line data={data} />

            <Box sx={{ mt: 2 }}>
               <TextField
                  label="Student Name"
                  fullWidth
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  sx={{ mb: 2 }}
                />
              <Button
                variant="contained"
                color="primary"
                fullWidth
                onClick={handleSubmitSubmission}
                disabled={!studentName || !reactionEquation} // Disable if no name or reaction not complete
              >
                Submit Experiment
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default ExperimentSimulator; 