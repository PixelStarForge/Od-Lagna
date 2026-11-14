"use client";

import React, { useEffect, useRef, useCallback } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { CelestialEngine, type StarHitTarget } from "./CelestialEngine";
import { vector3ToRaDec, formatRA, formatDec } from "./celestial-math";
import type { StarRecord, ConstellationRecord, CharacterStarRecord } from "../../lib/constellation-schema";

interface CelestialCanvasProps {
  stars: StarRecord[];
  constellations: ConstellationRecord[];
  characterStars: CharacterStarRecord[];
  showLines: boolean;
  showHalos: boolean;
  flyToStarId: string | null;
  flyToConstellationId: string | null;
  resetTrigger: number;
  zoomInTrigger: number;
  zoomOutTrigger: number;
  onFlyToComplete: () => void;
  onHoverStar: (target: StarHitTarget | null, screenPos?: { x: number; y: number }) => void;
  onSelectStar: (target: StarHitTarget | null) => void;
  onCoordinatesUpdate?: (ra: string, dec: string) => void;
}

export function CelestialCanvas({
  stars,
  constellations,
  characterStars,
  showLines,
  showHalos,
  flyToStarId,
  flyToConstellationId,
  resetTrigger,
  zoomInTrigger,
  zoomOutTrigger,
  onFlyToComplete,
  onHoverStar,
  onSelectStar,
  onCoordinatesUpdate,
}: CelestialCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const engineRef = useRef<CelestialEngine | null>(null);

  // Unified smooth continuous zoom: 0 (widest view) to 1 (deepest telescopic magnification)
  const targetZoomRef = useRef<number>(0.15);
  const currentZoomRef = useRef<number>(0.15);

  // Dynamic references to ensure callbacks in listeners/render loop never capture stale closures
  const onHoverStarRef = useRef(onHoverStar);
  const onSelectStarRef = useRef(onSelectStar);
  const onFlyToCompleteRef = useRef(onFlyToComplete);
  const onCoordinatesUpdateRef = useRef(onCoordinatesUpdate);

  useEffect(() => {
    onHoverStarRef.current = onHoverStar;
  }, [onHoverStar]);

  useEffect(() => {
    onSelectStarRef.current = onSelectStar;
  }, [onSelectStar]);

  useEffect(() => {
    onFlyToCompleteRef.current = onFlyToComplete;
  }, [onFlyToComplete]);

  useEffect(() => {
    onCoordinatesUpdateRef.current = onCoordinatesUpdate;
  }, [onCoordinatesUpdate]);

  // Pointer drag tracking to differentiate between clicks and camera orbit drags
  const pointerStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Camera Fly-To animation state
  const flyToStartTimeRef = useRef<number | null>(null);
  const flyToFromPosRef = useRef<THREE.Vector3>(new THREE.Vector3());
  const flyToTargetPosRef = useRef<THREE.Vector3>(new THREE.Vector3());
  const isFlyingRef = useRef<boolean>(false);

  // Initialize Three.js Scene
  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // 1. Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // 2. Camera (inside the celestial sphere, looking outward)
    const camera = new THREE.PerspectiveCamera(65, width / height, 0.1, 2500);
    camera.position.set(0, 0, 80);
    cameraRef.current = camera;

    // 3. Renderer (pure deep void black background)
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.setClearColor(0x000000, 1);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffecd0, 1.5);
    dirLight1.position.set(3.5, 4.5, 5);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x8fa8ff, 1.0);
    dirLight2.position.set(-3.5, -2, -4);
    scene.add(dirLight2);

    // 5. OrbitControls (unconstrained 360-degree navigation inside sphere)
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enablePan = false;
    controls.enableZoom = false; // Zoom is handled smoothly via unified wheel listener to prevent sticking at extremes
    controls.rotateSpeed = 0.6;
    controls.minDistance = 50;
    controls.maxDistance = 350;
    controls.minPolarAngle = 0;
    controls.maxPolarAngle = Math.PI;
    controls.target.set(0, 0, 0);
    controlsRef.current = controls;

    // 6. Celestial Engine (Stars, Ambient Field, Lines, Labels & Character Halos)
    const engine = new CelestialEngine(stars, constellations, characterStars);
    scene.add(engine.group);
    engineRef.current = engine;

    // Reusable vector for coordinate computation
    const lookDir = new THREE.Vector3();
    let frameCount = 0;

    // 7. Animation & Render Loop
    let animationFrameId: number;
    const animate = (time: number) => {
      animationFrameId = requestAnimationFrame(animate);

      // Handle Camera Fly-To Animation
      if (isFlyingRef.current) {
        if (!flyToStartTimeRef.current) flyToStartTimeRef.current = time;
        const elapsed = (time - flyToStartTimeRef.current) / 1000;
        const flyDuration = 1.1;
        const t = Math.min(elapsed / flyDuration, 1);
        const ease = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

        camera.position.lerpVectors(flyToFromPosRef.current, flyToTargetPosRef.current, ease);
        controls.target.set(0, 0, 0);
        controls.update();

        if (t >= 1) {
          isFlyingRef.current = false;
          flyToStartTimeRef.current = null;
          onFlyToCompleteRef.current();
        }
      } else {
        // Smooth continuous zoom (prevents jamming at boundaries)
        if (Math.abs(targetZoomRef.current - currentZoomRef.current) > 0.0005) {
          currentZoomRef.current += (targetZoomRef.current - currentZoomRef.current) * 0.18;
          const z = currentZoomRef.current;
          const targetDist = 60 + z * (300 - 60);
          const targetFov = 75 - z * (75 - 20);

          if (camera.position.lengthSq() > 0.001) {
            camera.position.normalize().multiplyScalar(targetDist);
          }
          camera.fov = targetFov;
          camera.updateProjectionMatrix();
        }
        if (controls.enabled) {
          controls.update();
        }
      }

      // Update character halos pulse
      engine.update(time);

      // Throttled astronomical coordinate update (every 8 frames ~ 130ms)
      frameCount++;
      if (frameCount % 8 === 0 && onCoordinatesUpdateRef.current) {
        camera.getWorldDirection(lookDir);
        const { ra, dec } = vector3ToRaDec(lookDir);
        onCoordinatesUpdateRef.current(formatRA(ra), formatDec(dec));
      }

      renderer.render(scene, camera);
    };

    animationFrameId = requestAnimationFrame(animate);

    // 8. Custom Smooth Wheel Zoom Listener (avoids OrbitControls hard clamping jam)
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const step = Math.sign(e.deltaY) * -0.07;
      targetZoomRef.current = Math.max(0, Math.min(1, targetZoomRef.current + step));
    };

    container.addEventListener("wheel", handleWheel, { passive: false });

    // 9. Resize Listener
    const handleResize = () => {
      if (!containerRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      container.removeEventListener("wheel", handleWheel);
      window.removeEventListener("resize", handleResize);
      renderer.dispose();
      controls.dispose();
      engine.dispose();
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount

  // Sync visibility toggles
  useEffect(() => {
    engineRef.current?.setLinesVisible(showLines);
  }, [showLines]);

  useEffect(() => {
    engineRef.current?.setHalosVisible(showHalos);
  }, [showHalos]);

  // Handle Zoom In (+ button)
  useEffect(() => {
    if (zoomInTrigger === 0) return;
    targetZoomRef.current = Math.min(1, targetZoomRef.current + 0.15);
  }, [zoomInTrigger]);

  // Handle Zoom Out (- button)
  useEffect(() => {
    if (zoomOutTrigger === 0) return;
    targetZoomRef.current = Math.max(0, targetZoomRef.current - 0.15);
  }, [zoomOutTrigger]);

  // Handle Camera Reset
  useEffect(() => {
    if (resetTrigger === 0 || !cameraRef.current || !controlsRef.current) return;
    const camera = cameraRef.current;
    targetZoomRef.current = 0.15;
    currentZoomRef.current = 0.15;
    camera.fov = 65;
    camera.updateProjectionMatrix();
    flyToFromPosRef.current.copy(camera.position);
    flyToTargetPosRef.current.set(0, 0, 80);
    controlsRef.current.target.set(0, 0, 0);
    flyToStartTimeRef.current = null;
    isFlyingRef.current = true;
  }, [resetTrigger]);

  // Handle Fly-To Star
  useEffect(() => {
    if (!flyToStarId || !engineRef.current || !cameraRef.current || !controlsRef.current) return;

    const starPos = engineRef.current.starPositions.get(flyToStarId);
    if (!starPos) return;

    const camera = cameraRef.current;
    flyToFromPosRef.current.copy(camera.position);

    const dir = starPos.clone().normalize();
    const destination = dir.clone().multiplyScalar(-140);

    flyToTargetPosRef.current.copy(destination);
    controlsRef.current.target.set(0, 0, 0);

    targetZoomRef.current = 0.35;
    currentZoomRef.current = 0.35;
    camera.fov = 55;
    camera.updateProjectionMatrix();

    flyToStartTimeRef.current = null;
    isFlyingRef.current = true;
  }, [flyToStarId]);

  // Handle Fly-To Constellation
  useEffect(() => {
    if (!flyToConstellationId || !engineRef.current || !cameraRef.current || !controlsRef.current) return;

    const center = engineRef.current.getConstellationCenter(flyToConstellationId);
    if (!center) return;

    const camera = cameraRef.current;
    flyToFromPosRef.current.copy(camera.position);

    const dir = center.clone().normalize();
    const destination = dir.clone().multiplyScalar(-100);

    flyToTargetPosRef.current.copy(destination);
    controlsRef.current.target.set(0, 0, 0);

    targetZoomRef.current = 0.2;
    currentZoomRef.current = 0.2;
    camera.fov = 65;
    camera.updateProjectionMatrix();

    flyToStartTimeRef.current = null;
    isFlyingRef.current = true;
  }, [flyToConstellationId]);

  // Pointer event handlers
  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    pointerStartRef.current = { x: e.clientX, y: e.clientY };
  }, []);

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!containerRef.current || !cameraRef.current || !engineRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const normX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const normY = -(((e.clientY - rect.top) / rect.height) * 2 - 1);

      const target = engineRef.current.getIntersectedStar(normX, normY, cameraRef.current);
      if (target) {
        const screenPos = engineRef.current.projectToScreen(
          target.worldPosition,
          cameraRef.current,
          rect.width,
          rect.height
        );
        onHoverStarRef.current(target, screenPos.visible ? { x: screenPos.x, y: screenPos.y } : undefined);
      } else {
        onHoverStarRef.current(null);
      }
    },
    []
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!containerRef.current || !cameraRef.current || !engineRef.current) return;

      // Ignore drag releases so orbiting doesn't trigger accidental selection
      const dx = e.clientX - pointerStartRef.current.x;
      const dy = e.clientY - pointerStartRef.current.y;
      if (Math.hypot(dx, dy) > 6) return;

      const rect = containerRef.current.getBoundingClientRect();
      const normX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const normY = -(((e.clientY - rect.top) / rect.height) * 2 - 1);

      const target = engineRef.current.getIntersectedStar(normX, normY, cameraRef.current);
      if (target) {
        onSelectStarRef.current(target);
      }
    },
    []
  );

  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      className="w-full h-full cursor-grab active:cursor-grabbing select-none outline-none relative overflow-hidden"
    />
  );
}
