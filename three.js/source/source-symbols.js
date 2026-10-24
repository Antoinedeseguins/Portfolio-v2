// Fixed positions keep the hidden markings still while the light moves over them.
export function createSymbolField() {
  const canvas = document.createElement("canvas");
  canvas.setAttribute("aria-hidden", "true");
  Object.assign(canvas.style, { position: "fixed", zIndex: "6", pointerEvents: "none" });
  document.body.append(canvas);
  const context = canvas.getContext("2d");
  let width = 0, height = 0;
  let excluded = null;
  const clear = () => context.clearRect(0, 0, width, height);
  return {
    // rect and hero are screen boxes; the field is drawn in design pixels, `unit` screen pixels each.
    resize(rect, ratio, hero = null, unit = 1) {
      width = rect.width / unit; height = rect.height / unit;
      excluded = hero ? { left: (hero.left - rect.left) / unit, right: (hero.right - rect.left) / unit,
        top: (hero.top - rect.top) / unit, bottom: (hero.bottom - rect.top) / unit } : null;
      Object.assign(canvas.style, { left: `${rect.left}px`, top: `${rect.top}px`, width: `${rect.width}px`, height: `${rect.height}px` });
      canvas.width = Math.max(1, Math.round(rect.width * ratio));
      canvas.height = Math.max(1, Math.round(rect.height * ratio));
      context.setTransform(ratio * unit, 0, 0, ratio * unit, 0, 0);
    },
    draw({ active, kills, origin, angle, beam, alpha }) {
      clear();
      if (!active || kills < 10) return;
      const { x, y, radius } = origin;
      const cosine = Math.cos(angle), sine = Math.sin(angle);
      const point = (forward, side) => [x + forward * cosine - side * sine, y + forward * sine + side * cosine];
      const spread = Math.tan(beam.angle) * beam.length;
      context.save();
      context.beginPath();
      context.moveTo(...point(radius * .3, -2));
      context.lineTo(...point(beam.length, -spread));
      context.lineTo(...point(beam.length, spread));
      context.lineTo(...point(radius * .3, 2));
      context.closePath(); context.clip();
      context.strokeStyle = `rgb(${beam.color.r},${beam.color.g},${beam.color.b})`;
      context.globalAlpha = .5 * alpha * Math.min(1, (kills - 9) / 6);
      context.lineWidth = 1;
      context.lineCap = "round";
      const count = Math.min(108, 6 + Math.floor(kills - 10) * 2);
      let drawn = 0;
      for (let candidate = 0; candidate < 108 && drawn < count; candidate++) {
        // Reveal interleaved positions so added symbols spread across the page.
        const index = candidate * 47 % 108;
        const row = Math.floor(index / 12), column = index % 12;
        const jitter = Math.sin(index * 12.9898 + 1);
        const size = 8 + (index % 4) * 1.5;
        const kind = (index * 7 + row) % 6;
        const px = width * ((column + .5 + jitter * .2) / 12);
        const py = height * ((row + .5 + Math.cos(index * 9.1) * .2) / 9);
        const margin = 20;
        if (excluded && px + margin > excluded.left && px - margin < excluded.right
          && py + margin > excluded.top && py - margin < excluded.bottom) continue;
        drawn++;
        context.save();
        context.translate(px, py);
        context.rotate(jitter * .25);
        context.beginPath();
        if (kind === 0 || kind === 3) {
          context.arc(0, 0, size * .65, 0, Math.PI * 2);
          context.moveTo(0, -size); context.lineTo(0, size);
          if (kind === 3) { context.moveTo(-size, 0); context.lineTo(size, 0); }
        } else if (kind === 1 || kind === 4) {
          context.moveTo(0, -size); context.lineTo(size * .8, size * .65);
          context.lineTo(-size * .8, size * .65); context.closePath();
          context.moveTo(-size, 0); context.lineTo(size, 0);
          if (kind === 4) { context.moveTo(0, -size * .3); context.lineTo(0, size); }
        } else if (kind === 2) {
          context.moveTo(-size, 0); context.quadraticCurveTo(0, -size, size, 0);
          context.quadraticCurveTo(0, size, -size, 0);
          context.moveTo(size * .25, 0); context.arc(0, 0, size * .25, 0, Math.PI * 2);
        } else {
          context.moveTo(0, size); context.lineTo(0, -size);
          context.lineTo(size * .7, -size * .4); context.lineTo(0, size * .1);
          context.moveTo(0, -size * .2); context.lineTo(-size * .65, -size * .7);
          context.moveTo(-size * .4, size * .6); context.lineTo(size * .4, size * .6);
        }
        context.stroke(); context.restore();
      }
      context.restore();
    },
    clear,
    dispose() { canvas.remove(); },
  };
}
