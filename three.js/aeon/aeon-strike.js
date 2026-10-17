import { createDamage } from "./aeon-damage.js?v=11";
import { enableBrawler } from "./aeon-brawler.js?v=43";

export function strikeMove(combo, charge) {
  const charged = charge >= 550;
  const kind = charged ? "charged" : ["slash", "reverse", "uppercut", "cross", "burst"][(combo - 1) % 5];
  return { kind, power: charged ? 2.2 + Math.min(1, charge / 1200) * .6 : [1, 1.15, 1.45, 1.6, 2.3][(combo - 1) % 5] };
}

export function enableStrikes(title) {
  return enableBrawler(title);
}

export function enableCursorFollow(title) {
  const row = title.closest(".aeon-title-row");
  const page = title.closest(".project-layout");
  const logo = row?.querySelector(".aeon-title-logo");
  if (!row || !page || !logo) return;
  const events = new AbortController();
  const options = { signal: events.signal };
  let active = false;
  let offsetX = 0, offsetY = 0;
  row.classList.add("aeon-follow-mode");
  logo.tabIndex = 0;
  logo.removeAttribute("aria-hidden");
  logo.setAttribute("role", "button");
  logo.setAttribute("aria-label", "Activer le suivi du curseur");
  logo.setAttribute("aria-pressed", "false");
  const toggle = () => {
    active = !active;
    document.documentElement.classList.toggle("aeon-hand-cursor", active);
    logo.setAttribute("aria-pressed", String(active));
    logo.setAttribute("aria-label", active ? "Arrêter le suivi du curseur" : "Activer le suivi du curseur");
  };
  logo.addEventListener("pointerdown", event => event.stopPropagation(), options);
  logo.addEventListener("click", event => {
    event.stopPropagation();
    toggle();
  }, options);
  logo.addEventListener("keydown", event => {
    if (["Enter", " "].includes(event.key)) {
      event.preventDefault();
      if (!event.repeat) toggle();
    }
  }, options);
  window.addEventListener("pointermove", event => {
    if (!active || (event.pointerType !== "mouse" && event.pointerType !== "pen")) return;
    if (!logo.isConnected || page.classList.contains("page-outgoing")) return;
    const fist = logo.getBoundingClientRect();
    const originX = fist.left - offsetX;
    const originY = fist.top - offsetY;
    // Use the full viewport above the project bar, including empty space.
    const left = 0;
    const right = document.documentElement.clientWidth;
    const top = 0;
    const bottom = Math.min(window.innerHeight, document.querySelector(".project-dock")?.getBoundingClientRect().top ?? window.innerHeight);
    const inside = event.clientX >= left && event.clientX <= right && event.clientY >= top && event.clientY < bottom;
    document.documentElement.classList.toggle("aeon-hand-cursor", inside);
    if (!inside) return;
    offsetX = Math.max(left, Math.min(right - fist.width, event.clientX - fist.width / 2)) - originX;
    offsetY = Math.max(top, Math.min(bottom - fist.height, event.clientY - fist.height / 2)) - originY;
    logo.style.transform = `translateY(calc(-50% - 4px)) translate(${offsetX}px, ${offsetY}px)`;
  }, options);
  document.documentElement.addEventListener("pointerleave", () => {
    document.documentElement.classList.remove("aeon-hand-cursor");
  }, options);
  window.addEventListener("resize", () => {
    offsetX = offsetY = 0;
    logo.style.transform = "";
  }, options);
  page.addEventListener("page-dispose", event => {
    events.abort();
    document.documentElement.classList.remove("aeon-hand-cursor");
    if (event.detail?.preserveVisual) return;
    row.classList.remove("aeon-follow-mode");
    logo.style.transform = "";
    for (const attribute of ["tabindex", "role", "aria-label", "aria-pressed"]) logo.removeAttribute(attribute);
    logo.setAttribute("aria-hidden", "true");
  }, options);
}

// Retained while the cursor-follow experiment replaces the combat interaction.
export function enableLegacyStrikes(title) {
  const page = title.closest(".project-layout"), events = new AbortController();
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const original = [...title.childNodes], letters = [], fragment = document.createDocumentFragment();
  for (const word of title.textContent.split(/(\s+)/)) {
    if (!word.trim()) { fragment.append(document.createTextNode(word)); continue; }
    const group = document.createElement("span"); group.className = "aeon-word";
    for (const char of word) {
      const element = document.createElement("span"); element.className = "aeon-letter"; element.textContent = char; group.append(element);
      letters.push({ element, cx: 0, cy: 0, x: 0, y: 0, rotation: 0, vx: 0, vy: 0, vr: 0, heat: 0 });
    }
    fragment.append(group);
  }
  title.replaceChildren(fragment);
  const logo = page.querySelector(".aeon-title-logo");
  const logoTarget = logo?.complete && logo.naturalWidth ? logo : null;
  if (logoTarget) {
    logoTarget.tabIndex = 0;
    logoTarget.removeAttribute("aria-hidden");
    logoTarget.setAttribute("role", "button");
    logoTarget.setAttribute("aria-label", "Frapper le logo Aeon");
    letters.push({ element: logoTarget, image: true, baseTransform: "translateY(calc(-50% - 4px))", cx: 0, cy: 0, x: 0, y: 0, rotation: 0, vx: 0, vy: 0, vr: 0, heat: 0 });
  }
  const canvas = document.createElement("canvas"); canvas.className = "aeon-hit-canvas"; canvas.setAttribute("aria-hidden", "true"); title.append(canvas);
  const context = canvas.getContext("2d");
  if (!context) { canvas.remove(); title.replaceChildren(...original); return; }
  const damage = createDamage(letters.filter(letter => !letter.image));
  const logoActor = letters.find(letter => letter.image);
  let rage = 0, rageUntil = -Infinity, rageHits = 0, lastLogoHit = -Infinity;
  let awakened=false,awakenedAt=0;
  let rampageUntil=0,rampageReady=0,rampaging=false;
  let punch=null,punchCooldown=.35,punchCount=0;
  let logoSquash=0,logoHue=0,targetHue=0;
  let aim = null, celebrationUntil = 0, titleCleared = false;
  const clearPunch=()=>{punch=null;logoSquash=0;};
  let repairTimer = null;
  const clearRepairTimer = () => { clearTimeout(repairTimer); repairTimer = null; };
  let frame = null, last = null, frozen = false, hold = null, particles = [], flash = null, effects = [];
  const pad = 110;
  let lastHit = -Infinity, combo = 0, hitStop = 0, width = 0, height = 0;
  let chainTint=0,chainCount=0;
  const playerHue=amount=>{
    // Two warm gradients, then a softer violet variation. 415deg is neon yellow
    // reached from red through orange, without crossing blue or green.
    const target=[415,415,290][Math.max(0,chainCount-1)%3];
    return 350+(target-350)*amount*amount;
  };
  const currentTint=now=>now-lastHit>750?0:chainTint;
  const location = event => { const rect = title.getBoundingClientRect(); return { x: event.clientX - rect.left, y: event.clientY - rect.top }; };
  const electric = (points, alpha, thickness = 3, hue = 350) => {
    if (!points.length) return;
    context.beginPath(); points.forEach((p, i) => i ? context.lineTo(p.x, p.y) : context.moveTo(p.x, p.y));
    context.shadowColor = `hsl(${hue},100%,55%)`; context.shadowBlur = 13;
    context.strokeStyle = `hsla(${hue},100%,58%,${alpha})`; context.lineWidth = thickness; context.stroke();
    context.shadowBlur = 0; context.strokeStyle = `hsla(${hue},100%,96%,${alpha})`; context.lineWidth = Math.max(.85, thickness * .36); context.stroke();
  };
  const drawEffect = effect => {
    const age = 1 - effect.life / effect.duration, alpha = (1 - age) ** .65;
    const span = effect.span * (.65 + age * .35);
    context.save(); context.translate(effect.x + pad, effect.y + pad);
    if(effect.comic){
      const growth=1-(1-age)**3;
      const radius=(12+effect.power*8)*(.4+growth*.7);
      const opacity=(1-age)**1.2;
      context.save();context.rotate(effect.kind==="uppercut"?-.65:effect.kind==="reverse"?-.25:.2);
      context.beginPath();
      for(const inset of [1,.7]){
        for(let i=0;i<20;i++){
          const angle=i*Math.PI/10;
          const jag=i%2?.58:1+Math.sin(i*4.7+effect.seed)*.12;
          const r=radius*jag*inset;
          const px=Math.cos(angle)*r*1.2,py=Math.sin(angle)*r*.72;
          if(i===0)context.moveTo(px,py);else context.lineTo(px,py);
        }
        context.closePath();
      }
      context.fillStyle=`hsla(${effect.hue},100%,65%,${opacity*.12})`;
      context.fill("evenodd");
      context.strokeStyle=`hsla(${effect.hue},100%,70%,${opacity*.25})`;
      context.lineWidth=.8;context.stroke();
      for(let i=0;i<4;i++){
        const angle=i*Math.PI/2+effect.seed;
        const inner=radius*(.7+growth*.2),outer=inner+4+effect.power*2;
        context.beginPath();
        context.moveTo(Math.cos(angle-.045)*inner,Math.sin(angle-.045)*inner*.7);
        context.lineTo(Math.cos(angle)*outer,Math.sin(angle)*outer*.7);
        context.lineTo(Math.cos(angle+.045)*inner,Math.sin(angle+.045)*inner*.7);
        context.closePath();context.fillStyle=`hsla(${effect.hue},100%,75%,${opacity*.35})`;context.fill();
      }
      context.restore();
    }
    if (effect.kind === "burst") {
      const points = [];
      for (let i = 0; i <= 32; i++) {
        const a = i / 32 * Math.PI * 2, radius = span * (.2 + age * .45) * (i % 2 ? .85 : 1);
        points.push({ x: Math.cos(a) * radius, y: Math.sin(a) * radius * .38 });
      }
      electric(points, alpha, 3.5, effect.hue);
    } else {
      const count = effect.kind === "cross" ? 2 : effect.kind === "charged" ? 3 : 1;
      for (let slash = 0; slash < count; slash++) {
        context.save();
        const tilt = effect.kind === "uppercut" ? -1.15 : effect.kind === "reverse" ? -.42 : effect.kind === "cross" ? (slash ? -.5 : .5) : effect.kind === "charged" ? (slash - 1) * .09 : .38;
        context.rotate(tilt);
        const sweep = Math.min(1, age / .22), reach = span * (.65 + sweep * .35);
        const points = [];
        for (let i = 0; i <= 12; i++) {
          const u = i / 12;
          const jag = i === 0 || i === 12 ? 0 : (Math.sin(i * 17.3 + effect.seed) + Math.sin(i * 5.7 + effect.seed * 2 + Math.floor(age * 18)) * .35) * (effect.kind === "charged" ? 12 : 9);
          points.push({ x: (u - .5) * reach, y: jag + (slash - (count - 1) / 2) * 7 });
        }
        electric(points, alpha, effect.kind === "charged" ? 4 : 2.6, effect.hue);
        for (const index of [3, 7, 9]) {
          const p = points[index], side = Math.sin(effect.seed + index) > 0 ? 1 : -1;
          const branch = 12 + Math.abs(Math.sin(effect.seed * index)) * 13;
          electric([p, { x: p.x + 7, y: p.y + side * branch * .45 }, { x: p.x + 3, y: p.y + side * branch * .7 }, { x: p.x + 13, y: p.y + side * branch }], alpha * .55, 1.2, effect.hue);
        }
        context.restore();
      }
    }
    context.restore();
  };
  const draw = () => {
    context.clearRect(0, 0, width, height);
    if (logoActor && rage > .005) {
      const cx=logoActor.cx+logoActor.x+pad,cy=logoActor.cy+logoActor.y+pad;
      const radius=Math.max(20,logoActor.glyphWidth*.8);
      const glow=context.createRadialGradient(cx,cy,0,cx,cy,radius);
      const hue=18+logoHue*rage;
      glow.addColorStop(0,`hsla(${hue},95%,55%,${rage*.24})`);
      glow.addColorStop(.6,`hsla(${hue},95%,50%,${rage*.12})`);
      glow.addColorStop(1,"rgba(255,0,60,0)");
      context.fillStyle=glow;context.fillRect(cx-radius,cy-radius,radius*2,radius*2);
    }
    damage.draw(context, pad);
    if (flash) {
      const alpha = flash.life / .18;
      const glow = context.createRadialGradient(flash.x + pad, flash.y + pad, 0, flash.x + pad, flash.y + pad, 28 + flash.power * 13);
      glow.addColorStop(0, `hsla(${flash.hue},100%,80%,${alpha * .5})`); glow.addColorStop(.35, `hsla(${flash.hue},100%,55%,${alpha * .25})`); glow.addColorStop(1, `hsla(${flash.hue},100%,55%,0)`);
      context.fillStyle = glow; context.fillRect(0, 0, width, height);
    }
    if (hold) {
      const charge = Math.min(1, (performance.now() - hold.started) / 900);
      const hue=playerHue(currentTint(performance.now()));
      title.style.setProperty("--strike-charge", charge);
      title.style.setProperty("--strike-hue", hue);
      const points = [];
      for (let i = 0; i <= 8; i++) {
        const a = i / 8 * Math.PI * 2, r = (7 + charge * 18) * (i % 2 ? .7 : 1);
        points.push({ x: hold.point.x + pad + Math.cos(a) * r, y: hold.point.y + pad + Math.sin(a) * r });
      }
      electric(points, .15 + charge * .5, 1.5, hue);
    }
    for (const effect of effects) drawEffect(effect);
    for (const spark of particles) {
      context.strokeStyle = `hsla(${spark.hue},100%,65%,${Math.max(0, spark.life / spark.duration)})`;
      context.lineWidth = spark.width;
      context.beginPath(); context.moveTo(spark.x + pad, spark.y + pad); context.lineTo(spark.x + pad - spark.vx * .025, spark.y + pad - spark.vy * .025); context.stroke();
    }
    for (const letter of letters) {
      const squash=letter===logoActor?` scale(${1+logoSquash},${1-logoSquash})`:"";
      letter.element.style.transform = `${letter.baseTransform || ""} translate(${letter.x}px, ${letter.y}px) rotate(${letter.rotation}deg)${squash}`;
      const heat = Math.min(1, letter.heat);
      letter.element.style.color = heat > .01 ? `hsl(${letter.hitHue??350},${heat*95}%,${12+heat*43}%)` : "";
    }
    if(logoTarget){
      const hue=logoHue*rage;
      logoTarget.style.filter=rage>.005?`hue-rotate(${hue}deg) saturate(${1+rage*1.1}) brightness(${1+rage*.2}) drop-shadow(0 0 ${3+rage*6}px hsla(${18+hue},95%,55%,${rage*.75}))`:"";
    }
  };
  const tick = now => {
    frame = null;
    if (frozen || document.hidden || !title.isConnected) return;
    const dt = Math.min(last === null ? 0 : (now - last) / 1000, .032); last = now;
    const rageTarget=now<rageUntil?Math.min(1,.4+rageHits*.1):0;
    rage+=(rageTarget-rage)*(1-Math.exp(-dt*5));
    if(rageTarget===0 && rage<.005)rage=0;
    if(!rampaging && now>=rampageReady && now<rageUntil && rage>=.82 && !punch && !reduced.matches){
      rampaging=true;rampageUntil=now+3000;rampageReady=now+10000;
      awakened=true;awakenedAt=now;punchCooldown=0;
    }
    if(rampaging && now>=rampageUntil){
      rampaging=false;clearRepairTimer();damage.shatter(now,reduced.matches);
      rage=.35;rageHits=0;rageUntil=now+1000;
      if(!reduced.matches){
        if(effects.length>=6)effects.shift();
        effects.push({x:title.clientWidth*.5,y:title.clientHeight*.5,kind:"burst",span:180,power:3,hue:18+logoHue,seed:0,duration:.4,life:.4});
      }
    }
    if(rageTarget===0)targetHue=0;
    const hueDifference=((targetHue-logoHue+540)%360)-180;
    logoHue+=hueDifference*(1-Math.exp(-dt*6));
    hitStop = Math.max(0, hitStop - dt);
    letters.forEach(letter => { letter.heat *= Math.exp(-dt * 9); });
    effects.forEach(effect => { effect.life -= dt; });
    effects = effects.filter(effect => effect.life > 0);
    const repairing = damage.step(now, dt, Boolean(hold), {left:-pad+8,right:width-pad-8,top:-pad+8,bottom:height-pad-8});
    const cleared = damage.destruction() >= .999;
    if (cleared && !titleCleared && !reduced.matches) celebrationUntil = now + 900;
    titleCleared = cleared;
    punchCooldown=Math.max(0,punchCooldown-dt);
    if(logoActor && !reduced.matches && rage>.2 && now<rageUntil && !hold && !punch && punchCooldown===0){
      punch={started:now,fromX:logoActor.x,fromY:logoActor.y,kind:punchCount++%3,hit:false};
      punch.rampage=rampaging;
      const targets=letters.filter(letter=>!letter.image && !letter.destroyed);
      punch.aimX=targets.length?targets[punchCount%targets.length].cx-logoActor.cx:0;
      targetHue=[-28,245,30][punch.kind];
    }
    if(punch){
      if(hold?.target===logoTarget)punch.started+=dt*1000;
      const progress=Math.max(0,Math.min(1,(now-punch.started)/(punch.rampage?370:1000)));
      const envelope=Math.sin(progress*Math.PI),direction=punchCount%2?1:-1;
      if(punch.kind===0){
        logoActor.x=punch.fromX+Math.sin(progress*Math.PI*8)*envelope*5;
        logoActor.y=punch.fromY-envelope*4;
        logoActor.rotation=Math.sin(progress*Math.PI*6)*envelope*16;
        logoSquash=Math.sin(progress*Math.PI*8)*envelope*.05;
      }else if(punch.kind===1){
        const hop=Math.sin(Math.min(1,progress/.78)*Math.PI);
        logoActor.x=punch.fromX+direction*hop*4;logoActor.y=punch.fromY-hop*18;
        logoActor.rotation=direction*hop*12;
        logoSquash=progress>.78?Math.sin((progress-.78)/.22*Math.PI)*.14:-hop*.05;
      }else{
        logoActor.x=punch.fromX+direction*envelope*10;
        logoActor.y=punch.fromY-Math.abs(Math.sin(progress*Math.PI*2))*5;
        logoActor.rotation=direction*Math.sin(progress*Math.PI*2)*envelope*24;
        logoSquash=envelope*.04;
      }
      if(punch.rampage)logoActor.x+=(punch.aimX-punch.fromX)*envelope;
      if(!punch.hit && progress>=(punch.kind === 1 ? .78 : .5)){
        punch.hit=true;
        const point={x:logoActor.cx+logoActor.x,y:logoActor.cy+logoActor.y};
        const ragePower=punch.rampage?3.2:1.4+rage;
        const targets=letters.filter(letter=>!letter.image && !letter.destroyed)
          .sort((a,b)=>Math.hypot(a.cx-point.x,a.cy-point.y)-Math.hypot(b.cx-point.x,b.cy-point.y));
        if(targets.length){
          const target=targets[0];clearRepairTimer();
          damage.hit({x:target.cx+target.x,y:target.cy+target.y},ragePower,-1,now,false);
          for(const letter of targets){
            const force=Math.exp(-Math.hypot(letter.cx-point.x,letter.cy-point.y)/85);
            letter.vx-=65*force*ragePower;letter.vy-=55*force*ragePower;letter.vr-=50*force*ragePower;letter.heat=Math.max(letter.heat,Math.min(1,force*ragePower*.5));
          }
          if(!awakened && damage.destruction()>=.7){awakened=true;awakenedAt=now;}
        }
        if(effects.length>=6)effects.shift();
        effects.push({...point,kind:"burst",span:48+rage*20,power:ragePower,hue:18+logoHue*rage,seed:Math.random()*100,duration:.3,life:.3});
      }
      logoActor.vx=logoActor.vy=logoActor.vr=0;
      if(progress>=1){clearPunch();punchCooldown=rampaging?.12:.8;}
    }
    let moving = false;
    if (hitStop === 0) for (const letter of letters) {
      if(letter===logoActor && punch){moving=true;continue;}
      const angry=letter===logoActor && !reduced.matches?rage:0;
      const roaming=angry>0 && awakened;
      const roamWidth=Math.min(110,title.clientWidth*.55);
      const phase=(now-awakenedAt)/1000;
      const chargingLogo=hold?.target===logoTarget && letter===logoActor;
      const expressive = letter===logoActor && !reduced.matches;
      const following = expressive && aim;
      const charge = hold && expressive ? Math.min(1,(now-hold.started)/900) : 0;
      const celebrating = expressive && now < celebrationUntil;
      const targetX=(chargingLogo?letter.x:roaming?(Math.cos(phase*2)-1)*roamWidth*.5*angry:following?Math.max(-10,Math.min(10,(aim.x-letter.cx)*.055)):0)+charge*5;
      const targetY=celebrating?-Math.abs(Math.sin((celebrationUntil-now)/900*Math.PI*3))*20:chargingLogo?letter.y:roaming?-(10+Math.sin(phase*3)*6)*angry:following?Math.max(-6,Math.min(6,(aim.y-letter.cy)*.08)):charge*4;
      const targetRotation=celebrating?Math.sin(now*.025)*15:Math.sin(now*.009)*7*angry+(following?Math.max(-9,Math.min(9,(aim.x-letter.cx)*.04)):0)-charge*12;
      for (let i = 0; i < 3; i++) {
        const step = dt / 3;
        letter.vx += (-130 * (letter.x-targetX) - 18 * letter.vx) * step;
        letter.vy += (-130 * (letter.y-targetY) - 18 * letter.vy) * step;
        letter.vr += (-105 * (letter.rotation-targetRotation) - 16 * letter.vr) * step;
        letter.x = Math.max(letter===logoActor?-title.clientWidth-70:-35, Math.min(35, letter.x + letter.vx * step));
        letter.y = Math.max(-28, Math.min(28, letter.y + letter.vy * step));
        letter.rotation = Math.max(-22, Math.min(22, letter.rotation + letter.vr * step));
      }
      moving ||= Math.abs(letter.x) + Math.abs(letter.y) + Math.abs(letter.rotation) + Math.abs(letter.vx) + Math.abs(letter.vy) + Math.abs(letter.vr) > .06;
    }
    for (const spark of particles) { spark.life -= dt; spark.x += spark.vx * dt; spark.y += spark.vy * dt; spark.vx *= Math.exp(-dt * 6); spark.vy *= Math.exp(-dt * 6); }
    particles = particles.filter(spark => spark.life > 0);
    if (flash) { flash.life -= dt; if (flash.life <= 0) flash = null; }
    if (!moving && hitStop === 0) letters.forEach(letter => { letter.x = letter.y = letter.rotation = letter.vx = letter.vy = letter.vr = 0; });
    draw();
    if (moving || punch || rage > 0 || now < rageUntil || now < celebrationUntil || hitStop > 0 || hold || particles.length || flash || effects.length || repairing) frame = requestAnimationFrame(tick);
    else {
      letters.forEach(letter => { letter.heat = 0; letter.element.style.color = ""; }); last = null;
      if (damage.hasDamage() && repairTimer === null) repairTimer = setTimeout(() => { repairTimer = null; wake(); }, Math.max(16, damage.repairAt() - performance.now()));
    }
  };
  const wake = () => { if (!frozen && !document.hidden && frame === null) { last = null; frame = requestAnimationFrame(tick); } };
  const strike = (point, charge, target) => {
    const now = performance.now(), gap = now - lastHit;
    const chaining=gap>=70 && gap<=750;
    combo = chaining ? combo % 5 + 1 : 1;
    const tint=currentTint(now);
    if(tint===0 && !chaining)chainCount++;
    chainTint=chaining?Math.min(1,tint+.025):0;
    lastHit = now;
    const { kind, power } = strikeMove(combo, charge);
    const hue=playerHue(chainTint);
    const finisher = kind === "burst" || kind === "charged";
    const direction = combo % 2 ? 1 : -1;
    clearRepairTimer();
    const hitLogo=target===logoTarget && logoActor;
    if(!hitLogo)damage.hit(point, power, direction, now, reduced.matches);
    if(hitLogo){
      rageHits=now-lastLogoHit<1600?rageHits+1:1;
      lastLogoHit=now;rageUntil=now+6500;
      rage=Math.min(1,rage+.25*power);
      // Repeated hits make the fist's shock grow along with its rage.
      if(rageHits%3===0){
        damage.hit({x:logoActor.cx+logoActor.x,y:logoActor.cy+logoActor.y},.9+rage*.8,-1,now,reduced.matches);
      }
      if(rageHits%6===0 || kind==="charged"){
        if(!reduced.matches){
          if(effects.length>=6)effects.shift();
          effects.push({x:logoActor.cx+logoActor.x,y:logoActor.cy+logoActor.y,kind:"burst",span:100,power,seed:Math.random()*100,duration:.5,life:.5});
          logoActor.vy-=300;logoActor.vr+=direction*350;
        }
      }
    }
    if(!awakened && logoActor && damage.destruction()>=.7){
      awakened=true;awakenedAt=now;rageUntil=now+6500;rage=Math.max(rage,.65);
    }
    if (kind === "charged") combo = 0;
    if (!reduced.matches) {
      for (const letter of letters) {
        const distance = Math.hypot(letter.cx - point.x, letter.cy - point.y);
        const influence = Math.exp(-distance / (power > 1.5 ? 190 : 70));
        const reaction=hitLogo && letter===logoActor?1.25+rage*.4:1;
        letter.vx += direction * 180 * power * influence * reaction;
        letter.vy -= (kind === "uppercut" ? 250 : kind === "burst" ? 160 : 100) * power * influence * reaction;
        letter.vr += (kind === "cross" ? Math.sign(letter.cx - point.x) || 1 : direction) * 150 * power * influence * reaction;
        letter.heat = Math.max(letter.heat, Math.min(1, influence * power * .65));
        letter.hitHue=hue;
      }
      hitStop = .035 + power * .018;
      const duration = finisher ? .45 : .3;
      if (effects.length >= 6) effects.shift();
      effects.push({ ...point, kind, power, hue, comic:finisher, span: Math.min(width - pad, finisher ? 230 : kind === "uppercut" ? 130 : kind === "slash" ? 55 : 150), seed: Math.random() * 100, duration, life: duration });
      for (let i = 0; i < (finisher ? 16 : 10) && particles.length < 64; i++) {
        const angle = Math.random() * Math.PI * 2, speed = (50 + Math.random() * 130) * power;
        const duration = .18 + Math.random() * .15;
        particles.push({ x: point.x, y: point.y, hue, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life: duration, duration, width: finisher ? 2 : 1.4 });
      }
    }
    flash = { ...point, life: .18, power, hue }; wake();
  };
  const release = (cancel = false) => {
    if (!hold) return;
    const saved = hold; hold = null; title.style.removeProperty("--strike-charge");
    if (saved.id !== null && saved.target.hasPointerCapture(saved.id)) saved.target.releasePointerCapture(saved.id);
    if (!cancel && !frozen) strike(saved.point, performance.now() - saved.started, saved.target);
    else wake();
  };
  const resize = () => {
    if (frozen) return;
    letters.forEach(letter => { letter.element.style.transform = letter.baseTransform || "none"; });
    const rect = title.getBoundingClientRect(); width = rect.width + pad * 2; height = rect.height + pad * 2;
    if (logoTarget) {
      const logoRect = logoTarget.getBoundingClientRect();
      logoActor.glyphWidth=logoRect.width;logoActor.glyphHeight=logoRect.height;
      width = Math.max(width, logoRect.right - rect.left + pad * 2);
      height = Math.max(height, logoRect.bottom - rect.top + pad * 2);
    }
    const ratio = Math.min(devicePixelRatio || 1, 1.5); canvas.width = Math.ceil(width * ratio); canvas.height = Math.ceil(height * ratio);
    canvas.style.left=`${-pad}px`;canvas.style.top=`${-pad}px`;
    canvas.style.width = `${width}px`; canvas.style.height = `${height}px`; context.setTransform(ratio, 0, 0, ratio, 0, 0);
    for (const letter of letters) { const r = letter.element.getBoundingClientRect(); letter.cx = r.left - rect.left + r.width / 2; letter.cy = r.top - rect.top + r.height / 2; }
    damage.measure();
    draw();
  };
  page.addEventListener("pointermove", event => {
    if (frozen || reduced.matches || event.pointerType !== "mouse") return;
    const point = location(event);
    aim = point.x >= -pad && point.x <= width-pad && point.y >= -pad && point.y <= height-pad ? point : null;
    wake();
  }, {signal:events.signal});
  page.addEventListener("pointerleave", () => { aim=null;wake(); }, {signal:events.signal});
  page.addEventListener("pointerdown", event => {
    if(frozen || hold || event.button!==0 || !event.isPrimary || reduced.matches) return;
    const point=location(event), fragment=damage.pick(point);
    if(!fragment) return;
    event.preventDefault();event.stopPropagation();
    const volley=damage.juggle(fragment,point,performance.now());
    if(!volley)return;
    clearRepairTimer();
    const hue=volley.special?45:350;
    if(effects.length>=6)effects.shift();
    effects.push({...volley,kind:volley.special?"burst":"uppercut",span:volley.special?70:32,power:volley.special?2:1,hue,seed:Math.random()*100,duration:.3,life:.3,comic:volley.special});
    flash={...volley,hue,life:.18,power:volley.special?2:1};
    if(logoActor){logoActor.vy-=100;logoActor.vr+=(volley.combo%2?1:-1)*100;}
    if(volley.special){rage=Math.min(1,rage+.2);rageHits++;rageUntil=performance.now()+2000;celebrationUntil=performance.now()+600;}
    hitStop=.035;wake();
  }, {capture:true,signal:events.signal});
  for (const target of [title, logoTarget].filter(Boolean)) {
  target.addEventListener("pointerdown", event => {
    if (frozen || hold || event.button !== 0) return;
    event.preventDefault(); event.stopPropagation();
    hold = { id: event.pointerId, target, started: performance.now(), point: location(event) }; target.setPointerCapture(event.pointerId); wake();
  }, { signal: events.signal });
  target.addEventListener("pointerup", event => { if (hold?.id === event.pointerId) release(); }, { signal: events.signal });
  for (const type of ["pointercancel", "lostpointercapture", "blur"]) target.addEventListener(type, () => release(true), { signal: events.signal });
  target.addEventListener("keydown", event => {
    if (!frozen && [" ", "Enter"].includes(event.key)) { event.preventDefault(); if (!hold && !event.repeat) { const bounds = target.getBoundingClientRect(), origin = title.getBoundingClientRect(); hold = { id: null, target, started: performance.now(), point: { x: bounds.left-origin.left+bounds.width/2, y: bounds.top-origin.top+bounds.height/2 } }; wake(); } }
  }, { signal: events.signal });
  target.addEventListener("keyup", event => { if ([" ", "Enter"].includes(event.key) && hold?.id === null) { event.preventDefault(); release(); } }, { signal: events.signal });
  }
  const observer = new ResizeObserver(resize); observer.observe(title);
  if (logoTarget) observer.observe(logoTarget);
  window.addEventListener("blur", () => release(true), { signal: events.signal });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) { release(true); clearPunch();clearRepairTimer(); if (frame !== null) cancelAnimationFrame(frame); frame = null; last = null; }
    else if (rage>0 || particles.length || flash || effects.length || damage.hasDamage() || letters.some(letter => letter.vx || letter.vy || letter.vr)) wake();
  }, { signal: events.signal });
  page.addEventListener("page-dispose", event => {
    clearPunch();
    frozen = true; clearRepairTimer(); if (frame !== null) cancelAnimationFrame(frame); frame = null; observer.disconnect(); events.abort();
    if (!event.detail?.preserveVisual) {
      damage.dispose(); canvas.remove(); title.replaceChildren(...original);
      if (logoTarget) {
        logoTarget.style.transform = ""; logoTarget.style.color = "";logoTarget.style.filter="";
        logoTarget.removeAttribute("tabindex"); logoTarget.removeAttribute("role");
        logoTarget.removeAttribute("aria-label"); logoTarget.setAttribute("aria-hidden", "true");
      }
    }
  }, { signal: events.signal });
  resize();
}
