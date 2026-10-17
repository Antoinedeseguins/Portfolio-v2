import { createGameScore } from "../game-score.js";
import { createResumeLock } from "../game-resume-lock.js";

export function enableGallery(button) {
  const page = button.closest(".project-layout"), title = page.querySelector(".necro-title");
  const score = createGameScore(page, "necromunda");
  const lockResume = createResumeLock();
  let kills = 0;
  const events = new AbortController(), options = { signal: events.signal };
  const original = [...title.childNodes], reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const sprites = ["gunner.svg", "enemy-chemist.svg", "enemy-heavy.svg"].map(asset => {
    const image = new Image(); image.src = new URL(`./${asset}?v=2`, import.meta.url).href; return image;
  });
  let active = false, recovering = false, canvas, ctx, frame, last = null;
  let letters = [], enemies = [], shots = [], animations = [];
  let defeatFragments = [];
  let hitAnimation = null;
  let elapsed = 0, spawn = 0, cooldown = 0, held = false, width = 0, height = 0;
  let escaped = 0, recoil = 0;
  const mouse = { x: 0, y: 0, inside: false };
  const aimPoint = () => {
    const shake = reduced ? 0 : Math.min(1, recoil / .35) * 7;
    const a = area();
    return { x: Math.max(a.left + 14, Math.min(a.right - 14, mouse.x + Math.sin(elapsed * 65) * shake)),
      y: Math.max(a.top + 14, Math.min(a.bottom - 14, mouse.y + Math.cos(elapsed * 53) * shake)) };
  };
  const area = () => {
    const copy = title.closest(".project-copy").getBoundingClientRect();
    const bottom = page.querySelector(".project-copy > .copy-rule")?.getBoundingClientRect().top ?? title.getBoundingClientRect().bottom + 20;
    return { left: Math.max(0, copy.left - 16), right: Math.min(innerWidth, copy.right + 16), top: Math.max(0, title.getBoundingClientRect().top - 130), bottom };
  };
  const updateMouse = event => {
    mouse.x = event.clientX; mouse.y = event.clientY;
    const a = area();
    mouse.inside = active && mouse.x >= a.left && mouse.x <= a.right && mouse.y >= a.top && mouse.y < a.bottom;
    document.documentElement.classList.toggle("necro-aiming", mouse.inside);
    if (!mouse.inside) held = false;
  };
  const measure = () => letters.forEach(letter => { letter.rect = letter.element.getBoundingClientRect(); });
  const resize = () => {
    if (!active) return;
    width = document.documentElement.clientWidth; height = innerHeight;
    const ratio = Math.min(devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio);
    canvas.style.width = `${width}px`; canvas.style.height = `${height}px`;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0); measure();
  };
  const stop = () => {
    lockResume(false);
    score.hide();
    hitAnimation?.cancel(); hitAnimation = null;
    defeatFragments.forEach(fragment => fragment.remove()); defeatFragments = [];
    button.style.visibility = "";
    active = false; held = false; recoil = 0;
    cancelAnimationFrame(frame); canvas?.remove();
    document.documentElement.classList.remove("necro-aiming");
    button.hidden = false; button.disabled = false; button.setAttribute("aria-pressed", "false");
    title.replaceChildren(...original); letters = []; enemies = []; shots = [];
    page.dataset.galleryPlaying = "false";
    page.dispatchEvent(new Event("hero-autoplay-change"));
  };
  const defeat = async () => {
    score.hide();
    if (reduced) { stop(); return; }
    active = false; held = false;
    lockResume(false);
    recovering = true;
    cancelAnimationFrame(frame);
    document.documentElement.classList.remove("necro-aiming");
    canvas?.remove();
    const bounds = button.getBoundingClientRect();
    const rifle = button.querySelector("img");
    button.style.visibility = "hidden";
    animations = Array.from({ length: 6 }, (_, index) => {
      const fragment = rifle.cloneNode();
      fragment.setAttribute("aria-hidden", "true");
      const column = index % 3, row = Math.floor(index / 3);
      Object.assign(fragment.style, {
        position: "fixed", left: `${bounds.left}px`, top: `${bounds.top}px`, width: `${bounds.width}px`, height: `${bounds.height}px`,
        pointerEvents: "none", zIndex: "5", objectFit: "contain",
        clipPath: `inset(${row * 50}% ${(2 - column) * 100 / 3}% ${(1 - row) * 50}% ${column * 100 / 3}%)`,
      });
      document.body.append(fragment); defeatFragments.push(fragment);
      const x = (column - 1) * 35, y = row ? 28 : -25;
      return fragment.animate([
        { opacity: 1, transform: "translate(0, 0) rotate(-12deg)" },
        { opacity: 1, transform: `translate(${x}px, ${y}px) rotate(${(column - 1) * 20 - 12}deg)`, offset: .4 },
        { opacity: 0, transform: `translate(${x * 1.5}px, ${y + 65}px) rotate(${(column - 1) * 45 - 12}deg)` },
      ], { duration: 700, easing: "ease-out", fill: "forwards" });
    });
    await Promise.allSettled(animations.map(animation => animation.finished));
    if (events.signal.aborted) return;
    animations.forEach(animation => animation.cancel());
    stop();
    animations = [button.animate([{ opacity: .25, translate: "-4px 0" }, { opacity: 1, translate: "0 0" }], { duration: 500 })];
    Promise.allSettled(animations.map(animation => animation.finished)).then(() => { recovering = false; animations = []; });
  };
  const addEnemy = () => {
    const choices = letters.filter(letter => !enemies.some(enemy => enemy.letter === letter));
    if (!choices.length) return;
    const letter = choices[Math.floor(Math.random() * choices.length)];
    const variant = Math.floor(Math.random() * sprites.length);
    const depth = Math.floor(Math.random() * 2);
    const scale = [1, .82][depth];
    enemies.push({ letter, variant, depth, scale, age: 0, exposure: 0, hp: elapsed > 15 && variant === 2 ? 2 : 1, fired: false, burst: 0, flash: 0, x: 0, y: 0 });
    enemies.sort((a, b) => a.scale - b.scale);
  };
  const shoot = () => {
    cooldown = .17;
    const aim = aimPoint();
    const enemy = [...enemies].reverse().find(target => target.exposure > .4 && Math.abs(aim.x - target.x) < 21 * target.scale + 2 && Math.abs(aim.y - target.y) < 27 * target.scale + 2);
    if (enemy) {
      enemy.hp--; enemy.flash = .12;
      if (enemy.hp <= 0) { kills++; score.update(kills); }
    }
    shots.push({ x: aim.x, y: aim.y, life: .2, hit: Boolean(enemy) });
    enemies = enemies.filter(target => target.hp > 0);
  };
  const tick = now => {
    if (!active) return;
    const dt = document.hidden || last === null ? 0 : Math.min(.035, (now - last) / 1000); last = now;
    elapsed += dt; cooldown = Math.max(0, cooldown - dt); recoil = Math.max(0, recoil - dt); spawn -= dt;
    measure();
    updateMouse({ clientX: mouse.x, clientY: mouse.y });
    const a = area(), pressure = Math.floor(elapsed / 6);
    if (spawn <= 0 && enemies.length < Math.min(7, 3 + pressure)) { addEnemy(); spawn = Math.max(.25, .85 - pressure * .09); }
    if (held && mouse.inside && cooldown <= 0) shoot();
    ctx.clearRect(0, 0, width, height);
    ctx.save(); ctx.beginPath(); ctx.rect(a.left, a.top, a.right - a.left, a.bottom - a.top); ctx.clip();
    const exposureTime = Math.max(.75, 1.7 - pressure * .1);
    for (const enemy of enemies) {
      enemy.age += dt; enemy.flash = Math.max(0, enemy.flash - dt);
      const b = enemy.letter.rect;
      enemy.exposure = Math.max(0, Math.min(1, enemy.age / .28, (exposureTime + .55 - enemy.age) / .3));
      enemy.x = b.left + b.width / 2;
      enemy.y = b.top + 27 * enemy.scale - enemy.exposure * (53 * enemy.scale + enemy.depth * 16);
      if (enemy.burst < 3 && enemy.age >= exposureTime - .4 + enemy.burst * .15) {
        enemy.burst++; enemy.fired = true; recoil = .35;
        shots.push({ x: enemy.x + 24 * enemy.scale, y: enemy.y + 12 * enemy.scale, life: .15, incoming: true });
      }
      // Only the part above the letter is visible: the typography is the cover.
      ctx.save(); ctx.beginPath(); ctx.rect(a.left, a.top, a.right - a.left, Math.max(0, b.top + 3 - a.top)); ctx.clip();
      ctx.translate(enemy.x, enemy.y);
      ctx.scale(enemy.scale, enemy.scale);
      ctx.globalAlpha = (1 - enemy.depth * .09) * Math.min(1, enemy.exposure * 3);
      const sprite = sprites[enemy.variant];
      if (sprite.complete && sprite.naturalWidth) {
        if (enemy.flash) ctx.filter = "brightness(1.9) sepia(.35)";
        const recoil = !reduced && enemy.fired ? -2 : 0;
        ctx.drawImage(sprite, enemy.variant === 2 ? -27 : -24, -29 + recoil, enemy.variant === 2 ? 54 : 48, 64);
        ctx.filter = "none";
      } else {
      ctx.fillStyle = enemy.flash ? "#ffe5a3" : enemy.hp > 1 ? "#454c42" : "#654b3c";
      ctx.strokeStyle = "#262625"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(-14, 21); ctx.lineTo(-11, 2); ctx.lineTo(11, 2); ctx.lineTo(14, 21); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = "#292d2c"; ctx.fillRect(-10, -14, 20, 19);
      ctx.fillStyle = "#8c7760"; ctx.fillRect(-9, -16, 18, 7);
      ctx.fillStyle = enemy.age > exposureTime - .35 ? "#ff643e" : "#d6b45e"; ctx.fillRect(-7, -7, 14, 3);
      ctx.fillStyle = "#282b29"; ctx.fillRect(-5, 9, 26, 7); ctx.fillRect(16, 7, 6, 10);
      }
      if (enemy.fired) { ctx.fillStyle = "#ffb44c"; ctx.beginPath(); ctx.arc(25, 12, 6, 0, Math.PI * 2); ctx.fill(); }
      ctx.restore();
    }
    const previousEscaped = escaped;
    enemies = enemies.filter(enemy => {
      if (enemy.age < exposureTime + .55) return true;
      escaped++;
      return false;
    });
    if (escaped > previousEscaped) {
      hitAnimation?.cancel();
      hitAnimation = title.animate([
        { color: "#bd3434" },
        { color: getComputedStyle(title).color },
      ], { duration: 380, easing: "ease-out" });
    }
    shots = shots.filter(shot => shot.life > 0);
    for (const shot of shots) {
      shot.life -= dt; ctx.globalAlpha = Math.max(0, shot.life / .2);
      ctx.strokeStyle = shot.incoming ? "#dd593f" : shot.hit ? "#efb94b" : "#7a776b"; ctx.lineWidth = 2;
      const r = reduced ? 6 : 5 + (1 - shot.life / .2) * 13;
      ctx.beginPath(); ctx.moveTo(shot.x - r, shot.y - r); ctx.lineTo(shot.x + r, shot.y + r);
      ctx.moveTo(shot.x + r, shot.y - r); ctx.lineTo(shot.x - r, shot.y + r); ctx.stroke();
    }
    ctx.globalAlpha = 1;
    if (mouse.inside) {
      const aim = aimPoint();
      ctx.strokeStyle = recoil > 0 ? "#d65c35" : "#a64933"; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(aim.x, aim.y, 9, 0, Math.PI * 2);
      for (let i = 0; i < 4; i++) { const angle = i * Math.PI / 2; ctx.moveTo(aim.x + Math.cos(angle) * 6, aim.y + Math.sin(angle) * 6); ctx.lineTo(aim.x + Math.cos(angle) * 14, aim.y + Math.sin(angle) * 14); }
      ctx.stroke();
    }
    ctx.restore();
    const rifle = button.getBoundingClientRect();
    const heartsX = Math.min(width - 44, rifle.right + 12), heartsY = rifle.top + rifle.height / 2;
    for (let i = 0; i < 3; i++) {
      ctx.save(); ctx.translate(heartsX + i * 13, heartsY);
      ctx.beginPath(); ctx.moveTo(0, 5);
      ctx.bezierCurveTo(-2, 3, -6, 0, -6, -3);
      ctx.bezierCurveTo(-6, -7, -1, -8, 0, -4);
      ctx.bezierCurveTo(1, -8, 6, -7, 6, -3);
      ctx.bezierCurveTo(6, 0, 2, 3, 0, 5); ctx.closePath();
      ctx.fillStyle = i < escaped ? "#d1cbc5" : "#bd5049";
      ctx.fill();
      ctx.restore();
    }
    if (escaped >= 3) { defeat(); return; }
    frame = requestAnimationFrame(tick);
  };
  const start = (event) => {
    if (active || recovering || events.signal.aborted) return;
    const fragment = document.createDocumentFragment();
    letters = [];
    for (const word of title.textContent.split(/(\s+)/)) {
      if (!word.trim()) { fragment.append(document.createTextNode(word)); continue; }
      const group = document.createElement("span"); group.className = "necro-word";
      for (const character of word) { const element = document.createElement("span"); element.textContent = character; group.append(element); letters.push({ element, rect: null }); }
      fragment.append(group);
    }
    title.replaceChildren(fragment);
    canvas = document.createElement("canvas"); canvas.className = "necro-gallery-stage"; canvas.setAttribute("aria-hidden", "true");
    ctx = canvas.getContext("2d"); if (!ctx) { title.replaceChildren(...original); return; }
    document.body.append(canvas); active = true; elapsed = 0; cooldown = 0; spawn = .6; last = null; held = false;
    lockResume(true);
    kills = 0; score.show();
    escaped = 0; recoil = 0; mouse.inside = false;
    resize(); addEnemy(); addEnemy(); addEnemy();
    updateMouse(event);
    button.disabled = true; button.setAttribute("aria-pressed", "true");
    page.dataset.galleryPlaying = "true"; page.dispatchEvent(new Event("hero-autoplay-change"));
    frame = requestAnimationFrame(tick);
  };
  button.addEventListener("click", event => { event.stopPropagation(); start(event); }, options);
  button.addEventListener("pointerdown", event => event.stopPropagation(), options);
  window.addEventListener("pointermove", event => { if (active) updateMouse(event); }, options);
  window.addEventListener("pointerdown", event => {
    if (!active || event.button !== 0 || !event.isPrimary) return;
    updateMouse(event); if (!mouse.inside) return;
    event.preventDefault(); event.stopImmediatePropagation(); held = true;
    if (cooldown <= 0) shoot();
  }, { capture: true, signal: events.signal });
  window.addEventListener("click", event => { if (active && mouse.inside && event.target !== button && !button.contains(event.target)) { event.preventDefault(); event.stopImmediatePropagation(); } }, { capture: true, signal: events.signal });
  for (const type of ["pointerup", "pointercancel", "blur"]) window.addEventListener(type, () => { held = false; }, options);
  document.addEventListener("visibilitychange", () => { held = false; last = null; }, options);
  const leaveArena = () => {
    held = false; mouse.inside = false; mouse.x = mouse.y = -Infinity;
    document.documentElement.classList.remove("necro-aiming");
  };
  document.documentElement.addEventListener("pointerleave", leaveArena, options);
  window.addEventListener("blur", leaveArena, options);
  window.addEventListener("resize", resize, options);
  page.addEventListener("page-dispose", () => { animations.forEach(animation => animation.cancel()); stop(); score.dispose(); events.abort(); }, options);
}
