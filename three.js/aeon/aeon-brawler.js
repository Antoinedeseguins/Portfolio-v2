import { createGameScore } from "../game-score.js";
import { createResumeLock } from "../game-resume-lock.js";

export function enableBrawler(title) {
  const page = title.closest(".project-layout");
  const logo = page?.querySelector(".aeon-title-logo");
  if (!logo) return;
  const score = createGameScore(page, "aeon-must-die");
  let kills = 0;
  const lockResume = createResumeLock();
  const resumeLink = document.querySelector(".resume-link");
  const events = new AbortController();
  const options = { signal: events.signal };
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const enemyTypes = [
    { asset: "enemy-raider.svg", width: 51.33, height: 54, offsetX: 3.67, pace: 1, phaseRate: 170, hp: 5 },
    { asset: "enemy-stalker.svg", width: 36, height: 56, pace: 1.18, phaseRate: 120, hp: 5 },
    { asset: "enemy-brute.svg", width: 63.64, height: 56, offsetX: 3.82, pace: .8, phaseRate: 230, hp: 8 },
    { asset: "enemy-overlord.svg", width: 116, height: 116, pace: .42, phaseRate: 320, hp: 70, boss: true },
  ].map(type => {
    const sprite = new Image();
    sprite.src = new URL(`./${type.asset}?v=5`, import.meta.url).href;
    return { ...type, sprite };
  });
  let enemyAppearance = 0;
  let canvas, ctx, frame, last, active = false;
  let width = 0, height = 0, spawn = 0, cooldown = 0, impact = 0;
  let enemies = [], sparks = [];
  const removeDefeatedEnemies = () => {
    const defeated = enemies.filter(enemy => enemy.hp <= 0).length;
    if (defeated) { kills += defeated; score.update(kills); }
    enemies = enemies.filter(enemy => enemy.hp > 0);
  };
  let effects = [], combo = 0, lastPunch = -Infinity;
  let attackCount = 0;
  let launch = 0, launchAnimations = [];
  let hold = null;
  const drawImpacts = step => {
    effects = effects.filter(effect => effect.life > 0);
    ctx.save();
    ctx.beginPath(); ctx.rect(0, 0, width, gameBottom()); ctx.clip();
    for (const effect of effects) {
      effect.life -= step;
      const age = Math.min(1, 1 - effect.life / effect.duration);
      const alpha = (1 - age) ** .7;
      if (effect.kind === "enemy-slash") {
        ctx.save();
        ctx.translate(effect.x, effect.y); ctx.rotate(effect.angle);
        ctx.globalAlpha = alpha;
        const sweep = reduced ? 1 : Math.min(1, age / .45);
        const length = effect.length * (.65 + sweep * .35);
        const arc = effect.boss ? 22 : 12;
        ctx.beginPath();
        ctx.moveTo(0, -arc);
        ctx.quadraticCurveTo(length * .65, -arc * 1.5, length, 0);
        ctx.quadraticCurveTo(length * .55, -arc * .35, 0, -arc);
        ctx.fillStyle = "#d94558"; ctx.fill();
        ctx.beginPath(); ctx.moveTo(length * .12, -arc * .9);
        ctx.quadraticCurveTo(length * .65, -arc, length, 0);
        ctx.strokeStyle = "#ffe2cc"; ctx.lineWidth = effect.boss ? 2 : 1; ctx.stroke();
        ctx.restore();
        continue;
      }
      if (effect.kind === "chain") {
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.strokeStyle = "#ff633f"; ctx.lineWidth = reduced ? 1.5 : 3;
        ctx.shadowColor = "#ff4538"; ctx.shadowBlur = reduced ? 0 : 10;
        ctx.beginPath();
        effect.points.forEach((point, index) => {
          if (!index) { ctx.moveTo(point.x, point.y); return; }
          const previous = effect.points[index - 1];
          const dx = point.x - previous.x, dy = point.y - previous.y;
          const length = Math.hypot(dx, dy) || 1;
          for (let segment = 1; segment <= 8; segment++) {
            const fraction = segment / 8;
            const zigzag = reduced || segment === 8 ? 0 : (segment % 2 ? 1 : -1) * 6;
            ctx.lineTo(previous.x + dx * fraction - dy / length * zigzag, previous.y + dy * fraction + dx / length * zigzag);
          }
        });
        ctx.stroke();
        ctx.shadowBlur = 0; ctx.strokeStyle = "#fff3d4"; ctx.lineWidth = 1; ctx.stroke();
        ctx.restore();
        continue;
      }
      ctx.save(); ctx.translate(effect.x, effect.y); ctx.rotate(effect.tilt);
      if (effect.areaAttack) {
        ctx.rotate(-effect.tilt);
        const expansion=1-(1-Math.min(1,age/.7))**3;
        const radius=Math.max(1,effect.reach*expansion);
        const fade=(1-age)**1.5;
        const wash=ctx.createRadialGradient(0,0,radius*.55,0,0,radius);
        wash.addColorStop(0,"rgba(249,126,64,0)");
        wash.addColorStop(.86,`rgba(245,139,70,${fade*.14})`);
        wash.addColorStop(1,"rgba(255,210,150,0)");
        ctx.fillStyle=wash;ctx.beginPath();ctx.arc(0,0,radius,0,Math.PI*2);ctx.fill();
        for(let wave=0;wave<2;wave++) {
          const progress=Math.max(0,(age-wave*.12)/(1-wave*.12));
          if(wave&&age<.12) continue;
          const r=Math.max(1,effect.reach*(1-(1-Math.min(1,progress/.7))**3));
          ctx.beginPath();ctx.arc(0,0,r,0,Math.PI*2);
          ctx.strokeStyle=`rgba(255,${wave?170:211},${wave?103:161},${fade*(wave?.35:.8)})`;
          ctx.lineWidth=wave?1:2.5*(1-age)+.6;
          ctx.shadowColor="#ed9a57";ctx.shadowBlur=wave?0:7;ctx.stroke();
        }
        ctx.shadowBlur=0;
        for(let i=0;i<12;i++) {
          const angle=i*Math.PI/6+effect.seed;
          const distance=radius*(.78+(i%3)*.07);
          const x=Math.cos(angle)*distance,y=Math.sin(angle)*distance;
          ctx.beginPath();ctx.moveTo(x,y);
          ctx.lineTo(x+Math.cos(angle)*5*(1-age),y+Math.sin(angle)*5*(1-age));
          ctx.strokeStyle=`rgba(247,179,109,${fade*.8})`;ctx.lineWidth=1;ctx.stroke();
        }
        ctx.restore();continue;
      }
      if (effect.charged || effect.partialCharge) {
        const powerful=effect.chargeRatio>.5;
        const strength=powerful?(effect.chargeRatio-.5)*2:effect.chargeRatio*2;
        const sweep = 1 - (1 - Math.min(1, age / .4)) ** 3;
        const length = effect.reach * (powerful?1.05+strength*.15:.7+strength*.12) * (.5 + sweep * .5);
        const thickness = (powerful?14+strength*7:6+strength*3) * (1 - age);
        const bend=effect.variant?1:-1;
        const fade = (1 - age) ** 1.8;
        const glow = ctx.createLinearGradient(-12, 0, length, 0);
        glow.addColorStop(0, "rgba(255,91,49,0)");
        glow.addColorStop(.4, `rgba(244,111,64,${fade*(powerful?.5:.35)})`);
        glow.addColorStop(.8, `rgba(255,206,151,${fade*(powerful?.85:.65)})`);
        glow.addColorStop(1, "rgba(255,230,194,0)");
        ctx.beginPath();ctx.moveTo(-12, 0);
        ctx.bezierCurveTo(length*.2, -thickness*bend, length*.65, -thickness*.8*bend, length, 0);
        ctx.bezierCurveTo(length*.62, thickness*.2*bend, length*.12, thickness*.5*bend, -12, 0);
        ctx.fillStyle = glow;ctx.fill();
        ctx.beginPath();ctx.moveTo(4, 0);
        ctx.quadraticCurveTo(length*.55, -thickness*.3*bend, length, 0);
        ctx.strokeStyle = `rgba(255,231,199,${fade*.9})`;
        ctx.lineWidth = powerful?1.8:1.2;ctx.shadowColor = "#fa995b";ctx.shadowBlur = powerful?8:4;ctx.stroke();
        ctx.shadowBlur = 0;
        if(powerful) {
          // Two fine trailing ribbons make the heavy strike broader, without a radial burst.
          for(const side of [-1,1]) {
            ctx.beginPath();ctx.moveTo(0,side*5);
            ctx.bezierCurveTo(length*.25,side*thickness*1.9,length*.7,side*thickness*.9,length*.96,0);
            ctx.strokeStyle=`rgba(244,173,108,${fade*.55})`;ctx.lineWidth=.9;ctx.stroke();
          }
          const tip=length*(.75+sweep*.25);
          ctx.beginPath();ctx.moveTo(tip-5,-thickness*.7);ctx.lineTo(tip+3,0);ctx.lineTo(tip-5,thickness*.7);
          ctx.strokeStyle=`rgba(255,230,185,${fade*.65})`;ctx.lineWidth=1;ctx.stroke();
        }
        const sparkCount=powerful?7:3;
        for (let i=0;i<sparkCount;i++) {
          const x=length*(.48+i*.45/sparkCount)+age*(powerful?28:12);
          const y=(i%2?1:-1)*(4+age*(8+i*4))*(powerful?1.3:1);
          ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+3*(1-age),y-.8);
          ctx.strokeStyle=`rgba(245,174,108,${fade*.65})`;ctx.lineWidth=1;ctx.stroke();
        }
        ctx.restore();continue;
      }
      if (effect.kind === "uppercut") ctx.scale(.65, 1.5);
      else if (effect.kind === "cross") ctx.scale(1.4, .7);
      const radius = (effect.charged ? 95 : effect.finisher ? 65 : 38) * (.45 + age * .8);
      // Jagged comic impact, without lettering.
      ctx.beginPath();
      for (let i = 0; i < 24; i++) {
        const angle = i * Math.PI / 12;
        const length = radius * (i % 2 ? .42 : 1 + Math.sin(i * 7 + effect.seed) * .18);
        const x = Math.cos(angle) * length, y = Math.sin(angle) * length * .65;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fillStyle = `hsla(${effect.hue},100%,60%,${alpha * .12})`;
      ctx.strokeStyle = `hsla(${effect.hue},100%,65%,${alpha * .7})`;
      ctx.lineWidth = 1.5; ctx.fill(); ctx.stroke();
      // Red electric slashes, white cores and branching arcs.
      for (let slash = 0; slash < (effect.finisher ? 3 : 1); slash++) {
        ctx.save(); ctx.rotate(slash ? (slash === 1 ? .85 : -.85) : 0);
        ctx.beginPath();
        for (let i = 0; i <= 12; i++) {
          const x = (i / 12 - .5) * radius * 2.5;
          const y = i === 0 || i === 12 ? 0 : Math.sin(i * 17 + effect.seed + Math.floor(age * 12)) * 10;
          if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
          if (i === 4 || i === 8) {
            ctx.lineTo(x + 4, y - 16); ctx.lineTo(x + 12, y - 23); ctx.moveTo(x, y);
          }
        }
        ctx.shadowColor = `hsl(${effect.hue},100%,55%)`; ctx.shadowBlur = 12;
        ctx.strokeStyle = `hsla(${effect.hue},100%,60%,${alpha})`; ctx.lineWidth = effect.finisher ? 4 : 3; ctx.stroke();
        ctx.shadowBlur = 0; ctx.strokeStyle = `rgba(255,245,250,${alpha})`; ctx.lineWidth = 1; ctx.stroke();
        ctx.restore();
      }
      ctx.restore();
    }
    ctx.restore();
  };
  const originalTitle = [...title.childNodes];
  let letters = [];
  let wave = 1, spawned = 0, intermission = 0, bossSpawned = false;
  let recovering = false, returnAnimations = [];
  const difficulty = () => (wave - 1) * .9;
  const waveSize = () => Math.min(46, 14 + (wave - 1) * 3);
  const nextWave = () => {
    wave++;
    bossSpawned = false;
    spawned = 0; intermission = 0; spawn = .8;
  };
  const measureLetters = () => {
    for (const letter of letters) {
      const rect = letter.element.getBoundingClientRect();
      letter.x = rect.left + rect.width / 2;
      letter.y = rect.top + rect.height / 2;
    }
  };
  const prepareLetters = () => {
    const fragment = document.createDocumentFragment();
    letters = [];
    for (const word of title.textContent.split(/(\s+)/)) {
      if (!word.trim()) { fragment.append(document.createTextNode(word)); continue; }
      const group = document.createElement("span");
      group.className = "aeon-word";
      for (const character of word) {
        const element = document.createElement("span");
        element.className = "aeon-letter"; element.textContent = character;
        group.append(element);
        letters.push({ element, character, state: "home", hp: 3, hitCooldown: 0, x: 0, y: 0 });
      }
      fragment.append(group);
    }
    title.replaceChildren(fragment);
    measureLetters();
  };
  const hand = { x: 0, y: 0, inside: true };
  const gameBottom = () => Math.max(0, Math.min(height,
    page.querySelector(".project-copy > .copy-rule")?.getBoundingClientRect().top
      ?? title.getBoundingClientRect().bottom + 20));
  const enemyArena = () => {
    const bounds = title.getBoundingClientRect();
    const media = page.querySelector(".media-stack")?.getBoundingClientRect();
    const copy = title.closest(".project-copy").getBoundingClientRect();
    const stacked = media && media.right > copy.left + 40 && media.bottom <= bounds.top;
    const right = Math.min(width - 60, Math.max(bounds.right + 80, copy.right - 60));
    const left = Math.min(right, Math.max(60, bounds.left - 80, !stacked && media ? media.right + 60 : 0));
    const bottom = Math.max(15, bounds.top - 12);
    const top = stacked ? Math.min(bottom, media.bottom + 48) : -56;
    return { left, right, top, bottom };
  };
  const stop = () => {
    score.hide();
    active = false;
    document.documentElement.classList.remove("aeon-game-active");
    lockResume(false);
    hold = null;
    launchAnimations.forEach(animation => animation.cancel());
    launchAnimations = [];
    cancelAnimationFrame(frame);
    canvas?.remove();
    document.documentElement.classList.remove("aeon-hand-cursor");
    logo.style.visibility = "";
    logo.setAttribute("aria-pressed", "false");
    if (letters.length) title.replaceChildren(...originalTitle);
    letters = [];
  };
  const endGame = () => {
    stop();
    enemies = []; sparks = []; effects = [];
    if (reduced) return;
    recovering = true;
    returnAnimations = [
      title.animate([
        { opacity: 0, filter: "blur(5px)", transform: "translateY(10px) scale(.96)" },
        { opacity: 1, filter: "blur(0px)", transform: "translateY(0) scale(1)" },
      ], { duration: 550, easing: "cubic-bezier(.2,.8,.2,1)" }),
      logo.animate([
        { opacity: 0, transform: "translateY(calc(-50% - 4px)) scale(.35) rotate(-18deg)" },
        { opacity: 1, transform: "translateY(calc(-50% - 4px)) scale(1.12) rotate(5deg)", offset: .7 },
        { opacity: 1, transform: "translateY(calc(-50% - 4px)) scale(1) rotate(0deg)" },
      ], { duration: 450, delay: 250, fill: "backwards", easing: "ease-out" }),
    ];
    Promise.allSettled(returnAnimations.map(animation => animation.finished)).then(() => {
      returnAnimations = []; recovering = false;
    });
  };
  const explodeFist = () => {
    if (reduced) { endGame(); return; }
    active = false; recovering = true; hold = null;
    score.hide();
    document.documentElement.classList.remove("aeon-hand-cursor");
    const origin = { x: hand.x, y: hand.y };
    const fragments = Array.from({ length: 16 }, (_, index) => {
      const column = index % 4, row = Math.floor(index / 4);
      const angle = Math.atan2(row - 1.5, column - 1.5) + (Math.random() - .5) * .4;
      const speed = 65 + Math.random() * 90;
      return { column, row, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - 40, spin: (Math.random() - .5) * 10 };
    });
    let started = null;
    const draw = now => {
      if (events.signal.aborted) return;
      started ??= now;
      const time = (now - started) / 1000;
      if (time >= .75) { endGame(); return; }
      ctx.clearRect(0, 0, width, height);
      ctx.save();
      ctx.globalAlpha = Math.max(0, 1 - time / .75);
      for (const piece of fragments) {
        ctx.save();
        ctx.translate(origin.x + (piece.column - 1.5) * 13.5 + piece.vx * time, origin.y + (piece.row - 1.5) * 13.5 + piece.vy * time + 100 * time * time);
        ctx.rotate(piece.spin * time);
        ctx.drawImage(logo, piece.column * logo.naturalWidth / 4, piece.row * logo.naturalHeight / 4, logo.naturalWidth / 4, logo.naturalHeight / 4, -6.75, -6.75, 13.5, 13.5);
        ctx.restore();
      }
      ctx.restore();
      frame = requestAnimationFrame(draw);
    };
    frame = requestAnimationFrame(draw);
  };
  const resize = () => {
    width = document.documentElement.clientWidth;
    height = Math.max(1, Math.min(innerHeight, document.querySelector(".project-dock")?.getBoundingClientRect().top ?? innerHeight));
    const ratio = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    hand.x = Math.max(25, Math.min(width - 25, hand.x));
    hand.y = Math.max(25, Math.min(height - 25, hand.y));
    enemies.forEach(enemy => {
      enemy.x = Math.max(22, Math.min(width - 22, enemy.x));
      enemy.y = Math.max(30, Math.min(height - 30, enemy.y));
    });
  };
  const addEnemy = () => {
    const available = letters.filter(letter => letter.state === "home");
    if (!available.length) return false;
    const attackerCounts = available.map(letter => enemies.filter(enemy => !enemy.escaped && enemy.hp > 0 && enemy.target === letter).length);
    const fewest = Math.min(...attackerCounts);
    const choices = available.filter((letter, index) => attackerCounts[index] === fewest);
    const target = choices[Math.floor(Math.random() * choices.length)];
    const arena = enemyArena();
    const entrance = enemyAppearance % 3;
    const x = entrance === 1 ? arena.left : entrance === 2 ? arena.right : arena.left + Math.random() * (arena.right - arena.left);
    const sideTop = Math.max(24, arena.top);
    const y = entrance === 0 ? arena.top : sideTop + Math.random() * Math.max(0, arena.bottom - sideTop - 24);
    const enemy = { x, y, hp: 3, vx: 0, vy: 0, flash: 0, phase: Math.random() * 6.28, speed: 26 + Math.random() * 16, target, grab: 0, escaped: false };
    const isBoss = wave % 4 === 0 && !bossSpawned;
    enemy.type = isBoss ? enemyTypes[3] : enemyTypes[enemyAppearance % 3];
    enemyAppearance++;
    if (isBoss) bossSpawned = true;
    enemy.hp = (isBoss ? 55 : enemy.type.hp) + (isBoss ? (wave / 4 - 1) * 10 : Math.min(5, Math.floor(difficulty() / 2)));
    enemy.maxHp = enemy.hp;
    enemy.speed *= enemy.type.pace;
    enemies.push(enemy);
    spawned++;
    return true;
  };
  const tick = now => {
    if (!active) return;
    const dt = document.hidden || last === null ? 0 : Math.min((now - last) / 1000, .035);
    last = now;
    const playing = !document.hidden;
    const step = playing ? dt : 0;
    launch = Math.max(0, launch - step);
    const pressure = difficulty();
    const moveMultiplier = 1.05 + Math.min(1.2, pressure * .13);
    const attackPeriod = Math.max(.3, .5 - pressure * .018);
    measureLetters();
    for (const letter of letters) letter.hitCooldown = Math.max(0, letter.hitCooldown - step);
    const arena = enemyArena();
    const arenaLeft = arena.left;
    const arenaRight = arena.right;
    const arenaBottom = arena.bottom;
    cooldown = Math.max(0, cooldown - step);
    impact = Math.max(0, impact - step);
    spawn -= step;
    if (playing && !intermission && spawn <= 0 && spawned < waveSize() && enemies.length < Math.min(9, 4 + Math.floor(pressure))) {
      addEnemy(); spawn = Math.max(.28, .7 - pressure * .045);
    }
    if (hold?.canCharge && !intermission && enemies.length) hold.chargeTime += step * 1000;
    ctx.clearRect(0, 0, width, height);
    const landings = [];
    for (const enemy of enemies) {
      enemy.stun = Math.max(0, (enemy.stun || 0) - step);
      enemy.attackSwing = Math.max(0, (enemy.attackSwing || 0) - step);
      enemy.controlCooldown = Math.max(0, (enemy.controlCooldown || 0) - step);
      if (enemy.airborne > 0) {
        enemy.airborne = Math.max(0, enemy.airborne - step);
        if (enemy.airborne === 0) landings.push(enemy);
      }
      if (enemy.target.state !== "home") {
        const available = letters.filter(letter => letter.state === "home");
        const target = available.sort((a, b) => Math.abs(a.x - enemy.x) - Math.abs(b.x - enemy.x))[0];
        if (!target) { enemy.escaped = true; continue; }
        enemy.target = target; enemy.grab = 0;
      }
      const dx = enemy.target.x - enemy.x;
      const dy = arenaBottom - enemy.y;
      const distance = Math.hypot(dx, dy) || 1;
      if (distance > 5 && enemy.stun === 0) {
        enemy.x += dx / distance * enemy.speed * moveMultiplier * step;
        enemy.y += dy / distance * enemy.speed * moveMultiplier * step;
      } else if (distance <= 5 && enemy.stun === 0 && Math.hypot(enemy.vx, enemy.vy) < 35) {
        enemy.grab += step;
        if (enemy.grab >= attackPeriod && enemy.target.hitCooldown === 0) {
          enemy.grab = 0;
          const letter = enemy.target;
          enemy.attackSwing = .24;
          const slashX = enemy.x, slashY = enemy.y - (enemy.type.boss ? 48 : 20);
          effects.push({ kind: "enemy-slash", x: slashX, y: slashY,
            angle: Math.atan2(letter.y - slashY, letter.x - slashX),
            length: Math.hypot(letter.x - slashX, letter.y - slashY),
            boss: enemy.type.boss, life: reduced ? .15 : .24, duration: reduced ? .15 : .24 });
          letter.hitCooldown = .6;
          letter.hp--;
          letter.element.style.color = letter.hp === 2 ? "#a84658" : "#ef345a";
          if (letter.hp <= 0) {
            letter.state = "lost";
            letter.element.style.visibility = "hidden";
          }
          for (let i = 0; i < (reduced ? 2 : 8); i++) {
            const angle = Math.random() * Math.PI * 2;
            sparks.push({ x: letter.x, y: letter.y, vx: Math.cos(angle) * 100, vy: Math.sin(angle) * 100, life: .3, color: "#392840" });
          }
        }
      }
      enemy.x = Math.max(arenaLeft, Math.min(arenaRight, enemy.x + enemy.vx * step));
      enemy.y = Math.max(arena.top, Math.min(arenaBottom, enemy.y + enemy.vy * step));
      enemy.vx *= Math.exp(-step * 9); enemy.vy *= Math.exp(-step * 9);
      enemy.flash = Math.max(0, enemy.flash - step);
      const bob = reduced ? 0 : Math.sin(now / 130 + enemy.phase) * 2;
      const airborneOffset = enemy.airborne > 0 ? Math.sin(enemy.airborne / .65 * Math.PI) * (enemy.type.boss ? 18 : 65) : 0;
      const strike = reduced ? 0 : Math.sin((enemy.attackSwing || 0) / .24 * Math.PI);
      ctx.save(); ctx.translate(enemy.x, enemy.y + bob - airborneOffset + strike * 7);
      const pulse = reduced ? 0 : Math.sin(enemy.grab / attackPeriod * Math.PI) * 3;
      const attacking = enemy.grab > 0 && distance <= 5;
      ctx.rotate(reduced ? 0 : strike > 0 ? strike * .22 : attacking ? Math.sin(enemy.grab * 24) * .16 : Math.sin(now / enemy.type.phaseRate + enemy.phase) * .045);
      ctx.scale(1 + (attacking ? pulse * .025 : 0), 1 - (attacking ? pulse * .02 : 0));
      const { sprite, width: spriteWidth, height: spriteHeight } = enemy.type;
      if (sprite.complete && sprite.naturalWidth) {
        if (enemy.flash > 0) ctx.filter = "brightness(1.8) sepia(.6) saturate(3)";
        ctx.drawImage(sprite, -spriteWidth / 2 + (enemy.type.offsetX || 0), 14 - spriteHeight + pulse, spriteWidth, spriteHeight);
        ctx.filter = "none";
      } else {
        ctx.fillStyle = enemy.flash ? "#ff4266" : "#392840";
        ctx.fillRect(-9, -9 + pulse, 18, 18);
      }
      if (enemy.type.boss) {
        ctx.fillStyle = "#251b2d"; ctx.fillRect(-35, -112, 70, 4);
        ctx.fillStyle = "#ff653f"; ctx.fillRect(-35, -112, 70 * enemy.hp / enemy.maxHp, 4);
      }
      ctx.restore();
    }
    for (const landing of landings) {
      for (const enemy of enemies) {
        if (enemy === landing || Math.hypot(enemy.x - landing.x, enemy.y - landing.y) > 85) continue;
        enemy.hp -= 2; enemy.flash = .15;
        if (!enemy.type.boss) { enemy.stun = Math.max(enemy.stun || 0, .3); enemy.grab = 0; }
      }
      if (!reduced) effects.push({ x: landing.x, y: landing.y, life: .3, duration: .3, kind: "slam", finisher: true, charged: false, hue: 25, tilt: 0, seed: Math.random() * 100 });
    }
    removeDefeatedEnemies();
    enemies = enemies.filter(enemy => !enemy.escaped);
    if (letters.length && letters.every(letter => letter.state === "lost")) {
      explodeFist();
      return;
    } else if (!intermission && spawned >= waveSize() && enemies.length === 0) {
      intermission = 1.4;
      if (hold) { hold.chargeTime = 0; hold.canCharge = false; }
    }
    if (intermission) {
      intermission = Math.max(.001, intermission - step);
      if (intermission <= .001) nextWave();
    }
    sparks = sparks.filter(spark => spark.life > 0);
    for (const spark of sparks) {
      spark.life -= step;
      spark.x += spark.vx * step; spark.y += spark.vy * step;
      ctx.globalAlpha = Math.max(0, spark.life / .3);
      ctx.fillStyle = spark.color; ctx.fillRect(spark.x, spark.y, 4, 4);
    }
    ctx.globalAlpha = 1;
    drawImpacts(step);
    if (hand.inside) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, width, gameBottom());
      ctx.clip();
      const charge = hold ? Math.min(1, hold.chargeTime / 1200) : 0;
      const size = !reduced && launch > 0
        ? 54 + Math.sin(Math.min(1, ( .6 - launch) / .6) * Math.PI) * 25
        : !reduced && charge > 0 ? 54 + charge * 14 : impact > 0 && !reduced ? 65 : 54;
      if (charge > .06) {
        const radius=size*.55+4;
        const start=Math.PI*.75,span=Math.PI*1.5;
        const opacity=Math.min(1,(charge-.06)/.08);
        ctx.save();ctx.translate(hand.x,hand.y);ctx.globalAlpha=opacity;
        ctx.lineCap="round";
        ctx.beginPath();ctx.arc(0,0,radius,start,start+span);
        ctx.strokeStyle="rgba(125,100,88,.18)";ctx.lineWidth=1;ctx.stroke();
        const gradient=ctx.createLinearGradient(-radius,radius,radius,-radius);
        gradient.addColorStop(0,"#bd7157");gradient.addColorStop(.65,"#e5ac75");gradient.addColorStop(1,"#ffe0b4");
        const end=start+span*charge;
        ctx.beginPath();ctx.arc(0,0,radius,start,end);
        ctx.strokeStyle=gradient;ctx.lineWidth=charge>=1?1.8:1.4;ctx.stroke();
        // The small top marker indicates when the charged attack is available.
        ctx.beginPath();ctx.moveTo(0,-radius-2);ctx.lineTo(0,-radius+2);
        ctx.strokeStyle=charge>=.5?"rgba(239,196,147,.9)":"rgba(125,100,88,.3)";
        ctx.lineWidth=1;ctx.stroke();
        ctx.beginPath();ctx.arc(Math.cos(end)*radius,Math.sin(end)*radius,1.5,0,Math.PI*2);
        ctx.fillStyle=charge>=1?"#ffe5c3":"#e9ba8b";ctx.fill();
        ctx.restore();
      }
      ctx.drawImage(logo, hand.x - size / 2, hand.y - size / 2, size, size);
      ctx.restore();
    }
    frame = requestAnimationFrame(tick);
  };
  const start = () => {
    if (active || recovering || events.signal.aborted) return;
    const bounds = logo.getBoundingClientRect();
    hand.x = bounds.left + bounds.width / 2; hand.y = bounds.top + bounds.height / 2; hand.inside = true;
    canvas = document.createElement("canvas");
    canvas.className = "aeon-brawler-stage"; canvas.setAttribute("aria-hidden", "true");
    ctx = canvas.getContext("2d");
    if (!ctx) return;
    document.body.append(canvas);
    active = true; enemies = []; sparks = []; spawn = 0; cooldown = impact = 0; last = null;
    kills = 0; score.show();
    document.documentElement.classList.add("aeon-game-active");
    window.getSelection()?.removeAllRanges();
    lockResume(true);
    effects = []; combo = 0; lastPunch = -Infinity; attackCount = 0;
    wave = 1; spawned = 0; intermission = 0; bossSpawned = false;
    enemyAppearance = 0;
    prepareLetters();
    resize();
    launch = reduced ? 0 : .6;
    impact = .16;
    for (let i = 0; i < 3; i++) addEnemy();
    // Make the first arrival visible immediately rather than above the viewport.
    if (enemies[0]) enemies[0].y = Math.min(enemyArena().bottom - 30, Math.max(24, enemyArena().top));
    spawn = .7;
    if (!reduced) {
      const titleColor = getComputedStyle(title).color;
      launchAnimations.push(title.animate([
        { color: titleColor, textShadow: "0 0 0 transparent" },
        { color: "#ff345a", textShadow: "0 0 8px #ff345a, 0 0 20px #ff345a99", offset: .25 },
        { color: "#ee2447", textShadow: "0 0 12px #ff345a88", offset: .5 },
        { color: titleColor, textShadow: "0 0 0 transparent" },
      ], { duration: 600, easing: "ease-out" }));
      const rule = page.querySelector(".project-copy > .copy-rule");
      if (rule) launchAnimations.push(rule.animate([
        { backgroundColor: "#ff345a", boxShadow: "0 0 12px 3px #ff345a99" },
        { backgroundColor: "#ff9755", boxShadow: "0 0 5px 1px #ff345a55", offset: .4 },
        { backgroundColor: getComputedStyle(rule).backgroundColor, boxShadow: "0 0 0 0 transparent" },
      ], { duration: 650, easing: "ease-out" }));
    }
    logo.style.visibility = "hidden";
    logo.setAttribute("aria-pressed", "true");
    move({ clientX: hand.x, clientY: hand.y });
    frame = requestAnimationFrame(tick);
  };
  const move = event => {
    if (!active) return;
    const bottom = gameBottom();
    const arena = enemyArena();
    const left = Math.max(0, Math.min(arena.left - 60, page.querySelector(".hero-frame")?.getBoundingClientRect().right ?? 0));
    const right = Math.min(width, Math.max(arena.right + 60, page.querySelector(".project-copy > .copy-rule")?.getBoundingClientRect().right ?? width));
    hand.inside = event.clientX >= left && event.clientX < right && event.clientY >= 0 && event.clientY < bottom;
    document.documentElement.classList.toggle("aeon-hand-cursor", hand.inside);
    if (!hand.inside) hold = null;
    hand.x = event.clientX;
    hand.y = event.clientY;
  };
  logo.tabIndex = 0; logo.removeAttribute("aria-hidden");
  logo.setAttribute("role", "button"); logo.setAttribute("aria-label", "Jouer au mini beat 'em all"); logo.setAttribute("aria-pressed", "false");
  logo.addEventListener("pointerdown", event => event.stopPropagation(), options);
  logo.addEventListener("click", event => { event.stopPropagation(); start(); }, options);
  logo.addEventListener("keydown", event => {
    if (["Enter", " "].includes(event.key)) { event.preventDefault(); if (!event.repeat) start(); }
  }, options);
  window.addEventListener("pointermove", move, options);
  const punch = chargeTime => {
    attackCount++;
    const now = performance.now();
    combo = now - lastPunch < 800 ? combo + 1 : 1;
    lastPunch = now;
    const charged = chargeTime >= 600;
    const partialCharge = !charged && chargeTime >= 150;
    const chargeRatio = Math.min(1,chargeTime/1200);
    const areaAttack = chargeRatio > .5;
    const fullCharge = chargeTime >= 1200;
    const kind = charged ? "charged" : attackCount % 5 === 0 ? "burst" : ["jab", "cross", "uppercut", "cross"][(combo - 1) % 4];
    const finisher = charged || kind === "burst";
    const damage = charged ? (fullCharge ? 6 : 4) : kind === "burst" ? 4 : kind === "uppercut" ? 3 : 1;
    const reach = areaAttack ? 160+(chargeRatio-.5)*120 : charged ? 115 : kind === "burst" ? 145 : 90;
    cooldown = charged ? .4 : .12; impact = .16;
    if (!reduced) {
      if (effects.length >= 8) effects.shift();
      const nearest = charged || partialCharge ? enemies.filter(enemy=>enemy.hp>0).sort((a,b)=>Math.hypot(a.x-hand.x,a.y-(a.type.boss?44:0)-hand.y)-Math.hypot(b.x-hand.x,b.y-(b.type.boss?44:0)-hand.y))[0] : null;
      const tilt = charged || partialCharge ? nearest ? Math.atan2(nearest.y-(nearest.type.boss?44:0)-hand.y,nearest.x-hand.x) : -.35 : kind === "uppercut" ? -.3 : combo % 2 ? -.4 : .4;
      const duration = areaAttack ? .62 : partialCharge || charged ? .28 : finisher ? .4 : .28;
      effects.push({ x: hand.x, y: hand.y, life: duration, duration, finisher, charged, partialCharge, chargeRatio, areaAttack, variant:attackCount%2, fullCharge, reach, kind, hue: fullCharge ? 45 : finisher ? 18 : 350, tilt, seed: Math.random() * 100 });
    }
    const chainPoints = [{ x: hand.x, y: hand.y }];
    const chained = new Set();
    if (!charged && attackCount % 3 === 0) {
      for (let hop = 0; hop < 3; hop++) {
        const origin = chainPoints[chainPoints.length - 1];
        const candidates = enemies.filter(enemy => !chained.has(enemy) && enemy.hp > 0)
          .map(enemy => ({ enemy, x: enemy.x, y: enemy.y - (enemy.type.boss ? 44 : 0) }))
          .filter(point => Math.hypot(point.x - origin.x, point.y - origin.y) <= (hop === 0 ? reach : 140))
          .sort((a, b) => Math.hypot(a.x - origin.x, a.y - origin.y) - Math.hypot(b.x - origin.x, b.y - origin.y));
        if (!candidates.length) break;
        const target = candidates[0];
        chained.add(target.enemy); chainPoints.push({ x: target.x, y: target.y });
      }
      if (chainPoints.length > 1) effects.push({ kind: "chain", points: chainPoints, life: .35, duration: .35 });
    }
    for (const enemy of enemies) {
      const dx = enemy.x - hand.x, dy = enemy.y - (enemy.type.boss ? 44 : 0) - hand.y;
      const distance = Math.hypot(dx, dy);
      if (distance > reach && !chained.has(enemy)) continue;
      enemy.hp -= (distance <= reach ? damage : 0) + (chained.has(enemy) ? 2 : 0); enemy.flash = .15;
      const canInterrupt = !enemy.type.boss || (distance <= reach && (charged || finisher || kind === "uppercut") && !(enemy.controlCooldown > 0));
      if (canInterrupt) {
        enemy.grab = 0;
        enemy.stun = Math.max(enemy.stun || 0, enemy.type.boss ? .12 : charged ? .4 : finisher ? .5 : .15);
        if (enemy.type.boss) enemy.controlCooldown = 1.4;
        if (!enemy.type.boss && kind === "uppercut" && distance <= reach) { enemy.airborne = .65; enemy.stun = .65; }
        const knockback = (enemy.type.boss ? 55 : 580) * (areaAttack ? 1.2 : charged ? 1.25 : finisher ? 1.4 : 1);
        enemy.vx = dx / (distance || 1) * knockback;
        enemy.vy = kind === "uppercut" ? 0 : dy / (distance || 1) * knockback;
      }
      for (let i = 0; i < (reduced ? 2 : 10); i++) {
        const angle = Math.random() * Math.PI * 2;
        sparks.push({ x: enemy.x, y: enemy.y, vx: Math.cos(angle) * 160, vy: Math.sin(angle) * 160, life: .3, color: enemy.hp ? "#ff4166" : "#edaa38" });
      }
    }
    removeDefeatedEnemies();
    if (charged) combo = 0;
  };
  const isNavigationTarget = target => {
    // The disabled CV link can sit underneath enemies at the top of the arena.
    if (target.closest('.resume-link[aria-disabled="true"]')) return false;
    return Boolean(target.closest("nav, a, .page-arrow"));
  };
  window.addEventListener("pointerdown", event => {
    if (!active || event.button !== 0 || !event.isPrimary) return;
    if (isNavigationTarget(event.target)) return;
    move(event);
    if (!hand.inside) return;
    event.preventDefault(); event.stopImmediatePropagation();
    if (cooldown > 0 || hold) return;
    hold = { id: event.pointerId, chargeTime: 0, canCharge: !intermission && enemies.length > 0 };
  }, { capture: true, signal: events.signal });
  window.addEventListener("pointerup", event => {
    if (!hold || hold.id !== event.pointerId || event.button !== 0) return;
    if (isNavigationTarget(event.target)) { hold = null; return; }
    const chargeTime = !intermission && enemies.length ? hold.chargeTime : 0;
    move(event);
    hold = null;
    if (!active || !hand.inside) return;
    event.preventDefault(); event.stopImmediatePropagation();
    punch(chargeTime);
  }, { capture: true, signal: events.signal });
  window.addEventListener("pointercancel", () => { hold = null; }, options);
  // Prevent native selection and link dragging from interrupting combat gestures.
  for (const type of ["selectstart", "dragstart"]) {
    document.addEventListener(type, event => {
      if (active) event.preventDefault();
    }, { capture: true, signal: events.signal });
  }
  window.addEventListener("blur", () => { hold = null; }, options);
  document.addEventListener("visibilitychange", () => { if (document.hidden) hold = null; }, options);
  // Keep combat clicks from opening the portfolio beneath the arena.
  window.addEventListener("click", event => {
    if (resumeLink?.getAttribute("aria-disabled") === "true" && event.target.closest(".resume-link")) {
      event.preventDefault(); event.stopImmediatePropagation(); return;
    }
    if (!active || event.target === logo) return;
    if (isNavigationTarget(event.target)) return;
    move(event);
    if (hand.inside) { event.preventDefault(); event.stopImmediatePropagation(); }
  }, { capture: true, signal: events.signal });
  document.documentElement.addEventListener("pointerleave", () => {
    hold = null;
    hand.inside = false; document.documentElement.classList.remove("aeon-hand-cursor");
  }, options);
  window.addEventListener("resize", () => {
    if (active) { resize(); move({ clientX: hand.x, clientY: hand.y }); }
  }, options);
  window.addEventListener("scroll", () => {
    if (active) move({ clientX: hand.x, clientY: hand.y });
  }, { passive: true, signal: events.signal });
  page.addEventListener("page-dispose", () => {
    returnAnimations.forEach(animation => animation.cancel());
    stop(); score.dispose(); events.abort();
    for (const attribute of ["tabindex", "role", "aria-label", "aria-pressed"]) logo.removeAttribute(attribute);
    logo.setAttribute("aria-hidden", "true");
  }, options);
}
