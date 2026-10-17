import * as THREE from "../vendor/three.module.js";
import { stepSpring, applySpray } from "./spring.js?v=7";
import { sampleText } from "./text-shape.js?v=4";
import { createResumeLock } from "../game-resume-lock.js";

export function createMagneticCube(canvas, { color = 0x1769f5, text = "", fontFamily = "Raleway", fontWeight = "700", anchor = null, surface = null } = {}) {
  const input = anchor || canvas;
  const lockResume = createResumeLock();
  const interactionSurface = surface || input;
  const interactionTarget = (event) => {
    if (!surface) return input;
    const target = event.target.closest?.('.toy-widget[data-toy="magnetic-cube"], .toy-widget[data-toy="voxel-title"]');
    return target && surface.contains(target) ? target : null;
  };
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const textShape = text ? sampleText(text, fontFamily, fontWeight) : null;
  const label = textShape ? anchor?.closest("h1")?.querySelector(".voxel-title-label") : null;
  const baselineMarker = label ? document.createElement("span") : null;
  if (baselineMarker) {
    baselineMarker.style.cssText = "display:inline-block;width:0;height:0;vertical-align:baseline;padding:0;margin:0";
    baselineMarker.setAttribute("aria-hidden", "true");
    label.append(baselineMarker);
  }
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 60);
  if (textShape) camera.position.set(0, 0, 12);
  else camera.position.set(4.6, 3.8, 7.5);
  camera.lookAt(0, 0, 0);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x728094, 3));
  const light = new THREE.DirectionalLight(0xffffff, 4);
  light.position.set(4, 6, 5);
  scene.add(light);
  const fill = new THREE.DirectionalLight(0x77aaff, 2);
  fill.position.set(-4, 1, -3);
  scene.add(fill);
  const group = new THREE.Group();
  scene.add(group);
  const gridSize = 4;
  const cubeSize = textShape ? textShape.size : anchor && surface ? 0.43 : 0.5;
  const center = (gridSize - 1) / 2;
  const geometry = new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize);
  const material = textShape
    ? new THREE.MeshStandardMaterial({ color, metalness: 0, roughness: .8 })
    : new THREE.MeshStandardMaterial({ color: 0xf50091, metalness: .25, roughness: .3 });
  const outlineBox = new THREE.BoxGeometry(gridSize * cubeSize, gridSize * cubeSize, gridSize * cubeSize);
  const edgeGeometry = new THREE.EdgesGeometry(outlineBox);
  outlineBox.dispose();
  const edgeMaterial = new THREE.LineBasicMaterial({ color: 0x8c325d, transparent: true, opacity: 0.55 });
  const outline = new THREE.LineSegments(edgeGeometry, edgeMaterial);
  if (!textShape) group.add(outline);
  if (!textShape) edgeMaterial.opacity = 0;
  const bodies = [];
  const positions = textShape ? textShape.positions : [];
  if (!textShape) {
    for (let x = 0; x < gridSize; x++) for (let y = 0; y < gridSize; y++) for (let z = 0; z < gridSize; z++) {
      positions.push({ x: (x - center) * cubeSize, y: (y - center) * cubeSize, z: (z - center) * cubeSize });
    }
  }
  const instances = textShape ? new THREE.InstancedMesh(geometry, material, positions.length) : null;
  if (instances) {
    instances.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    instances.frustumCulled = false;
    group.add(instances);
  }
  for (const position of positions) {
    const pieceMaterial = textShape ? material : material.clone();
    const mesh = new THREE.Mesh(geometry, pieceMaterial);
    mesh.position.set(position.x, position.y, position.z);
    if (!instances) group.add(mesh);
    bodies.push({ mesh, home: mesh.position.clone(), position: mesh.position, rotation: mesh.rotation,
      velocity: new THREE.Vector3(), spin: new THREE.Vector3(),
      sprayStrength: textShape ? 1 : 1.95,
      maxDistance: textShape ? 7 : 12,
      scatter: textShape ? {
        x: (Math.random() - 0.5) * 1.1,
        y: (Math.random() - 0.5) * 1.1,
        z: (Math.random() - 0.5) * 0.5,
        strength: 0.75 + Math.random() * 0.5,
      } : null });
  }
  const updateInstances = () => {
    if (!instances) return;
    bodies.forEach((body, index) => { body.mesh.updateMatrix(); instances.setMatrixAt(index, body.mesh.matrix); });
    instances.instanceMatrix.needsUpdate = true;
  };
  updateInstances();
  const raycaster = new THREE.Raycaster();
  const sprayRay = new THREE.Ray();
  const inverseGroup = new THREE.Matrix4();
  const pointer = new THREE.Vector2();
  const events = new AbortController();
  let disposed = false;
  let paused = false;
  let visible = true;
  let lastTime = null;
  let sprayPointer = null;
  let keyboardSpray = false;

  const updatePointer = (event) => {
    const rect = canvas.getBoundingClientRect();
    pointer.set((event.clientX - rect.left) / rect.width * 2 - 1, -(event.clientY - rect.top) / rect.height * 2 + 1);
  };
  const stopSpray = () => {
    lockResume(false);
    const pointerId = sprayPointer;
    sprayPointer = null;
    keyboardSpray = false;
    input.classList.remove("is-spraying");
    if (pointerId !== null && interactionSurface.hasPointerCapture(pointerId)) interactionSurface.releasePointerCapture(pointerId);
  };
  interactionSurface.addEventListener("pointerdown", (event) => {
    if (disposed || paused || sprayPointer !== null || !event.isPrimary || event.button !== 0) return;
    if (!interactionTarget(event)) return;
    event.preventDefault();
    event.stopPropagation();
    updatePointer(event);
    sprayPointer = event.pointerId;
    lockResume(true);
    interactionSurface.setPointerCapture(event.pointerId);
    input.classList.add("is-spraying");
  }, { signal: events.signal });
  interactionSurface.addEventListener("pointermove", (event) => {
    if (event.pointerId === sprayPointer) updatePointer(event);
  }, { signal: events.signal });
  for (const type of ["pointerup", "pointercancel", "lostpointercapture"]) {
    interactionSurface.addEventListener(type, (event) => {
      if (event.pointerId === sprayPointer) stopSpray();
    }, { signal: events.signal });
  }
  input.addEventListener("blur", stopSpray, { signal: events.signal });
  interactionSurface.addEventListener("focusout", () => {
    if (keyboardSpray) stopSpray();
  }, { signal: events.signal });
  window.addEventListener("blur", stopSpray, { signal: events.signal });
  interactionSurface.addEventListener("keydown", (event) => {
    if (event.key !== " " && event.key !== "Enter") return;
    const target = interactionTarget(event);
    if (!target) return;
    event.preventDefault();
    if (paused || disposed) return;
    keyboardSpray = true;
    lockResume(true);
    const rect = target.getBoundingClientRect();
    updatePointer({ clientX: rect.left + rect.width / 2, clientY: rect.top + rect.height / 2 });
    input.classList.add("is-spraying");
  }, { signal: events.signal });
  interactionSurface.addEventListener("keyup", (event) => {
    if (event.key === " " || event.key === "Enter") stopSpray();
  }, { signal: events.signal });

  const render = (time) => {
    if (surface?.classList.contains("page-entering")) resize(false);
    const dt = Math.min(lastTime === null ? 0 : (time - lastTime) / 1000, 1 / 30);
    lastTime = time;
    const steps = Math.max(1, Math.ceil(dt * 120));
    const spraying = sprayPointer !== null || keyboardSpray;
    if (spraying) {
      scene.updateMatrixWorld(true);
      raycaster.setFromCamera(pointer, camera);
      sprayRay.copy(raycaster.ray).applyMatrix4(inverseGroup.copy(group.matrixWorld).invert());
    }
    for (let i = 0; i < steps; i++) bodies.forEach((body) => {
      if (spraying) applySpray(body, sprayRay, dt / steps, reducedMotion.matches);
      stepSpring(body, dt / steps);
    });
    // Fade the assembled cube's outline as its pieces separate.
    const separation = Math.max(...bodies.map((body) => body.position.distanceTo(body.home)));
    edgeMaterial.opacity = 0.55 * Math.max(0, 1 - separation / 0.35);
    updateInstances();
    renderer.render(scene, camera);
  };
  const updateLoop = () => {
    lastTime = null;
    if (document.hidden || !visible) stopSpray();
    renderer.setAnimationLoop(!disposed && !paused && visible && !document.hidden ? render : null);
  };
  const resize = (renderNow = true) => {
    if (disposed || paused) return;
    if (surface) {
      const rect = surface.getBoundingClientRect();
      canvas.style.left = `${-rect.left}px`;
      canvas.style.top = `${-rect.top}px`;
      canvas.style.width = `${document.documentElement.clientWidth}px`;
      canvas.style.height = `${Math.max(window.innerHeight, rect.bottom)}px`;
    }
    const { width, height } = canvas.getBoundingClientRect();
    const anchorRect = input.getBoundingClientRect();
    if (!width || !height || !anchorRect.width || !anchorRect.height) return;
    renderer.setSize(width, height, false);
    camera.aspect = anchorRect.width / anchorRect.height;
    if (textShape) {
      const fontSize = parseFloat(getComputedStyle(input).fontSize);
      const worldPerPixel = textShape.scale * 128 / fontSize;
      const baseline = baselineMarker ? baselineMarker.getBoundingClientRect().top - anchorRect.top : anchorRect.height * 0.8;
      group.position.y = (anchorRect.height / 2 - baseline) * worldPerPixel;
      const labelLeft = label ? label.getBoundingClientRect().left - anchorRect.left : 0;
      group.position.x = (labelLeft + textShape.advanceWidth * fontSize / 256 - anchorRect.width / 2) * worldPerPixel;
      camera.fov = THREE.MathUtils.radToDeg(2 * Math.atan(anchorRect.height * worldPerPixel / 2 / (12 - cubeSize / 2)));
    }
    if (surface) {
      const rect = canvas.getBoundingClientRect();
      camera.setViewOffset(anchorRect.width, anchorRect.height, rect.left - anchorRect.left, rect.top - anchorRect.top, width, height);
    }
    camera.updateProjectionMatrix();
    if (renderNow !== false) renderer.render(scene, camera);
  };
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(input);
  if (surface) resizeObserver.observe(surface);
  const intersectionObserver = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; updateLoop(); });
  intersectionObserver.observe(input);
  window.addEventListener("resize", resize, { signal: events.signal });
  input.addEventListener("hero-ready", resize, { signal: events.signal });
  document.addEventListener("visibilitychange", updateLoop, { signal: events.signal });
  resize();
  updateLoop();
  return {
    pause() { paused = true; stopSpray(); updateLoop(); },
    snapshot() {
      renderer.render(scene, camera);
      const snapshot = document.createElement("canvas");
      snapshot.width = canvas.width;
      snapshot.height = canvas.height;
      snapshot.getContext("2d").drawImage(canvas, 0, 0);
      return snapshot;
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      stopSpray();
      renderer.setAnimationLoop(null);
      events.abort();
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      geometry.dispose();
      material.dispose();
      bodies.forEach((body) => { if (body.mesh.material !== material) body.mesh.material.dispose(); });
      edgeGeometry.dispose();
      edgeMaterial.dispose();
      instances?.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      baselineMarker?.remove();
    },
  };
}
