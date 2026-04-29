/* global React, THREE */
/* Scene — Three.js renderer for the camera view.
   Exposes <CameraScene lights subject tweaks /> which mounts a canvas and reflows on prop changes. */

(function () {
  const { useEffect, useRef } = React;

  // ── Light helpers ─────────────────────────────────────────────────
  // Light position is stored as floor coordinates (x, z) ∈ [-3, 3], plus height.
  // The "subject" sits at origin, head centred at y=1.55.

  const SUBJECT_HEIGHT = 1.55;

  function kelvinToRGB(k) {
    // Tanner Helland approximation, normalised to 0..1
    k = k / 100;
    let r, g, b;
    if (k <= 66) {
      r = 255;
      g = 99.4708025861 * Math.log(k) - 161.1195681661;
      b = k <= 19 ? 0 : 138.5177312231 * Math.log(k - 10) - 305.0447927307;
    } else {
      r = 329.698727446 * Math.pow(k - 60, -0.1332047592);
      g = 288.1221695283 * Math.pow(k - 60, -0.0755148492);
      b = 255;
    }
    const clamp = (v) => Math.max(0, Math.min(255, v)) / 255;
    return [clamp(r), clamp(g), clamp(b)];
  }

  function mixGel(kelvinRGB, gelHex) {
    if (!gelHex || gelHex === 'none') return kelvinRGB;
    const c = new THREE.Color(gelHex);
    // Multiply gel onto the kelvin colour
    return [kelvinRGB[0] * c.r, kelvinRGB[1] * c.g, kelvinRGB[2] * c.b];
  }

  // ── Build the head mesh based on style ─────────────────────────────
  function buildHead(style) {
    const group = new THREE.Group();
    const faceMeshes = []; // used to compute portrait framing center (excludes neck/shoulders)
    const mat = (() => {
      if (style === 'wireframe') {
        return new THREE.MeshBasicMaterial({ color: 0xC8A96E, wireframe: true });
      }
      if (style === 'realistic') {
        return new THREE.MeshStandardMaterial({
          color: 0xCBA88A,
          roughness: 0.55,
          metalness: 0.0,
        });
      }
      // clay — matte off-white, the photographer's choice
      return new THREE.MeshStandardMaterial({
        color: 0xD8D2C4,
        roughness: 0.85,
        metalness: 0.0,
      });
    })();

    // Skull — slightly elongated sphere
    const skullGeo = new THREE.SphereGeometry(0.18, 64, 64);
    skullGeo.scale(1.0, 1.18, 1.05);
    const skull = new THREE.Mesh(skullGeo, mat);
    skull.position.y = SUBJECT_HEIGHT + 0.05;
    skull.castShadow = true;
    skull.receiveShadow = true;
    group.add(skull);
    faceMeshes.push(skull);

    // Jaw — narrower
    const jawGeo = new THREE.SphereGeometry(0.135, 48, 48);
    jawGeo.scale(0.95, 0.85, 1.0);
    const jaw = new THREE.Mesh(jawGeo, mat);
    jaw.position.set(0, SUBJECT_HEIGHT - 0.13, 0.015);
    jaw.castShadow = true;
    jaw.receiveShadow = true;
    group.add(jaw);
    faceMeshes.push(jaw);

    // Nose
    const noseGeo = new THREE.ConeGeometry(0.028, 0.075, 16);
    noseGeo.rotateX(Math.PI / 2);
    const nose = new THREE.Mesh(noseGeo, mat);
    nose.position.set(0, SUBJECT_HEIGHT - 0.02, 0.18);
    nose.castShadow = true;
    nose.receiveShadow = true;
    group.add(nose);
    faceMeshes.push(nose);

    // Brow ridge — small torus segment
    const browGeo = new THREE.TorusGeometry(0.085, 0.012, 8, 24, Math.PI);
    const brow = new THREE.Mesh(browGeo, mat);
    brow.position.set(0, SUBJECT_HEIGHT + 0.05, 0.155);
    brow.rotation.set(0, 0, Math.PI);
    group.add(brow);
    faceMeshes.push(brow);

    // Eyes — dark pupils with reflective sclera (catchlights live here)
    const eyeGeo = new THREE.SphereGeometry(0.022, 24, 24);
    const scleraMat = new THREE.MeshStandardMaterial({ color: 0xF2F0EB, roughness: 0.15, metalness: 0.0 });
    const irisMat = new THREE.MeshStandardMaterial({ color: 0x2A2018, roughness: 0.2, metalness: 0.0 });
    [[-0.05, 0.165], [0.05, 0.165]].forEach(([x, z]) => {
      const sclera = new THREE.Mesh(eyeGeo, scleraMat);
      sclera.position.set(x, SUBJECT_HEIGHT + 0.025, z);
      group.add(sclera);
      faceMeshes.push(sclera);
      const iris = new THREE.Mesh(new THREE.SphereGeometry(0.011, 16, 16), irisMat);
      iris.position.set(x, SUBJECT_HEIGHT + 0.025, z + 0.013);
      group.add(iris);
      faceMeshes.push(iris);
    });

    // Lips — flat ellipse
    const lipMat = new THREE.MeshStandardMaterial({
      color: style === 'wireframe' ? 0xC8A96E : 0xA88070,
      roughness: 0.7,
      wireframe: style === 'wireframe',
    });
    const lipGeo = new THREE.SphereGeometry(0.04, 24, 16);
    lipGeo.scale(1.4, 0.35, 0.4);
    const lips = new THREE.Mesh(lipGeo, lipMat);
    lips.position.set(0, SUBJECT_HEIGHT - 0.085, 0.165);
    group.add(lips);
    faceMeshes.push(lips);

    // Neck cylinder
    const neckGeo = new THREE.CylinderGeometry(0.07, 0.085, 0.18, 24);
    const neck = new THREE.Mesh(neckGeo, mat);
    neck.position.y = SUBJECT_HEIGHT - 0.27;
    neck.castShadow = true;
    neck.receiveShadow = true;
    group.add(neck);

    // Shoulders — wide flattened ellipsoid
    const shGeo = new THREE.SphereGeometry(0.32, 32, 24);
    shGeo.scale(1.0, 0.35, 0.55);
    const sh = new THREE.Mesh(shGeo, mat);
    sh.position.y = SUBJECT_HEIGHT - 0.42;
    sh.castShadow = true;
    sh.receiveShadow = true;
    group.add(sh);

    // Compute bounding box of face features only (excludes neck/shoulders)
    // so the camera centers on the head, not the full bust
    const faceBox = new THREE.Box3();
    faceMeshes.forEach(m => faceBox.expandByObject(m));
    const faceCenter = faceBox.getCenter(new THREE.Vector3());

    return { group, faceCenter };
  }

  function buildBackdrop(color) {
    const group = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(color),
      roughness: 1.0,
      metalness: 0.0,
    });
    // Curved seamless backdrop
    const w = 4.0, h = 3.0, d = 3.0;
    const segments = 32;
    const geo = new THREE.PlaneGeometry(w, h, segments, segments);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i);
      // Curve the bottom of the wall forward so it joins the floor
      const t = Math.max(0, (-y + h / 2) / 0.5);
      if (y < -h / 2 + 0.5) {
        const k = 1 - Math.min(1, t);
        const bend = Math.sin((1 - k) * Math.PI / 2) * 0.5;
        pos.setZ(i, bend);
        pos.setY(i, -h / 2 + 0.5 - (0.5 - bend));
      }
    }
    geo.computeVertexNormals();
    const wall = new THREE.Mesh(geo, mat);
    wall.position.set(0, h / 2 - 0.5, -1.0);
    wall.receiveShadow = true;
    group.add(wall);

    // Floor extension forward
    const fGeo = new THREE.PlaneGeometry(w, d);
    fGeo.rotateX(-Math.PI / 2);
    const floor = new THREE.Mesh(fGeo, mat);
    floor.position.set(0, -1.0, 0.5);
    floor.receiveShadow = true;
    group.add(floor);

    return group;
  }

  // ── Component ──────────────────────────────────────────────────────
  function CameraScene({ lights, tweaks, selectedId, onSelectLight, camPos, onCamPosChange }) {
    const mountRef = useRef(null);
    const stateRef = useRef(null);

    // Initial mount
    useEffect(() => {
      const mount = mountRef.current;
      if (!mount) return;

      const scene = new THREE.Scene();
      scene.background = new THREE.Color('#0A0A0B');

      const renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.05;
      mount.appendChild(renderer.domElement);

      const camera = new THREE.PerspectiveCamera(40, 1, 0.05, 50);

      // Orbit state — camera always looks at orbitTarget
      const orbit = {
        theta: 0,            // azimuth (horizontal, radians)
        phi: 0,              // elevation (vertical, radians)
        radius: 1.6,
        target: new THREE.Vector3(0, SUBJECT_HEIGHT, 0),
      };

      function applyOrbit() {
        const { theta, phi, radius, target } = orbit;
        camera.position.set(
          target.x + radius * Math.sin(theta) * Math.cos(phi),
          target.y + radius * Math.sin(phi),
          target.z + radius * Math.cos(theta) * Math.cos(phi),
        );
        camera.lookAt(target);
      }
      applyOrbit();

      // Mouse drag — left: orbit, right: pan target
      const canvas = renderer.domElement;
      canvas.style.cursor = 'grab';
      let dragMode = null; // 'orbit' | 'pan'
      let lastX = 0, lastY = 0;

      const _right = new THREE.Vector3();
      const _up = new THREE.Vector3();

      function onMouseDown(e) {
        dragMode = e.button === 2 ? 'pan' : 'orbit';
        lastX = e.clientX; lastY = e.clientY;
        canvas.style.cursor = dragMode === 'pan' ? 'move' : 'grabbing';
        e.preventDefault();
      }
      function onMouseMove(e) {
        if (!dragMode) return;
        const dx = e.clientX - lastX;
        const dy = e.clientY - lastY;
        lastX = e.clientX; lastY = e.clientY;
        if (dragMode === 'orbit') {
          orbit.theta -= dx * 0.008;
          orbit.phi = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, orbit.phi + dy * 0.006));
        } else {
          // Pan: move target along camera's local right/up axes
          const panSpeed = orbit.radius * 0.0008;
          _right.setFromMatrixColumn(camera.matrix, 0);
          _up.setFromMatrixColumn(camera.matrix, 1);
          orbit.target.addScaledVector(_right, -dx * panSpeed);
          orbit.target.addScaledVector(_up, dy * panSpeed);
        }
        applyOrbit();
      }
      function onMouseUp() {
        dragMode = null;
        canvas.style.cursor = 'grab';
      }
      function onContextMenu(e) { e.preventDefault(); }

      // Touch: one finger = orbit, two fingers = pan
      let lastTouchX = 0, lastTouchY = 0;
      let lastPinchMidX = 0, lastPinchMidY = 0;
      function onTouchStart(e) {
        if (e.touches.length === 1) {
          lastTouchX = e.touches[0].clientX;
          lastTouchY = e.touches[0].clientY;
        } else if (e.touches.length === 2) {
          lastPinchMidX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
          lastPinchMidY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
        }
        e.preventDefault();
      }
      function onTouchMove(e) {
        if (e.touches.length === 1) {
          const dx = e.touches[0].clientX - lastTouchX;
          const dy = e.touches[0].clientY - lastTouchY;
          lastTouchX = e.touches[0].clientX;
          lastTouchY = e.touches[0].clientY;
          orbit.theta -= dx * 0.008;
          orbit.phi = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, orbit.phi + dy * 0.006));
          applyOrbit();
        } else if (e.touches.length === 2) {
          const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
          const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
          const dx = midX - lastPinchMidX;
          const dy = midY - lastPinchMidY;
          lastPinchMidX = midX; lastPinchMidY = midY;
          const panSpeed = orbit.radius * 0.0008;
          _right.setFromMatrixColumn(camera.matrix, 0);
          _up.setFromMatrixColumn(camera.matrix, 1);
          orbit.target.addScaledVector(_right, -dx * panSpeed);
          orbit.target.addScaledVector(_up, dy * panSpeed);
          applyOrbit();
        }
        e.preventDefault();
      }

      canvas.addEventListener('mousedown', onMouseDown);
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
      canvas.addEventListener('contextmenu', onContextMenu);
      canvas.addEventListener('touchstart', onTouchStart, { passive: false });
      canvas.addEventListener('touchmove', onTouchMove, { passive: false });

      // Very low ambient so studio lights do the work
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

      let raf;
      const tick = () => {
        renderer.render(scene, camera);
        raf = requestAnimationFrame(tick);
      };
      tick();

      stateRef.current = { scene, renderer, camera, orbit, applyOrbit, headGroup, backdropGroup, lightGroup, lightObjs: new Map(), currentHeadStyle: null, currentBackdrop: null };

      return () => {
        cancelAnimationFrame(raf);
        ro.disconnect();
        renderer.dispose();
        canvas.removeEventListener('mousedown', onMouseDown);
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
        canvas.removeEventListener('contextmenu', onContextMenu);
        canvas.removeEventListener('touchstart', onTouchStart);
        canvas.removeEventListener('touchmove', onTouchMove);
        if (renderer.domElement.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement);
      };
    }, []);

    // Update head style
    useEffect(() => {
      const s = stateRef.current; if (!s) return;
      if (s.currentHeadStyle === tweaks.headStyle) return;
      while (s.headGroup.children.length) s.headGroup.remove(s.headGroup.children[0]);
      const { group, faceCenter } = buildHead(tweaks.headStyle);
      s.headGroup.add(group);
      s.orbit.target.y = faceCenter.y;
      s.applyOrbit();
      s.currentHeadStyle = tweaks.headStyle;
    }, [tweaks.headStyle]);

    // Sync camera position from floor plan
    useEffect(() => {
      const s = stateRef.current; if (!s) return;
      if (!camPos) return;
      const { orbit } = s;
      const dx = camPos.x - orbit.target.x;
      const dz = camPos.z - orbit.target.z;
      const hDist = Math.sqrt(dx * dx + dz * dz);
      if (hDist < 0.05) return;
      orbit.theta = Math.atan2(dx, dz);
      orbit.radius = hDist / Math.max(0.1, Math.cos(orbit.phi));
      s.applyOrbit();
    }, [camPos]);

    // Update backdrop
    useEffect(() => {
      const s = stateRef.current; if (!s) return;
      if (s.currentBackdrop === tweaks.backdrop) return;
      while (s.backdropGroup.children.length) s.backdropGroup.remove(s.backdropGroup.children[0]);
      s.backdropGroup.add(buildBackdrop(tweaks.backdrop));
      s.currentBackdrop = tweaks.backdrop;
    }, [tweaks.backdrop]);

    // Update camera FOV
    useEffect(() => {
      const s = stateRef.current; if (!s) return;
      // Convert "focal length 35mm equivalent" to FOV
      const focal = tweaks.focal || 50;
      const fov = 2 * Math.atan(36 / (2 * focal)) * 180 / Math.PI;
      s.camera.fov = fov;
      s.camera.updateProjectionMatrix();
    }, [tweaks.focal]);

    // Reconcile lights
    useEffect(() => {
      const s = stateRef.current; if (!s) return;
      const seen = new Set();
      lights.forEach(L => {
        seen.add(L.id);
        let entry = s.lightObjs.get(L.id);
        if (!entry) {
          // Create
          const sl = new THREE.SpotLight(0xffffff, 0, 12, Math.PI / 4, 0.5, 1.6);
          sl.castShadow = true;
          sl.shadow.mapSize.set(1024, 1024);
          sl.shadow.bias = -0.0005;
          s.lightGroup.add(sl);
          s.lightGroup.add(sl.target);
          entry = { spot: sl };
          s.lightObjs.set(L.id, entry);
        }
        // Position
        entry.spot.position.set(L.x, L.height, L.z);
        // Target — aim point if set, otherwise subject head
        const tx = (L.aim && typeof L.aim.x === 'number') ? L.aim.x : 0;
        const tz = (L.aim && typeof L.aim.z === 'number') ? L.aim.z : 0;
        const ty = (L.aim && typeof L.aim.y === 'number') ? L.aim.y : SUBJECT_HEIGHT;
        entry.spot.target.position.set(tx, ty, tz);
        entry.spot.target.updateMatrixWorld();
        // Power
        const on = L.on !== false ? 1 : 0;
        const intensityScale = {
          key: 12,
          fill: 6,
          rim: 10,
          beauty: 11,
          softbox: 9,
        }[L.type] || 8;
        entry.spot.intensity = on * (L.power / 100) * intensityScale;
        // Color = kelvin × gel
        const k = kelvinToRGB(L.kelvin);
        const m = mixGel(k, L.gel);
        entry.spot.color.setRGB(m[0], m[1], m[2]);
        // Spread by type & size
        const sizeAngle = {
          key: Math.PI / 5,
          fill: Math.PI / 3.5,
          rim: Math.PI / 6,
          beauty: Math.PI / 5.5,
          softbox: Math.PI / 3,
        }[L.type] || Math.PI / 5;
        entry.spot.angle = sizeAngle * (0.7 + (L.size || 50) / 100);
        entry.spot.penumbra = (L.type === 'softbox' || L.type === 'beauty') ? 0.85 : 0.55;
      });
      // Remove stale
      for (const [id, entry] of s.lightObjs.entries()) {
        if (!seen.has(id)) {
          s.lightGroup.remove(entry.spot);
          s.lightGroup.remove(entry.spot.target);
          s.lightObjs.delete(id);
        }
      }
    }, [lights]);

    return React.createElement('div', {
      ref: mountRef,
      style: { width: '100%', height: '100%', position: 'relative' },
    });
  }

  Object.assign(window, { CameraScene, kelvinToRGB });
})();
