import { createGame, resetGame, stepGame, defeatVisual, cloudShadow } from "./source-game.js?v=12";

const smokeColors = {
  normal: { core: "82,77,102", soft: "111,105,129", edge: "130,123,148" },
  dense: { core: "153,56,62", soft: "182,80,84", edge: "199,111,112" },
};

export function beamSettings(distance, scale = 1) {
  const focus = Math.max(0, Math.min((distance - 30) / 360, 1));
  return {
    focus,
    power: 1.3 + focus * 3.2,
    angle: 0.72 + (0.045 - 0.72) * focus,
    intensity: (0.18 + 0.16 * focus) * (.7 + .3 * scale),
    length: (150 + 650 * focus) * scale,
    color: focus >= 0.9 ? { r: 250, g: 50, b: 55 } : { r: 83, g: 132, b: 255 },
  };
}

export function avatarArrival() {
  return { core: 1, halo: 1, rings: 1, scale: 1, ready: true };
}

export function createToy(canvas, { anchor = canvas, surface = null } = {}) {
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas 2D unavailable");
  const events = new AbortController();
  const avatar = new Image();
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const game = createGame();
  const title = anchor.closest(".project-title-row")?.querySelector(".project-title");
  const highlight = title ? document.createElement("span") : null;
  if (highlight) {
    highlight.className = "beam-title-highlight";
    highlight.textContent = title.textContent;
    highlight.setAttribute("aria-hidden", "true");
    title.classList.add("light-reactive-title");
    title.append(highlight);
  }
  let titleBounds = null;
  let width = 0, height = 0, frame = null, previousTime = null;
  let paused = false, disposed = false, visible = true;
  let pointerId = null, keyboard = false, active = false;
  let hovered = false, focused = false, hoverAmount = 0;
  let target = { x: 0, y: 0 };
  let angle = 0, distance = 180, opacity = 0, titleOpacity = 0, phase = 0;
  let arrivalTime = 0;
  let origin = { x: 0, y: 0, radius: 22 };

  const updateTarget = (event) => {
    const rect = canvas.getBoundingClientRect();
    target = { x: event.clientX - rect.left, y: event.clientY - rect.top };
  };
  const stop = (reset = true) => {
    const captured = pointerId;
    pointerId = null;
    keyboard = false;
    active = false;
    if (reset !== false && game.status !== "defeated") resetGame(game);
    if (captured !== null && anchor.hasPointerCapture(captured)) anchor.releasePointerCapture(captured);
  };
  const draw = () => {
    context.clearRect(0, 0, width, height);
    const arrival = avatarArrival(arrivalTime, reducedMotion.matches);
    const hint = { rotation: 0, scaleX: 1, scaleY: 1, glow: 0 };
    const hoverPulse = reducedMotion.matches ? 0 : Math.sin(phase * 2.2);
    hint.scaleX += hoverAmount * hoverPulse * .12;
    hint.scaleY += hoverAmount * hoverPulse * .12;
    anchor.style.setProperty("--source-hover-glow", 1 + hoverAmount * (hoverPulse * .12 - .12));
    hint.glow += hoverAmount * .6;
    const x = origin.x, y = origin.y, radius = origin.radius * arrival.scale;
    const ending = game.status === "defeated" ? defeatVisual(game.defeatTime, reducedMotion.matches) : { light: 1, fog: 0, others: 1 };
    const flicker = active && !reducedMotion.matches && game.lightFlash > 0 ? 1 + Math.sin((.18 - game.lightFlash) * 45) * .12 * game.lightFlash / .18 : 1;
    const hitProgress = 1 - game.hitFlash / .65;
    const hitLight = game.hitFlash > 0
      ? reducedMotion.matches
        ? 1 - Math.sin(hitProgress * Math.PI) * .25
        : 1 - Math.sin(hitProgress * Math.PI * 2) ** 2 * .85
      : 1;
    const showHitHalo = active && game.status !== "defeated" && game.hitFlash > 0;
    if ((anchor.dataset.hit === "true") !== showHitHalo) anchor.dataset.hit = String(showHitHalo);
    if (showHitHalo) anchor.style.setProperty("--source-hit-glow", reducedMotion.matches ? .8 : .25 + .75 * Math.sin(hitProgress * Math.PI * 2) ** 2);
    if (highlight && titleBounds) {
      const beam = beamSettings(distance, game.beamScale);
      const length = beam.length;
      const spread = Math.tan(beam.angle) * length;
      const localX = x - titleBounds.x, localY = y - titleBounds.y;
      const cosine = Math.cos(angle), sine = Math.sin(angle);
      const point = (forward, side) => `${localX + forward * cosine - side * sine}px ${localY + forward * sine + side * cosine}px`;
      highlight.style.clipPath = `polygon(${point(radius * 0.3, -2)},${point(length, -spread)},${point(length, spread)},${point(radius * 0.3, 2)})`;
      highlight.style.color = `rgb(${beam.color.r},${beam.color.g},${beam.color.b})`;
      highlight.style.opacity = game.status === "defeated" ? "0" : String(titleOpacity * hitLight);
    }
    if (opacity > 0.005) {
      const beam = beamSettings(distance, game.beamScale);
      const spread = Math.tan(beam.angle) * beam.length;
      const { r, g, b } = beam.color;
      const intensity = beam.intensity * hitLight * (active ? (.8 + beam.focus * .35) * flicker : 1);
      context.save();
      context.translate(x, y);
      context.rotate(angle);
      context.filter = "blur(4px)";
      const gradient = context.createLinearGradient(0, 0, beam.length, 0);
      gradient.addColorStop(0, `rgba(${r},${g},${b},${intensity * opacity})`);
      gradient.addColorStop(0.35, `rgba(${r},${g},${b},${intensity * opacity * 0.5})`);
      gradient.addColorStop(1, `rgba(${r},${g},${b},0)`);
      context.fillStyle = gradient;
      context.beginPath();
      context.moveTo(radius * 0.3, -2);
      context.lineTo(beam.length, -spread);
      context.quadraticCurveTo(beam.length + spread * 0.18, 0, beam.length, spread);
      context.lineTo(radius * 0.3, 2);
      context.closePath();
      context.fill();
      // Only the beam has been drawn, so cut its shadows before drawing the smoke.
      context.clip();
      context.globalCompositeOperation = "destination-out";
      context.filter = "blur(2px)";
      context.fillStyle = "black";
      for (const cloud of game.cubes) {
        const tint = smokeColors[cloud.kind] || smokeColors.normal;
        const shadow = cloudShadow(cloud, { x, y }, angle);
        if (!shadow || shadow.start >= beam.length || Math.abs(shadow.direction) > beam.angle + shadow.halfAngle) continue;
        const left = shadow.direction - shadow.halfAngle, right = shadow.direction + shadow.halfAngle;
        const far = beam.length * 2;
        context.beginPath();
        context.moveTo(Math.cos(left) * shadow.start, Math.sin(left) * shadow.start);
        context.lineTo(Math.cos(left) * far, Math.sin(left) * far);
        context.lineTo(Math.cos(right) * far, Math.sin(right) * far);
        context.lineTo(Math.cos(right) * shadow.start, Math.sin(right) * shadow.start);
        context.closePath(); context.fill();
        context.save();
        context.globalCompositeOperation = "source-over";
        const smokeShadow = context.createLinearGradient(0, 0, beam.length, 0);
        smokeShadow.addColorStop(0, `rgba(${tint.core},${0.2 * opacity})`);
        smokeShadow.addColorStop(0.65, `rgba(${tint.core},${0.14 * opacity})`);
        smokeShadow.addColorStop(1, `rgba(${tint.core},0)`);
        context.fillStyle = smokeShadow;
        context.fill();
        context.clip();
        context.filter = "blur(4px)";
        for (let i = 0; i < 5; i++) {
          const progress = (i + 0.5) / 5;
          const depth = shadow.start + (beam.length - shadow.start) * progress;
          const halfWidth = Math.max(6, Math.sin(shadow.halfAngle) * depth);
          const drift = Math.sin(phase * 0.7 + i * 1.8 + cloud.rotation) * halfWidth * 0.35;
          context.save();
          context.translate(Math.cos(shadow.direction) * depth - Math.sin(shadow.direction) * drift,
            Math.sin(shadow.direction) * depth + Math.cos(shadow.direction) * drift);
          context.rotate(shadow.direction);
          context.scale(1.8, 1);
          const wisp = context.createRadialGradient(0, 0, 0, 0, 0, halfWidth);
          wisp.addColorStop(0, `rgba(${tint.core},${0.09 * opacity * (1 - progress)})`);
          wisp.addColorStop(1, `rgba(${tint.soft},0)`);
          context.fillStyle = wisp;
          context.beginPath(); context.arc(0, 0, halfWidth, 0, Math.PI * 2); context.fill();
          context.restore();
        }
        context.restore();
      }
      context.restore();
    }
    for (const cloud of game.cubes) {
      const tint = smokeColors[cloud.kind] || smokeColors.normal;
      for (const puff of cloud.trail || []) {
        const age = puff.age / 0.7;
        const radius = cloud.size * (0.65 + age * 0.4);
        const trail = context.createRadialGradient(puff.x, puff.y, 0, puff.x, puff.y, radius);
        trail.addColorStop(0, `rgba(${tint.soft},${0.18 * (1 - age) * (1 - cloud.damage * 0.7) * ending.others})`);
        trail.addColorStop(1, `rgba(${tint.edge},0)`);
        context.fillStyle = trail;
        context.beginPath(); context.arc(puff.x, puff.y, radius, 0, Math.PI * 2); context.fill();
      }
      context.save();
      context.translate(cloud.x, cloud.y);
      context.globalAlpha = ending.others;
      context.rotate(cloud.rotation);
      const size = cloud.size * (1.3 + cloud.damage * 0.5);
      const density = cloud.kind === "dense" ? 1.45 : cloud.kind === "fast" ? .85 : 1;
      for (let i = 0; i < 5; i++) {
        const a = i * Math.PI * 2 / 5 + Math.sin(phase + i) * 0.12;
        const px = Math.cos(a) * size * 0.42, py = Math.sin(a) * size * 0.32;
        const radius = size * (0.7 + Math.sin(i * 2 + phase * 0.6) * 0.1);
        const smoke = context.createRadialGradient(px, py, 0, px, py, radius);
        smoke.addColorStop(0, `rgba(${tint.core},${0.25 * density * (1 - cloud.damage * 0.7)})`);
        smoke.addColorStop(0.45, `rgba(${tint.soft},${0.16 * density * (1 - cloud.damage * 0.7)})`);
        smoke.addColorStop(1, `rgba(${tint.edge},0)`);
        context.fillStyle = smoke;
        context.beginPath(); context.arc(px, py, radius, 0, Math.PI * 2); context.fill();
      }
      context.restore();
    }
    for (const spark of game.sparks) {
      const radius = spark.size * (3 + (0.5 - spark.life) * 8);
      const smoke = context.createRadialGradient(spark.x, spark.y, 0, spark.x, spark.y, radius);
      smoke.addColorStop(0, `rgba(112,115,142,${spark.life * 0.5 * ending.others})`);
      smoke.addColorStop(1, "rgba(130,134,160,0)");
      context.fillStyle = smoke;
      context.beginPath(); context.arc(spark.x, spark.y, radius, 0, Math.PI * 2); context.fill();
    }
    context.save();
    context.translate(x, y);
    context.scale(hint.scaleX, hint.scaleY);
    anchor.style.setProperty("--source-light-alpha", Math.min(1, ending.light * flicker));
    context.rotate(angle + hint.rotation);
    context.globalAlpha = (0.35 + ending.light * 0.65) * arrival.rings;
    if (avatar.complete && avatar.naturalWidth > 0) {
      const scale = radius / 22;
      context.drawImage(avatar, -76 * scale, -57 * scale, 152 * scale, 114 * scale);
    }
    context.restore();
    if (ending.fog > 0) {
      for (let i = 0; i < 5; i++) {
        const a = i * Math.PI * 2 / 5 + game.defeatTime * 0.4;
        const px = x + Math.cos(a) * radius * 0.6, py = y + Math.sin(a) * radius * 0.5;
        const fogRadius = radius * (1.1 + game.defeatTime * 0.4);
        const fog = context.createRadialGradient(px, py, 0, px, py, fogRadius);
        fog.addColorStop(0, `rgba(69,64,89,${ending.fog * 0.36})`);
        fog.addColorStop(1, "rgba(99,92,119,0)");
        context.fillStyle = fog;
        context.beginPath(); context.arc(px, py, fogRadius, 0, Math.PI * 2); context.fill();
      }
    }
  };
  const resize = () => {
    if (disposed || paused) return;
    if (surface) {
      const rect = surface.getBoundingClientRect();
      Object.assign(canvas.style, { left: `${-rect.left}px`, top: `${-rect.top}px`, width: `${document.documentElement.clientWidth}px`, height: `${Math.max(window.innerHeight, rect.bottom)}px` });
    }
    const rect = canvas.getBoundingClientRect(), bounds = anchor.getBoundingClientRect();
    if (title) {
      const titleRect = title.getBoundingClientRect();
      titleBounds = { x: titleRect.left - rect.left, y: titleRect.top - rect.top, width: titleRect.width, height: titleRect.height };
    }
    width = rect.width; height = rect.height;
    const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
    canvas.width = Math.max(1, Math.round(width * ratio));
    canvas.height = Math.max(1, Math.round(height * ratio));
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    origin = { x: bounds.left - rect.left + bounds.width / 2, y: bounds.top - rect.top + bounds.height / 2, radius: Math.min(bounds.width, bounds.height) * 0.15 };
    draw();
  };
  const tick = (time) => {
    frame = null;
    if (disposed || paused || !visible || document.hidden) return;
    const dt = Math.min(previousTime === null ? 0 : (time - previousTime) / 1000, 0.05);
    previousTime = time;
    hoverAmount += ((hovered || focused) && !active && game.status === "ready" ? 1 - hoverAmount : -hoverAmount) * (1 - Math.exp(-dt * 12));
    if (avatar.complete && avatar.naturalWidth > 0) arrivalTime += dt;
    if (avatarArrival(arrivalTime, reducedMotion.matches).ready) phase += dt * 1.6;
    const easing = 1 - Math.exp(-dt * 14);
    if (active && !keyboard) {
      const dx = target.x - origin.x, dy = target.y - origin.y;
      const targetAngle = Math.atan2(dy, dx);
      angle += Math.atan2(Math.sin(targetAngle - angle), Math.cos(targetAngle - angle)) * easing;
      distance += (Math.hypot(dx, dy) - distance) * easing;
    }
    opacity += ((active ? 1 : 0) - opacity) * easing;
    titleOpacity += ((active ? 1 : 0) - titleOpacity) * easing;
    stepGame(game, dt, active, origin, angle, beamSettings(distance, game.beamScale), { width, height });
    if (game.status === "defeated" && active) { opacity = titleOpacity = 0; stop(false); }
    draw();
    frame = requestAnimationFrame(tick);
  };
  const updateLoop = () => {
    if (frame !== null) cancelAnimationFrame(frame);
    frame = null; previousTime = null;
    if (document.hidden || !visible) stop();
    if (!disposed && !paused && visible && !document.hidden) frame = requestAnimationFrame(tick);
  };
  anchor.addEventListener("pointerdown", (event) => {
    if (paused || disposed || !avatarArrival(arrivalTime, reducedMotion.matches).ready || game.status === "defeated" || pointerId !== null || !event.isPrimary || event.button !== 0) return;
    updateTarget(event);
    if (Math.hypot(target.x - origin.x, target.y - origin.y) > origin.radius * 1.65) return;
    pointerId = event.pointerId; active = true;
    anchor.setPointerCapture(pointerId);
  }, { signal: events.signal });
  anchor.addEventListener("pointermove", (event) => {
    if (event.pointerId === pointerId) updateTarget(event);
    const bounds = canvas.getBoundingClientRect();
    hovered = event.pointerType === "mouse" && Math.hypot(event.clientX - bounds.left - origin.x, event.clientY - bounds.top - origin.y) <= origin.radius * 1.65;
  }, { signal: events.signal });
  anchor.addEventListener("pointerleave", () => { hovered = false; }, { signal: events.signal });
  anchor.addEventListener("focus", () => { focused = true; }, { signal: events.signal });
  anchor.addEventListener("blur", () => { focused = false; hovered = false; }, { signal: events.signal });
  for (const type of ["pointerup", "pointercancel", "lostpointercapture", "blur"]) anchor.addEventListener(type, stop, { signal: events.signal });
  window.addEventListener("blur", stop, { signal: events.signal });
  anchor.addEventListener("keydown", (event) => {
    if (paused || disposed || !avatarArrival(arrivalTime, reducedMotion.matches).ready || game.status === "defeated") return;
    if ((event.key === " " || event.key === "Enter") && event.repeat) { event.preventDefault(); return; }
    if (event.key === " " || event.key === "Enter") { event.preventDefault(); keyboard = true; active = true; }
    else if (active && event.key.startsWith("Arrow")) {
      event.preventDefault();
      if (event.key === "ArrowLeft") angle -= 0.12;
      if (event.key === "ArrowRight") angle += 0.12;
      if (event.key === "ArrowUp") distance = Math.min(600, distance + 24);
      if (event.key === "ArrowDown") distance = Math.max(30, distance - 24);
    }
  }, { signal: events.signal });
  anchor.addEventListener("keyup", (event) => { if (event.key === " " || event.key === "Enter") stop(); }, { signal: events.signal });
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(anchor);
  if (title) resizeObserver.observe(title);
  if (surface) resizeObserver.observe(surface);
  const intersectionObserver = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; updateLoop(); });
  intersectionObserver.observe(anchor);
  window.addEventListener("resize", resize, { signal: events.signal });
  document.addEventListener("visibilitychange", updateLoop, { signal: events.signal });
  avatar.addEventListener("load", () => { if (!disposed && !paused) draw(); }, { signal: events.signal });
  avatar.src = new URL("three.js/source/source-avatar.svg?v=2", document.baseURI).href;
  resize(); updateLoop();
  return {
    pause() { paused = true; stop(); updateLoop(); },
    snapshot() { const copy = document.createElement("canvas"); copy.width = canvas.width; copy.height = canvas.height; copy.getContext("2d").drawImage(canvas, 0, 0); return copy; },
    dispose() { if (disposed) return; disposed = true; stop(); updateLoop(); events.abort(); resizeObserver.disconnect(); intersectionObserver.disconnect(); highlight?.remove(); title?.classList.remove("light-reactive-title"); },
  };
}
