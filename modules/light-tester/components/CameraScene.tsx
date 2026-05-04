"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { kelvinToRGB, mixGel } from "./colorUtils";
import type { Light, Tweaks } from "./types";

const SUBJECT_HEIGHT = 1.55;
const BASE_FOCAL = 50;
const BASE_DISTANCE = 1.6;

function buildHead(style: string): THREE.Group {
  const group = new THREE.Group();
  const mat = style === "clay"
    ? new THREE.MeshStandardMaterial({ color: 0xd8d2c4, roughness: 0.85, metalness: 0.0 })
    : new THREE.MeshStandardMaterial({ color: 0xcba88a, roughness: 0.55, metalness: 0.0 });

  const skullGeo = new THREE.SphereGeometry(0.18, 64, 64);
  skullGeo.scale(1.0, 1.18, 1.05);
  const skull = new THREE.Mesh(skullGeo, mat);
  skull.position.y = SUBJECT_HEIGHT + 0.05;
  skull.castShadow = true;
  skull.receiveShadow = true;
  group.add(skull);

  const jawGeo = new THREE.SphereGeometry(0.135, 48, 48);
  jawGeo.scale(0.95, 0.85, 1.0);
  const jaw = new THREE.Mesh(jawGeo, mat);
  jaw.position.set(0, SUBJECT_HEIGHT - 0.13, 0.015);
  jaw.castShadow = true;
  jaw.receiveShadow = true;
  group.add(jaw);

  const noseGeo = new THREE.ConeGeometry(0.028, 0.075, 16);
  noseGeo.rotateX(Math.PI / 2);
  const nose = new THREE.Mesh(noseGeo, mat);
  nose.position.set(0, SUBJECT_HEIGHT - 0.02, 0.18);
  nose.castShadow = true;
  group.add(nose);

  const browGeo = new THREE.TorusGeometry(0.085, 0.012, 8, 24, Math.PI);
  const brow = new THREE.Mesh(browGeo, mat);
  brow.position.set(0, SUBJECT_HEIGHT + 0.05, 0.155);
  brow.rotation.set(0, 0, Math.PI);
  group.add(brow);

  const eyeGeo = new THREE.SphereGeometry(0.022, 24, 24);
  const scleraMat = new THREE.MeshStandardMaterial({ color: 0xf2f0eb, roughness: 0.15, metalness: 0.0 });
  const irisMat = new THREE.MeshStandardMaterial({ color: 0x2a2018, roughness: 0.2, metalness: 0.0 });
  ([ [-0.05, 0.165], [0.05, 0.165] ] as [number, number][]).forEach(([x, z]) => {
    const sclera = new THREE.Mesh(eyeGeo, scleraMat);
    sclera.position.set(x, SUBJECT_HEIGHT + 0.025, z);
    group.add(sclera);
    const iris = new THREE.Mesh(new THREE.SphereGeometry(0.011, 16, 16), irisMat);
    iris.position.set(x, SUBJECT_HEIGHT + 0.025, z + 0.013);
    group.add(iris);
  });

  const lipMat = style === "clay"
    ? mat
    : new THREE.MeshStandardMaterial({ color: 0xa88070, roughness: 0.7 });
  const lipGeo = new THREE.SphereGeometry(0.04, 24, 16);
  lipGeo.scale(1.4, 0.35, 0.4);
  const lips = new THREE.Mesh(lipGeo, lipMat);
  lips.position.set(0, SUBJECT_HEIGHT - 0.085, 0.165);
  group.add(lips);

  const neckGeo = new THREE.CylinderGeometry(0.07, 0.085, 0.18, 24);
  const neck = new THREE.Mesh(neckGeo, mat);
  neck.position.y = SUBJECT_HEIGHT - 0.27;
  neck.castShadow = true;
  neck.receiveShadow = true;
  group.add(neck);

  const shGeo = new THREE.SphereGeometry(0.32, 32, 24);
  shGeo.scale(1.0, 0.35, 0.55);
  const sh = new THREE.Mesh(shGeo, mat);
  sh.position.y = SUBJECT_HEIGHT - 0.42;
  sh.castShadow = true;
  sh.receiveShadow = true;
  group.add(sh);

  return group;
}

function buildBackdrop(color: string): THREE.Group {
  const group = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(color),
    roughness: 1.0,
    metalness: 0.0,
  });

  const w = 4.0, h = 3.0, d = 3.0;
  const geo = new THREE.PlaneGeometry(w, h, 32, 32);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i);
    if (y < -h / 2 + 0.5) {
      const bend = Math.sin((1 - Math.min(1, (-y + h / 2) / 0.5 - 1 + 1)) * Math.PI / 2) * 0.5;
      pos.setZ(i, bend);
      pos.setY(i, -h / 2 + 0.5 - (0.5 - bend));
    }
  }
  geo.computeVertexNormals();
  const wall = new THREE.Mesh(geo, mat);
  wall.position.set(0, h / 2 - 0.5, -1.0);
  wall.receiveShadow = true;
  group.add(wall);

  const fGeo = new THREE.PlaneGeometry(w, d);
  fGeo.rotateX(-Math.PI / 2);
  const floor = new THREE.Mesh(fGeo, mat);
  floor.position.set(0, -1.0, 0.5);
  floor.receiveShadow = true;
  group.add(floor);

  return group;
}

interface SceneState {
  scene: THREE.Scene;
  renderer: THREE.WebGLRenderer;
  camera: THREE.PerspectiveCamera;
  controls: OrbitControls;
  headGroup: THREE.Group;
  backdropGroup: THREE.Group;
  lightGroup: THREE.Group;
  lightObjs: Map<string, { spot: THREE.SpotLight }>;
  currentHeadStyle: string | null;
  currentBackdrop: string | null;
}

interface Props {
  lights: Light[];
  tweaks: Tweaks;
  selectedId: string | null;
  cameraPos: { x: number; z: number };
}

export function CameraScene({ lights, tweaks, cameraPos }: Props) {
  const mountRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef<SceneState | null>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#0A0A0B");

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    mount.appendChild(renderer.domElement);

    const fov = 2 * Math.atan(36 / (2 * BASE_FOCAL)) * (180 / Math.PI);
    const camera = new THREE.PerspectiveCamera(fov, 1, 0.05, 50);
    camera.position.set(0, SUBJECT_HEIGHT, BASE_DISTANCE);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, SUBJECT_HEIGHT, 0);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.enableZoom = false;
    // Don't let camera go underground
    controls.maxPolarAngle = Math.PI * 0.72;
    controls.update();

    const ambient = new THREE.AmbientLight(0xffffff, 0.06);
    scene.add(ambient);

    const headGroup = new THREE.Group();
    scene.add(headGroup);
    const backdropGroup = new THREE.Group();
    scene.add(backdropGroup);
    const lightGroup = new THREE.Group();
    scene.add(lightGroup);

    const ro = new ResizeObserver(() => {
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    });
    ro.observe(mount);

    let raf: number;
    const tick = () => {
      controls.update();
      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    };
    tick();

    stateRef.current = {
      scene, renderer, camera, controls,
      headGroup, backdropGroup, lightGroup,
      lightObjs: new Map(),
      currentHeadStyle: null,
      currentBackdrop: null,
    };

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      controls.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    };
  }, []);

  useEffect(() => {
    const s = stateRef.current;
    if (!s || s.currentHeadStyle === tweaks.headStyle) return;
    s.currentHeadStyle = tweaks.headStyle;

    const clearHead = () => {
      while (s.headGroup.children.length) s.headGroup.remove(s.headGroup.children[0]);
    };

    if (tweaks.headStyle === "realistic") {
      // Show clay placeholder while the GLB loads
      clearHead();
      s.headGroup.add(buildHead("clay"));

      const loader = new GLTFLoader();
      loader.load(
        "/models/head.glb",
        (gltf) => {
          // Only apply if style hasn't changed since we started loading
          if (stateRef.current?.currentHeadStyle !== "realistic") return;
          clearHead();

          const model = gltf.scene;

          // Auto-fit: centre the bounding box at subject head height
          const box = new THREE.Box3().setFromObject(model);
          const size = new THREE.Vector3();
          box.getSize(size);
          const centre = new THREE.Vector3();
          box.getCenter(centre);

          // Scale so the head fits roughly 0.22m tall (skull diameter)
          const targetHeight = 0.44;
          const scale = targetHeight / size.y;
          model.scale.setScalar(scale);

          // Re-centre after scale
          box.setFromObject(model);
          box.getCenter(centre);
          model.position.sub(centre);
          model.position.y += SUBJECT_HEIGHT;

          // Apply shadow + lighting to all meshes
          model.traverse((child) => {
            if (child instanceof THREE.Mesh) {
              child.castShadow = true;
              child.receiveShadow = true;
              // Keep original materials — they carry textures
            }
          });

          s.headGroup.add(model);
        },
        undefined,
        () => {
          // GLB not found — fall back to procedural realistic
          if (stateRef.current?.currentHeadStyle !== "realistic") return;
          clearHead();
          s.headGroup.add(buildHead("realistic"));
        }
      );
    } else {
      clearHead();
      s.headGroup.add(buildHead(tweaks.headStyle));
    }
  }, [tweaks.headStyle]);

  useEffect(() => {
    const s = stateRef.current;
    if (!s || s.currentBackdrop === tweaks.backdrop) return;
    while (s.backdropGroup.children.length) s.backdropGroup.remove(s.backdropGroup.children[0]);
    s.backdropGroup.add(buildBackdrop(tweaks.backdrop));
    s.currentBackdrop = tweaks.backdrop;
  }, [tweaks.backdrop]);

  // Camera floor-plan position: teleport to new XZ, keep current height
  useEffect(() => {
    const s = stateRef.current;
    if (!s) return;
    s.camera.position.set(cameraPos.x, s.camera.position.y, cameraPos.z);
    s.controls.target.set(0, SUBJECT_HEIGHT, 0);
    s.controls.update();
  }, [cameraPos]);

  // Focal length = pure FOV (optical lens swap); camera distance = floor-plan drag
  useEffect(() => {
    const s = stateRef.current;
    if (!s) return;
    const focal = tweaks.focal || BASE_FOCAL;
    const fov = 2 * Math.atan(36 / (2 * focal)) * (180 / Math.PI);
    s.camera.fov = fov;
    s.camera.updateProjectionMatrix();
  }, [tweaks.focal]);

  useEffect(() => {
    const s = stateRef.current;
    if (!s) return;
    const seen = new Set<string>();
    lights.forEach((L) => {
      seen.add(L.id);
      let entry = s.lightObjs.get(L.id);
      if (!entry) {
        const sl = new THREE.SpotLight(0xffffff, 0, 12, Math.PI / 4, 0.5, 1.6);
        sl.castShadow = true;
        sl.shadow.mapSize.set(1024, 1024);
        sl.shadow.bias = -0.0005;
        s.lightGroup.add(sl);
        s.lightGroup.add(sl.target);
        entry = { spot: sl };
        s.lightObjs.set(L.id, entry);
      }
      entry.spot.position.set(L.x, L.height, L.z);

      const tx = L.aim?.x ?? 0;
      const tz = L.aim?.z ?? 0;
      const ty = L.aim?.y ?? SUBJECT_HEIGHT;
      entry.spot.target.position.set(tx, ty, tz);
      entry.spot.target.updateMatrixWorld();

      const on = L.on ? 1 : 0;
      const intensityScale: Record<string, number> = {
        key: 12, fill: 6, rim: 10, beauty: 11, softbox: 9,
      };
      entry.spot.intensity = on * (L.power / 100) * (intensityScale[L.type] ?? 8);

      const k = kelvinToRGB(L.kelvin);
      const m = mixGel(k, L.gel);
      entry.spot.color.setRGB(m[0], m[1], m[2]);

      const sizeAngle: Record<string, number> = {
        key: Math.PI / 5,
        fill: Math.PI / 3.5,
        rim: Math.PI / 6,
        beauty: Math.PI / 5.5,
        softbox: Math.PI / 3,
      };
      entry.spot.angle = (sizeAngle[L.type] ?? Math.PI / 5) * (0.7 + (L.size || 50) / 100);
      entry.spot.penumbra = (L.type === "softbox" || L.type === "beauty") ? 0.85 : 0.55;
    });

    for (const [id, entry] of s.lightObjs.entries()) {
      if (!seen.has(id)) {
        s.lightGroup.remove(entry.spot);
        s.lightGroup.remove(entry.spot.target);
        s.lightObjs.delete(id);
      }
    }
  }, [lights]);

  return (
    <div
      ref={mountRef}
      style={{ width: "100%", height: "100%", position: "relative" }}
    />
  );
}
