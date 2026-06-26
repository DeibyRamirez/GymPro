"use client"

import { OrbitControls } from "@react-three/drei"
import { Canvas, useFrame, useLoader } from "@react-three/fiber"
import { Loader2 } from "lucide-react"
import { Suspense, useEffect, useMemo } from "react"
import * as THREE from "three"
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js"

type BodyModel = "Hombre" | "Mujer"

/**
 * Tamaño visual del modelo en pantalla.
 * Menor = más pequeño · mayor = más grande (prueba 0.35–0.70).
 */
const MODEL_VIEW_SCALE = 0.48

/** Altura del pivote dentro del cuerpo (0 = pies, 1 = cabeza). 0.52 ≈ torso/pecho. */
const PIVOT_HEIGHT_RATIO = 0.52

/** Gira el modelo 180° en Y para que mire hacia la cámara (FBX/Mixamo suele venir invertido). */
const MODEL_ROTATION_Y = Math.PI

/** Altura Y de la cámara — nivel del torso (no por debajo del modelo). */
const CAMERA_HEIGHT = 0.95

/** Altura Y del punto de mira (pecho / pivote del modelo). */
const CAMERA_LOOK_AT_Y = 0.88

/** Distancia frontal de la cámara al modelo. */
const CAMERA_DISTANCE = 2.95


function prepareMaterials(object: THREE.Object3D) {
  object.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      const mesh = child as THREE.Mesh
      mesh.castShadow = true
      mesh.receiveShadow = true
      const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
      materials.forEach((mat) => {
        if (mat) mat.side = THREE.FrontSide
      })
    }
  })
}

/**
 * Crea un grupo pivote en (0,0,0) — la órbita gira alrededor del torso, no de los pies.
 */
function buildPivotedModel(source: THREE.Group) {
  const pivot = new THREE.Group()
  const model = source.clone(true)

  model.rotation.y = MODEL_ROTATION_Y
  prepareMaterials(model)
  pivot.add(model)

  model.updateMatrixWorld(true)

  let box = new THREE.Box3().setFromObject(model)
  const size = box.getSize(new THREE.Vector3())
  const maxDim = Math.max(size.x, size.y, size.z)

  if (maxDim > 0) {
    // Escala del modelo — ajusta MODEL_VIEW_SCALE si se ve grande o pequeño.
    const scale = MODEL_VIEW_SCALE / maxDim
    model.scale.setScalar(scale)
  }

  model.updateMatrixWorld(true)
  box = new THREE.Box3().setFromObject(model)
  const fittedSize = box.getSize(new THREE.Vector3())

  const centerX = (box.min.x + box.max.x) / 2
  const centerZ = (box.min.z + box.max.z) / 2
  const pivotY = box.min.y + fittedSize.y * PIVOT_HEIGHT_RATIO

  // Desplaza el mesh para que el pivote (torso) quede en el origen del grupo.
  model.position.set(-centerX, -pivotY, -centerZ)

  const mixer = new THREE.AnimationMixer(model)
  return { pivot, mixer, clips: source.animations ?? [] }
}

function FbxModel({ url }: { url: string }) {
  const fbx = useLoader(FBXLoader, url)

  const { pivot, mixer, clips } = useMemo(() => buildPivotedModel(fbx), [fbx])

  useEffect(() => {
    if (clips.length === 0) return

    const action = mixer.clipAction(clips[0])
    action.reset()
    action.setLoop(THREE.LoopRepeat, Infinity)
    action.play()

    return () => {
      action.stop()
      mixer.stopAllAction()
    }
  }, [clips, mixer])

  useFrame((_, delta) => {
    mixer.update(delta)
  })

  return <primitive object={pivot} />
}

function ModelScene({ model }: { model: BodyModel }) {
  return (
    <Canvas
      camera={{ position: [0, CAMERA_HEIGHT, CAMERA_DISTANCE], fov: 36 }}
      className="touch-none"
    >
      <color attach="background" args={["#f4f4f5"]} />
      <ambientLight intensity={0.95} />
      <directionalLight position={[3, 5, 2]} intensity={1.15} />
      <directionalLight position={[-2, 2, -1]} intensity={0.4} />
      <Suspense fallback={null}>
        <FbxModel url={`/modelos3d/${model}.fbx`} />
      </Suspense>
      <OrbitControls
        enablePan={false}
        minDistance={1.8}
        maxDistance={4.5}
        target={[0, CAMERA_LOOK_AT_Y, 0]}
        minPolarAngle={Math.PI / 6}
        maxPolarAngle={Math.PI / 1.65}
      />
    </Canvas>
  )
}

const hotspots: Array<{ label: string; className: string }> = [
  { label: "Hombro", className: "left-[30%] top-[28%]" },
  { label: "Rodilla", className: "left-[48%] top-[56%]" },
]

export function BodyModelViewer({ model = "Hombre" }: { model?: BodyModel }) {
  return (
    <div className="relative flex h-full min-h-[360px] flex-col overflow-hidden rounded-xl border bg-gradient-to-b from-zinc-50 to-zinc-100 dark:from-zinc-900 dark:to-zinc-950">
      <div className="absolute inset-0 pb-8">
        <Suspense
          fallback={
            <div className="flex h-full items-center justify-center text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          }
        >
          <ModelScene model={model} />
        </Suspense>
      </div>

      {hotspots.map((spot) => (
        <div
          key={spot.label}
          className={`pointer-events-none absolute ${spot.className} flex items-center gap-1.5`}
        >
          <span className="h-2 w-2 rounded-full bg-sky-500 ring-2 ring-white shadow" />
          <span className="rounded-md bg-white/90 px-2 py-0.5 text-[10px] font-medium shadow-sm dark:bg-zinc-800/90">
            {spot.label}
          </span>
        </div>
      ))}

      <div className="relative z-10 mt-auto flex justify-center gap-4 border-t border-white/40 bg-white/60 px-3 py-2 text-[11px] font-medium text-muted-foreground backdrop-blur dark:bg-zinc-900/60">
        <span>Peso</span>
        <span>% Grasa</span>
        <span>Cintura</span>
      </div>
    </div>
  )
}
