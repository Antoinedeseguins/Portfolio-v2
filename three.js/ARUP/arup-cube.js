export function enableCubeHover(button) {
  const svg = button.querySelector(".arup-play-cube");
  if (!svg) return;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const events = new AbortController(), options = { signal: events.signal };
  const faces = [
    { normal: [0, 1, 0], color: "#ffe680", points: [[-.5,.5,-.5],[.5,.5,-.5],[.5,.5,.5],[-.5,.5,.5]] },
    { normal: [0,-1,0], color: "#ffe680", points: [[-.5,-.5,.5],[.5,-.5,.5],[.5,-.5,-.5],[-.5,-.5,-.5]] },
    { normal: [0,0,1], color: "#df493e", points: [[-.5,.5,.5],[.5,.5,.5],[.5,-.5,.5],[-.5,-.5,.5]] },
    { normal: [0,0,-1], color: "#df493e", points: [[.5,.5,-.5],[-.5,.5,-.5],[-.5,-.5,-.5],[.5,-.5,-.5]] },
    { normal: [1,0,0], color: "#49a868", points: [[.5,.5,.5],[.5,.5,-.5],[.5,-.5,-.5],[.5,-.5,.5]] },
    { normal: [-1,0,0], color: "#438de0", points: [[-.5,.5,-.5],[-.5,.5,.5],[-.5,-.5,.5],[-.5,-.5,-.5]] },
  ];
  let frame = null, elapsed = 0, previous = null, settling = false;
  const draw = (turn, progress) => {
    // Alternate left and right rolls on two axes, retaining each face's colour.
    const rotateStep = ([x,y,z], index, amount) => {
      const angle = (index % 2 ? 1 : -1) * amount * Math.PI / 2;
      const c = Math.cos(angle), s = Math.sin(angle);
      return index % 2 ? [x, y*c-z*s, y*s+z*c] : [x*c-y*s, x*s+y*c, z];
    };
    const rotate = point => {
      let rotated = point;
      for (let index = 0; index < turn % 6; index++) rotated = rotateStep(rotated, index, 1);
      return rotateStep(rotated, turn, progress);
    };
    const visible = faces.filter(face => rotate(face.normal).reduce((sum, value) => sum + value, 0) > .001);
    const projected = visible.map(face => ({ color: face.color, points: face.points.map(point => {
      const [x,y,z] = rotate(point); return [(x-z)*27, (x+z)*15.75-y*31.5];
    }) }));
    const scale = Math.min(1, 27 / Math.max(...projected.flatMap(face => face.points.map(point => Math.abs(point[0])))), 31.5 / Math.max(...projected.flatMap(face => face.points.map(point => Math.abs(point[1])))));
    svg.innerHTML = projected.map(face => `<polygon points="${face.points.map(([x,y]) => `${32+x*scale},${35.5+y*scale}`).join(" ")}" fill="${face.color}" stroke="#000" stroke-width="1" stroke-linejoin="round"/>`).join("");
  };
  const tick = time => {
    frame = null;
    if (document.hidden || button.getAttribute("aria-pressed") === "true") { previous = null; return; }
    if (previous !== null) elapsed += Math.min(50, time - previous);
    previous = time;
    const turn = Math.floor(elapsed / 2200), phase = elapsed % 2200;
    const progress = Math.min(1, phase / 650);
    const eased = progress * progress * (3 - 2 * progress);
    draw(turn, eased);
    if (settling && progress === 1) {
      elapsed = (turn + 1) * 2200;
      previous = null; settling = false;
      return;
    }
    frame = requestAnimationFrame(tick);
  };
  const stop = () => { cancelAnimationFrame(frame); frame = null; previous = null; settling = false; };
  const finishRoll = () => { if (frame !== null) settling = true; };
  const start = () => {
    settling = false;
    if (frame !== null || reduced.matches || button.getAttribute("aria-pressed") === "true" || !matchMedia("(hover: hover)").matches) return;
    frame = requestAnimationFrame(tick);
  };
  button.addEventListener("pointerenter", start, options);
  button.addEventListener("pointerleave", finishRoll, options);
  button.addEventListener("pointerdown", stop, options);
  button.addEventListener("focus", start, options);
  button.addEventListener("blur", finishRoll, options);
  button.addEventListener("click", stop, options);
  document.addEventListener("visibilitychange", () => { if (document.hidden) stop(); }, options);
  button.closest(".project-layout").addEventListener("page-dispose", () => { stop(); events.abort(); }, { once: true });
}
