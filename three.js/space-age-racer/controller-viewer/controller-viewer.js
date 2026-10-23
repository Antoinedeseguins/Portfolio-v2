import * as THREE from "../../vendor/three.module.js";
import { createController } from "./controller-model.js?v=15";
import { createControllerStudio } from "./controller-studio.js";
import { createControllerSignal } from "./controller-signal.js";
import { createControllerDemo } from "./controller-demo.js?v=2";
import { createBoostBurst } from "./controller-boost.js?v=2";
import { attachControllerAnnotations } from "./controller-annotations.js?v=22";

export async function enableController(frame) {
  if (!frame.isConnected || frame.closest(".page-outgoing, .page-drag-preview")) return;
  const response = await fetch(new URL("./descriptions.json", import.meta.url), { cache: "no-cache" });
  if (!response.ok) throw new Error(`Controller descriptions: HTTP ${response.status}`);
  const descriptions = await response.json();
  for (const key of ["overview", "left", "right", "boost", "arduino", "potentiometers", "potentiometerRight"]) {
    if (typeof descriptions[key]?.title !== "string" || typeof descriptions[key]?.description !== "string") {
      throw new Error(`Invalid controller description: ${key}`);
    }
  }
  if (!frame.isConnected || frame.closest(".page-outgoing, .page-drag-preview")) return;
  const canvas = frame.querySelector("canvas"), viewer = frame.querySelector(".controller-viewer");
  const abort = new AbortController(), events = { signal: abort.signal };
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true }); }
  catch {
    frame.classList.add("controller-unavailable");
    frame.querySelector(".controller-error").hidden = false;
    return;
  }
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.6));
  renderer.setClearColor(0x000000, 0);
  const scene = new THREE.Scene();
  scene.add(new THREE.HemisphereLight(0xffffff, 0x8d989e, 2.8));
  const key = new THREE.DirectionalLight(0xfff4e4, 3.5); key.position.set(-7, 8, 7); scene.add(key);
  const fill = new THREE.DirectionalLight(0xd3e6f2, 1.7); fill.position.set(5, 3, -4); scene.add(fill);
  const camera = new THREE.PerspectiveCamera(34, 16 / 9, .1, 80);
  const model = createController(); scene.add(model.root);
  const studio = createControllerStudio(scene, renderer, key);
  // The front and top covers withdraw together to expose the mechanism.
  const coverMaterial = model.frontPanel.material.clone();
  coverMaterial.transparent = true;
  model.frontPanel.material = coverMaterial;
  const roofMaterials = new Map();
  model.roof.traverse(object => {
    if (!object.isMesh) return;
    if (!roofMaterials.has(object.material)) {
      const material = object.material.clone();
      material.transparent = true;
      roofMaterials.set(object.material, material);
    }
    object.material = roofMaterials.get(object.material);
  });
  const coverMaterials = [coverMaterial, ...roofMaterials.values()];
  // Each hover target owns its materials, so lighting one part never lights another.
  const hoverMaterials = [];
  function highlightGroup(objects, exclude = null) {
    const materials = new Map();
    for (const root of objects) root.traverse(object => {
      if (!object.isMesh || object === exclude) return;
      if (!materials.has(object.material)) {
        const material = object.material.clone();
        materials.set(object.material, material); hoverMaterials.push(material);
      }
      object.material = materials.get(object.material);
    });
    return { materials: [...materials.values()], value: 0 };
  }
  const highlights = {
    left: highlightGroup([model.levers[0]]),
    right: highlightGroup([model.levers[1]], model.boost),
    boost: highlightGroup([model.boost]),
    arduino: highlightGroup([model.board]),
    potentiometers: highlightGroup([model.sensors[0], model.couplings[0]]),
    potentiometerRight: highlightGroup([model.sensors[1], model.couplings[1]]),
    cover: { materials: [coverMaterial], value: 0 },
  };
  const target = new THREE.Vector3(0, 1.45, 0);
  const raycaster = new THREE.Raycaster(), pointer = new THREE.Vector2();
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  let azimuth = -.5, elevation = .25, distance = 11.2;
  let distanceScale = 1;
  let opened = false, removal = 0, boosted = false, drag = null;
  let hoveredPart = null, selectedPart = null;
  let disposed = false, visible = true, raf = null, previousTime = null;
  const signal = createControllerSignal(model);
  const demo = createControllerDemo();
  const burst = createBoostBurst(scene, model);
  const angles = [0, 0], desired = [0, 0];
  const annotations = attachControllerAnnotations(frame, model, camera, {
    toggleOpen: () => setOpen(!opened),
    highlight: id => { hoveredPart = id; wake(); },
    select: part => {
      demo.select(part);
      if (part === "sensors" || part === "sensorsRight") signal.play(part === "sensors" ? 0 : 1);
      else if (part === "boost" && opened && removal > .85) signal.play(2);
      else signal.stop();
      selectedPart = { lever0: "left", lever1: "right", boost: "boost", sensors: "potentiometers", sensorsRight: "potentiometerRight", arduino: "arduino" }[part] || null;
      selectPart(part);
    },
    pressBoost: value => {
      if (value) demo.cancel();
      boost(value);
    },
    reset: () => {
      demo.cancel();
      if (drag) release({ pointerId: drag.id }, true);
      azimuth = -.5; elevation = .25; distance = 11.2;
      setLever(0, 0); setLever(1, 0); boost(false); setOpen(false); selectPart("levers");
    },
  }, events, descriptions);
  function updateCamera() {
    const radius = distance * distanceScale;
    camera.position.set(target.x + radius * Math.sin(azimuth) * Math.cos(elevation), target.y + radius * Math.sin(elevation), target.z + radius * Math.cos(azimuth) * Math.cos(elevation));
    camera.lookAt(target); camera.updateMatrixWorld();
  }
  function setOpen(value) {
    opened = value;
    if (!value) signal.stop();
    if (!value && ["arduino", "potentiometers", "potentiometerRight"].includes(selectedPart)) selectedPart = null;
    model.frontPanel.visible = true;
    model.roof.visible = true;
    wake();
  }
  function selectPart(part) {
    const id = part.startsWith("lever") ? "levers" : part;
    if (id === "cover") setOpen(!opened);
    wake();
  }
  function boost(value) {
    // A fresh press kicks the controller; holding the button does not repeat it.
    if (value && !boosted && !reduced.matches) burst.trigger();
    boosted = value;
    wake();
  }
  // Rotation gauge: the arc fills with the lever's angle, on the side it leans towards, and its tip
  // points the way the lever is turning. It pops in slightly larger and fades with the lever's rest.
  const gaugeHold = [0, 0], gaugeFade = [0, 0], gaugeTurn = [1, 1];
  const tipAxis = new THREE.Vector3(0, 1, 0), tipDirection = new THREE.Vector3();
  function updateGauge(arrow, angle, turn, fade) {
    const { gauge, arcs, tip, material } = arrow.userData;
    arrow.visible = fade > 0;
    if (!arrow.visible) return;
    material.opacity = fade;
    arrow.scale.setScalar(.85 + .15 * (1 - (1 - fade) ** 3) + .06 * Math.sin(Math.PI * fade));
    const reach = Math.min(1, Math.abs(angle) / (Math.PI / 6));
    const side = angle < 0 ? 1 : 0;
    arcs.forEach((arc, index) => {
      arc.visible = index === side;
      arc.geometry.setDrawRange(0, Math.round(reach * gauge.segments) * gauge.radial * 6);
    });
    const end = (angle < 0 ? -1 : 1) * reach * gauge.sweep;
    tip.position.set(gauge.offset, Math.cos(end) * gauge.radius, Math.sin(end) * gauge.radius);
    tipDirection.set(0, -Math.sin(end), Math.cos(end)).multiplyScalar(turn);
    tip.quaternion.setFromUnitVectors(tipAxis, tipDirection);
  }
  function draw() { updateCamera(); studio.update(camera); renderer.render(scene, camera); annotations.update(opened && removal > .85); }
  function tick(time) {
    raf = null;
    if (disposed || !visible || document.hidden) return;
    const dt = previousTime === null ? 1 / 60 : Math.min(.04, (time - previousTime) / 1000);
    previousTime = time;
    const factor = reduced.matches ? 1 : 1 - Math.exp(-dt * 9);
    const hoverTarget = hoveredPart === "body" ? (opened && removal > .85 ? "arduino" : "cover") : hoveredPart;
    const demonstration = demo.update(dt, reduced.matches);
    const bursting = burst.update(dt);
    if (selectedPart === "boost" && opened && removal > .85 && !signal.active && !reduced.matches) signal.play(2);
    const arrivalFlash = signal.update(dt, opened && removal > .85, reduced.matches);
    let highlightMoving = false;
    for (const [id, group] of Object.entries(highlights)) {
      const destination = hoverTarget === id || selectedPart === id ? 1 : 0;
      group.value += (destination - group.value) * factor;
      if (Math.abs(group.value - destination) < .001) group.value = destination;
      else highlightMoving = true;
      for (const material of group.materials) material.emissive.setRGB(
        group.value * .025 + (id === "boost" && boosted ? .23 : 0) + (id === "arduino" ? arrivalFlash * .35 : 0),
        group.value * .24 + (id === "boost" && boosted ? .04 : 0) + (id === "arduino" ? arrivalFlash * .2 : 0),
        group.value * .48 + (id === "arduino" ? arrivalFlash * .08 : 0),
      );
    }
    model.led.material.emissive.r += demonstration.led + arrivalFlash * .6;
    model.led.material.emissive.g += demonstration.led * .3 + arrivalFlash * .2;
    model.frontPanel.position.copy(model.frontPanelRest);
    const destination = opened ? 1 : 0;
    removal = reduced.matches ? destination : THREE.MathUtils.clamp(removal + (opened ? 1 : -1) * dt / .42, 0, 1);
    const eased = removal * removal * (3 - 2 * removal);
    model.frontPanel.position.z += eased * .55;
    model.frontPanel.position.y += eased * .06;
    model.frontPanel.visible = removal < 1;
    model.roof.position.copy(model.roofRest);
    model.roof.position.y += eased * .65;
    model.roof.visible = removal < 1;
    for (const material of coverMaterials) {
      material.opacity = 1 - eased;
      material.depthWrite = removal === 0;
    }
    let gaugeMoving = false;
    for (let i = 0; i < 2; i++) {
      const previous = angles[i];
      angles[i] += (desired[i] - angles[i]) * factor;
      const angle = THREE.MathUtils.clamp(angles[i], -Math.PI / 6, Math.PI / 6);
      model.levers[i].rotation.x = model.axleRigs[i].rotation.x = angle;
      const moving = Math.abs(desired[i] - angles[i]) > .001;
      if (moving) gaugeTurn[i] = Math.sign(angles[i] - previous) || gaugeTurn[i];
      // The gauge lingers briefly after the lever stops, then fades out.
      gaugeHold[i] = moving ? .6 : Math.max(0, gaugeHold[i] - dt);
      const shown = opened && removal > .85 && gaugeHold[i] > 0;
      gaugeFade[i] = reduced.matches ? (shown ? 1 : 0) : THREE.MathUtils.clamp(gaugeFade[i] + (shown ? 1 : -1) * dt / .18, 0, 1);
      if (gaugeFade[i] > 0 && gaugeFade[i] < 1 || gaugeHold[i] > 0) gaugeMoving = true;
      updateGauge(model.rotationArrows[i], angle, gaugeTurn[i], gaugeFade[i]);
    }
    model.boost.position.x = -.94 + .025 * (boosted ? 1 : demonstration.press);
    draw();
    if (bursting || gaugeMoving || demo.active || signal.active || removal !== destination || highlightMoving || angles.some((angle, i) => Math.abs(desired[i] - angle) > .001)) raf = requestAnimationFrame(tick);
    else previousTime = null;
  }
  function wake() { if (!disposed && visible && !document.hidden && raf === null) { previousTime = null; raf = requestAnimationFrame(tick); } }
  function ray(event) {
    const rect = canvas.getBoundingClientRect();
    pointer.set((event.clientX - rect.left) / rect.width * 2 - 1, -(event.clientY - rect.top) / rect.height * 2 + 1);
    raycaster.setFromCamera(pointer, camera);
    return raycaster.intersectObjects(model.picks, false).find(hit => {
      for (let object = hit.object; object; object = object.parent) if (!object.visible) return false;
      if (removal > .5 && hit.object === model.frontPanel) return false;
      // Hide internal hotspots while the enclosure is closed.
      return (opened && removal > .85) || !["arduino", "sensors"].includes(hit.object.userData.part);
    });
  }
  function setLever(index, degrees) {
    const value = THREE.MathUtils.clamp(degrees, -30, 30);
    desired[index] = THREE.MathUtils.degToRad(value); wake();
  }
  function release(event, cancelled = false) {
    if (!drag || drag.id !== event.pointerId) return;
    const old = drag; drag = null;
    if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
    canvas.classList.remove("is-grabbed");
    if (old.part === "boost") boost(false);
    if (!cancelled && !old.moved && old.part) selectPart(old.part);
  }
  canvas.addEventListener("pointerdown", event => {
    if (event.button !== 0 || !event.isPrimary || drag) return;
    event.preventDefault(); event.stopPropagation(); canvas.focus({ preventScroll: true });
    const part = ray(event)?.object.userData.part;
    const index = part === "lever0" ? 0 : part === "lever1" ? 1 : null;
    if (index !== null) angles[index] = desired[index] = model.levers[index].rotation.x;
    if (index !== null || part === "boost") demo.cancel();
    drag = { id: event.pointerId, x: event.clientX, y: event.clientY, startX: event.clientX, startY: event.clientY, part, index, startAngle: index !== null ? THREE.MathUtils.radToDeg(desired[index]) : 0, moved: false };
    canvas.setPointerCapture(event.pointerId); canvas.classList.add("is-grabbed");
    if (part === "boost") { selectPart("boost"); boost(true); }
  }, events);
  canvas.addEventListener("pointermove", event => {
    if (!drag || drag.id !== event.pointerId) return;
    const dx = event.clientX - drag.x, dy = event.clientY - drag.y;
    if (Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) > 4) drag.moved = true;
    if (drag.index !== null) setLever(drag.index, drag.startAngle - (event.clientY - drag.startY) * .45);
    else if (drag.part !== "boost") { azimuth -= dx * .008; elevation = THREE.MathUtils.clamp(elevation + dy * .007, -.12, 1.1); wake(); }
    drag.x = event.clientX; drag.y = event.clientY;
  }, events);
  // Hovering a part that can be handled lights it; clickable parts also get a pointer cursor.
  const handles = { lever0: ["left", ""], lever1: ["right", ""], boost: ["boost", "press"], cover: ["cover", "press"], arduino: ["arduino", "press"] };
  function hoverCanvas(part) {
    const [id, kind] = handles[part] ?? [null, ""];
    canvas.dataset.hover = kind;
    if (id === hoveredPart) return;
    hoveredPart = id; wake();
  }
  canvas.addEventListener("pointermove", event => {
    if (drag || event.pointerType === "touch") return;
    hoverCanvas(ray(event)?.object.userData.part);
  }, events);
  canvas.addEventListener("pointerleave", () => { if (!drag) hoverCanvas(null); }, events);
  canvas.addEventListener("pointerup", e => release(e), events);
  canvas.addEventListener("pointercancel", e => release(e, true), events);
  canvas.addEventListener("lostpointercapture", e => release(e, true), events);
  canvas.addEventListener("wheel", event => {
    event.preventDefault(); distance = THREE.MathUtils.clamp(distance + event.deltaY * .009, 8.5, 19); wake();
  }, { ...events, passive: false });
  canvas.addEventListener("keydown", event => {
    if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "+", "=", "-", "Escape"].includes(event.key)) return;
    event.preventDefault();
    if (event.key === "ArrowLeft") azimuth -= .12;
    if (event.key === "ArrowRight") azimuth += .12;
    if (event.key === "ArrowUp") elevation = Math.min(1.1, elevation + .1);
    if (event.key === "ArrowDown") elevation = Math.max(-.12, elevation - .1);
    if (["+", "="].includes(event.key)) distance = Math.max(8.5, distance - .7);
    if (event.key === "-") distance = Math.min(19, distance + .7);
    if (event.key === "Escape") { if (drag) release({ pointerId: drag.id }, true); boost(false); }
    wake();
  }, events);
  function resize() {
    if (disposed) return;
    const rect = viewer.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    renderer.setSize(rect.width, rect.height, false);
    distanceScale = rect.width < 600 ? 1.15 : 1;
    camera.aspect = rect.width / rect.height;
    camera.clearViewOffset();
    camera.updateProjectionMatrix(); draw();
  }
  const observer = new ResizeObserver(resize); observer.observe(viewer);
  const intersection = new IntersectionObserver(entries => {
    visible = entries[0].isIntersecting;
    if (visible) wake(); else { cancelAnimationFrame(raf); raf = null; previousTime = null; }
  }); intersection.observe(frame);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) { if (drag) release({ pointerId: drag.id }, true); boost(false); cancelAnimationFrame(raf); raf = null; previousTime = null; }
    else wake();
  }, events);
  frame.addEventListener("hero-dispose", () => {
    if (disposed) return;
    disposed = true;
    if (drag) release({ pointerId: drag.id }, true);
    abort.abort(); observer.disconnect(); intersection.disconnect(); cancelAnimationFrame(raf);
    const geometries = new Set();
    scene.traverse(object => { if (object.geometry) geometries.add(object.geometry); });
    geometries.forEach(g => g.dispose()); Object.values(model.materials).forEach(m => { m.map?.dispose(); m.dispose(); });
    studio.dispose();
    signal.dispose();
    burst.dispose();
    hoverMaterials.forEach(material => material.dispose()); coverMaterials.forEach(material => material.dispose()); renderer.dispose();
  }, { once: true });
  resize(); frame.classList.add("controller-ready"); wake();
}
