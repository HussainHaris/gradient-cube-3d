import { useState, useRef, useMemo, useEffect } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Environment, RoundedBox } from '@react-three/drei'
import * as THREE from 'three'
import './App.css'

function SubCube({ 
  position, rotation, colorA, colorB, colorC, cornerRadius, size, 
  diffusionType, gradientSharpness, gradientOffset, gradientRotation,
  cubeType // 'gradient', 'opposite', 'glass', 'silver'
}: { 
  position: [number, number, number],
  rotation: [number, number, number], 
  colorA: string, 
  colorB: string, 
  colorC: string,
  cornerRadius: number,
  size: number,
  diffusionType: 'smooth' | 'radial' | 'sharp',
  gradientSharpness: number,
  gradientOffset: number,
  gradientRotation: number,
  cubeType: 'gradient' | 'opposite' | 'glass' | 'silver'
}) {
  const meshRef = useRef<THREE.Mesh>(null)
  const materialRef = useRef<THREE.MeshPhysicalMaterial>(null)
  const shaderRef = useRef<any>(null)
  
  // Calculate opposite colors
  const getOppositeColor = (color: string) => {
    const c = new THREE.Color(color)
    return new THREE.Color(1 - c.r, 1 - c.g, 1 - c.b).getHexString()
  }
  
  const oppositeColorA = `#${getOppositeColor(colorA)}`
  const oppositeColorB = `#${getOppositeColor(colorB)}`
  const oppositeColorC = `#${getOppositeColor(colorC)}`
  
  // Custom shader modification function (for gradient, opposite, and silver cubes)
  const onBeforeCompile = (shader: any) => {
    if (cubeType === 'glass') return // Skip shader modification for glass cubes
    
    shaderRef.current = shader
    
    let finalColorA, finalColorB, finalColorC
    
    if (cubeType === 'silver') {
      // Brighter silver gradient colors
      finalColorA = '#f0f0f0' // Very light silver
      finalColorB = '#c0c0c0' // Medium silver
      finalColorC = '#808080' // Darker silver (but not too dark)
    } else if (cubeType === 'opposite') {
      finalColorA = oppositeColorA
      finalColorB = oppositeColorB
      finalColorC = oppositeColorC
    } else {
      finalColorA = colorA
      finalColorB = colorB
      finalColorC = colorC
    }
    
    // Add custom uniforms
    shader.uniforms.gradientColorA = { value: new THREE.Color(finalColorA) }
    shader.uniforms.gradientColorB = { value: new THREE.Color(finalColorB) }
    shader.uniforms.gradientColorC = { value: new THREE.Color(finalColorC) }
    shader.uniforms.diffusionType = { value: diffusionType === 'smooth' ? 0 : diffusionType === 'radial' ? 1 : 2 }
    shader.uniforms.gradientSharpness = { value: gradientSharpness }
    shader.uniforms.gradientOffset = { value: gradientOffset }
    shader.uniforms.gradientRotation = { value: gradientRotation }
    
    // Add varying to vertex shader
    shader.vertexShader = shader.vertexShader.replace(
      'void main() {',
      `
      varying vec3 vLocalPosition;
      void main() {
        vLocalPosition = position;
      `
    )
    
    // Add uniforms and functions to fragment shader
    shader.fragmentShader = shader.fragmentShader.replace(
      'uniform float roughness;',
      `
      uniform float roughness;
      uniform vec3 gradientColorA;
      uniform vec3 gradientColorB;
      uniform vec3 gradientColorC;
      uniform float diffusionType;
      uniform float gradientSharpness;
      uniform float gradientOffset;
      uniform float gradientRotation;
      varying vec3 vLocalPosition;
      
      vec3 getGradientColor() {
        vec3 gradientColor;
        
        // Determine which face we're on based on the dominant axis
        vec3 absPos = abs(vLocalPosition);
        float maxAxis = max(absPos.x, max(absPos.y, absPos.z));
        vec3 faceId = vec3(0.0);
        
        if (absPos.x == maxAxis) {
          faceId = vec3(1.0, 0.0, vLocalPosition.x > 0.0 ? 1.0 : -1.0);
        } else if (absPos.y == maxAxis) {
          faceId = vec3(0.0, 1.0, vLocalPosition.y > 0.0 ? 1.0 : -1.0);
        } else {
          faceId = vec3(0.0, 0.0, vLocalPosition.z > 0.0 ? 1.0 : -1.0);
        }
        
        // Create unique seeds for each face
        float faceSeed = faceId.x * 2.3 + faceId.y * 5.7 + faceId.z * 8.1;
        float faceVariation = sin(faceSeed) * 0.5 + 0.5;
        
        // Use UV coordinates for per-face gradients
        vec2 faceUV = vec2(0.0);
        if (absPos.x == maxAxis) {
          faceUV = vec2(vLocalPosition.y, vLocalPosition.z) / maxAxis;
        } else if (absPos.y == maxAxis) {
          faceUV = vec2(vLocalPosition.x, vLocalPosition.z) / maxAxis;
        } else {
          faceUV = vec2(vLocalPosition.x, vLocalPosition.y) / maxAxis;
        }
        
        // Apply rotation to UV coordinates
        float s = sin(gradientRotation);
        float c = cos(gradientRotation);
        mat2 rotMat = mat2(c, -s, s, c);
        faceUV = rotMat * faceUV;
        
        // Apply face variation to UV coordinates
        faceUV = faceUV * 0.5 + 0.5;
        faceUV += vec2(faceVariation * 0.3, sin(faceSeed * 1.7) * 0.3);
        
        if (diffusionType < 0.5) {
          float t1 = (faceUV.x + faceUV.y) * 0.5 + gradientOffset + faceVariation * 0.2;
          float t2 = abs(faceUV.x - faceUV.y) + gradientOffset * 0.5 + sin(faceSeed * 2.1) * 0.1;
          
          if (gradientSharpness > 1.0) {
            t1 = pow(max(0.0, t1), gradientSharpness);
            t2 = pow(max(0.0, t2), gradientSharpness * 0.7);
          } else {
            t1 = smoothstep(0.0, 1.0, t1);
            t2 = smoothstep(0.0, 1.0, t2);
          }
          
          gradientColor = mix(gradientColorA, gradientColorB, clamp(t1, 0.0, 1.0));
          gradientColor = mix(gradientColor, gradientColorC, clamp(t2, 0.0, 1.0));
        } else if (diffusionType < 1.5) {
          vec2 center = vec2(0.5) + vec2(sin(faceSeed) * 0.2, cos(faceSeed * 1.3) * 0.2);
          float dist = length(faceUV - center) + gradientOffset + faceVariation * 0.1;
          float angle = atan(faceUV.y - center.y, faceUV.x - center.x) / 6.28318 + 0.5 + faceVariation;
          
          if (gradientSharpness > 1.0) {
            dist = pow(max(0.0, dist), gradientSharpness);
          } else {
            dist = smoothstep(0.0, 1.0, dist);
          }
          
          gradientColor = mix(gradientColorA, gradientColorB, clamp(dist, 0.0, 1.0));
          gradientColor = mix(gradientColor, gradientColorC, clamp(angle, 0.0, 1.0));
        } else {
          float t1 = abs(faceUV.x + gradientOffset + faceVariation * 0.3);
          float t2 = abs(faceUV.y + gradientOffset * 0.5 + sin(faceSeed * 1.9) * 0.2);
          
          float band1 = smoothstep(0.3, 0.3 + 0.1 / gradientSharpness, t1);
          float band2 = smoothstep(0.6, 0.6 + 0.1 / gradientSharpness, t2);
          
          gradientColor = mix(gradientColorA, gradientColorB, band1);
          gradientColor = mix(gradientColor, gradientColorC, band2);
        }
        
        return gradientColor;
      }
      `
    )
    
    // Replace the diffuse color with our gradient
    shader.fragmentShader = shader.fragmentShader.replace(
      'vec4 diffuseColor = vec4( diffuse, opacity );',
      'vec4 diffuseColor = vec4( getGradientColor(), opacity );'
    )
  }
  
  // Update shader uniforms when props change (for gradient, opposite, and silver cubes)
  useEffect(() => {
    if (shaderRef.current && cubeType !== 'glass') {
      let finalColorA, finalColorB, finalColorC
      
      if (cubeType === 'silver') {
        finalColorA = '#f0f0f0'
        finalColorB = '#c0c0c0'
        finalColorC = '#808080'
      } else if (cubeType === 'opposite') {
        finalColorA = oppositeColorA
        finalColorB = oppositeColorB
        finalColorC = oppositeColorC
      } else {
        finalColorA = colorA
        finalColorB = colorB
        finalColorC = colorC
      }
      
      shaderRef.current.uniforms.gradientColorA.value = new THREE.Color(finalColorA)
      shaderRef.current.uniforms.gradientColorB.value = new THREE.Color(finalColorB)
      shaderRef.current.uniforms.gradientColorC.value = new THREE.Color(finalColorC)
      shaderRef.current.uniforms.diffusionType.value = diffusionType === 'smooth' ? 0 : diffusionType === 'radial' ? 1 : 2
      shaderRef.current.uniforms.gradientSharpness.value = gradientSharpness
      shaderRef.current.uniforms.gradientOffset.value = gradientOffset
      shaderRef.current.uniforms.gradientRotation.value = gradientRotation
    }
  }, [colorA, colorB, colorC, diffusionType, gradientSharpness, gradientOffset, gradientRotation, cubeType, oppositeColorA, oppositeColorB, oppositeColorC])

  const subCubeSize = size / 2

  return (
    <RoundedBox 
      ref={meshRef} 
      position={position}
      args={[subCubeSize, subCubeSize, subCubeSize]} 
      radius={cornerRadius * subCubeSize / 2}
      smoothness={4}
      rotation={rotation}
    >
      <meshPhysicalMaterial 
        ref={materialRef}
        metalness={cubeType === 'glass' ? 0.1 : cubeType === 'silver' ? 0.95 : 0.3}
        roughness={cubeType === 'glass' ? 0.05 : cubeType === 'silver' ? 0.01 : 0.1}
        clearcoat={1}
        clearcoatRoughness={0.05}
        envMapIntensity={cubeType === 'glass' ? 3 : cubeType === 'silver' ? 2.5 : 1.5}
        transparent={cubeType === 'glass'}
        opacity={cubeType === 'glass' ? 0.3 : 1}
        onBeforeCompile={cubeType !== 'glass' ? onBeforeCompile : undefined}
      />
    </RoundedBox>
  )
}

function CubeCluster({ 
  rotation, colorA, colorB, colorC, cornerRadius, size, 
  diffusionType, gradientSharpness, gradientOffset, gradientRotation 
}: { 
  rotation: [number, number, number], 
  colorA: string, 
  colorB: string, 
  colorC: string,
  cornerRadius: number,
  size: number,
  diffusionType: 'smooth' | 'radial' | 'sharp',
  gradientSharpness: number,
  gradientOffset: number,
  gradientRotation: number
}) {
  const groupRef = useRef<THREE.Group>(null)
  
  // Define the 8 subcube positions in a 2x2x2 arrangement
  const subCubePositions: [number, number, number][] = [
    [-size/4, -size/4, -size/4], // 0: back-bottom-left
    [size/4, -size/4, -size/4],  // 1: back-bottom-right
    [-size/4, size/4, -size/4],  // 2: back-top-left
    [size/4, size/4, -size/4],   // 3: back-top-right
    [-size/4, -size/4, size/4],  // 4: front-bottom-left
    [size/4, -size/4, size/4],   // 5: front-bottom-right
    [-size/4, size/4, size/4],   // 6: front-top-left
    [size/4, size/4, size/4],    // 7: front-top-right
  ]
  
  // Define cube types: 25% glass, 25% silver, 25% gradient, 25% opposite (non-adjacent)
  const cubeTypes: ('gradient' | 'opposite' | 'glass' | 'silver')[] = [
    'glass',    // 0
    'gradient', // 1
    'opposite', // 2 (non-adjacent to 1)
    'silver',   // 3
    'silver',   // 4
    'glass',    // 5
    'gradient', // 6 (non-adjacent to 2)
    'opposite'  // 7 (non-adjacent to 1 and 2)
  ]

  return (
    <group ref={groupRef} rotation={rotation}>
      {subCubePositions.map((position, index) => (
        <SubCube
          key={index}
          position={position}
          rotation={[0, 0, 0]}
          colorA={colorA}
          colorB={colorB}
          colorC={colorC}
          cornerRadius={cornerRadius}
          size={size}
          diffusionType={diffusionType}
          gradientSharpness={gradientSharpness}
          gradientOffset={gradientOffset}
          gradientRotation={gradientRotation}
          cubeType={cubeTypes[index]}
        />
      ))}
    </group>
  )
}

function GridBackground({ gridSize }: { gridSize: number }) {
  const { viewport, camera } = useThree()
  const gridRef = useRef<THREE.LineSegments>(null)
  
  const gridGeometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry()
    const vertices = []
    
    // Make grid much larger and based on camera distance
    const distance = camera.position.length()
    const scale = Math.max(distance * 0.5, 20) // Minimum size of 20
    const width = viewport.width * scale
    const height = viewport.height * scale
    const halfWidth = width / 2
    const halfHeight = height / 2
    
    // Create more grid lines for infinite appearance
    const step = gridSize
    const numLinesX = Math.ceil(width / step) + 10
    const numLinesY = Math.ceil(height / step) + 10
    
    // Vertical lines
    for (let i = -numLinesX; i <= numLinesX; i++) {
      const x = i * step
      vertices.push(x, -halfHeight, -10)
      vertices.push(x, halfHeight, -10)
    }
    
    // Horizontal lines
    for (let i = -numLinesY; i <= numLinesY; i++) {
      const y = i * step
      vertices.push(-halfWidth, y, -10)
      vertices.push(halfWidth, y, -10)
    }
    
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))
    return geometry
  }, [gridSize, viewport.width, viewport.height, camera.position])
  
  return (
    <lineSegments ref={gridRef} geometry={gridGeometry}>
      <lineBasicMaterial color="#ffffff" transparent opacity={0.5} />
    </lineSegments>
  )
}

function DraggableLight({ position, setPosition, brightness, onDragStart, onDragEnd }: { 
  position: [number, number, number], 
  setPosition: (pos: [number, number, number]) => void,
  brightness: number,
  onDragStart: () => void,
  onDragEnd: () => void
}) {
  const meshRef = useRef<THREE.Mesh>(null)
  const { camera, gl } = useThree()
  const [isFollowing, setIsFollowing] = useState(false)
  const moveHandlerRef = useRef<((e: any) => void) | null>(null)

  const handlePointerDown = (e: any) => {
    e.stopPropagation()
    if (isFollowing) {
      setIsFollowing(false)
      onDragEnd()
      gl.domElement.style.cursor = 'grab'
      if (moveHandlerRef.current) {
        gl.domElement.removeEventListener('pointermove', moveHandlerRef.current)
        moveHandlerRef.current = null
      }
    } else {
      setIsFollowing(true)
      onDragStart()
      gl.domElement.style.cursor = 'grabbing'
      const handleCanvasPointerMove = (e: any) => {
        if (!meshRef.current) return
        
        const rect = gl.domElement.getBoundingClientRect()
        const x = ((e.clientX - rect.left) / rect.width) * 2 - 1
        const y = -((e.clientY - rect.top) / rect.height) * 2 + 1
        
        const vector = new THREE.Vector3(x, y, 0.5)
        vector.unproject(camera)
        
        const dir = vector.sub(camera.position).normalize()
        const distance = 8
        const newPos = camera.position.clone().add(dir.multiplyScalar(distance))
        
        setPosition([newPos.x, newPos.y, 8])
      }
      
      moveHandlerRef.current = handleCanvasPointerMove
      gl.domElement.addEventListener('pointermove', handleCanvasPointerMove)
    }
  }

  useFrame(() => {
    return () => {
      if (moveHandlerRef.current) {
        gl.domElement.removeEventListener('pointermove', moveHandlerRef.current)
      }
    }
  })

  return (
    <>
      <directionalLight position={position} intensity={brightness} castShadow />
      <mesh 
        ref={meshRef}
        position={position} 
        onPointerDown={handlePointerDown}
        renderOrder={1000}
      >
        <sphereGeometry args={[0.5, 32, 32]} />
        <meshBasicMaterial 
          color={isFollowing ? "#ff0000" : "#ffff00"}
          depthTest={false}
          transparent={true}
          opacity={0.9}
        />
      </mesh>
    </>
  )
}

function QuadLights({ brightness }: { brightness: number }) {
  const positions: [number, number, number][] = [
    [-8, 8, 8],
    [8, 8, 8],
    [-8, -8, 8],
    [8, -8, 8]
  ]
  
  return (
    <>
      {positions.map((pos, i) => (
        <directionalLight 
          key={i} 
          position={pos} 
          intensity={brightness * 0.5} 
          castShadow 
        />
      ))}
    </>
  )
}

function DragAreaIndicator({ size }: { size: number }) {
  const circleRadius = (size * Math.sqrt(2)) / 2 + 1
  
  return (
    <mesh position={[0, 0, -1]} renderOrder={-1}>
      <circleGeometry args={[circleRadius, 64]} />
      <meshBasicMaterial 
        color="#ffffff" 
        transparent={true} 
        opacity={0.5}
        side={THREE.DoubleSide}
      />
    </mesh>
  )
}

function Scene({ 
  rotationX, rotationY, colorA, colorB, colorC, cornerRadius, 
  lightPosition, setLightPosition, size, brightness, lightMode, environment,
  diffusionType, gradientSharpness, gradientOffset, gradientRotation,
  gridSize, onLightDragStart, onLightDragEnd
}: {
  rotationX: number,
  rotationY: number,
  colorA: string,
  colorB: string,
  colorC: string,
  cornerRadius: number,
  lightPosition: [number, number, number],
  setLightPosition: (pos: [number, number, number]) => void,
  size: number,
  brightness: number,
  lightMode: 'single' | 'quad',
  environment: string | null,
  diffusionType: 'smooth' | 'radial' | 'sharp',
  gradientSharpness: number,
  gradientOffset: number,
  gradientRotation: number,
  gridSize: number,
  onLightDragStart: () => void,
  onLightDragEnd: () => void
}) {
  return (
    <>
      <GridBackground gridSize={gridSize} />
      <ambientLight intensity={0.3} />
      {lightMode === 'single' ? (
        <DraggableLight 
          position={lightPosition} 
          setPosition={setLightPosition}
          brightness={brightness}
          onDragStart={onLightDragStart}
          onDragEnd={onLightDragEnd}
        />
      ) : (
        <QuadLights brightness={brightness} />
      )}
      <DragAreaIndicator size={size} />
      <CubeCluster 
        rotation={[rotationX, rotationY, 0]} 
        colorA={colorA} 
        colorB={colorB} 
        colorC={colorC}
        cornerRadius={cornerRadius}
        size={size}
        diffusionType={diffusionType}
        gradientSharpness={gradientSharpness}
        gradientOffset={gradientOffset}
        gradientRotation={gradientRotation}
      />
      {environment && <Environment preset={environment as any} />}
    </>
  )
}

function App() {
  const [rotationX, setRotationX] = useState(0)
  const [rotationY, setRotationY] = useState(0)
  const [colorA, setColorA] = useState('#ff6ec7')
  const [colorB, setColorB] = useState('#7ee8fa')
  const [colorC, setColorC] = useState('#eec0ff')
  const [bgColorA, setBgColorA] = useState('#ff6ec7')
  const [bgColorB, setBgColorB] = useState('#7ee8fa')
  const [bgColorC, setBgColorC] = useState('#eec0ff')
  const [lightPosition, setLightPosition] = useState<[number, number, number]>([5, 5, 8])
  const [cornerRadius, setCornerRadius] = useState(0.1)
  const [size, setSize] = useState(6)
  const [brightness, setBrightness] = useState(1.5)
  const [lightMode, setLightMode] = useState<'single' | 'quad'>('single')
  const [environment, setEnvironment] = useState<string | null>('city')
  const [diffusionType, setDiffusionType] = useState<'smooth' | 'radial' | 'sharp'>('smooth')
  const [gradientSharpness, setGradientSharpness] = useState(1)
  const [gradientOffset, setGradientOffset] = useState(0)
  const [gradientRotation, setGradientRotation] = useState(0)
  const [gridSize, setGridSize] = useState(2)
  const [isDragging, setIsDragging] = useState(false)
  const [isLightDragging, setIsLightDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [rotationStart, setRotationStart] = useState({ x: 0, y: 0 })

  // Generate expanding background gradient
  const backgroundStyle = {
    background: `
      radial-gradient(ellipse 150% 150% at top left, ${bgColorA}40 0%, transparent 70%),
      radial-gradient(ellipse 150% 150% at top right, ${bgColorB}40 0%, transparent 70%),
      radial-gradient(ellipse 150% 150% at bottom left, ${bgColorB}40 0%, transparent 70%),
      radial-gradient(ellipse 150% 150% at bottom right, ${bgColorC}40 0%, transparent 70%),
      radial-gradient(ellipse 200% 200% at center, ${bgColorA}15 0%, ${bgColorB}15 40%, ${bgColorC}15 100%),
      linear-gradient(135deg, ${bgColorA}20 0%, ${bgColorB}20 50%, ${bgColorC}20 100%)
    `,
    minHeight: '200vh',
    width: '100%',
    position: 'fixed' as const,
    top: 0,
    left: 0,
    zIndex: -1
  }

  // Enhanced event handlers for both mouse and touch
  const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
    if (isLightDragging) return
    
    const target = e.target as HTMLElement
    if (target.tagName === 'CANVAS') {
      setIsDragging(true)
      
      // Handle both mouse and touch events
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
      
      setDragStart({ x: clientX, y: clientY })
      setRotationStart({ x: rotationY, y: rotationX })
      
      // Prevent default touch behavior
      if ('touches' in e) {
        e.preventDefault()
      }
    }
  }

  const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (isDragging && !isLightDragging) {
      // Handle both mouse and touch events
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
      
      const deltaX = clientX - dragStart.x
      const deltaY = clientY - dragStart.y
      setRotationY(rotationStart.x + deltaX * 0.01)
      setRotationX(rotationStart.y + deltaY * 0.01)
      
      // Prevent default touch behavior
      if ('touches' in e) {
        e.preventDefault()
      }
    }
  }

  const handleEnd = () => {
    setIsDragging(false)
  }

  const environmentOptions = [
    { value: null, label: 'None' },
    { value: 'sunset', label: 'Sunset' },
    { value: 'dawn', label: 'Dawn' },
    { value: 'night', label: 'Night' },
    { value: 'warehouse', label: 'Warehouse' },
    { value: 'forest', label: 'Forest' },
    { value: 'apartment', label: 'Apartment' },
    { value: 'studio', label: 'Studio' },
    { value: 'city', label: 'City' },
    { value: 'park', label: 'Park' },
    { value: 'lobby', label: 'Lobby' }
  ]

  return (
    <>
      <div style={backgroundStyle} />
      <div 
        className="cube-container"
        onMouseDown={handleStart}
        onMouseMove={handleMove}
        onMouseUp={handleEnd}
        onMouseLeave={handleEnd}
        onTouchStart={handleStart}
        onTouchMove={handleMove}
        onTouchEnd={handleEnd}
        style={{ touchAction: 'none' }} // Prevent default touch behaviors
      >
        <Canvas 
          style={{ height: 600, width: 600, cursor: isDragging ? 'grabbing' : 'grab' }} 
          camera={{ position: [0, 0, 15] }}
          shadows
        >
          <Scene 
            rotationX={rotationX}
            rotationY={rotationY}
            colorA={colorA}
            colorB={colorB}
            colorC={colorC}
            cornerRadius={cornerRadius}
            lightPosition={lightPosition}
            setLightPosition={setLightPosition}
            size={size}
            brightness={brightness}
            lightMode={lightMode}
            environment={environment}
            diffusionType={diffusionType}
            gradientSharpness={gradientSharpness}
            gradientOffset={gradientOffset}
            gradientRotation={gradientRotation}
            gridSize={gridSize}
            onLightDragStart={() => setIsLightDragging(true)}
            onLightDragEnd={() => setIsLightDragging(false)}
          />
        </Canvas>
        <div className="controls">
          <div className="sliders">
            <label>
              Cube Size
              <input
                type="range"
                min={2}
                max={10}
                step={0.1}
                value={size}
                onChange={e => setSize(Number(e.target.value))}
              />
            </label>
            <label>
              Corner Radius
              <input
                type="range"
                min={0}
                max={0.5}
                step={0.01}
                value={cornerRadius}
                onChange={e => setCornerRadius(Number(e.target.value))}
              />
            </label>
            <label>
              Grid Size
              <input
                type="range"
                min={0.5}
                max={5}
                step={0.1}
                value={gridSize}
                onChange={e => setGridSize(Number(e.target.value))}
              />
              <span className="value">{gridSize.toFixed(1)}</span>
            </label>
          </div>
          <div className="gradient-controls">
            <label>
              Gradient Sharpness
              <input
                type="range"
                min={0.1}
                max={5}
                step={0.1}
                value={gradientSharpness}
                onChange={e => setGradientSharpness(Number(e.target.value))}
              />
              <span className="value">{gradientSharpness.toFixed(1)}</span>
            </label>
            <label>
              Gradient Offset
              <input
                type="range"
                min={-1}
                max={1}
                step={0.05}
                value={gradientOffset}
                onChange={e => setGradientOffset(Number(e.target.value))}
              />
              <span className="value">{gradientOffset.toFixed(2)}</span>
            </label>
            <label>
              Gradient Rotation
              <input
                type="range"
                min={0}
                max={Math.PI * 2}
                step={0.1}
                value={gradientRotation}
                onChange={e => setGradientRotation(Number(e.target.value))}
              />
              <span className="value">{(gradientRotation * 180 / Math.PI).toFixed(0)}°</span>
            </label>
          </div>
          <div className="light-controls">
            <label>
              Light Mode
              <select value={lightMode} onChange={e => setLightMode(e.target.value as 'single' | 'quad')}>
                <option value="single">Single Light (Draggable)</option>
                <option value="quad">Quad Lights (Fixed)</option>
              </select>
            </label>
            <label>
              Environment
              <select value={environment || ''} onChange={e => setEnvironment(e.target.value || null)}>
                {environmentOptions.map(opt => (
                  <option key={opt.value || 'none'} value={opt.value || ''}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Gradient Diffusion
              <select value={diffusionType} onChange={e => setDiffusionType(e.target.value as 'smooth' | 'radial' | 'sharp')}>
                <option value="smooth">Smooth Linear</option>
                <option value="radial">Radial Burst</option>
                <option value="sharp">Sharp Non-linear</option>
              </select>
            </label>
            <label>
              Light Brightness
              <input
                type="range"
                min={0}
                max={3}
                step={0.1}
                value={brightness}
                onChange={e => setBrightness(Number(e.target.value))}
              />
            </label>
          </div>
          <div className="color-section">
            <h3>Cube Colors</h3>
            <div className="color-pickers">
              <label>
                Color A
                <input type="color" value={colorA} onChange={e => setColorA(e.target.value)} />
              </label>
              <label>
                Color B
                <input type="color" value={colorB} onChange={e => setColorB(e.target.value)} />
              </label>
              <label>
                Color C
                <input type="color" value={colorC} onChange={e => setColorC(e.target.value)} />
              </label>
            </div>
          </div>
          <div className="color-section">
            <h3>Background Colors</h3>
            <div className="color-pickers">
              <label>
                BG Color A
                <input type="color" value={bgColorA} onChange={e => setBgColorA(e.target.value)} />
              </label>
              <label>
                BG Color B
                <input type="color" value={bgColorB} onChange={e => setBgColorB(e.target.value)} />
              </label>
              <label>
                BG Color C
                <input type="color" value={bgColorC} onChange={e => setBgColorC(e.target.value)} />
              </label>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default App
