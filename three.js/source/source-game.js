export function createGame() {
  return { cubes: [], sparks: [], kills: 0, spawnIn: 0.5, hitFlash: 0, lightFlash: 0, elapsed: 0, status: "ready", defeatTime: 0, lives: 3, invulnerable: 0, beamScale: 1 };
}

export function resetGame(game) {
  game.cubes.length = 0;
  game.kills = 0;
  game.sparks.length = 0;
  game.spawnIn = 0.5;
  game.hitFlash = 0;
  game.lightFlash = 0;
  game.elapsed = 0;
  game.status = "ready";
  game.defeatTime = 0;
  game.lives = 3;
  game.invulnerable = 0;
  game.beamScale = 1;
}

export function sourceDifficulty(time) {
  const pressure = Math.min(1, Math.max(0, (time - 4) / 30));
  const waves = time >= 10, quiet = waves && (time - 10) % 10 >= 8;
  return {
    interval: (time < 4 ? .95 : .72 - pressure * .28) * (quiet ? 1.8 : 1),
    speed: 24 + pressure * 20,
    denseChance: time < 4 ? 0 : .22 + pressure * .13,
    fastChance: waves ? .25 : 0,
  };
}

export function defeatVisual(time, reducedMotion = false) {
  const recovery = Math.max(0, Math.min(time - 2, 1));
  const flicker = time < 0.5 ? (1 - time / 0.5) * (reducedMotion ? 1 : 0.55 + 0.45 * Math.cos(time * Math.PI * 12)) : 0;
  return {
    light: time < 2 ? flicker : recovery * recovery * (3 - 2 * recovery),
    fog: time < 0.2 ? time / 0.2 : Math.max(0, 1 - (time - 0.2) / 1.2),
    others: Math.max(0, 1 - time / 0.6),
  };
}

export function cloudBlocksLight(blocker, target, origin) {
  const dx = target.x - origin.x, dy = target.y - origin.y;
  const distance = Math.hypot(dx, dy);
  if (distance === 0) return false;
  const bx = blocker.x - origin.x, by = blocker.y - origin.y;
  const along = (bx * dx + by * dy) / distance;
  const across = Math.abs(bx * dy - by * dx) / distance;
  return along > 0 && along < distance && across < blocker.size;
}

export function cloudShadow(cloud, origin, angle) {
  const dx = cloud.x - origin.x, dy = cloud.y - origin.y;
  const distance = Math.hypot(dx, dy);
  const shadowRadius = cloud.size * .75;
  if (distance <= shadowRadius) return null;
  return {
    direction: Math.atan2(Math.sin(Math.atan2(dy, dx) - angle), Math.cos(Math.atan2(dy, dx) - angle)),
    halfAngle: Math.asin(Math.min(1, shadowRadius / distance)),
    start: Math.sqrt(distance * distance - shadowRadius * shadowRadius),
  };
}

export function stepGame(game, dt, active, origin, angle, beam, bounds, random = Math.random) {
  if (game.status === "defeated") {
    game.defeatTime += dt;
    if (game.defeatTime >= 0.6) { game.cubes.length = 0; game.sparks.length = 0; }
    if (game.defeatTime >= 3.1) resetGame(game);
    return;
  }
  if (!active) { resetGame(game); return; }
  game.elapsed = (game.elapsed || 0) + dt;
  game.lightFlash = Math.max(0, (game.lightFlash || 0) - dt);
  const difficulty = sourceDifficulty(game.elapsed);
  game.hitFlash = Math.max(0, game.hitFlash - dt);
  game.invulnerable = Math.max(0, game.invulnerable - dt);
  const targetScale = 1 - (3 - game.lives) * .22;
  game.beamScale += (targetScale - game.beamScale) * (1 - Math.exp(-dt * 8));
  game.spawnIn -= dt;
  if (game.spawnIn <= 0) {
    game.spawnIn = difficulty.interval + random() * .35;
    if (game.cubes.length < 12 && bounds.width > 60 && bounds.height > 60) {
      // Rare upper arrivals stay slow and fragile, even as difficulty increases.
      const fromAbove = game.elapsed >= 4 && random() < .12;
      const direction = fromAbove ? -Math.PI * (.2 + random() * .6) : random() * Math.PI;
      const radius = 180 + random() * 180;
      const x = Math.max(24, Math.min(bounds.width - 24, origin.x + Math.cos(direction) * radius));
      const y = Math.max(24, Math.min(bounds.height - 24, origin.y + Math.sin(direction) * radius));
      if (Math.hypot(x - origin.x, y - origin.y) > 100) {
        const roll = random();
        const kind = fromAbove ? "normal" : roll < difficulty.denseChance ? "dense" : roll < difficulty.denseChance + difficulty.fastChance ? "fast" : "normal";
        const dense = kind === "dense", fast = kind === "fast";
        game.cubes.push({ x, y, kind, health: fromAbove ? .55 : dense ? 1.8 : 1, size: (dense ? 13 : fast ? 7 : 9) + random() * 4,
          speed: fromAbove ? 18 + random() * 6 : (difficulty.speed + random() * 12) * (dense ? .8 : fast ? 1.4 : 1), rotation: random() * Math.PI,
          spin: (random() - 0.5) * 0.6, damage: 0 });
      }
    }
  }
  const forward = { x: Math.cos(angle), y: Math.sin(angle) };
  for (const cube of game.cubes) {
    cube.trail = (cube.trail || []).filter((puff) => { puff.age += dt; return puff.age < 0.7; });
    cube.trailClock = (cube.trailClock || 0) + dt;
    if (cube.trailClock >= 0.08) {
      cube.trailClock %= 0.08;
      cube.trail.push({ x: cube.x, y: cube.y, age: 0 });
      if (cube.trail.length > 9) cube.trail.shift();
    }
    const dx = cube.x - origin.x, dy = cube.y - origin.y;
    const distance = Math.hypot(dx, dy);
    const movement = Math.min(cube.speed * dt, distance);
    cube.x -= dx / Math.max(distance, 1) * movement;
    cube.y -= dy / Math.max(distance, 1) * movement;
    cube.rotation += cube.spin * dt;
  }
  game.cubes.sort((a, b) => Math.hypot(a.x - origin.x, a.y - origin.y) - Math.hypot(b.x - origin.x, b.y - origin.y));
  const survivors = [];
  for (const cube of game.cubes) {
    const dx = cube.x - origin.x, dy = cube.y - origin.y;
    const along = dx * forward.x + dy * forward.y;
    const across = Math.abs(dx * forward.y - dy * forward.x);
    const illuminated = along > 0 && along < beam.length * 0.9 && across < Math.tan(beam.angle) * along + cube.size * 0.6;
    const blocked = illuminated && game.cubes.some((other) => other !== cube && other.damage < 1 && cloudBlocksLight(other, cube, origin));
    if (illuminated && !blocked) {
      const focus = beam.focus ?? (beam.color.r > 200 ? 1 : 0);
      const power = beam.power ?? (beam.color.r > 200 ? 3.5 : 1.8);
      const efficiency = cube.kind === "dense" ? .45 + .95 * focus : 1;
      cube.damage += dt * power * efficiency / (cube.health || 1);
      const distance = Math.hypot(dx, dy);
      // Cancel only part of the approach so illuminated enemies keep advancing.
      const slow = (.3 + focus * .2) * (cube.kind === "dense" ? .5 : 1);
      const push = Math.min(cube.speed * dt, distance) * slow;
      cube.x += dx / Math.max(distance, 1) * push;
      cube.y += dy / Math.max(distance, 1) * push;
    }
    if (cube.damage >= 1) {
      game.kills++;
      game.lightFlash = .18;
      for (let i = 0; i < 8 && game.sparks.length < 160; i++) {
        const a = random() * Math.PI * 2, speed = 25 + random() * 65;
        game.sparks.push({ x: cube.x, y: cube.y, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed,
          life: 0.5, size: 2 + random() * 2, color: beam.color });
      }
    } else if (Math.hypot(dx, dy) < origin.radius + cube.size * 0.6) {
      if (game.invulnerable === 0) {
        game.lives--;
        game.hitFlash = .65;
        game.invulnerable = 1.1;
        if (game.lives <= 0) {
          game.status = "defeated";
          game.defeatTime = 0;
          return;
        }
      }
    } else survivors.push(cube);
  }
  game.cubes = survivors;
  game.sparks = game.sparks.filter((spark) => {
    spark.life -= dt;
    spark.x += spark.vx * dt; spark.y += spark.vy * dt;
    spark.vx *= Math.exp(-dt * 3); spark.vy *= Math.exp(-dt * 3);
    return spark.life > 0;
  });
}
