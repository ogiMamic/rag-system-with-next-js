'use client'

import { useEffect, useRef } from 'react'
import { useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import gsap from 'gsap'
import * as THREE from 'three'
import type { PersonPosition } from '@/lib/family-tree/types'

type OrbitControlsImpl = React.ComponentRef<typeof OrbitControls>

type Props = {
  focusPosition: PersonPosition | null
  autoRotate: boolean
}

export function CameraRig({ focusPosition, autoRotate }: Props) {
  const { camera } = useThree()
  const controlsRef = useRef<OrbitControlsImpl>(null)

  // Fly-to when focus changes
  useEffect(() => {
    if (!focusPosition) return
    const target = new THREE.Vector3(focusPosition.x, focusPosition.y, focusPosition.z)
    const camOffset = new THREE.Vector3(0, 0.8, 4)
    const camEnd = target.clone().add(camOffset)

    const controls = controlsRef.current
    if (!controls) return

    gsap.to(camera.position, {
      x: camEnd.x,
      y: camEnd.y,
      z: camEnd.z,
      duration: 1.2,
      ease: 'power3.inOut',
      onUpdate: () => controls.update(),
    })
    gsap.to(controls.target, {
      x: target.x,
      y: target.y,
      z: target.z,
      duration: 1.2,
      ease: 'power3.inOut',
      onUpdate: () => controls.update(),
    })
  }, [focusPosition, camera])

  return (
    <OrbitControls
      ref={controlsRef}
      enableDamping
      dampingFactor={0.08}
      autoRotate={autoRotate}
      autoRotateSpeed={0.4}
      minDistance={2}
      maxDistance={40}
      maxPolarAngle={Math.PI * 0.95}
    />
  )
}
