"use client"

import { cn } from "@/lib/utils"
import { OrbitControls, useGLTF } from "@react-three/drei"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { Loader2 } from "lucide-react"
import { Suspense, useEffect, useMemo, useRef, useState, type ComponentRef } from "react"
import * as THREE from "three"
import { clone as cloneSkinnedScene } from "three/examples/jsm/utils/SkeletonUtils.js"

type OrbitControlsRef = ComponentRef<typeof OrbitControls>

type BodyModel = "Hombre" | "Mujer"

const MODEL_URL: Record<BodyModel, string> = {
  Hombre: "/modelos3d/Hombre.glb",
  Mujer: "/modelos3d/Mujer.glb",
}

/**
 * Tamaño visual del modelo en pantalla.
 * Menor = más pequeño · mayor = más grande (prueba 0.35–0.70).
 */
const MODEL_VIEW_SCALE = 1.5

/** Altura del pivote dentro del cuerpo (0 = pies, 1 = cabeza). 0.52 ≈ torso/pecho. */
const PIVOT_HEIGHT_RATIO = 0.52

/** Distancia frontal de la cámara al pivote (torso en el origen). */
const CAMERA_DISTANCE = 2.85

const INITIAL_CAMERA_POSITION = new THREE.Vector3(0, 0.08, CAMERA_DISTANCE)
const INITIAL_CAMERA_TARGET = new THREE.Vector3(0, 0, 0)
const RESET_IDLE_MS = 900
const RESET_LERP = 0.1

const hotspotsHombre: Array<{ label: string; className: string }> = [
  { label: "Pecho", className: "left-[50%] top-[35%]" },
  { label: "Muslo", className: "left-[53%] top-[70%]" },
  { label: "Brazo", className: "left-[60%] top-[37%]" },
  { label: "Cadera", className: "left-[55%] top-[58%]" },
  { label: "Cintura", className: "left-[55%] top-[52%]" },
  { label: "Pantorrilla", className: "left-[47%] top-[82%]" },
]

const hotspotsMujer: Array<{ label: string; className: string }> = [
  { label: "Pecho", className: "left-[50%] top-[44%]" },
  { label: "Muslo", className: "left-[53%] top-[74%]" },
  { label: "Brazo", className: "left-[60%] top-[37%]" },
  { label: "Cadera", className: "left-[53%] top-[58%]" },
  { label: "Cintura", className: "left-[50%] top-[52%]" },
  { label: "Pantorrilla", className: "left-[47%] top-[85%]" },
]

function getHotspotsForModel(model: BodyModel) {
  switch (model) {
    case "Mujer":
      return hotspotsMujer
    case "Hombre":
    default:
      return hotspotsHombre
  }
}

function prepareMaterials(object: THREE.Object3D) {
  object.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      const mesh = child as THREE.Mesh
      const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
      materials.forEach((mat) => {
        if (!mat) return
        mat.side = THREE.DoubleSide
        if (mat instanceof THREE.MeshStandardMaterial) {
          mat.roughness = Math.min(mat.roughness, 0.55)
          mat.metalness = Math.min(mat.metalness, 0.1)
        }
      })
    }
  })
}

/**
 * Crea un grupo pivote en (0,0,0) — la órbita gira alrededor del torso, no de los pies.
 */
function buildPivotedModel(source: THREE.Object3D, clips: THREE.AnimationClip[]) {
  const pivot = new THREE.Group()
  const model = cloneSkinnedScene(source)
  prepareMaterials(model)
  pivot.add(model)

  model.updateMatrixWorld(true)

  let box = new THREE.Box3().setFromObject(model)
  const size = box.getSize(new THREE.Vector3())
  const maxDim = Math.max(size.x, size.y, size.z)

  if (maxDim > 0) {
    const scale = MODEL_VIEW_SCALE / maxDim
    model.scale.setScalar(scale)
  }

  model.updateMatrixWorld(true)
  box = new THREE.Box3().setFromObject(model)
  const fittedSize = box.getSize(new THREE.Vector3())

  const centerX = (box.min.x + box.max.x) / 2
  const centerZ = (box.min.z + box.max.z) / 2
  const pivotY = box.min.y + fittedSize.y * PIVOT_HEIGHT_RATIO

  model.position.set(-centerX, -pivotY, -centerZ)

  const mixer = new THREE.AnimationMixer(model)
  return { pivot, mixer, clips }
}

function GlbModel({
  url,
  onAnimationActiveChange,
}: {
  url: string
  onAnimationActiveChange?: (active: boolean) => void
}) {
  const { scene, animations } = useGLTF(url)
  const { pivot, mixer, clips } = useMemo(
    () => buildPivotedModel(scene, animations),
    [scene, animations],
  )

  useEffect(() => {
    if (clips.length === 0) {
      onAnimationActiveChange?.(false)
      return
    }

    onAnimationActiveChange?.(true)

    const action = mixer.clipAction(clips[0])
    action.reset()
    action.setLoop(THREE.LoopRepeat, Infinity)
    action.play()

    return () => {
      action.stop()
      mixer.stopAllAction()
      onAnimationActiveChange?.(false)
    }
  }, [clips, mixer, onAnimationActiveChange])

  useFrame((_, delta) => {
    mixer.update(delta)
  })

  return <primitive object={pivot} />
}

function ResettingOrbitControls({
  onInteractionStart,
  onViewRestored,
}: {
  onInteractionStart?: () => void
  onViewRestored?: () => void
}) {
  const controlsRef = useRef<OrbitControlsRef>(null)
  const { camera } = useThree()
  const isResetting = useRef(false)
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const onViewRestoredRef = useRef(onViewRestored)

  useEffect(() => {
    onViewRestoredRef.current = onViewRestored
  }, [onViewRestored])

  const clearIdleTimer = () => {
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current)
      idleTimerRef.current = null
    }
  }

  const scheduleReset = () => {
    clearIdleTimer()
    idleTimerRef.current = setTimeout(() => {
      isResetting.current = true
    }, RESET_IDLE_MS)
  }

  useEffect(() => clearIdleTimer, [])

  useFrame(() => {
    if (!isResetting.current || !controlsRef.current) return

    camera.position.lerp(INITIAL_CAMERA_POSITION, RESET_LERP)
    controlsRef.current.target.lerp(INITIAL_CAMERA_TARGET, RESET_LERP)
    controlsRef.current.update()

    const cameraReady = camera.position.distanceTo(INITIAL_CAMERA_POSITION) < 0.01
    const targetReady = controlsRef.current.target.distanceTo(INITIAL_CAMERA_TARGET) < 0.01

    if (cameraReady && targetReady) {
      camera.position.copy(INITIAL_CAMERA_POSITION)
      controlsRef.current.target.copy(INITIAL_CAMERA_TARGET)
      controlsRef.current.update()
      isResetting.current = false
      onViewRestoredRef.current?.()
    }
  })

  return (
    <OrbitControls
      ref={controlsRef}
      enablePan={false}
      enableDamping
      dampingFactor={0.08}
      minDistance={1.8}
      maxDistance={4.5}
      target={INITIAL_CAMERA_TARGET}
      minPolarAngle={Math.PI / 6}
      maxPolarAngle={Math.PI / 1.65}
      onStart={() => {
        isResetting.current = false
        clearIdleTimer()
        onInteractionStart?.()
      }}
      onEnd={scheduleReset}
    />
  )
}

function ModelScene({
  model,
  onInteractionStart,
  onViewRestored,
  onAnimationActiveChange,
}: {
  model: BodyModel
  onInteractionStart?: () => void
  onViewRestored?: () => void
  onAnimationActiveChange?: (active: boolean) => void
}) {
  return (
    <Canvas
      camera={{ position: [0, 0.08, CAMERA_DISTANCE], fov: 36 }}
      className="relative z-0 h-full w-full touch-none"
      style={{ width: "100%", height: "100%" }}
    >
      <color attach="background" args={["#f4f4f5"]} />
      <hemisphereLight args={["#ffffff", "#d4d4d8", 0.9]} />
      <ambientLight intensity={0.35} />
      <directionalLight position={[0, 0.5, 4.8]} intensity={1.85} />
      <directionalLight position={[2.8, 1.2, 2.5]} intensity={0.45} />
      <directionalLight position={[-2.8, 1.2, 2.5]} intensity={0.45} />
      <directionalLight position={[0, 3.5, 1.5]} intensity={0.3} />
      <GlbModel url={MODEL_URL[model]} onAnimationActiveChange={onAnimationActiveChange} />
      <ResettingOrbitControls
        onInteractionStart={onInteractionStart}
        onViewRestored={onViewRestored}
      />
    </Canvas>
  )
}

Object.values(MODEL_URL).forEach((url) => useGLTF.preload(url))

export function BodyModelViewer({
  model = "Hombre",
  className,
}: {
  model?: BodyModel
  className?: string
}) {
  const [isUserInteracting, setIsUserInteracting] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const showHotspots = !isUserInteracting && !isAnimating
  const hotspots = getHotspotsForModel(model)

  return (
    <div
      className={cn(
        "relative flex h-full min-h-[480px] flex-col overflow-hidden rounded-xl border bg-gradient-to-b from-zinc-50 to-zinc-100 dark:from-zinc-900 dark:to-zinc-950",
        className,
      )}
    >
      <div className="relative min-h-0 flex-1">
        <div className="absolute inset-0 z-0">
          <Suspense
            fallback={
              <div className="flex h-full items-center justify-center text-muted-foreground">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            }
          >
            <ModelScene
              model={model}
              onInteractionStart={() => setIsUserInteracting(true)}
              onViewRestored={() => setIsUserInteracting(false)}
              onAnimationActiveChange={setIsAnimating}
            />
          </Suspense>
        </div>

        <div
          className={cn(
            "pointer-events-none absolute inset-0 bottom-10 z-10 transition-opacity duration-300",
            showHotspots ? "opacity-100" : "opacity-0",
          )}
          aria-hidden={!showHotspots}
        >
          {hotspots.map((spot) => (
            <div
              key={spot.label}
              className={cn("absolute flex items-center gap-1.5", spot.className)}
            >
              <span className="h-2 w-2 rounded-full bg-sky-500 ring-2 ring-white shadow" />
              <span className="rounded-md bg-white/90 px-2 py-0.5 text-[10px] font-medium shadow-sm dark:bg-zinc-800/90">
                {spot.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="relative z-20 flex shrink-0 justify-center gap-4 border-t border-white/40 bg-white/60 px-3 py-2 text-[11px] font-medium text-muted-foreground backdrop-blur dark:bg-zinc-900/60">
        <span>Peso</span>
        <span>% Grasa</span>
        <span>Cintura</span>
      </div>
    </div>
  )
}
