import { createResumeLock } from "../game-resume-lock.js";

// Pixel coordinates; bounds describe the allowed centre of the ball.
export function stepBall(ball, dt, bounds, target = null) {
  const steps = Math.max(1, Math.ceil(dt * 120));
  const step = dt / steps;
  for (let i = 0; i < steps; i++) {
    if (target) {
      ball.vx += ((target.x - ball.x) * 220 - ball.vx * 22) * step;
      ball.vy += ((target.y - ball.y) * 220 - ball.vy * 22) * step;
    } else {
      ball.vx *= Math.exp(-step * .35);
    }
    ball.vy += 1000 * step;
    const speed = Math.hypot(ball.vx, ball.vy);
    if (speed > 1800) { ball.vx *= 1800 / speed; ball.vy *= 1800 / speed; }
    ball.x += ball.vx * step; ball.y += ball.vy * step;
    if (ball.x < bounds.left) { ball.x = bounds.left; ball.vx = Math.abs(ball.vx) * .65; }
    if (ball.x > bounds.right) { ball.x = bounds.right; ball.vx = -Math.abs(ball.vx) * .65; }
    if (ball.y < bounds.top) { ball.y = bounds.top; ball.vy = Math.abs(ball.vy) * .65; }
    if (ball.y >= bounds.bottom) {
      ball.y = bounds.bottom;
      ball.vy = Math.abs(ball.vy) < 45 ? 0 : -Math.abs(ball.vy) * .6;
      if (!target) ball.vx *= Math.exp(-step * 5);
    }
    ball.angle += ball.vx * step / 18;
  }
}

export function enableShapes(button) {
  const page = button.closest(".project-layout");
  const lockResume = createResumeLock();
  const events = new AbortController(), options = { signal: events.signal };
  const stage = document.createElement("button");
  stage.type = "button"; stage.className = "proteo-shape-stage";
  stage.setAttribute("aria-label", "Déplacer la boule Proteo");
  const avatar = button.querySelector("img").cloneNode();
  stage.append(avatar);
  const ball = { x: 0, y: 0, vx: 0, vy: 0, angle: 0 };
  const radius = 52 * 25 / 72;
  let active = false, drag = null, frame = null, previousTime = null;
  const playBounds = () => {
    const rule = page.querySelector(".project-copy > .copy-rule")?.getBoundingClientRect();
    const left = Math.max(0, page.querySelector(".hero-frame")?.getBoundingClientRect().right ?? 0);
    const right = Math.min(innerWidth, rule?.right ?? innerWidth);
    const bottom = Math.min(innerHeight, document.querySelector(".project-dock")?.getBoundingClientRect().top ?? innerHeight, rule?.top ?? innerHeight);
    return { left: left + radius, right: Math.max(left + radius, right - radius), top: radius, bottom: Math.max(radius, bottom - radius) };
  };
  const clamp = (point, bounds) => ({ x: Math.max(bounds.left, Math.min(bounds.right, point.x)), y: Math.max(bounds.top, Math.min(bounds.bottom, point.y)) });
  const paint = () => {
    stage.style.translate = `${ball.x - 26}px ${ball.y - 26}px`;
    avatar.style.rotate = `${ball.angle}rad`;
  };
  const tick = time => {
    frame = null;
    if (!active || document.hidden) return;
    const dt = previousTime === null ? 0 : Math.min(.04, (time - previousTime) / 1000);
    previousTime = time;
    const bounds = playBounds();
    stepBall(ball, dt, bounds, drag ? clamp(drag.target, bounds) : null);

    paint();
    if (drag || Math.abs(ball.vx) > .5 || Math.abs(ball.vy) > .5 || ball.y < bounds.bottom - .1) frame = requestAnimationFrame(tick);
    else { ball.vx = ball.vy = 0; previousTime = null; }
  };
  const wake = () => { if (active && frame === null) { previousTime = null; frame = requestAnimationFrame(tick); } };
  const release = () => {
    const released = drag; drag = null;
    stage.classList.remove("is-grabbed");
    if (released?.capture.hasPointerCapture(released.id)) released.capture.releasePointerCapture(released.id);
    wake();
  };
  const stop = () => {
    active = false; release(); cancelAnimationFrame(frame); frame = null; previousTime = null;
    stage.remove();

    button.style.visibility = ""; button.setAttribute("aria-pressed", "false");
    lockResume(false);
  };
  const grab = event => {
    if (!event.isPrimary || event.button !== 0 || drag) return;
    event.preventDefault(); event.stopPropagation();
    if (!active) {
      const rect = button.getBoundingClientRect();
      Object.assign(ball, clamp({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }, playBounds()), { vx: 0, vy: 0, angle: 0 });
      active = true; document.body.append(stage); paint();

      button.style.visibility = "hidden"; button.setAttribute("aria-pressed", "true");
      lockResume(true);
    }
    const capture = event.currentTarget;
    drag = { id: event.pointerId, capture, offsetX: ball.x - event.clientX, offsetY: ball.y - event.clientY, target: { x: ball.x, y: ball.y } };
    capture.setPointerCapture(event.pointerId);
    stage.classList.add("is-grabbed"); wake();
  };
  for (const control of [button, stage]) {
    control.addEventListener("pointerdown", grab, options);
    control.addEventListener("lostpointercapture", event => { if (drag?.id === event.pointerId) release(); }, options);
    control.addEventListener("click", event => event.stopPropagation(), options);
  }
  window.addEventListener("pointermove", event => {
    if (event.pointerId !== drag?.id) return;
    drag.target = { x: event.clientX + drag.offsetX, y: event.clientY + drag.offsetY };
  }, options);
  for (const type of ["pointerup", "pointercancel"]) window.addEventListener(type, event => {
    if (event.pointerId === drag?.id) release();
  }, options);
  window.addEventListener("click", event => {
    if (active && event.target.closest(".resume-link")) { event.preventDefault(); event.stopImmediatePropagation(); }
  }, { capture: true, signal: events.signal });
  window.addEventListener("keydown", event => {
    if (active && event.key === "Escape") { event.preventDefault(); stop(); button.focus({ preventScroll: true }); }
  }, options);
  for (const type of ["resize", "scroll"]) window.addEventListener(type, wake, { passive: true, signal: events.signal });
  window.addEventListener("blur", stop, options);
  document.addEventListener("visibilitychange", () => { if (document.hidden) stop(); }, options);
  page.addEventListener("page-dispose", () => { stop(); events.abort(); }, { once: true });
}
