import { createPodracerModel } from "./podracer-model.js?v=9";
import { createRace, stepRace } from "./space-racer-game.js?v=23";
import { createGameScore } from "../game-score.js";
import { createResumeLock } from "../game-resume-lock.js";
import { drawDesertTrack, drawDesertObstacle } from "./desert-environment.js?v=13";

export function stepRacer(state, dt, steering, accelerating) {
  dt = Math.max(0, Math.min(.035, dt));
  state.speed += ((accelerating ? 1 : 0) - state.speed) * (1 - Math.exp(-dt * 2.5));
  const baseThrust = .1 + state.speed * .65;
  const response = 1 - Math.exp(-dt * 10);
  state.leftThrust = (state.leftThrust ?? .1) + (Math.min(1, baseThrust + Math.max(0, steering) * .85) - (state.leftThrust ?? .1)) * response;
  state.rightThrust = (state.rightThrust ?? .1) + (Math.min(1, baseThrust + Math.max(0, -steering) * .85) - (state.rightThrust ?? .1)) * response;
  state.time += dt * (.4 + state.speed * 2);
  const imbalance = Math.sin(state.time * 1.7) * .22 + Math.sin(state.time * .73 + 1) * .14;
  state.vx += (steering * (.65 + state.speed * .95) + imbalance * (.12 + state.speed * .65)) * dt;
  const counterSteering = steering * state.vx < 0 ? .65 : 0;
  state.vx *= Math.exp(-dt * (2.9 - state.speed * 1.15 + counterSteering));
  state.x += state.vx * dt;
  if (Math.abs(state.x) > .85) { state.x = Math.sign(state.x) * .85; state.vx *= -.2; }
  const thrustDifference = state.leftThrust - state.rightThrust;
  const lean = Math.max(-.65, Math.min(.65,
    state.vx * .85 + steering * .32 + thrustDifference * .35 + imbalance * state.speed * .12
  ));
  state.roll += (lean - state.roll) * (1 - Math.exp(-dt * 7.5));
}

export function enableRacer(play) {
  const page = play.closest(".project-layout"), events = new AbortController();
  const score = createGameScore(page, "space-age-racer");
  const lockResume = createResumeLock();
  const zone = play.closest(".space-racer-title-row");
  const title = zone.querySelector(".project-title");
  const titleText = title.textContent;
  title.setAttribute("aria-label", titleText);
  const letters = [];
  title.replaceChildren(...titleText.split(/(\s+)/).map(part => {
    if (/^\s+$/.test(part)) return document.createTextNode(part);
    const word = document.createElement("span");
    word.className = "space-racer-word";
    word.setAttribute("aria-hidden", "true");
    for (const character of part) {
      const letter = document.createElement("span");
      letter.className = "space-racer-letter";
      letter.textContent = character;
      word.append(letter); letters.push(letter);
    }
    return word;
  }));
  let launchAnimations = [], launchPod = null, launchFrame = null;
  let returnAnimations = [];
  const clearReturn = () => {
    returnAnimations.forEach(animation => animation.cancel());
    returnAnimations = [];
  };
  const clearLaunch = () => {
    if (launchFrame !== null) cancelAnimationFrame(launchFrame);
    launchFrame = null;
    zone.classList.remove("is-launching");
    launchAnimations.forEach(animation => animation.cancel());
    launchAnimations = []; launchPod?.remove(); launchPod = null;
  };
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  let running = false, disposed = false, frame = null, last = null, accelerating = false, steering = 0;
  let canvas = null, context = null, width = 0, height = 0, focused = true, trackBottom = Infinity;
  let drawingHeadroom = 48, archHeight = 8.4;
  let state = {x:0,vx:0,speed:0,roll:0,time:0,leftThrust:.1,rightThrust:.1}, race = createRace();
  const { vertices, faces } = createPodracerModel();
  const notify = () => {
    lockResume(running);
    zone.classList.toggle("is-playing", running);
    if (running) page.dataset.racerPlaying = "true"; else delete page.dataset.racerPlaying;
    page.dispatchEvent(new Event("hero-autoplay-change"));
  };
  const draw = (preview = false, targetContext = context, targetWidth = width, targetHeight = height, view = {}) => {
    const context = targetContext, width = targetWidth, height = targetHeight;
    const headroom = preview ? 0 : drawingHeadroom;
    context.clearRect(0, -headroom, width, height + headroom);
    const size = view.size ?? (preview ? 21 : Math.min(25, height * .19, width * .06));
    const x = view.x ?? width * (.5 + state.x * .35), y = view.y ?? height * .56;
    const roll = view.roll ?? (reduced.matches ? 0 : state.roll);
    if (!preview) {
    const horizon = { x: width*.5, y: height*.08 };
    drawDesertTrack(context,width,height,trackBottom,reduced.matches?0:state.time);
    const visibleObstacles = [...race.obstacles].sort((a,b) => a.progress-b.progress);
    for(const obstacle of visibleObstacles) {
      if (obstacle.progress < 0) continue;
      const p=obstacle.progress, perspective=.12+p*p*(.88/(.82*.82));
      const ox=width*.5+obstacle.x*width*.35*perspective;
      const oy=horizon.y+p*p*height*.65;
      const half=Math.max(1.5,width*.042*perspective*(obstacle.size ?? 1));
      const fadeProgress = Math.max(0, Math.min(1, (p - .92) / .23));
      const foregroundOpacity = 1 - fadeProgress * fadeProgress * (3 - 2 * fadeProgress);
      context.save();context.globalAlpha=Math.min(1,.2+p*2) * foregroundOpacity;
      context.translate(ox,oy);context.scale(half,half);
      obstacle.desertTint ??= Math.floor(Math.random() * 5);
      drawDesertObstacle(context,obstacle.type === "arch" ? {...obstacle, height: archHeight} : obstacle);
      context.restore();
    }
    }
    context.save(); context.translate(x, y + size * 1.3); context.scale(1.3, .25);
    const shadow = context.createRadialGradient(0,0,0,0,0,size*1.4); shadow.addColorStop(0,"rgba(30,50,60,.18)"); shadow.addColorStop(1,"rgba(30,50,60,0)");
    context.fillStyle=shadow; context.beginPath(); context.arc(0,0,size*1.4,0,Math.PI*2); context.fill(); context.restore();
    const yaw = view.yaw ?? (preview ? Math.PI / 8 : reduced.matches ? 0 : state.vx * .22);
    const pitch = view.pitch ?? (preview ? .12 : .1);
    const project = ([vx,vy,vz]) => {
      const a = vx * Math.cos(yaw) + vz * Math.sin(yaw), b = -vx * Math.sin(yaw) + vz * Math.cos(yaw);
      const c = vy * Math.cos(pitch) - b * Math.sin(pitch), z = vy * Math.sin(pitch) + b * Math.cos(pitch);
      const scale = size / (1 + z * .12 * (view.perspective ?? (preview ? 0 : 1)));
      return { x: x + (a * Math.cos(roll) - c * Math.sin(roll)) * scale, y: y + (a * Math.sin(roll) + c * Math.cos(roll)) * scale, z };
    };
    const projected = vertices.map(project);
    context.save();
    if(race.defeated)context.globalAlpha=.4;
    const ordered = faces.map(face => {
      const points = face.points.map(i=>projected[i]);
      const thrust = vertices[face.points[0]][0] < 0 ? state.leftThrust : state.rightThrust;
      return { ...face, points, color: face.exhaust ? `rgb(${100+Math.round(thrust*70)},${190+Math.round(thrust*50)},255)` : face.color, thrust };
    });
    for(const side of [-1,1]) {
      const thrust = (side < 0 ? state.leftThrust : state.rightThrust) ?? .1;
      const flicker = reduced.matches ? 1 : 1 + Math.sin(state.time*69+side*2)*.12 + Math.sin(state.time*113)*.06;
      const length = (.22 + thrust * 1.65) * flicker;
      for(const core of [false,true]) {
        const radius = core ? .1 + thrust*.05 : .19 + thrust*.09;
        const ring = Array.from({length:6},(_,i)=>{
          const angle=i*Math.PI/3;
          return [side*1.35+Math.cos(angle)*radius,-.25+Math.sin(angle)*radius,-.2];
        });
        const tip = [side*1.35 + (reduced.matches ? 0 : Math.sin(state.time*84+side)*.025*thrust),-.25 + length*.1,-.2-length*(core?.68:1)];
        for(let i=0;i<6;i++)ordered.push({points:[ring[i],ring[(i+1)%6],tip].map(project),flame:true,thrust,core,base:project([side*1.35,-.25,-.2]),tip:project(tip)});
      }
    }
    const arcTime = preview || reduced.matches ? 0 : state.time;
    const energyPoints = Array.from({length: 13}, (_, i) => {
      const t = i / 12;
      const jitter = i === 0 || i === 12 ? 0 : Math.sin(i * 2.7 + arcTime * 29) * .085;
      return project([-.78 + t * 1.56, -.37 + jitter, .95 + jitter * .55]);
    });
    ordered.push({points: energyPoints, energy: true});
    ordered.forEach(face=>{face.depth=face.points.reduce((sum,p)=>sum+p.z,0)/face.points.length;});
    ordered.sort((a,b)=>b.depth-a.depth);
    for (const face of ordered) {
      if (face.energy) {
        context.save();
        context.lineJoin = "round"; context.lineCap = "round";
        context.beginPath();
        face.points.forEach((p, i) => { if (i) context.lineTo(p.x, p.y); else context.moveTo(p.x, p.y); });
        context.strokeStyle = "#ef3cbd"; context.lineWidth = 2.8;
        context.shadowColor = "#ff48ce"; context.shadowBlur = 8;
        context.stroke();
        context.strokeStyle = "#ffe0f5"; context.lineWidth = .9;
        context.shadowBlur = 3; context.stroke();
        context.restore();
        continue;
      }
      context.beginPath(); face.points.forEach((p,i)=>{if(i)context.lineTo(p.x,p.y);else context.moveTo(p.x,p.y);});context.closePath();
      if(face.flame){
        const gradient=context.createLinearGradient(face.base.x,face.base.y,face.tip.x,face.tip.y);
        gradient.addColorStop(0,face.core?"rgba(211,247,255,.98)":"rgba(131,218,255,.9)");
        gradient.addColorStop(.55,face.core?"rgba(135,208,255,.96)":"rgba(57,151,255,.88)");
        gradient.addColorStop(.82,face.core?"rgba(116,172,255,.9)":"rgba(77,124,247,.8)");
        gradient.addColorStop(1,face.core?"rgba(150,159,255,.82)":"rgba(130,116,240,.65)");
        context.fillStyle=gradient;
      }else context.fillStyle=face.color;
      if(face.exhaust||face.flame){context.shadowColor=face.exhaust?"#83daff":"#639fff";context.shadowBlur=4+face.thrust*10;}
      context.fill();context.shadowBlur=0;
      if(!face.flame){context.strokeStyle="rgba(35,65,80,.25)";context.lineWidth=.6;context.stroke();}
    }
    context.restore();
    if(race.defeated&&!reduced.matches) {
      const progress=Math.min(1,race.defeatTime/1.3);
      context.strokeStyle=`rgba(194,113,73,${1-progress})`;context.lineWidth=2;
      for(let i=0;i<12;i++){
        const angle=i*Math.PI/6, spread=size*(.7+progress*2);
        context.beginPath();context.moveTo(x+Math.cos(angle)*spread,y+Math.sin(angle)*spread*.45);
        context.lineTo(x+Math.cos(angle)*(spread+5),y+Math.sin(angle)*(spread+5)*.45);context.stroke();
      }
    }
  };
  const preview = document.createElement("canvas");
  preview.className = "space-racer-preview";
  preview.setAttribute("aria-hidden", "true");
  preview.width = 240; preview.height = 160;
  const previewContext = preview.getContext("2d");
  if (previewContext) {
    previewContext.scale(2, 2);
    draw(true, previewContext, 120, 80);
    play.prepend(preview);
  }
  const tick = time => {
    frame = null;
    if (!running || disposed || document.hidden || !focused) return;
    const dt=last===null?0:Math.max(0,Math.min(.035,(time-last)/1000));last=time;
    if(!race.defeated)stepRacer(state,dt,steering,accelerating);
    const size=Math.min(25,height*.19,width*.06);
    stepRace(race,dt,state,size*1.65/(width*.35));
    score.update(race.distance);
    if (race.defeated) score.hide();
    if(race.defeated&&race.defeatTime>=1.3){stop(true);return;}
    draw();
    frame=requestAnimationFrame(tick);
  };
  const resume = () => { if (running && !disposed && !zone.classList.contains("is-launching") && !document.hidden && focused && frame===null) { last=null; frame=requestAnimationFrame(tick); } };
  const pause = () => { if(frame!==null)cancelAnimationFrame(frame);frame=null;last=null;accelerating=false;steering=0; };
  const resize = () => {
    if(!running)return;
    width=zone.clientWidth;height=zone.clientHeight+70;
    // Extra canvas space above the track keeps the taller arches in view.
    drawingHeadroom = Math.max(0, zone.getBoundingClientRect().top - 35 - 12);
    // Fit the model once for the entire approach, preserving its proportions in motion.
    const lastDepth = 1.15 ** 2;
    const lastScale = width * .042 * (.12 + lastDepth * .88 / (.82 ** 2));
    archHeight = Math.min(8.4, (height * (.08 + lastDepth * .65) + drawingHeadroom - 4) / Math.max(1.5, lastScale));
    canvas.style.top = `${-35 - drawingHeadroom}px`;
    canvas.style.height = `${height + drawingHeadroom}px`;
    const ratio=Math.min(devicePixelRatio||1,1.5);canvas.width=Math.round(width*ratio);canvas.height=Math.round((height+drawingHeadroom)*ratio);
    const rule = page.querySelector(".project-copy > .copy-rule");
    trackBottom = rule ? rule.getBoundingClientRect().top - canvas.getBoundingClientRect().top - drawingHeadroom - 1 : height * .94;
    context.setTransform(ratio,0,0,ratio,0,drawingHeadroom*ratio);draw();
  };
  const stop = (restoreTitle = false) => {
    score.hide();
    running=false;clearLaunch();clearReturn();pause();canvas?.remove();canvas=context=null;
    play.disabled = false;
    play.setAttribute("aria-pressed","false");play.setAttribute("aria-label","Play Space Age Racer");notify();
    if (restoreTitle && !disposed && !reduced.matches) {
      const restoration = letters.map((letter, index) => letter.animate([
        {transform:"translate(-18px, -10px) rotate(-7deg)",opacity:0},
        {transform:"translate(2px, 1px) rotate(1deg)",opacity:1,offset:.75},
        {transform:"translate(0, 0) rotate(0deg)",opacity:1},
      ], {duration:650,delay:index*28,easing:"cubic-bezier(.22, 1, .36, 1)",fill:"both"}));
      restoration.push(preview.animate([
        {transform:"translate(-14px, 4px) rotate(-10deg) scale(.9)",opacity:0},
        {transform:"translate(0, 0) rotate(0deg) scale(1)",opacity:1},
      ], {duration:800,delay:180,easing:"cubic-bezier(.22, 1, .36, 1)",fill:"both"}));
      returnAnimations = restoration;
      Promise.all(restoration.map(animation => animation.finished)).then(() => {
        if (returnAnimations === restoration) clearReturn();
      }).catch(() => {});
    }
  };
  play.addEventListener("click", () => {
    if(disposed || running)return;
    clearReturn();
    canvas=document.createElement("canvas");canvas.className="space-racer-stage";canvas.setAttribute("aria-hidden","true");context=canvas.getContext("2d");
    if(!context){canvas=null;return;}
    state={x:0,vx:0,speed:0,roll:0,time:0,leftThrust:.1,rightThrust:.1};race=createRace();running=true;focused=true;
    score.show();
    const podBounds = preview.getBoundingClientRect();
    const zoneBounds = zone.getBoundingClientRect();
    zone.append(canvas);play.disabled=true;play.setAttribute("aria-pressed","true");notify();resize();
    if (reduced.matches || !previewContext) { resume(); return; }
    zone.classList.add("is-launching");
    launchPod = document.createElement("canvas");
    const ratio = Math.min(devicePixelRatio || 1, 1.5);
    launchPod.width = Math.round(width * ratio); launchPod.height = Math.round(height * ratio);
    launchPod.className = "space-racer-launch-pod";
    launchPod.setAttribute("aria-hidden", "true");
    launchPod.style.cssText = `left:0;top:-35px;width:${width}px;height:${height}px`;
    const launchContext = launchPod.getContext("2d");
    launchContext.setTransform(ratio, 0, 0, ratio, 0, 0);
    zone.append(launchPod);
    const distance = Math.max(100, podBounds.left - zoneBounds.left + podBounds.width);
    const startX = podBounds.left - zoneBounds.left + podBounds.width * .5;
    const startY = podBounds.top - zoneBounds.top + 35 + podBounds.height * .56;
    const startSize = 21 * podBounds.width / 120;
    const smooth = value => { const t = Math.max(0, Math.min(1, value)); return t*t*t*(t*(t*6-15)+10); };
    const mix = (a,b,t) => a+(b-a)*t;
    let launchElapsed = 0, launchLast = null;
    const animateLaunch = time => {
      launchFrame = null;
      if (!running || disposed) return;
      if (!document.hidden && focused && launchLast !== null) launchElapsed += Math.min(35, time-launchLast);
      launchLast = time;
      const progress = Math.min(1, launchElapsed / 1850);
      const turn = smooth(progress / .35);
      const depart = smooth((progress-.25) / .75);
      // A short turn pushes the letters aside while the pod joins the race directly.
      const travel = smooth((progress-.1) / .9);
      draw(true, launchContext, width, height, {
        x: mix(startX, width*.5, travel),
        y: mix(startY, height*.56, depart),
        yaw: mix(mix(Math.PI/8, -Math.PI/3, turn), 0, depart),
        pitch: mix(.12, .1, depart),
        perspective: depart,
        roll: -Math.sin(depart*Math.PI)*.1,
        size: mix(startSize, Math.min(25,height*.19,width*.06), depart),
      });
      if (progress >= 1) { clearLaunch(); resize(); resume(); return; }
      launchFrame = requestAnimationFrame(animateLaunch);
    };
    launchFrame = requestAnimationFrame(animateLaunch);
    for (const [index, letter] of letters.entries()) {
      const bounds = letter.getBoundingClientRect();
      const delay = 400 + Math.max(0, Math.min(1, (podBounds.left-bounds.right)/distance)) * 350;
      launchAnimations.push(letter.animate([
        {transform:"translate(0,0) rotate(0deg)",opacity:1},
        {transform:`translate(-6px,-2px) rotate(-4deg)`,opacity:1,offset:.2},
        {transform:`translate(${-48-index*1.5}px,${-22-(index%4)*8}px) rotate(${-18-(index%3)*10}deg)`,opacity:0},
      ], {duration:700,delay,easing:"cubic-bezier(.4,0,.2,1)",fill:"forwards"}));
    }
  },{signal:events.signal});
  window.addEventListener("pointermove", event => { if(running){const bounds=zone.getBoundingClientRect();steering=-Math.max(-1,Math.min(1,(event.clientX-bounds.left-width*.5)/(width*.35)));} },{signal:events.signal});
  window.addEventListener("pointerout",event=>{if(event.relatedTarget===null){steering=0;accelerating=false;}},{signal:events.signal});
  window.addEventListener("pointerdown", event => {
    if(!running||event.button!==0||event.target.closest("button,a,input,textarea,select,[contenteditable],.hero-frame,.gallery-shell,.project-dock,.topline"))return;
    const bounds=zone.getBoundingClientRect();
    if(event.clientX<bounds.left-100||event.clientX>bounds.right+100||event.clientY<bounds.top-110||event.clientY>bounds.bottom+180)return;
    accelerating=true;event.preventDefault();event.stopPropagation();
  },{capture:true,signal:events.signal});
  for(const type of ["pointerup","pointercancel"])window.addEventListener(type,()=>{accelerating=false;},{signal:events.signal});
  window.addEventListener("keydown",event=>{if(running&&event.key==="Escape"){event.preventDefault();stop();}},{signal:events.signal});
  window.addEventListener("blur",()=>{focused=false;pause();},{signal:events.signal});
  window.addEventListener("focus",()=>{focused=true;resume();},{signal:events.signal});
  window.addEventListener("resize",resize,{signal:events.signal});
  document.addEventListener("visibilitychange",()=>{if(document.hidden)pause();else resume();},{signal:events.signal});
  page.addEventListener("page-dispose",()=>{disposed=true;stop();score.dispose();events.abort();},{signal:events.signal});
}
