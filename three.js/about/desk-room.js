import * as THREE from "../vendor/three.module.js";
import { GLTFLoader } from "../vendor/GLTFLoader.js";

// Kenney Furniture Kit (CC0), recoloured to the site's cool greys and blue.
const MODELS = "Assets/aboutme/room/";
const PALETTE = {
  wood: 0x3a4148,
  metal: 0xc9d0d6,
  metalDark: 0x15191d,
  metalMedium: 0x59646e,
};
// Per-model overrides of the palette above.
const CABINET = { wood: 0x7d8894 };
// The 90s computer built below: beige-era shapes in the site's light greys, dark screen that lights up blue.
const RETRO_PC = { case: 0xd3d9de, caseShade: 0xb3bcc4, slot: 0x2b333b, screen: 0x1d2227, led: 0x4a86c8 };
const SCREEN_ON = 0x4a86c8;
const NOTE = { paper: 0xf4f5f2, tape: 0x9cbbe0 };
// Camera angles: front right, slightly above.
const VIEW_ELEVATION = THREE.MathUtils.degToRad(24);
const VIEW_AZIMUTH = THREE.MathUtils.degToRad(32);

function spring(value = 0) {
  return { value, velocity: 0, target: value };
}

function stepSpring(s, dt, stiffness = 170, damping = 18) {
  s.velocity += ((s.target - s.value) * stiffness - s.velocity * damping) * dt;
  s.value += s.velocity * dt;
  return Math.abs(s.target - s.value) > 1e-4 || Math.abs(s.velocity) > 1e-4;
}

// A box whose back face shrinks towards a smaller rectangle: the tapered rear of a CRT.
function taperedBox(width, height, depth, backScale) {
  const geometry = new THREE.BoxGeometry(width, height, depth);
  const position = geometry.attributes.position;
  for (let i = 0; i < position.count; i++) {
    if (position.getZ(i) >= 0) continue;
    position.setX(i, position.getX(i) * backScale);
    position.setY(i, position.getY(i) * backScale - height * (1 - backScale) * .25);
  }
  geometry.computeVertexNormals();
  return geometry;
}

// A 90s desktop PC (flat case, CRT on top), facing +z, standing on y = 0.
// Sizes are in desk units: the desk is .72 wide and .38 deep.
function buildRetroComputer() {
  const pc = new THREE.Group();
  const part = (geometry, material, x, y, z) => {
    const mesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ name: material }));
    mesh.position.set(x, y, z);
    pc.add(mesh);
    return mesh;
  };

  // Flat desktop case with a floppy drive, a CD tray and a power LED.
  part(new THREE.BoxGeometry(.25, .075, .15), "case", 0, .0375, 0);
  part(new THREE.BoxGeometry(.25, .006, .15), "caseShade", 0, .003, 0);
  part(new THREE.BoxGeometry(.07, .03, .004), "caseShade", .07, .04, .076);
  part(new THREE.BoxGeometry(.05, .005, .004), "slot", .07, .044, .078);
  part(new THREE.BoxGeometry(.08, .018, .004), "caseShade", -.05, .045, .076);
  part(new THREE.BoxGeometry(.008, .008, .004), "led", -.108, .022, .077);

  // CRT monitor on a swivel foot.
  part(new THREE.CylinderGeometry(.05, .06, .015, 16), "caseShade", 0, .0825, -.01);
  part(new THREE.BoxGeometry(.34, .29, .04), "case", 0, .235, .02);
  part(taperedBox(.32, .27, .19, .62), "caseShade", 0, .23, -.095);
  const screen = part(new THREE.BoxGeometry(.27, .21, .004), "screen", 0, .24, .041);
  screen.name = "screen";

  return pc;
}

export function enableDeskRoom(host) {
  const canvas = document.createElement("canvas");
  canvas.className = "about-room-canvas";
  canvas.setAttribute("aria-hidden", "true");
  host.append(canvas);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(26, 1, 0.1, 50);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x7d8a99, 2.2));
  const sun = new THREE.DirectionalLight(0xffffff, 2.6);
  sun.position.set(1.2, 3, 2.2);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.radius = 6;
  Object.assign(sun.shadow.camera, { left: -1.5, right: 1.5, top: 1.5, bottom: -1.5, near: .5, far: 8 });
  scene.add(sun);
  const fill = new THREE.DirectionalLight(0xb9d4ff, .9);
  fill.position.set(2, 1, 1);
  scene.add(fill);
  // A cool rim light from behind outlines the furniture against the pale page.
  const rim = new THREE.DirectionalLight(0xcfe0ff, 2.4);
  rim.position.set(-1.5, 1.8, -2.5);
  scene.add(rim);

  const pivot = new THREE.Group();
  scene.add(pivot);
  const room = new THREE.Group();
  pivot.add(room);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(6, 6), new THREE.ShadowMaterial({ color: 0x1c2321, opacity: .16 }));
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  room.add(floor);

  // Interactive parts: each has a spring driven between 0 (rest) and 1 (open / on).
  const parts = [];
  let radius = .8;
  let disposed = false;
  let frame = 0;
  let last = 0;

  const loader = new GLTFLoader();
  const load = (name) => new Promise((resolve, reject) => loader.load(MODELS + name + ".glb", (gltf) => resolve(gltf.scene), undefined, reject));

  // Thin dark strokes on the hard edges give an illustrated, technical-drawing look.
  const edgeMaterial = new THREE.LineBasicMaterial({ color: 0x1b2127, transparent: true, opacity: .32 });

  function recolour(object, overrides = {}) {
    const meshes = [];
    object.traverse((child) => { if (child.isMesh) meshes.push(child); });
    meshes.forEach((child) => {
      child.castShadow = true;
      child.receiveShadow = true;
      const source = Array.isArray(child.material) ? child.material : [child.material];
      const materials = source.map((material) => {
        const colour = overrides[material.name] ?? PALETTE[material.name] ?? 0xc9d0d6;
        // Faces sit a hair behind their edge strokes so the lines never flicker into dashes.
        return new THREE.MeshStandardMaterial({ name: material.name, color: colour, roughness: 1, metalness: 0, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 });
      });
      child.material = Array.isArray(child.material) ? materials : materials[0];
      const edges = new THREE.LineSegments(new THREE.EdgesGeometry(child.geometry, 30), edgeMaterial);
      edges.raycast = () => {};
      child.add(edges);
    });
  }

  // A paper note taped near the top of a door's inner face, only seen once the door swings open.
  function addNote(door) {
    door.updateWorldMatrix(true, true);
    const box = new THREE.Box3().setFromObject(door);
    const min = door.worldToLocal(box.min.clone()), max = door.worldToLocal(box.max.clone());
    const width = Math.abs(max.x - min.x) * .5;
    const note = new THREE.Group();
    const paper = new THREE.Mesh(new THREE.PlaneGeometry(width, width * 1.15), new THREE.MeshStandardMaterial({ color: NOTE.paper, roughness: 1, side: THREE.DoubleSide }));
    const tape = new THREE.Mesh(new THREE.PlaneGeometry(width * .45, width * .14), new THREE.MeshStandardMaterial({ color: NOTE.tape, roughness: 1, side: THREE.DoubleSide }));
    tape.position.set(0, width * .575, .001);
    const outline = new THREE.LineSegments(new THREE.EdgesGeometry(paper.geometry), edgeMaterial);
    outline.raycast = () => {};
    paper.add(outline);
    paper.receiveShadow = tape.receiveShadow = true;
    note.add(paper, tape);
    // Inner face is the door's back (-z); the note faces inwards, slightly askew.
    const inner = Math.min(min.z, max.z) - .002;
    note.position.set((min.x + max.x) / 2, Math.max(min.y, max.y) - width * .9, inner);
    note.rotation.set(0, Math.PI, THREE.MathUtils.degToRad(-4));
    door.add(note);
  }

  function addPart(object, apply) {
    const part = { object, apply, state: spring() };
    object.traverse((child) => { if (child.isMesh) child.userData.part = part; });
    parts.push(part);
    return part;
  }

  Promise.all(["desk", "bookcaseClosedDoors"].map(load))
    .then(([desk, cabinet]) => {
      if (disposed) return;
      recolour(desk);
      recolour(cabinet, CABINET);

      // Desk spans x 0 → .72, z -.38 → 0, top at y .384; the cabinet stands to its right.
      room.add(desk);
      cabinet.scale.setScalar(1.2);
      cabinet.position.set(.79, 0, -.02);
      room.add(cabinet);

      const computer = buildRetroComputer();
      recolour(computer, RETRO_PC);
      computer.position.set(.34, .384, -.25);
      room.add(computer);
      const screenMaterial = computer.getObjectByName("screen").material;
      const screenOff = new THREE.Color(RETRO_PC.screen), screenOn = new THREE.Color(SCREEN_ON);
      addPart(computer, (t) => {
        screenMaterial.color.lerpColors(screenOff, screenOn, t);
        screenMaterial.emissive.copy(screenOn).multiplyScalar(t * .45);
      });

      const drawer = desk.getObjectByName("drawer");
      if (drawer) {
        const rest = drawer.position.z;
        addPart(drawer, (t) => { drawer.position.z = rest + t * .16; });
      }
      const doorLeft = cabinet.getObjectByName("doorLeft");
      const doorRight = cabinet.getObjectByName("doorRight");
      if (doorLeft && doorRight) {
        addNote(doorLeft);
        const apply = (t) => { doorLeft.rotation.y = -t * 1.9; doorRight.rotation.y = t * 1.9; };
        addPart(cabinet, apply);
      }

      room.remove(floor);
      const box = new THREE.Box3().setFromObject(room);
      room.add(floor);
      const centre = box.getCenter(new THREE.Vector3());
      room.position.set(-centre.x, 0, -centre.z);
      pivot.position.y = -box.getSize(new THREE.Vector3()).y / 2;
      radius = box.getBoundingSphere(new THREE.Sphere()).radius;
      resize();
      host.classList.add("has-room");
      wake();
    })
    .catch((error) => { if (!disposed) console.error("About room could not be loaded", error); });

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();

  function pick(event) {
    const rect = canvas.getBoundingClientRect();
    pointer.set(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1);
    raycaster.setFromCamera(pointer, camera);
    const [hit] = raycaster.intersectObjects(room.children, true);
    return hit?.object.userData.part ?? null;
  }

  const events = new AbortController();
  const options = { signal: events.signal };
  host.addEventListener("pointermove", (event) => {
    host.classList.toggle("is-pointing", Boolean(pick(event)));
  }, options);
  host.addEventListener("pointerleave", () => {
    host.classList.remove("is-pointing");
  }, options);
  host.addEventListener("click", (event) => {
    const part = pick(event);
    if (!part) return;
    part.state.target = part.state.target ? 0 : 1;
    wake();
  }, options);

  function resize() {
    const { width, height } = canvas.getBoundingClientRect();
    if (!width || !height) return;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    // Keep the whole room in view whatever the frame's shape: fit its bounding sphere to the narrower field of view.
    const vertical = THREE.MathUtils.degToRad(camera.fov) / 2;
    const horizontal = Math.atan(Math.tan(vertical) * camera.aspect);
    const distance = radius * .84 / Math.sin(Math.min(vertical, horizontal));
    camera.position.set(Math.sin(VIEW_AZIMUTH) * Math.cos(VIEW_ELEVATION) * distance, Math.sin(VIEW_ELEVATION) * distance, Math.cos(VIEW_AZIMUTH) * Math.cos(VIEW_ELEVATION) * distance);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
    wake();
  }

  const observer = new ResizeObserver(resize);
  observer.observe(canvas);

  function tick(now) {
    frame = 0;
    const dt = Math.min(.033, last ? (now - last) / 1000 : .016);
    last = now;
    let moving = false;
    for (const part of parts) {
      moving |= stepSpring(part.state, dt);
      part.apply(part.state.value);
    }
    renderer.render(scene, camera);
    if (moving && !disposed) wake();
    else last = 0;
  }

  function wake() {
    if (!frame && !disposed) frame = requestAnimationFrame(tick);
  }

  return () => {
    disposed = true;
    cancelAnimationFrame(frame);
    events.abort();
    observer.disconnect();
    scene.traverse((child) => {
      if (!child.isMesh && !child.isLineSegments) return;
      child.geometry.dispose();
      (Array.isArray(child.material) ? child.material : [child.material]).forEach((m) => m.dispose());
    });
    renderer.dispose();
    canvas.remove();
  };
}
