// Homepage hero: an original, procedurally built 5-piece drum kit rendered
// with three.js in the "steel blueprint" style — graphite shells, chrome
// hardware, hairline edges and a blueprint floor grid. Drag to rotate.
import * as THREE from 'three';
import { RoomEnvironment } from '/assets/vendor/RoomEnvironment.js';

const stage = document.getElementById('kit-stage');
const labelLayer = document.getElementById('kit-labels');

function webglAvailable() {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
  } catch {
    return false;
  }
}

if (stage && webglAvailable()) init();

function init() {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  stage.prepend(renderer.domElement);

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(renderer), 0.04).texture;

  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 50);
  const target = new THREE.Vector3(0, 0.78, 0);

  // ---- Materials ----
  const COLORS = { carbon: 0x0b0405, graphite: 0x150e0f, steel: 0x382e30, slate: 0x858182, chalk: 0xffffff, red: 0xe32735 };
  const mat = {
    shell: new THREE.MeshStandardMaterial({ color: 0x1d1517, metalness: 0.55, roughness: 0.32, envMapIntensity: 0.9 }),
    head: new THREE.MeshStandardMaterial({ color: 0xd9d5d5, metalness: 0, roughness: 0.85, side: THREE.DoubleSide }),
    resonant: new THREE.MeshStandardMaterial({ color: 0x0b0405, metalness: 0.2, roughness: 0.6, side: THREE.DoubleSide }),
    chrome: new THREE.MeshStandardMaterial({ color: 0xd8d4d5, metalness: 1, roughness: 0.18 }),
    cymbal: new THREE.MeshStandardMaterial({ color: 0xb7aea9, metalness: 1, roughness: 0.32, side: THREE.DoubleSide }),
    seat: new THREE.MeshStandardMaterial({ color: 0x150e0f, metalness: 0.1, roughness: 0.9 }),
    red: new THREE.MeshBasicMaterial({ color: COLORS.red, side: THREE.DoubleSide }),
    edge: new THREE.LineBasicMaterial({ color: COLORS.chalk, transparent: true, opacity: 0.35 }),
    groove: new THREE.LineBasicMaterial({ color: COLORS.chalk, transparent: true, opacity: 0.12 }),
  };

  const kit = new THREE.Group();
  scene.add(kit);

  const circleLine = (r, material, segments = 96) => {
    const pts = [];
    for (let i = 0; i <= segments; i++) {
      const a = (i / segments) * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.cos(a) * r, 0, Math.sin(a) * r));
    }
    return new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), material);
  };

  const rod = (from, to, radius = 0.009, material = mat.chrome) => {
    const a = new THREE.Vector3(...from);
    const b = new THREE.Vector3(...to);
    const len = a.distanceTo(b);
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, len, 10), material);
    mesh.position.copy(a).lerp(b, 0.5);
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize());
    return mesh;
  };

  // Tripod stand: three splayed legs meeting a centre pole at `height`.
  const tripod = (x, z, height, spread = 0.24) => {
    const g = new THREE.Group();
    g.add(rod([x, 0.2, z], [x, height, z], 0.011));
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2 + Math.PI / 6;
      g.add(rod([x, 0.22, z], [x + Math.cos(a) * spread, 0.005, z + Math.sin(a) * spread], 0.008));
    }
    return g;
  };

  // A drum: shell, batter + resonant heads, hoops, lugs and hairline rims.
  // Built along +Y; callers rotate it into place.
  const drum = (radius, depth, { lugs = 8, resonantDark = true } = {}) => {
    const g = new THREE.Group();
    const shell = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, depth, 64, 1, true), mat.shell);
    g.add(shell);

    const batter = new THREE.Mesh(new THREE.CircleGeometry(radius * 0.985, 64), mat.head);
    batter.rotation.x = -Math.PI / 2;
    batter.position.y = depth / 2;
    g.add(batter);

    const reso = new THREE.Mesh(new THREE.CircleGeometry(radius * 0.985, 64), resonantDark ? mat.resonant : mat.head);
    reso.rotation.x = Math.PI / 2;
    reso.position.y = -depth / 2;
    g.add(reso);

    for (const y of [depth / 2, -depth / 2]) {
      const hoop = new THREE.Mesh(new THREE.TorusGeometry(radius * 1.005, Math.max(0.006, radius * 0.035), 8, 72), mat.chrome);
      hoop.rotation.x = Math.PI / 2;
      hoop.position.y = y;
      g.add(hoop);
      const rim = circleLine(radius * 1.04, mat.edge);
      rim.position.y = y;
      g.add(rim);
    }

    const lugGeo = new THREE.BoxGeometry(radius * 0.09, depth * 0.38, radius * 0.07);
    for (let i = 0; i < lugs; i++) {
      const a = (i / lugs) * Math.PI * 2;
      const lug = new THREE.Mesh(lugGeo, mat.chrome);
      lug.position.set(Math.cos(a) * radius * 1.03, 0, Math.sin(a) * radius * 1.03);
      lug.rotation.y = -a;
      g.add(lug);
    }
    return g;
  };

  // Cymbal: lathe profile with a bell, plus faint tonal grooves.
  const cymbal = (radius) => {
    const g = new THREE.Group();
    const profile = [
      new THREE.Vector2(0.0, 0.034),
      new THREE.Vector2(0.025, 0.033),
      new THREE.Vector2(0.045, 0.026),
      new THREE.Vector2(0.06, 0.012),
      new THREE.Vector2(radius * 0.55, 0.005),
      new THREE.Vector2(radius, -0.004),
    ];
    g.add(new THREE.Mesh(new THREE.LatheGeometry(profile, 72), mat.cymbal));
    g.add(circleLine(radius, mat.edge));
    for (const f of [0.35, 0.55, 0.75]) {
      const ring = circleLine(radius * f, mat.groove);
      ring.position.y = 0.006 + (1 - f) * 0.004;
      g.add(ring);
    }
    return g;
  };

  // ---- Kick (22") ----
  const kick = drum(0.28, 0.42, { lugs: 10, resonantDark: true });
  kick.rotation.x = Math.PI / 2; // batter faces the drummer (-z), resonant faces the viewer (+z)
  kick.position.set(0, 0.29, 0.05);
  kit.add(kick);
  // Front-head logo: the one signal-red mark on the kit.
  const logo = new THREE.Mesh(new THREE.RingGeometry(0.075, 0.095, 4, 1), mat.red);
  logo.rotation.z = Math.PI / 4;
  logo.position.set(0, 0.29, 0.05 + 0.211);
  kit.add(logo);
  const logoDot = new THREE.Mesh(new THREE.PlaneGeometry(0.05, 0.05), mat.red);
  logoDot.position.set(0, 0.29, 0.05 + 0.212);
  kit.add(logoDot);
  for (const s of [-1, 1]) kit.add(rod([s * 0.2, 0.12, 0.2], [s * 0.34, 0.005, 0.32], 0.008)); // spurs

  // ---- Toms on the kick ----
  const tom1 = drum(0.127, 0.2, { lugs: 6, resonantDark: false });
  tom1.position.set(-0.17, 0.84, 0.02);
  tom1.rotation.set(-0.38, 0, 0.12);
  kit.add(tom1);
  const tom2 = drum(0.152, 0.22, { lugs: 6, resonantDark: false });
  tom2.position.set(0.2, 0.86, 0.02);
  tom2.rotation.set(-0.38, 0, -0.12);
  kit.add(tom2);
  kit.add(rod([0, 0.56, 0.04], [0, 0.74, 0.02], 0.014));
  kit.add(rod([0, 0.74, 0.02], [-0.12, 0.76, 0.02], 0.01));
  kit.add(rod([0, 0.74, 0.02], [0.14, 0.77, 0.02], 0.01));

  // ---- Floor tom (16") ----
  const floorTom = drum(0.203, 0.4, { lugs: 8, resonantDark: false });
  floorTom.position.set(0.56, 0.47, -0.32);
  kit.add(floorTom);
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2 + 0.6;
    const x = 0.56 + Math.cos(a) * 0.225;
    const z = -0.32 + Math.sin(a) * 0.225;
    kit.add(rod([x, 0.42, z], [x + Math.cos(a) * 0.05, 0.005, z + Math.sin(a) * 0.05], 0.008));
  }

  // ---- Snare (14") ----
  const snare = drum(0.178, 0.14, { lugs: 10, resonantDark: false });
  snare.position.set(-0.47, 0.64, -0.3);
  snare.rotation.set(-0.08, 0, 0.06);
  kit.add(snare);
  kit.add(tripod(-0.47, -0.3, 0.56, 0.2));

  // ---- Hi-hat (14") ----
  const hatX = -0.84;
  const hatZ = -0.3;
  const hatBottom = cymbal(0.178);
  hatBottom.rotation.x = Math.PI;
  hatBottom.position.set(hatX, 0.98, hatZ);
  kit.add(hatBottom);
  const hatTop = cymbal(0.178);
  hatTop.position.set(hatX, 1.0, hatZ);
  kit.add(hatTop);
  kit.add(tripod(hatX, hatZ, 1.08, 0.22));

  // ---- Crash (18") on a boom stand ----
  kit.add(tripod(-0.62, 0.32, 1.2, 0.26));
  kit.add(rod([-0.62, 1.2, 0.32], [-0.48, 1.42, 0.12], 0.009));
  const crash = cymbal(0.229);
  crash.position.set(-0.46, 1.44, 0.1);
  crash.rotation.set(-0.32, 0, 0.22);
  kit.add(crash);

  // ---- Ride (20") ----
  kit.add(tripod(0.98, -0.02, 1.08, 0.26));
  kit.add(rod([0.98, 1.08, -0.02], [0.86, 1.22, -0.1], 0.009));
  const ride = cymbal(0.254);
  ride.position.set(0.84, 1.24, -0.12);
  ride.rotation.set(-0.22, 0, -0.18);
  kit.add(ride);

  // ---- Throne ----
  const seat = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.08, 40), mat.seat);
  seat.position.set(0, 0.56, -0.85);
  kit.add(seat);
  const seatRim = circleLine(0.172, mat.edge);
  seatRim.position.set(0, 0.6, -0.85);
  kit.add(seatRim);
  kit.add(tripod(0, -0.85, 0.52, 0.24));

  // ---- Sticks resting on the snare ----
  const stickMat = new THREE.MeshStandardMaterial({ color: 0xd9c7a8, roughness: 0.7 });
  kit.add(rod([-0.62, 0.72, -0.26], [-0.28, 0.73, -0.12], 0.007, stickMat));
  kit.add(rod([-0.6, 0.72, -0.34], [-0.27, 0.73, -0.28], 0.007, stickMat));

  // ---- Blueprint floor ----
  const grid = new THREE.GridHelper(6, 30, COLORS.steel, COLORS.steel);
  grid.material.transparent = true;
  grid.material.opacity = 0.55;
  scene.add(grid);
  const floorRing = circleLine(1.35, new THREE.LineBasicMaterial({ color: COLORS.slate, transparent: true, opacity: 0.4 }), 128);
  floorRing.position.y = 0.002;
  scene.add(floorRing);
  // Fade the grid into the canvas with a radial mask plane.
  const fade = new THREE.Mesh(
    new THREE.CircleGeometry(3.2, 64),
    new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      uniforms: { color: { value: new THREE.Color(COLORS.carbon) } },
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
      fragmentShader:
        'uniform vec3 color; varying vec2 vUv; void main(){ float d = distance(vUv, vec2(0.5)) * 2.0; gl_FragColor = vec4(color, smoothstep(0.35, 0.95, d)); }',
    })
  );
  fade.rotation.x = -Math.PI / 2;
  fade.position.y = 0.003;
  scene.add(fade);

  // ---- Lights ----
  scene.add(new THREE.HemisphereLight(0xffffff, 0x0b0405, 0.6));
  const key = new THREE.DirectionalLight(0xffffff, 2.4);
  key.position.set(2.5, 4, 3);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xffffff, 1.6);
  rim.position.set(-3, 2.5, -3.5);
  scene.add(rim);

  // ---- Labels (instrument callouts) ----
  const callouts = [
    { text: '01 · Kick 22"', obj: logo, offset: [0, 0, 0], accent: true },
    { text: '02 · Snare 14"', obj: snare, offset: [0, 0.08, 0] },
    { text: '03 · Hi-hat 14"', obj: hatTop, offset: [0, 0.03, 0] },
    { text: '04 · Ride 20"', obj: ride, offset: [0, 0.03, 0] },
    { text: '05 · Floor tom 16"', obj: floorTom, offset: [0, 0.2, 0] },
  ].map((c) => {
    const el = document.createElement('div');
    el.className = `kit-label mono${c.accent ? ' kit-label--accent' : ''}`;
    el.innerHTML = `<span class="kit-label__node"></span><span class="kit-label__line"></span><span class="kit-label__text">${c.text}</span>`;
    labelLayer?.appendChild(el);
    return { ...c, el, local: new THREE.Vector3(...c.offset) };
  });

  // ---- Sizing ----
  let width = 0;
  let height = 0;
  const resize = () => {
    width = stage.clientWidth;
    height = stage.clientHeight;
    if (!width || !height) return;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    // Pull back on narrow/tall stages so the whole kit stays in frame.
    const dist = camera.aspect < 1 ? 5.4 : camera.aspect < 1.4 ? 4.6 : 4.1;
    camera.position.set(0, 2.05, dist);
    camera.lookAt(target);
    camera.updateProjectionMatrix();
  };
  new ResizeObserver(resize).observe(stage);
  resize();

  // ---- Interaction ----
  let rotY = -0.55;
  let rotX = 0;
  let velocity = 0;
  let dragging = false;
  let lastX = 0;
  let lastY = 0;
  const canvas = renderer.domElement;
  canvas.addEventListener('pointerdown', (e) => {
    dragging = true;
    lastX = e.clientX;
    lastY = e.clientY;
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    lastX = e.clientX;
    lastY = e.clientY;
    velocity = dx * 0.006;
    rotY += velocity;
    rotX = THREE.MathUtils.clamp(rotX + dy * 0.003, -0.25, 0.3);
  });
  const release = () => (dragging = false);
  canvas.addEventListener('pointerup', release);
  canvas.addEventListener('pointercancel', release);

  // ---- Render loop (paused when off-screen or hidden) ----
  let visible = true;
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible) requestAnimationFrame(tick);
  }).observe(stage);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) requestAnimationFrame(tick);
  });

  const v = new THREE.Vector3();
  const clock = new THREE.Clock();
  let intro = 0;
  let labelsShown = false;
  let running = false;

  function placeLabels() {
    if (!labelLayer || width < 300) return;
    for (const c of callouts) {
      v.copy(c.local);
      c.obj.localToWorld(v);
      v.project(camera);
      const x = (v.x * 0.5 + 0.5) * width;
      const y = (-v.y * 0.5 + 0.5) * height;
      const flip = x > width * 0.62;
      c.el.style.flexDirection = flip ? 'row-reverse' : 'row';
      c.el.style.transform = `translate(${flip ? `calc(${x}px - 100% + 3.5px)` : `${x - 3.5}px`}, ${y - 12}px)`;
    }
  }

  function tick() {
    if (running) return;
    running = true;
    requestAnimationFrame(frame);
  }

  function frame() {
    running = false;
    if (!visible || document.hidden) return;
    const dt = Math.min(clock.getDelta(), 0.05);
    intro = Math.min(1, intro + dt * 0.9);
    const ease = 1 - Math.pow(1 - intro, 3);

    if (!dragging) {
      velocity *= 0.94;
      rotY += velocity + (reduceMotion ? 0 : dt * 0.12);
      rotX *= 0.96;
    }
    kit.rotation.y = rotY - (1 - ease) * 0.9;
    kit.rotation.x = rotX;
    kit.position.y = (1 - ease) * -0.15;
    grid.rotation.y = kit.rotation.y;
    floorRing.rotation.y = kit.rotation.y;

    renderer.render(scene, camera);
    placeLabels();
    if (!labelsShown && intro >= 1) {
      labelsShown = true;
      callouts.forEach((c, i) => setTimeout(() => c.el.classList.add('is-visible'), i * 120));
    }
    tick();
  }

  tick();
}
