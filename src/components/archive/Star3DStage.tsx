import { useEffect, useRef } from "react";

const THREE_CDN_URL = "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js";

interface ThreeColor {
  convertSRGBToLinear(): ThreeColor;
}

interface ThreeShape {
  moveTo(x: number, y: number): void;
  quadraticCurveTo(cpX: number, cpY: number, x: number, y: number): void;
  closePath(): void;
}

interface ThreeGeometry {
  center(): void;
  computeVertexNormals(): void;
  dispose(): void;
}

interface ThreeMaterial {
  dispose(): void;
}

interface ThreeObject3D {
  position: { x: number; y: number; z: number; set(x: number, y: number, z: number): void };
  rotation: { x: number; y: number; z: number };
  scale: { set(x: number, y: number, z: number): void };
  add(obj: ThreeObject3D): void;
}

interface ThreeCamera extends ThreeObject3D {
  aspect: number;
  updateProjectionMatrix(): void;
}

interface ThreeRenderer {
  outputEncoding: number;
  toneMapping: number;
  toneMappingExposure: number;
  setPixelRatio(value: number): void;
  setSize(width: number, height: number, updateStyle?: boolean): void;
  render(scene: ThreeObject3D, camera: ThreeCamera): void;
  dispose(): void;
}

interface ThreeClock {
  getElapsedTime(): number;
}

interface ThreeNamespace {
  sRGBEncoding: number;
  ACESFilmicToneMapping: number;
  Color: new (hex: number) => ThreeColor;
  Shape: new () => ThreeShape;
  WebGLRenderer: new (params: {
    canvas: HTMLCanvasElement;
    alpha: boolean;
    antialias: boolean;
    powerPreference: string;
  }) => ThreeRenderer;
  Scene: new () => ThreeObject3D;
  PerspectiveCamera: new (fov: number, aspect: number, near: number, far: number) => ThreeCamera;
  HemisphereLight: new (skyColor: number, groundColor: number, intensity: number) => ThreeObject3D;
  AmbientLight: new (color: number, intensity: number) => ThreeObject3D;
  DirectionalLight: new (color: number, intensity: number) => ThreeObject3D;
  ExtrudeGeometry: new (
    shape: ThreeShape,
    options: {
      depth: number;
      bevelEnabled: boolean;
      bevelSegments: number;
      steps: number;
      bevelSize: number;
      bevelThickness: number;
      curveSegments: number;
    },
  ) => ThreeGeometry;
  MeshPhysicalMaterial: new (params: {
    color: ThreeColor;
    emissive: ThreeColor;
    emissiveIntensity: number;
    roughness: number;
    metalness: number;
    clearcoat: number;
    clearcoatRoughness: number;
    reflectivity: number;
  }) => ThreeMaterial;
  Mesh: new (geometry: ThreeGeometry, material: ThreeMaterial) => ThreeObject3D;
  Group: new () => ThreeObject3D;
  Clock: new () => ThreeClock;
}

type WindowWithThree = Window & { THREE?: ThreeNamespace };

let threeLoadPromise: Promise<ThreeNamespace | null> | null = null;

function loadThree(): Promise<ThreeNamespace | null> {
  if (typeof window === "undefined") return Promise.resolve(null);
  const win = window as WindowWithThree;
  if (win.THREE) return Promise.resolve(win.THREE);
  if (threeLoadPromise) return threeLoadPromise;

  threeLoadPromise = new Promise((resolve) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${THREE_CDN_URL}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve(win.THREE ?? null), { once: true });
      existing.addEventListener("error", () => resolve(null), { once: true });
      return;
    }
    const script = document.createElement("script");
    script.src = THREE_CDN_URL;
    script.async = true;
    script.onload = () => resolve(win.THREE ?? null);
    script.onerror = () => resolve(null);
    document.head.appendChild(script);
  });

  return threeLoadPromise;
}

function createRoundedStarShape(THREE: ThreeNamespace, pointsCount: number, outerR: number, innerR: number) {
  const shape = new THREE.Shape();
  const total = pointsCount * 2;
  const pts: Array<{ x: number; y: number }> = [];

  for (let i = 0; i < total; i++) {
    const angle = (i / total) * Math.PI * 2 - Math.PI / 2;
    const r = i % 2 === 0 ? outerR : innerR;
    pts.push({ x: Math.cos(angle) * r, y: Math.sin(angle) * r });
  }

  const mid = (a: { x: number; y: number }, b: { x: number; y: number }) => ({
    x: (a.x + b.x) * 0.5,
    y: (a.y + b.y) * 0.5,
  });

  const last = pts[total - 1]!;
  const first = pts[0]!;
  const startMid = mid(last, first);
  shape.moveTo(startMid.x, startMid.y);

  for (let i = 0; i < total; i++) {
    const curr = pts[i]!;
    const next = pts[(i + 1) % total]!;
    const m = mid(curr, next);
    shape.quadraticCurveTo(curr.x, curr.y, m.x, m.y);
  }
  shape.closePath();
  return shape;
}

export function Star3DStage({ onSpin }: { onSpin: () => void }) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const shadowRef = useRef<HTMLDivElement | null>(null);
  const onSpinRef = useRef(onSpin);
  onSpinRef.current = onSpin;

  useEffect(() => {
    const starWrap = wrapRef.current;
    const starCanvas = canvasRef.current;
    const contactShadow = shadowRef.current;
    if (!starWrap || !starCanvas || !contactShadow) return;

    let cancelled = false;
    let rafId = 0;
    let cleanupInner: (() => void) | null = null;

    const burstSparkles = () => {
      const colors = ["#FFD829", "#FFE866", "#141414"];
      for (let i = 0; i < 12; i++) {
        const p = document.createElement("div");
        p.className = "landing-sparkle-particle";
        const size = 8 + Math.random() * 8;
        const color = i % 4 === 0 ? colors[2]! : colors[i % 2]!;
        p.innerHTML = `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="${color}"><path d="M12 1L14.6 9.4L23 12L14.6 14.6L12 23L9.4 14.6L1 12L9.4 9.4Z"/></svg>`;
        p.style.left = "50%";
        p.style.top = "50%";
        p.style.marginLeft = `${-size / 2}px`;
        p.style.marginTop = `${-size / 2}px`;
        starWrap.appendChild(p);

        const angle = (Math.PI * 2 * i) / 12 + (Math.random() - 0.5) * 0.35;
        const dist = 84 + Math.random() * 44;
        const tx = Math.cos(angle) * dist;
        const ty = Math.sin(angle) * dist;
        const rot = (Math.random() - 0.5) * 220;

        p.animate(
          [
            { transform: "translate3d(0,0,0) scale(0.3) rotate(0deg)", opacity: 1 },
            { transform: `translate3d(${tx}px, ${ty}px, 0) scale(1.1) rotate(${rot}deg)`, opacity: 1, offset: 0.65 },
            { transform: `translate3d(${tx * 1.18}px, ${ty * 1.18}px, 0) scale(0.2) rotate(${rot}deg)`, opacity: 0 },
          ],
          {
            duration: 620 + Math.random() * 180,
            easing: "cubic-bezier(0.22, 1, 0.36, 1)",
            fill: "forwards",
          },
        );
        window.setTimeout(() => p.remove(), 860);
      }
    };

    const startCanvas2DFallback = () => {
      const ctx = starCanvas.getContext("2d");
      if (!ctx) return;

      let rot = 0;
      let spinBoost = 0;

      const resize2D = () => {
        const rect = starWrap.getBoundingClientRect();
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        starCanvas.width = Math.max(1, Math.floor(rect.width * dpr));
        starCanvas.height = Math.max(1, Math.floor(rect.height * dpr));
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      };

      const handleClick = () => {
        spinBoost += 0.38;
        onSpinRef.current();
        burstSparkles();
      };

      starWrap.addEventListener("click", handleClick);
      window.addEventListener("resize", resize2D);
      resize2D();

      const loop2D = (now: number) => {
        if (cancelled) return;
        const t = now * 0.001;
        const rect = starWrap.getBoundingClientRect();
        const w = rect.width;
        const h = rect.height;
        const scale = Math.min(w, h) / 228;
        ctx.clearRect(0, 0, w, h);

        rot += 0.008 + spinBoost;
        spinBoost *= 0.93;
        const floatY = Math.sin(t * 1.8) * 6 * scale;

        ctx.save();
        ctx.translate(w / 2, h / 2 + floatY - 4 * scale);
        ctx.rotate(rot);

        const grad = ctx.createRadialGradient(-22 * scale, -26 * scale, 8 * scale, 0, 0, 82 * scale);
        grad.addColorStop(0, "#FFE44D");
        grad.addColorStop(0.45, "#FFD000");
        grad.addColorStop(1, "#E09F00");

        ctx.beginPath();
        const pts = 8;
        for (let i = 0; i < pts * 2; i++) {
          const a = (i / (pts * 2)) * Math.PI * 2;
          const r = (i % 2 === 0 ? 74 : 42) * scale;
          const x = Math.cos(a) * r;
          const y = Math.sin(a) * r;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fillStyle = grad;
        ctx.fill();
        ctx.restore();

        const shadowScale = 1 - (floatY / Math.max(scale, 0.5)) * 0.015;
        contactShadow.style.transform = `translateX(-50%) scale(${shadowScale.toFixed(3)})`;
        rafId = window.requestAnimationFrame(loop2D);
      };
      rafId = window.requestAnimationFrame(loop2D);

      const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(resize2D) : null;
      ro?.observe(starWrap);

      cleanupInner = () => {
        starWrap.removeEventListener("click", handleClick);
        window.removeEventListener("resize", resize2D);
        ro?.disconnect();
      };
    };

    const startThree = (THREE: ThreeNamespace) => {
      try {
        const renderer = new THREE.WebGLRenderer({
          canvas: starCanvas,
          alpha: true,
          antialias: true,
          powerPreference: "high-performance",
        });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        renderer.outputEncoding = THREE.sRGBEncoding;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 0.96;

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
        camera.position.set(0, 0.12, 6.2);

        const hemiLight = new THREE.HemisphereLight(0xfffbe6, 0xe68a00, 0.58);
        hemiLight.position.set(0, 8, 0);
        scene.add(hemiLight);

        const ambientLight = new THREE.AmbientLight(0xffd966, 0.22);
        scene.add(ambientLight);

        const keyLight = new THREE.DirectionalLight(0xffffff, 0.92);
        keyLight.position.set(4.5, 6.5, 7.5);
        scene.add(keyLight);

        const fillLight = new THREE.DirectionalLight(0xffcc00, 0.38);
        fillLight.position.set(-5.5, 3.0, 5.0);
        scene.add(fillLight);

        const rimLight = new THREE.DirectionalLight(0xffb800, 0.75);
        rimLight.position.set(-4.0, -4.5, -5.0);
        scene.add(rimLight);

        const starShape = createRoundedStarShape(THREE, 8, 1.38, 0.78);
        const geometry = new THREE.ExtrudeGeometry(starShape, {
          depth: 0.24,
          bevelEnabled: true,
          bevelSegments: 14,
          steps: 1,
          bevelSize: 0.19,
          bevelThickness: 0.28,
          curveSegments: 24,
        });
        geometry.center();
        geometry.computeVertexNormals();

        const material = new THREE.MeshPhysicalMaterial({
          color: new THREE.Color(0xffc400).convertSRGBToLinear(),
          emissive: new THREE.Color(0xff9900).convertSRGBToLinear(),
          emissiveIntensity: 0.16,
          roughness: 0.2,
          metalness: 0.05,
          clearcoat: 0.92,
          clearcoatRoughness: 0.1,
          reflectivity: 0.92,
        });

        const starMesh = new THREE.Mesh(geometry, material);
        const starPivot = new THREE.Group();
        starPivot.add(starMesh);
        scene.add(starPivot);

        const resizeRenderer = () => {
          const rect = starWrap.getBoundingClientRect();
          const width = Math.max(1, Math.floor(rect.width));
          const height = Math.max(1, Math.floor(rect.height));
          renderer.setSize(width, height, false);
          camera.aspect = width / height;
          camera.updateProjectionMatrix();
        };
        const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(resizeRenderer) : null;
        ro?.observe(starWrap);
        window.addEventListener("resize", resizeRenderer);
        resizeRenderer();

        let isDragging = false;
        let prevX = 0;
        let prevY = 0;
        let pointerDownTime = 0;
        let dragDistance = 0;

        let rotX = 0.22;
        let rotY = -0.28;
        let velX = 0;
        let velY = 0;
        let spinTargetRemaining = 0;
        let tapPopScale = 0;

        const triggerTapSpin = () => {
          onSpinRef.current();
          spinTargetRemaining += Math.PI * 2;
          tapPopScale = 0.14;
          velX += (Math.random() - 0.5) * 0.06;
          burstSparkles();
        };

        const onPointerDown = (e: PointerEvent) => {
          isDragging = true;
          prevX = e.clientX;
          prevY = e.clientY;
          dragDistance = 0;
          pointerDownTime = performance.now();
          velX = 0;
          velY = 0;
          try {
            starWrap.setPointerCapture(e.pointerId);
          } catch {
            // ignore
          }
        };

        const onPointerMove = (e: PointerEvent) => {
          if (!isDragging) return;
          const dx = e.clientX - prevX;
          const dy = e.clientY - prevY;
          prevX = e.clientX;
          prevY = e.clientY;

          dragDistance += Math.hypot(dx, dy);
          const sensitivity = 0.0125;
          rotY += dx * sensitivity;
          rotX += dy * sensitivity;
          velY = dx * sensitivity;
          velX = dy * sensitivity;
        };

        const onPointerEnd = (e: PointerEvent) => {
          if (!isDragging) return;
          isDragging = false;
          const elapsed = performance.now() - pointerDownTime;
          if (dragDistance < 10 && elapsed < 320) {
            triggerTapSpin();
          }
          try {
            starWrap.releasePointerCapture(e.pointerId);
          } catch {
            // ignore
          }
        };

        const onKeyDown = (e: KeyboardEvent) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            triggerTapSpin();
          }
        };

        starWrap.addEventListener("pointerdown", onPointerDown);
        starWrap.addEventListener("pointermove", onPointerMove);
        starWrap.addEventListener("pointerup", onPointerEnd);
        starWrap.addEventListener("pointercancel", onPointerEnd);
        starWrap.addEventListener("keydown", onKeyDown);

        const clock = new THREE.Clock();

        const animate = () => {
          if (cancelled) return;
          rafId = window.requestAnimationFrame(animate);
          const t = clock.getElapsedTime();

          const floatY = Math.sin(t * 1.85) * 0.11;
          starPivot.position.y = floatY + 0.08;

          const shadowScale = 1 - floatY * 0.85;
          const shadowOpacity = 0.88 - floatY * 1.1;
          contactShadow.style.transform = `translateX(-50%) scale(${shadowScale.toFixed(3)})`;
          contactShadow.style.opacity = Math.max(0.45, Math.min(1, shadowOpacity)).toFixed(2);

          if (spinTargetRemaining > 0.001) {
            const step = Math.max(spinTargetRemaining * 0.16, 0.045);
            const applied = Math.min(step, spinTargetRemaining);
            rotY += applied;
            spinTargetRemaining -= applied;
          }

          if (tapPopScale > 0.001) {
            tapPopScale *= 0.86;
          } else {
            tapPopScale = 0;
          }
          const s = 1 + tapPopScale;
          starPivot.scale.set(s, s, s);

          if (!isDragging) {
            rotY += velY;
            rotX += velX;
            velY *= 0.94;
            velX *= 0.94;

            const idleSpeed = Math.abs(velY) < 0.002 && spinTargetRemaining < 0.01 ? 0.0055 : 0;
            rotY += idleSpeed;
            const targetIdleX = Math.sin(t * 1.1) * 0.22;
            rotX += (targetIdleX - rotX) * 0.025;
          }

          rotX = Math.max(-1.25, Math.min(1.25, rotX));

          starMesh.rotation.x = rotX;
          starMesh.rotation.y = rotY;
          starMesh.rotation.z = Math.sin(t * 0.9) * 0.06;

          renderer.render(scene, camera);
        };

        animate();

        cleanupInner = () => {
          ro?.disconnect();
          window.removeEventListener("resize", resizeRenderer);
          starWrap.removeEventListener("pointerdown", onPointerDown);
          starWrap.removeEventListener("pointermove", onPointerMove);
          starWrap.removeEventListener("pointerup", onPointerEnd);
          starWrap.removeEventListener("pointercancel", onPointerEnd);
          starWrap.removeEventListener("keydown", onKeyDown);
          geometry.dispose();
          material.dispose();
          renderer.dispose();
        };
      } catch {
        startCanvas2DFallback();
      }
    };

    void loadThree().then((THREE) => {
      if (cancelled) return;
      if (THREE) {
        startThree(THREE);
      } else {
        startCanvas2DFallback();
      }
    });

    return () => {
      cancelled = true;
      if (rafId) window.cancelAnimationFrame(rafId);
      cleanupInner?.();
    };
  }, []);

  return (
    <div
      ref={wrapRef}
      role="button"
      tabIndex={0}
      aria-label="3D 노란 별 — 드래그해서 회전하거나 탭해서 360도 스핀"
      className="relative flex h-[228px] w-[228px] cursor-grab touch-none items-center justify-center sm:h-[260px] sm:w-[260px] lg:h-[360px] lg:w-[360px] xl:h-[400px] xl:w-[400px] active:cursor-grabbing focus:outline-none"
    >
      <canvas ref={canvasRef} className="block h-full w-full" />
      <div ref={shadowRef} className="landing-contact-shadow" />
    </div>
  );
}
