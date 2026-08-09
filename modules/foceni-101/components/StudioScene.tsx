"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { BokehPass } from "three/examples/jsm/postprocessing/BokehPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { DEFAULT_PARAMS, type PhotoParams } from "./types";
import { computeLight } from "./light";
import { ORB_COUNT, ORB_LAYOUTS, type Orb } from "./compositions";

const SUBJECT_HEIGHT = 1.55;
const BASE_FOCAL = 50;
const BASE_DISTANCE = 1.6;
const SENSOR = 36; // full-frame width (mm) for FOV math
const MAX_GHOST = 18;
const MIN_F = 1.8; // widest aperture the UI allows; defines "fully open" for DoF math
const REF_ASPECT = 1.6; // the aspect the orb layouts were tuned at

type Quality = "high" | "low";

// ── Procedural film-grain pass (custom, no FilmPass API guessing) ──────────
const GrainShader = {
  uniforms: {
    tDiffuse: { value: null as THREE.Texture | null },
    amount: { value: 0 },
    time: { value: 0 },
    tint: { value: new THREE.Vector3(1, 1, 1) },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform float amount;
    uniform float time;
    uniform vec3 tint;
    varying vec2 vUv;
    float rand(vec2 co) {
      return fract(sin(dot(co, vec2(12.9898, 78.233)) + time) * 43758.5453);
    }
    void main() {
      vec4 c = texture2D(tDiffuse, vUv);
      float n = (rand(vUv) - 0.5) * amount;
      gl_FragColor = vec4((c.rgb + n) * tint, c.a);
    }
  `,
};

function focalToFov(focal: number): number {
  return 2 * Math.atan(SENSOR / (2 * focal)) * (180 / Math.PI);
}

interface SceneState {
  renderer: THREE.WebGLRenderer;
  composer: EffectComposer;
  bokeh: BokehPass;
  grain: ShaderPass;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  key: THREE.SpotLight;
  fill: THREE.SpotLight;
  headGroup: THREE.Group;
  orbiter: THREE.Mesh;
  ghosts: THREE.Mesh[];
  history: THREE.Vector3[];
  current: PhotoParams; // smoothly tweened toward `target`
}

interface Props {
  target: PhotoParams;
  quality: Quality;
  orbLightOn: boolean;
  /** Key into ORB_LAYOUTS — which arrangement the background balls tween to. */
  orbLayout: string;
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

export function StudioScene({ target, quality, orbLightOn, orbLayout }: Props) {
  const mountRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef<SceneState | null>(null);
  const targetRef = useRef<PhotoParams>(target);
  targetRef.current = target;
  const orbLightOnRef = useRef(orbLightOn);
  orbLightOnRef.current = orbLightOn;
  const orbLayoutRef = useRef(orbLayout);
  orbLayoutRef.current = orbLayout;
  // Lives outside the scene effect so a quality-change remount keeps the
  // tweened params instead of jumping back to defaults.
  const currentRef = useRef<PhotoParams>({ ...DEFAULT_PARAMS });

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const pixelRatio = quality === "low" ? 1 : Math.min(window.devicePixelRatio, 2);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#0A0A0B");

    // No canvas AA: EffectComposer renders through offscreen targets, so MSAA
    // on the canvas would cost memory without smoothing anything.
    const renderer = new THREE.WebGLRenderer();
    renderer.setPixelRatio(pixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    renderer.domElement.style.display = "block";
    mount.appendChild(renderer.domElement);

    const camera = new THREE.PerspectiveCamera(focalToFov(BASE_FOCAL), 1, 0.05, 50);
    camera.position.set(0, SUBJECT_HEIGHT, BASE_DISTANCE);
    camera.lookAt(0, SUBJECT_HEIGHT, 0);

    // ── Lighting: soft key + fill + low ambient ──────────────────────────
    scene.add(new THREE.AmbientLight(0xffffff, 0.18));

    const key = new THREE.SpotLight(0xfff2e0, 14, 12, Math.PI / 5, 0.7, 1.4);
    key.position.set(1.1, SUBJECT_HEIGHT + 1.0, 1.4);
    key.target.position.set(0, SUBJECT_HEIGHT, 0);
    key.castShadow = true;
    key.shadow.mapSize.set(quality === "low" ? 512 : 1024, quality === "low" ? 512 : 1024);
    key.shadow.bias = -0.0005;
    scene.add(key);
    scene.add(key.target);

    const fill = new THREE.SpotLight(0xdfe6ff, 5, 12, Math.PI / 3.5, 0.8, 1.4);
    fill.position.set(-1.4, SUBJECT_HEIGHT + 0.5, 1.2);
    fill.target.position.set(0, SUBJECT_HEIGHT, 0);
    scene.add(fill);
    scene.add(fill.target);

    // ── Backdrop (curved sweep) ──────────────────────────────────────────
    const backMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1f, roughness: 1 });
    const wall = new THREE.Mesh(new THREE.PlaneGeometry(8, 6), backMat);
    wall.position.set(0, SUBJECT_HEIGHT, -1.6);
    wall.receiveShadow = true;
    scene.add(wall);
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(8, 6), backMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(0, SUBJECT_HEIGHT - 0.95, 0);
    floor.receiveShadow = true;
    scene.add(floor);

    // ── Bokeh balls behind subject (so shallow DoF is obvious) ───────────
    // They double as the composition section's props: each composition rearranges
    // them (see ORB_LAYOUTS), so the layout — not just the subject's position —
    // is what actually demonstrates the rule.
    const ballGeo = new THREE.SphereGeometry(0.05, 16, 16);
    const ballColors = [0xc8a96e, 0xd4b87a, 0x8a93b0, 0xf2f0eb];
    const balls: THREE.Mesh[] = [];
    /** Live orb state, tweened toward the active layout. */
    const ballState: Orb[] = ORB_LAYOUTS.default.map((o) => ({ ...o }));
    for (let i = 0; i < ORB_COUNT; i++) {
      const m = new THREE.MeshStandardMaterial({
        color: ballColors[i % ballColors.length],
        emissive: new THREE.Color(ballColors[i % ballColors.length]),
        emissiveIntensity: 0.9,
        roughness: 0.4,
      });
      const ball = new THREE.Mesh(ballGeo, m);
      scene.add(ball);
      balls.push(ball);
    }

    // ── Head: clay placeholder, swap to head.glb when loaded ─────────────
    const headGroup = new THREE.Group();
    scene.add(headGroup);

    // Z of the front-most face surface (toward camera). DoF focuses here so
    // the eyes/nose stay sharp at open apertures, not the head's mid-slice.
    let headFrontZ = 0.21; // clay fallback (sphere r0.2 * scaleZ 1.05)

    const clayMat = new THREE.MeshStandardMaterial({ color: 0xd8d2c4, roughness: 0.85 });
    const clay = new THREE.Mesh(new THREE.SphereGeometry(0.2, 48, 48), clayMat);
    clay.scale.set(1, 1.2, 1.05);
    clay.position.y = SUBJECT_HEIGHT;
    clay.castShadow = true;
    clay.receiveShadow = true;
    headGroup.add(clay);

    const gltfLoader = new GLTFLoader();
    gltfLoader.setMeshoptDecoder(MeshoptDecoder); // head.glb is meshopt-compressed
    gltfLoader.load(
      "/models/head.glb",
      (gltf) => {
        const model = gltf.scene;
        const box = new THREE.Box3().setFromObject(model);
        const size = new THREE.Vector3();
        box.getSize(size);
        model.scale.setScalar(0.44 / size.y);
        box.setFromObject(model);
        const centre = new THREE.Vector3();
        box.getCenter(centre);
        const dims = new THREE.Vector3();
        box.getSize(dims);
        headFrontZ = dims.z / 2; // front of the (centred) head
        model.position.sub(centre);
        model.position.y += SUBJECT_HEIGHT;
        model.traverse((c) => {
          if (c instanceof THREE.Mesh) {
            c.castShadow = true;
            c.receiveShadow = true;
          }
        });
        while (headGroup.children.length) headGroup.remove(headGroup.children[0]);
        headGroup.add(model);
      },
      undefined,
      () => {/* keep clay fallback */},
    );

    // ── Orbiting object (for the shutter / motion-blur section) ──────────
    const orbiter = new THREE.Mesh(
      new THREE.SphereGeometry(0.05, 24, 24),
      new THREE.MeshStandardMaterial({
        color: 0xc8a96e,
        emissive: 0xc8a96e,
        emissiveIntensity: 1.4,
      }),
    );
    scene.add(orbiter);

    // The orbiter is a real light source: it flies around the head and throws
    // moving shadows, so the orbit reads as light (not just a glowing dot).
    const orbLight = new THREE.PointLight(0xffe2bc, 7, 5, 2);
    orbLight.castShadow = true;
    orbLight.shadow.mapSize.set(quality === "low" ? 256 : 512, quality === "low" ? 256 : 512);
    orbLight.shadow.bias = -0.004;
    orbLight.shadow.camera.near = 0.05;
    orbiter.add(orbLight);

    const ghosts: THREE.Mesh[] = [];
    for (let i = 0; i < MAX_GHOST; i++) {
      const g = new THREE.Mesh(
        orbiter.geometry,
        new THREE.MeshBasicMaterial({ color: 0xc8a96e, transparent: true, opacity: 0 }),
      );
      g.visible = false;
      scene.add(g);
      ghosts.push(g);
    }

    // ── Post-processing chain ────────────────────────────────────────────
    const composer = new EffectComposer(renderer);
    composer.setPixelRatio(pixelRatio);
    composer.addPass(new RenderPass(scene, camera));

    const bokeh = new BokehPass(scene, camera, {
      focus: BASE_DISTANCE,
      aperture: 0.00002,
      maxblur: 0.004,
    });
    composer.addPass(bokeh);

    const grain = new ShaderPass(GrainShader);
    composer.addPass(grain);

    composer.addPass(new OutputPass());

    const current = currentRef.current;

    stateRef.current = {
      renderer, composer, bokeh, grain, scene, camera, key, fill,
      headGroup, orbiter, ghosts,
      history: [],
      current,
    };

    // ── Sizing ────────────────────────────────────────────────────────────
    const resize = () => {
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      composer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    const ro = new ResizeObserver(resize);
    ro.observe(mount);
    resize();

    // ── Animation loop: run while visible & on-screen, pause otherwise ────
    const timer = new THREE.Timer();
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    let visible = !document.hidden;
    let onScreen = true;
    let orbitAngle = 0;
    const active = () => visible && onScreen;

    const tick = () => {
      timer.update();
      const dt = Math.min(timer.getDelta(), 0.05);
      const t = targetRef.current;
      // Frame-rate independent damping; reduced motion snaps instead of tweening.
      const k = reduceMotion ? 1 : 1 - Math.pow(0.001, dt);

      current.exposure = lerp(current.exposure, t.exposure, k);
      current.aperture = lerp(current.aperture, t.aperture, k);
      current.shutter = lerp(current.shutter, t.shutter, k);
      current.iso = lerp(current.iso, t.iso, k);
      current.focal = lerp(current.focal, t.focal, k);
      current.angle = lerp(current.angle, t.angle, k);
      current.whiteBalance = lerp(current.whiteBalance, t.whiteBalance, k);
      current.composition = lerp(current.composition, t.composition, k);
      current.compositionY = lerp(current.compositionY, t.compositionY, k);
      current.framing = lerp(current.framing, t.framing, k);

      // Exposure: unified light model — aperture + shutter + ISO all feed brightness.
      renderer.toneMappingExposure = 1.05 * computeLight(current).mul;

      // Focal length → FOV + dolly (keeps subject size, shows compression).
      // Angle → raise/lower the camera while still looking at the subject.
      const dist = BASE_DISTANCE * (current.focal / BASE_FOCAL) * current.framing;
      const camY = SUBJECT_HEIGHT + current.angle * 0.7;
      camera.position.set(0, camY, dist);
      camera.fov = focalToFov(current.focal);
      camera.updateProjectionMatrix();
      camera.lookAt(0, SUBJECT_HEIGHT, 0);

      // Screen space → world, at a given distance from the camera. Composition
      // is authored as a fraction of the frame rather than in metres, so a layout
      // reads the same on a wide desktop and a tall phone — and the subject can't
      // slide out of frame when the aspect ratio narrows.
      // ponytail: assumes the camera axis is parallel to Z (angle ≈ 0, true in the
      // composition section); a tilted camera makes this a small approximation.
      const tanHalf = Math.tan((camera.fov * Math.PI) / 360);
      const halfV = (d: number) => d * tanHalf;
      const halfH = (d: number) => d * tanHalf * camera.aspect;

      // Composition → place the subject in the frame; lights follow so it stays lit
      const compX = current.composition * halfH(dist);
      const compY = current.compositionY * halfV(dist);
      headGroup.position.x = compX;
      headGroup.position.y = compY;
      key.target.position.set(compX, SUBJECT_HEIGHT + compY, 0);
      fill.target.position.set(compX, SUBJECT_HEIGHT + compY, 0);

      // Background balls tween toward the active layout (screen-space u/v, radius s).
      // Radius is in world units, so on a tall phone the same ball covers ~3× more
      // of the frame; scale it with the aspect so a layout keeps its proportions.
      const layout = ORB_LAYOUTS[orbLayoutRef.current] ?? ORB_LAYOUTS.default;
      const sizeK = Math.min(1, camera.aspect / REF_ASPECT);
      for (let i = 0; i < ORB_COUNT; i++) {
        const b = ballState[i];
        const to = layout[i];
        // Balls a layout doesn't use shrink away where they stand; tweening their
        // position too would streak them across the frame on the way out.
        if (to.s > 0.02) {
          b.u = lerp(b.u, to.u, k);
          b.v = lerp(b.v, to.v, k);
          b.z = lerp(b.z, to.z, k);
        }
        b.s = lerp(b.s, to.s, k);
        const d = Math.max(0.2, dist + b.z); // b.z = metres behind the subject
        balls[i].position.set(b.u * halfH(d), SUBJECT_HEIGHT + b.v * halfV(d), -b.z);
        balls[i].scale.setScalar(Math.max(b.s * sizeK, 0.0001));
        balls[i].visible = b.s > 0.02;
      }

      // White balance → warm/cool tint on the final image
      const wbT = (current.whiteBalance - 5500) / 2500; // -1 warm .. +1 cool
      const tint = (grain.uniforms as Record<string, THREE.IUniform>)["tint"].value as THREE.Vector3;
      tint.set(1 - wbT * 0.18, 1, 1 + wbT * 0.22);

      // Aperture → depth of field. Low f = big blur. focus tracks subject.
      // `aperture` uniform = how fast things go soft off the focal plane,
      // `maxblur` caps the blur radius. Both scale with how open the f-stop is.
      // 0 (wide open at MIN_F) .. 1 (closed at f/16). Clamped so f/MIN_F = fully open.
      const aT = Math.min(1, Math.max(0, (current.aperture - MIN_F) / (16 - MIN_F)));
      const open = 1 - aT;
      const bu = bokeh.uniforms as Record<string, THREE.IUniform>;
      // Focus a touch behind the nose tip (≈ the eyes), so the face reads sharp —
      // not just the front-most point. Background balls sit far behind, still blur.
      // ponytail: 0.2 = how far back into the head the focal plane sits; tune visually.
      bu["focus"].value = Math.max(0.1, dist - headFrontZ * 0.2);
      // Gentler than before so the whole face stays crisp wide open while the
      // distant background still goes creamy. ponytail: coefficients tuned by eye.
      bu["aperture"].value = 0.0002 + open * open * 0.02;
      bu["maxblur"].value = 0.003 + open * 0.01;

      // ISO → grain
      const isoT = (current.iso - 100) / (6400 - 100);
      const gu = grain.uniforms as Record<string, THREE.IUniform>;
      // Capped so ISO 6400 reads "noisy", not broken-TV static hiding the subject.
      gu["amount"].value = Math.max(0, isoT) * 0.22;
      gu["time"].value = reduceMotion ? 1 : timer.getElapsed();
      // Skip the full-screen grain pass when it would be a no-op (ISO 100, neutral WB).
      grain.enabled = gu["amount"].value > 0.002 || Math.abs(wbT) > 0.01;

      // Shutter → motion blur of the orbiter (ghost trail)
      if (!reduceMotion) orbitAngle += dt * 1.7;
      const R = 0.5;
      orbiter.position.set(
        Math.cos(orbitAngle) * R,
        SUBJECT_HEIGHT + 0.15,
        0.25 + Math.sin(orbitAngle) * R * 0.5,
      );
      const hist = stateRef.current!.history;
      hist.push(orbiter.position.clone());
      if (hist.length > MAX_GHOST + 2) hist.shift();

      // Toggle hides the whole orbiter (glowing dot + its light + trail), so the
      // on/off has a clear visible effect — not just the subtle cast light.
      const orbOn = orbLightOnRef.current;
      orbLight.visible = orbOn;
      orbiter.visible = orbOn;

      const nGhost = Math.round(current.shutter * MAX_GHOST);
      // Lead orbiter dims as the trail grows (energy spread over time)
      (orbiter.material as THREE.MeshStandardMaterial).emissiveIntensity =
        1.4 * (1 - current.shutter * 0.6);
      for (let i = 0; i < MAX_GHOST; i++) {
        const g = ghosts[i];
        const idx = hist.length - 2 - i;
        if (orbOn && i < nGhost && idx >= 0) {
          g.visible = true;
          g.position.copy(hist[idx]);
          (g.material as THREE.MeshBasicMaterial).opacity =
            (1 - i / Math.max(nGhost, 1)) * 0.45;
        } else {
          g.visible = false;
        }
      }

      composer.render();
      if (active()) raf = requestAnimationFrame(tick);
      else raf = 0;
    };
    const start = () => { if (raf === 0 && active()) { timer.update(); raf = requestAnimationFrame(tick); } };
    const stop = () => { if (raf) { cancelAnimationFrame(raf); raf = 0; } };

    const onVis = () => { visible = !document.hidden; if (active()) start(); else stop(); };
    document.addEventListener("visibilitychange", onVis);
    const io = new IntersectionObserver(([e]) => {
      onScreen = e.isIntersecting;
      if (active()) start(); else stop();
    });
    io.observe(mount);

    start();

    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVis);
      io.disconnect();
      ro.disconnect();
      composer.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quality]);

  return <div ref={mountRef} style={{ width: "100%", height: "100%", position: "relative" }} />;
}
