import { enableCubeHover } from "./arup-cube.js?v=5";

export function enableRunner(title) {
  const row = title.closest(".arup-title-row");
  const control = row.querySelector(".arup-play");
  if (!control) return;
  enableCubeHover(control);
  const measureCubeLanding = () => {
    const rule = row.closest(".project-copy").querySelector(".copy-rule");
    if (!rule) return;
    const rowBounds = row.getBoundingClientRect();
    const distance = rule.getBoundingClientRect().top - rowBounds.top - rowBounds.height / 2 - 19.6;
    control.style.setProperty("--cube-floor", `${distance}px`);
  };
  measureCubeLanding();
  if (window.matchMedia("(hover: none), (pointer: coarse)").matches) return;
  const page = row.closest(".project-layout");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const setHeroPaused = active => {
    page.dataset.runnerPlaying = String(active);
    page.dispatchEvent(new Event("hero-autoplay-change"));
  };
  const logos = title.querySelector(".arup-title-logos");
  const logoLetters = [...logos.querySelectorAll("img")];
  const textLetters = [...title.querySelectorAll(".arup-title-text > span")];
  const resetLetters = () => {
    textLetters.forEach(letter => { letter.style.opacity = ""; });
    logoLetters.forEach(letter => { letter.style.opacity = ""; letter.style.scale = ""; letter.style.translate = ""; letter.classList.remove("is-lost", "is-restored"); });
    logos.classList.remove("is-hit");
  };
  const transformLetters = time => {
    logoLetters.forEach((letter, i) => {
      const progress = Math.max(0, Math.min(1, (time - i * .12) / .28));
      const back = progress - 1;
      const pop = Math.max(0, 1 + 2.7 * back ** 3 + 1.7 * back ** 2);
      letter.style.opacity = String(progress);
      letter.style.scale = String(.55 + pop * .45);
      letter.style.translate = `0 ${-Math.sin(progress * Math.PI) * .12}em`;
      if (textLetters[i]) textLetters[i].style.opacity = String(1 - progress);
    });
  };
  const ground = row.closest(".project-copy").querySelector(".copy-rule");
  if (!ground) return;
  ground.classList.add("arup-ground");
  const scene = document.createElement("span");
  scene.className = "arup-runner-scene"; scene.setAttribute("aria-hidden", "true");
  ground.append(scene);
  let trackWidth = 3.6, dropDistance = 0;
  const measure = () => {
    measureCubeLanding();
    const fontSize = parseFloat(getComputedStyle(title).fontSize);
    const bounds = ground.getBoundingClientRect();
    scene.style.fontSize = `${fontSize}px`;
    trackWidth = bounds.width / fontSize;
    dropDistance = bounds.top - title.getBoundingClientRect().bottom;
    logos.style.setProperty("--ground-offset", `${dropDistance}px`);
  };
  const observer = new ResizeObserver(measure);
  observer.observe(ground); observer.observe(title);
  measure();
  const events = new AbortController();
  let running = false, frozen = false, disposed = false, loading = null;
  let entering = false, entryTime = 0;
  let remainingLetters = logoLetters.length, invincible = 0;
  let frame = null, last = 0, elapsed = 0, spawn = 1, lift = 0, velocity = 0, obstacles = [];
  let landingTime = .18;
  const enemyColors = [["#43a66a", "#26603d"], ["#468ed0", "#28557f"], ["#cb5b52", "#793630"]];
  let enemyColorIndex = 0;
  let nextIsAirborne = false;
  let previousWasAirborne = false;
  let nextBonus = 12;
  const planEnemy = () => {
    if (!nextIsAirborne && !previousWasAirborne && remainingLetters < logoLetters.length && elapsed >= nextBonus && Math.random() < .18) {
      nextBonus = elapsed + 12;
      previousWasAirborne = false;
      return { bonus: true, count: 1, airborne: false, delay: 1.25 };
    }
    const followUp = nextIsAirborne;
    const startsPattern = !followUp && elapsed >= 8 && Math.random() < .55;
    const airborne = followUp || (!previousWasAirborne && !startsPattern && elapsed >= 8 && Math.random() < .35);
    nextIsAirborne = startsPattern;
    previousWasAirborne = airborne;
    const group = !airborne && elapsed >= 5 && Math.random() < .4;
    const count = group ? elapsed >= 12 && Math.random() < .3 ? 3 : 2 : 1;
    const pressure = Math.min(1, elapsed / 22);
    const baseDelay = startsPattern ? (group ? 1 : .88) + Math.random() * .1
      : (1.1 - pressure * .2) + Math.random() * (1.3 - pressure * .85);
    // Short quiet stretches alternate with denser passages; paired timings stay fixed.
    const rhythm = elapsed % 18;
    const delay = startsPattern ? baseDelay : Math.max(.95, baseDelay * (rhythm > 14 ? 1.45 : rhythm > 8 ? .9 : 1));
    return { airborne, delay, count, bonus: false };
  };
  let resetTimer = null;
  const cancelReset = () => { if (resetTimer !== null) clearTimeout(resetTimer); resetTimer = null; };
  const available = () => !disposed && !frozen && title.isConnected && !title.closest(".page-outgoing, .page-drag-preview");
  const load = async () => {
    if (!loading) loading = Promise.all(logoLetters.map(image => image.decode()))
      .then(() => available())
      .catch(error => { console.error("ARUP logo could not be loaded", error); return false; })
      .finally(() => { loading = null; });
    return loading;
  };
  const stopFrame = () => { if (frame !== null) cancelAnimationFrame(frame); frame = null; last = 0; };
  const clear = () => { obstacles.forEach(item => item.element.remove()); obstacles = []; };
  const jump = () => { if (running && !entering && lift <= .001) { velocity = 4.8; landingTime = .18; } };
  const stop = () => {
    const returning = row.classList.contains("is-running") && available();
    cancelReset(); elapsed = 0; spawn = 1; lift = velocity = 0;
    landingTime = .18;
    remainingLetters = logoLetters.length; invincible = 0;
    nextIsAirborne = false;
    previousWasAirborne = false;
    nextBonus = 12;
    entering = false; entryTime = 0; logos.style.removeProperty("--entry-offset");
    running = false; stopFrame(); row.classList.remove("is-running", "is-crashed", "is-entering"); ground.classList.remove("is-running"); resetLetters();
    setHeroPaused(false);
    control.setAttribute("aria-label", "Play ARUP");control.setAttribute("aria-pressed", "false");
    logos.style.removeProperty("--jump"); clear(); title.setAttribute("aria-pressed", "false");
    row.classList.toggle("is-returning", returning);
  };
  const tick = now => {
    frame = null;
    if (!running || !available() || document.hidden) return;
    const dt = last ? Math.min((now - last) / 1000, .035) : 0; last = now;
    if (entering) {
      entryTime += dt;
      let offset = -dropDistance;
      if (entryTime < .76) {
        transformLetters(entryTime);
      } else if (entryTime < 1.21) {
        row.classList.remove("is-entering"); resetLetters();
        const fall = (entryTime - .76) / .45;
        offset = -dropDistance * (1 - fall * fall);
      } else {
        offset = 0;
      }
      logos.style.setProperty("--entry-offset", `${offset}px`);
      if (entryTime >= 1.21) {
        entering = false;
        logos.style.removeProperty("--entry-offset");
        velocity = 3;
        landingTime = .18;
      }
      frame = requestAnimationFrame(tick);
      return;
    }
    elapsed += dt; spawn -= dt;
    invincible = Math.max(0, invincible - dt);
    if (invincible === 0) logos.classList.remove("is-hit");
    const previousLift = lift;
    velocity -= 12 * dt; lift = Math.max(0, lift + velocity * dt);
    landingTime = Math.min(.18, landingTime + dt);
    if (previousLift > 0 && lift === 0) landingTime = 0;
    if (lift === 0) velocity = 0;
    const rebound = reducedMotion.matches ? 0 : Math.sin(landingTime / .18 * Math.PI) * .055;
    logos.style.setProperty("--jump", `${-(lift + rebound)}em`);
    const speed = Math.min(6.6, 5 + elapsed * .055);
    if (spawn <= 0 && obstacles.length < 21) {
      const { airborne, delay, count, bonus } = planEnemy();
      const separation = count === 3 ? .3 : .5 + Math.random() * .12;
      const shape = Math.random();
      for (let i = 0; i < count; i++) {
        const element = document.createElement("span"); element.className = "arup-runner-obstacle"; scene.append(element);
        const [background, borderColor] = enemyColors[enemyColorIndex++ % enemyColors.length];
        Object.assign(element.style, { background, borderColor });
        element.classList.toggle("is-airborne", airborne);
        element.classList.toggle("is-bonus", bonus);
        const height = bonus ? .2 : airborne ? .3 : count === 3 ? .2 + Math.random() * .04 : count === 2 ? .24 + Math.random() * .04 : shape < .33 ? .24 : shape > .7 ? .4 : .32;
        const width = bonus ? .2 : airborne ? .3 : count === 3 ? .18 : count === 2 ? .26 : shape < .33 ? .4 : shape > .7 ? .18 : .26;
        const bottom = bonus ? 1.3 : airborne ? 1.2 : 0;
        Object.assign(element.style, { left: "0", width: `${width}em`, height: `${height}em` });
        obstacles.push({ x: trackWidth + .2 + i * separation, width, height, bottom, airborne, bonus, phase: Math.random() * Math.PI * 2, element });
      }
      spawn = delay;
    }
    for (const item of obstacles) {
      item.x -= speed * dt;
      const bottom = item.bottom + (item.airborne && !reducedMotion.matches ? Math.sin(elapsed * 2.5 + item.phase) * .045 : 0);
      item.element.style.transform = `translate3d(${item.x}em, ${-bottom}em, 0)`;
      const playerRight = .7 + Math.max(0, remainingLetters - 1) * .65;
      const verticalHit = lift < bottom + item.height - .025 && lift + 1.05 > bottom + .025;
      if (item.bonus) {
        if (!item.collected && item.x < playerRight && item.x + item.width > .1 && verticalHit) {
          item.collected = true;
          if (remainingLetters < logoLetters.length) {
            const letter = logoLetters[remainingLetters++];
            letter.classList.remove("is-lost"); letter.classList.add("is-restored");
          }
        }
        continue;
      }
      if (!item.hit && invincible === 0 && item.x < playerRight && item.x + item.width > .1 && verticalHit) {
        item.hit = true;
        remainingLetters -= 1;
        logoLetters[remainingLetters].classList.remove("is-restored");
        logoLetters[remainingLetters].classList.add("is-lost");
        if (remainingLetters > 0) {
          invincible = .95;
          logos.classList.add("is-hit");
          continue;
        }
        running = false; row.classList.add("is-crashed");
        setHeroPaused(false);
        control.setAttribute("aria-label", "Replay ARUP");
        resetTimer = setTimeout(() => {
          resetTimer = null;
          if (available()) stop();
        }, 650);
        return;
      }
    }
    obstacles = obstacles.filter(item => { if (item.collected || item.x + item.width < 0) { item.element.remove(); return false; } return true; });
    frame = requestAnimationFrame(tick);
  };
  const start = async () => {
    if (!(await load())) return;
    if (running) return;


    cancelReset();
    row.classList.remove("is-returning");
    clear(); elapsed = 0; spawn = 1; lift = velocity = 0; last = 0;
    landingTime = .18;
    enemyColorIndex = 0;
    nextIsAirborne = false;
    previousWasAirborne = false;
    nextBonus = 12;
    spawn = .8 + Math.random() * .7;
    remainingLetters = logoLetters.length; invincible = 0;
    measure();
    entering = !reducedMotion.matches;
    entryTime = 0;
    resetLetters();
    row.classList.toggle("is-entering", entering);
    if (entering) transformLetters(entryTime);
    logos.style.setProperty("--entry-offset", `${entering ? -dropDistance : 0}px`);
    running = true; row.classList.add("is-running"); ground.classList.add("is-running"); row.classList.remove("is-crashed");
    setHeroPaused(true);
    title.setAttribute("aria-pressed", "true"); control.setAttribute("aria-label", "Jump ARUP");control.setAttribute("aria-pressed", "true");
    logos.style.setProperty("--jump", "0em"); control.focus({ preventScroll: true });
    stopFrame(); frame = requestAnimationFrame(tick);
  };
  control.addEventListener("click", () => {
    if (!available()) return;
    if (running) jump();
    else start();
  }, { signal: events.signal });
  scene.addEventListener("pointerdown", event => event.stopPropagation(), { signal: events.signal });
  scene.addEventListener("click", event => {
    event.stopPropagation();
    if (available()) jump();
  }, { signal: events.signal });
  document.addEventListener("keydown", event => {
    if (!running || !available() || event.code !== "Space" || event.target.closest("input, textarea, select, [contenteditable]")) return;
    event.preventDefault(); if (!event.repeat) jump();
  }, { signal: events.signal });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) { stopFrame(); }
    else if (running && available()) { last = 0; frame = requestAnimationFrame(tick); }
  }, { signal: events.signal });
  page.addEventListener("page-dispose", event => {

    frozen = true; cancelReset(); stopFrame(); observer.disconnect();
    delete page.dataset.runnerPlaying;
    if (!event.detail?.preserveVisual) { disposed = true; events.abort(); }
  }, { signal: events.signal });
}
