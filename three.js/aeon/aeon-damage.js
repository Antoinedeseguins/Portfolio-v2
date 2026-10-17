export function createDamage(letters) {
  const ratio = Math.min(devicePixelRatio || 1, 1.5);
  const color = getComputedStyle(letters[0].element).color;
  let fragments = [], hitAt = -Infinity, repairStep = -1;
  const inkAmount = canvas => {
    const pixels=canvas.getContext("2d").getImageData(0,0,canvas.width,canvas.height).data;
    let total=0;for(let i=3;i<pixels.length;i+=4)total+=pixels[i];
    return total;
  };
  const polygon = (context, points) => {
    context.beginPath(); points.forEach((p, i) => i ? context.lineTo(p.x, p.y) : context.moveTo(p.x, p.y)); context.closePath();
  };
  const clearLetter = letter => {
    letter.cuts = []; letter.destroyed = false; letter.repair = 0; letter.element.style.maskImage = "";
  };
  const wholeLetter = letter => [{ x: 0, y: 0 }, { x: letter.glyphWidth, y: 0 }, { x: letter.glyphWidth, y: letter.glyphHeight }, { x: 0, y: letter.glyphHeight }];
  const mask = (letter, repair) => {
    if (!letter.cuts.length) return;
    repair = Math.max(letter.repair || 0, repair);
    letter.repair = repair;
    const paths = letter.cuts.map(points => `<polygon points="${points.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ")}" fill="black" opacity="${(1 - repair).toFixed(2)}"/>`).join("");
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${letter.glyphWidth} ${letter.glyphHeight}"><defs><mask id="m" maskUnits="userSpaceOnUse" x="0" y="0" width="${letter.glyphWidth}" height="${letter.glyphHeight}"><rect width="100%" height="100%" fill="white"/>${paths}</mask></defs><rect width="100%" height="100%" fill="white" mask="url(#m)"/></svg>`;
    letter.element.style.maskImage = `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
  };
  const rebuild = letter => {
    const context = letter.ink.getContext("2d");
    context.clearRect(0, 0, letter.glyphWidth, letter.glyphHeight);
    context.drawImage(letter.base, 0, 0, letter.base.width, letter.base.height, 0, 0, letter.glyphWidth, letter.glyphHeight);
    context.globalCompositeOperation = "destination-out";
    for (const cut of letter.cuts) { polygon(context, cut); context.fill(); }
    context.globalCompositeOperation = "source-over";
  };
  const measure = () => {
    for (const letter of letters) {
      const element = letter.element, style = getComputedStyle(element), rect = element.getBoundingClientRect();
      letter.glyphWidth = Math.max(1, rect.width); letter.glyphHeight = Math.max(1, rect.height);
      clearLetter(letter);
      letter.base = document.createElement("canvas"); letter.ink = document.createElement("canvas");
      for (const canvas of [letter.base, letter.ink]) { canvas.width = Math.ceil(rect.width * ratio); canvas.height = Math.ceil(rect.height * ratio); canvas.getContext("2d").setTransform(ratio, 0, 0, ratio, 0, 0); }
      if (letter.image) {
        letter.base.getContext("2d").drawImage(element, 0, 0, letter.glyphWidth, letter.glyphHeight);
        rebuild(letter);
        continue;
      }
      const marker = document.createElement("span"); Object.assign(marker.style, { display: "inline-block", width: "0", height: "0" });
      const character = element.textContent; element.append(marker);
      const baseline = marker.getBoundingClientRect().top - rect.top; marker.remove();
      const context = letter.base.getContext("2d"); context.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
      context.textBaseline = "alphabetic"; context.fillStyle = color; context.fillText(character, 0, baseline);
      letter.fullInk=inkAmount(letter.base);
      rebuild(letter);
    }
    fragments = []; repairStep = -1;
  };
  const chip = (letter, point, power, direction, reduced) => {
    if (letter.destroyed) return;
    const radians = letter.rotation * Math.PI / 180, cosine = Math.cos(radians), sine = Math.sin(radians);
    const points = wholeLetter(letter);
    const left = Math.floor(Math.min(...points.map(p => p.x))), top = Math.floor(Math.min(...points.map(p => p.y)));
    const width = Math.ceil(Math.max(...points.map(p => p.x)) - left), height = Math.ceil(Math.max(...points.map(p => p.y)) - top);
    if (!reduced) {
      if (fragments.length >= 28) fragments.shift();
      const sprite = document.createElement("canvas"); sprite.width = Math.ceil(width * ratio); sprite.height = Math.ceil(height * ratio);
      const context = sprite.getContext("2d"); context.scale(ratio, ratio); context.translate(-left, -top); polygon(context, points); context.clip();
      context.drawImage(letter.base, 0, 0, letter.base.width, letter.base.height, 0, 0, letter.glyphWidth, letter.glyphHeight);
      const ox = left + width / 2 - letter.glyphWidth / 2, oy = top + height / 2 - letter.glyphHeight / 2;
      fragments.push({ sprite, width, height, x: letter.cx + letter.x + ox * cosine - oy * sine, y: letter.cy + letter.y + ox * sine + oy * cosine,
        vx: direction * (35 + Math.random() * 45) * power, vy: -(80 + Math.random() * 45) * power, angle: radians, spin: (Math.random() - .5) * 6, life: 1.6, volleys: 0 });
    }
    letter.repair = 0;
    letter.cuts = [points]; rebuild(letter);
    letter.destroyed = true;
  };
  return {
    measure,
    pick(point) {
      return [...fragments].reverse().find(fragment => {
        const dx = point.x-fragment.x, dy = point.y-fragment.y;
        const cosine = Math.cos(fragment.angle), sine = Math.sin(fragment.angle);
        return Math.abs(dx*cosine+dy*sine) < fragment.width/2+9 && Math.abs(-dx*sine+dy*cosine) < fragment.height/2+9;
      });
    },
    juggle(fragment, point, now) {
      if (!fragments.includes(fragment)) return null;
      fragment.volleys++;
      fragment.vx = Math.max(-140,Math.min(140,(fragment.x-point.x)*12));
      fragment.vy = -150-Math.min(70,fragment.volleys*12);
      fragment.spin = (fragment.volleys%2 ? 1 : -1)*5;
      fragment.life = 1.6;
      hitAt = now; repairStep = -1;
      return {x:fragment.x,y:fragment.y,combo:fragment.volleys,special:fragment.volleys%3===0};
    },
    shatter(now, reduced) {
      hitAt=now;repairStep=-1;
      const letter = letters.find(letter => !letter.destroyed);
      if (letter) {
        chip(letter,{x:letter.cx+letter.x,y:letter.cy+letter.y},2.6,Math.random()<.5?-1:1,reduced);
        mask(letter,0);
      }
    },
    destruction() {
      let original=0,remaining=0;
      for(const letter of letters){
        const full = letter.fullInk || 0;
        original += full;
        remaining += letter.cuts.length ? full * (letter.repair || 0) : full;
      }
      return original>0?Math.max(0,Math.min(1,1-remaining/original)):0;
    },
    hit(point, power, direction, now, reduced) {
      hitAt = now; repairStep = -1;
      const targets = letters.filter(letter => !letter.destroyed).sort((a, b) => Math.hypot(a.cx + a.x - point.x, a.cy + a.y - point.y) - Math.hypot(b.cx + b.x - point.x, b.cy + b.y - point.y));
      if (targets[0]) chip(targets[0], point, power, direction, reduced);
      letters.forEach(letter => mask(letter, 0));
    },
    step(now, dt, holding, bounds) {
      for (const fragment of fragments) { fragment.life -= dt; fragment.x += fragment.vx * dt; fragment.y += fragment.vy * dt; fragment.vy += 340 * dt; fragment.angle += fragment.spin * dt; }
      if (bounds) for (const fragment of fragments) {
        const radius = Math.hypot(fragment.width,fragment.height)/2;
        const left=bounds.left+radius,right=bounds.right-radius,top=bounds.top+radius,bottom=bounds.bottom-radius;
        if(fragment.x<left || fragment.x>right){fragment.x=Math.max(left,Math.min(right,fragment.x));fragment.vx*=-.65;}
        if(fragment.y<top){fragment.y=top;fragment.vy=Math.abs(fragment.vy)*.35;}
        if(fragment.y>bottom)fragment.life=0;
      }
      fragments = fragments.filter(fragment => fragment.life > 0);
      const repair = Math.max(0, Math.min(1, (now - hitAt - 3500) / 1100));
      const step = Math.floor(repair * 20);
      if (!holding && step !== repairStep) {
        repairStep = step;
        for (const letter of letters) {
          if (repair >= 1) {
            clearLetter(letter);
            rebuild(letter);
          } else {
            mask(letter, step / 20);
            if (letter.repair > 0) letter.destroyed = false;
          }
        }
      }
      return fragments.length > 0 || (!holding && repair > 0 && repair < 1 && letters.some(letter => letter.cuts.length));
    },
    draw(context, pad) {
      for (const fragment of fragments) {
        context.save(); context.translate(fragment.x + pad, fragment.y + pad); context.rotate(fragment.angle); context.globalAlpha = Math.min(1, fragment.life / .25);
        context.drawImage(fragment.sprite, -fragment.width / 2, -fragment.height / 2, fragment.width, fragment.height); context.restore();
      }
    },
    hasDamage: () => letters.some(letter => letter.cuts?.length),
    repairAt: () => hitAt + 3500,
    dispose() { fragments = []; letters.forEach(clearLetter); },
  };
}
