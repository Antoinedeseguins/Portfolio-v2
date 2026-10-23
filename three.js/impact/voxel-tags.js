import * as THREE from "../vendor/three.module.js";
import { stepSpring, applySpray } from "./spring.js?v=8";
import { createResumeLock } from "../game-resume-lock.js";

// Impact's tags are destructible like its title: hold the pointer on a tag and spray it apart
// into cubes; the cubes always pull back together. At rest the crisp DOM tag shows instead.
// World units match the title toy (about 25 CSS px each) so the spray feels the same.
const PX = 25, STEP = 3, DEPTH = 30;

export function enableVoxelTags(layout) {
  const meta = layout.querySelector(".project-copy > .project-meta");
  if (!meta || !meta.children.length) return () => {};
  const lockResume = createResumeLock();
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const canvas = document.createElement("canvas");
  canvas.className = "voxel-tags-canvas";
  canvas.setAttribute("aria-hidden", "true");
  layout.append(canvas);
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 1, DEPTH * 3);
  camera.position.set(0, 0, DEPTH);
  const raycaster = new THREE.Raycaster(), pointer = new THREE.Vector2(), matrix = new THREE.Object3D();
  const events = new AbortController(), signal = events.signal;
  let tags = [], sprayPointer = null, lastTime = null, disposed = false;

  const newBody = (home, position = home.clone(), rotation = new THREE.Euler()) => ({
    home, position, rotation, velocity: new THREE.Vector3(), spin: new THREE.Vector3(),
    sprayStrength: 1, maxDistance: 7, maxSprayDepth: DEPTH + 10,
    scatter: { x: (Math.random() - .5) * 1.1, y: (Math.random() - .5) * 1.1, z: (Math.random() - .5) * .5, strength: .75 + Math.random() * .5 },
  });
  function release(tag) {
    scene.remove(tag.group);
    tag.mesh.dispose();
    tag.mesh.geometry.dispose();
    tag.chipMaterial.dispose();
    tag.letters.forEach(letter => letter.geometry.dispose());
    tag.letterMaterial.map.dispose();
    tag.letterMaterial.dispose();
    tag.element.style.removeProperty("opacity");
  }
  // Rebuild each tag from its current layout, font and colours: the chip breaks into small cubes,
  // while every letter becomes its own tile so the words stay readable as they fly.
  function build() {
    tags.forEach(release);
    const bounds = layout.getBoundingClientRect();
    if (!bounds.width || !bounds.height) return;
    renderer.setSize(bounds.width, bounds.height, false);
    camera.aspect = bounds.width / bounds.height;
    camera.fov = THREE.MathUtils.radToDeg(2 * Math.atan(bounds.height / PX / 2 / DEPTH));
    camera.updateProjectionMatrix();
    tags = [...meta.children].map(element => {
      const rect = element.getBoundingClientRect(), style = getComputedStyle(element);
      const width = Math.round(rect.width), height = Math.round(rect.height);
      const toWorld = (x, y) => new THREE.Vector3((rect.left - bounds.left + x - bounds.width / 2) / PX, (bounds.height / 2 - rect.top + bounds.top - y) / PX, 0);
      const group = new THREE.Group();
      group.visible = false;
      scene.add(group);

      // Chip: the same translucent tint as the DOM chip, unlit, so it blends with the page identically.
      // Flat tiles rather than cubes: side faces would overlap in the transparency and draw a grid.
      // Cells divide the chip exactly, so the pieces cover it edge to edge.
      const sample = document.createElement("canvas");
      sample.width = width; sample.height = height;
      const context = sample.getContext("2d", { willReadFrequently: true });
      context.fillStyle = "#000";
      context.beginPath(); context.roundRect(0, 0, width, height, parseFloat(style.borderRadius) || 0); context.fill();
      const coverage = context.getImageData(0, 0, width, height).data;
      const tint = style.backgroundColor.match(/[\d.]+/g).map(Number);
      const chipMaterial = new THREE.MeshBasicMaterial({ color: new THREE.Color().setRGB(tint[0] / 255, tint[1] / 255, tint[2] / 255, THREE.SRGBColorSpace), transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false });
      chipMaterial.userData.alpha = tint[3] ?? 1;
      const columns = Math.max(1, Math.round(rect.width / STEP)), rows = Math.max(1, Math.round(rect.height / STEP));
      const cellWidth = rect.width / columns, cellHeight = rect.height / rows;
      const cells = [];
      for (let row = 0; row < rows; row++) for (let column = 0; column < columns; column++) {
        const cx = (column + .5) * cellWidth, cy = (row + .5) * cellHeight;
        // Skip blocks outside the rounded corners.
        if (coverage[(Math.min(height - 1, cy | 0) * width + Math.min(width - 1, cx | 0)) * 4 + 3] > 127) cells.push(toWorld(cx, cy));
      }
      const mesh = new THREE.InstancedMesh(new THREE.PlaneGeometry(cellWidth / PX, cellHeight / PX), chipMaterial, cells.length);
      mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      mesh.frustumCulled = false;
      group.add(mesh);
      const bodies = cells.map(home => newBody(home));

      // Letters: one atlas per tag at triple resolution, one tile per glyph just in front of the chip.
      const scale = 3, font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
      const spacing = style.letterSpacing === "normal" ? "0px" : style.letterSpacing;
      const atlas = document.createElement("canvas");
      atlas.width = width * scale; atlas.height = height * scale;
      const ink = atlas.getContext("2d");
      ink.scale(scale, scale);
      Object.assign(ink, { font, letterSpacing: spacing, fillStyle: style.color, textBaseline: "middle" });
      const text = element.textContent, left = parseFloat(style.paddingLeft), baseline = height / 2 + .5;
      ink.fillText(text, left, baseline);
      const map = new THREE.CanvasTexture(atlas);
      map.colorSpace = THREE.SRGBColorSpace;
      map.anisotropy = 4;
      const letterMaterial = new THREE.MeshBasicMaterial({ map, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false });
      const letters = [];
      for (let i = 0; i < text.length; i++) {
        if (!text[i].trim()) continue;
        const start = left + ink.measureText(text.slice(0, i)).width;
        const glyph = ink.measureText(text[i]).width;
        const x0 = Math.max(0, start - 1), x1 = Math.min(width, start + glyph + 1), y0 = Math.max(0, baseline - 8), y1 = Math.min(height, baseline + 8);
        const letterGeometry = new THREE.PlaneGeometry((x1 - x0) / PX, (y1 - y0) / PX);
        const uv = letterGeometry.attributes.uv;
        for (let v = 0; v < uv.count; v++) uv.setXY(v, (uv.getX(v) ? x1 : x0) / width, 1 - (uv.getY(v) ? y0 : y1) / height);
        const letter = new THREE.Mesh(letterGeometry, letterMaterial);
        const home = toWorld((x0 + x1) / 2, (y0 + y1) / 2).setZ(STEP / PX * .6);
        letter.position.copy(home);
        letter.renderOrder = 1;
        group.add(letter);
        letters.push(letter);
        bodies.push(newBody(home, letter.position, letter.rotation));
      }
      return { element, group, mesh, chipMaterial, letters, letterMaterial, bodies, cubeCount: cells.length, active: false };
    });
  }

  // Letter tiles move through their own meshes; only the chip cubes need instance matrices.
  function writeMatrices(tag) {
    for (let index = 0; index < tag.cubeCount; index++) {
      const body = tag.bodies[index];
      matrix.position.copy(body.position); matrix.rotation.copy(body.rotation); matrix.updateMatrix();
      tag.mesh.setMatrixAt(index, matrix.matrix);
    }
    tag.mesh.instanceMatrix.needsUpdate = true;
  }
  // The pieces and the DOM tag cross-fade with how far the pieces have moved, so there is never
  // a visible swap: settled pieces are invisible over the real tag, flying ones replace it.
  function setFade(tag, amount) {
    tag.chipMaterial.opacity = tag.chipMaterial.userData.alpha * amount;
    tag.letterMaterial.opacity = amount;
    if (amount > 0) tag.element.style.opacity = String(1 - amount);
    else tag.element.style.removeProperty("opacity");
  }
  function setActive(tag, active) {
    if (tag.active === active) return;
    tag.active = active;
    tag.group.visible = active;
    if (!active) tag.bodies.forEach(body => { body.position.copy(body.home); body.rotation.set(0, 0, 0); body.velocity.set(0, 0, 0); body.spin.set(0, 0, 0); });
    setFade(tag, 0);
    writeMatrices(tag);
  }

  function aim(event) {
    const bounds = layout.getBoundingClientRect();
    pointer.set((event.clientX - bounds.left) / bounds.width * 2 - 1, -(event.clientY - bounds.top) / bounds.height * 2 + 1);
    // Any tag the pointer sweeps over while spraying breaks too.
    for (const tag of tags) {
      const rect = tag.element.getBoundingClientRect();
      if (event.clientX >= rect.left && event.clientX <= rect.right && event.clientY >= rect.top && event.clientY <= rect.bottom) setActive(tag, true);
    }
  }
  function render(time) {
    const dt = Math.min(lastTime === null ? 0 : (time - lastTime) / 1000, 1 / 30);
    lastTime = time;
    const steps = Math.max(1, Math.ceil(dt * 120));
    if (sprayPointer !== null) raycaster.setFromCamera(pointer, camera);
    let busy = sprayPointer !== null;
    for (const tag of tags) {
      if (!tag.active) continue;
      let separation = 0;
      for (const body of tag.bodies) {
        for (let i = 0; i < steps; i++) {
          if (sprayPointer !== null) applySpray(body, raycaster.ray, dt / steps, reducedMotion.matches);
          stepSpring(body, dt / steps);
        }
        separation = Math.max(separation, body.position.distanceTo(body.home), Math.abs(body.rotation.x) + Math.abs(body.rotation.y) + Math.abs(body.rotation.z));
      }
      if (sprayPointer === null && separation < .004) setActive(tag, false);
      else { busy = true; setFade(tag, THREE.MathUtils.smoothstep(separation, .02, .3)); writeMatrices(tag); }
    }
    renderer.render(scene, camera);
    if (!busy) { renderer.setAnimationLoop(null); lastTime = null; }
  }
  const start = () => { if (!disposed) renderer.setAnimationLoop(render); };
  const stopSpray = () => {
    if (sprayPointer === null) return;
    if (layout.hasPointerCapture(sprayPointer)) layout.releasePointerCapture(sprayPointer);
    sprayPointer = null;
    lockResume(false);
  };

  layout.addEventListener("pointerdown", event => {
    if (disposed || sprayPointer !== null || !event.isPrimary || event.button !== 0 || !event.target.closest?.(".project-meta > span") || !meta.contains(event.target)) return;
    event.preventDefault(); event.stopPropagation();
    sprayPointer = event.pointerId;
    layout.setPointerCapture(event.pointerId);
    lockResume(true);
    aim(event);
    start();
  }, { signal });
  layout.addEventListener("pointermove", event => { if (event.pointerId === sprayPointer) aim(event); }, { signal });
  for (const type of ["pointerup", "pointercancel", "lostpointercapture"]) {
    layout.addEventListener(type, event => { if (event.pointerId === sprayPointer) stopSpray(); }, { signal });
  }
  window.addEventListener("blur", stopSpray, { signal });
  const resizeObserver = new ResizeObserver(() => { if (!tags.some(tag => tag.active)) build(); });
  resizeObserver.observe(layout);
  document.fonts.ready.then(() => { if (!disposed && !tags.some(tag => tag.active)) build(); });
  build();

  return function dispose() {
    if (disposed) return;
    disposed = true;
    stopSpray();
    renderer.setAnimationLoop(null);
    events.abort();
    resizeObserver.disconnect();
    tags.forEach(release);
    renderer.dispose();
    renderer.forceContextLoss();
    canvas.remove();
  };
}
