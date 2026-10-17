export function createRace() {
  return {
    elapsed: 0, distance: 0, spawnIn: 2,
    obstacles: [{x:0,progress:.3,checked:false,hit:false,type:"arch",size:1,opening:.65}],
    defeated: false, defeatTime: 0, lastLane: -1, lastChallenge: null,
  };
}

export function stepRace(race, dt, racer, radius = .24, random = Math.random) {
  dt = Math.max(0, Math.min(.035, dt));
  if (race.defeated) { race.defeatTime += dt; return; }
  race.elapsed += dt;
  const difficulty = Math.min(1, race.elapsed / 75);
  // Alternating pressure and recovery avoids a uniformly dense obstacle stream.
  const phase = race.elapsed % 16;
  const pressure = race.elapsed < 4 ? 0 : phase < 12 ? 1 : -.6;
  const pace = .2 + difficulty * .14 + racer.speed * .13;
  race.distance += pace * dt * 1000;
  race.spawnIn -= dt;
  const obstacleType = () => {
    const roll = random();
    return roll < .3 ? "rock" : roll < .55 ? "slab" : "pillar";
  };
  if (race.spawnIn <= 0 && race.obstacles.length <= 14) {
    const interval = Math.max(.6, 1.45 - difficulty * .55 - pressure * .25 + random() * .3);
    const archPattern = race.elapsed >= 8 && random() < .06;
    const sidePattern = race.elapsed >= 4 && pressure > 0 && random() < .5 + difficulty * .12;
    if (archPattern) {
      race.obstacles.push({x:0,progress:0,checked:false,hit:false,type:"arch",size:1,opening:.58});
      race.spawnIn = interval + 1.3;
    } else if (sidePattern) {
      const choices = (race.elapsed >= 20 ? ["side","chicane","center"] : race.elapsed >= 10 ? ["side","center"] : ["side"])
        .filter(pattern => pattern !== race.lastChallenge || race.elapsed < 10);
      const challenge = choices[Math.floor(random()*choices.length)];
      race.lastChallenge = challenge;
      const addObstacle = (x, progress, size) => race.obstacles.push({
        x,progress,checked:false,hit:false,shape:Math.floor(random()*3),size,type:obstacleType(),
      });
      if (challenge === "chicane") {
        const firstSide = random() < .5 ? -1 : 1;
        const changeGap = .65 - difficulty*.1;
        for (let stage=0;stage<2;stage++) {
          const side=stage===0?firstSide:-firstSide;
          for (let row=0;row<2;row++) for (let column=0;column<2;column++) {
            addObstacle(side*(column === 0 ? .65 : .22),-stage*(.18+changeGap)-row*.18-column*.04,.85+random()*.1);
          }
        }
        race.lastLane=firstSide<0?2:0;
        race.spawnIn=(.36+changeGap+.04)/pace+Math.max(1.4,interval);
      } else if (challenge === "center") {
        for (let row=0;row<3;row++) for (const side of [-1,1]) {
          addObstacle(side*.65,-row*.22,.65+random()*.1);
        }
        race.lastLane=0;
        race.spawnIn=.44/pace+Math.max(1.4,interval);
      } else {
      const side = random() < .5 ? -1 : 1;
      const rows = 3 + Math.floor(difficulty * 2);
      const columns = 2;
      for (let row = 0; row < rows; row++) {
        for (let column = 0; column < columns; column++) {
          race.obstacles.push({
            x: side * (column === 0 ? .65 : .22),
            progress: -row * .18 - column * .04, checked: false, hit: false,
            shape: Math.floor(random() * 3), size: .85 + random() * .15,
            type: obstacleType(),
          });
        }
      }
      race.lastLane = side < 0 ? 0 : 2;
      // Finish the occupied stretch before introducing a new pattern across the track.
      race.spawnIn = ((rows - 1) * .18 + (columns - 1) * .04) / pace + Math.max(1.05,interval);
      }
    } else {
    const lane = (race.lastLane + 1 + Math.floor(random() * 2)) % 3;
    race.lastLane = lane;
    const lanes = [lane];
    if (race.elapsed > 8 && pressure > 0 && random() < .25 + difficulty * .25) {
      // Both rocks arrive together, leaving the third lane clear.
      lanes.push((lane + 1 + Math.floor(random() * 2)) % 3);
    }
    let borderLane = -1;
    if (lanes.length === 1 && random() < .7) {
      const availableEdges = [0, 2].filter(edge => !lanes.includes(edge));
      borderLane = availableEdges[Math.floor(random() * availableEdges.length)];
      lanes.push(borderLane);
    }
    for (const occupiedLane of lanes) {
      const onBorder = occupiedLane === borderLane;
      race.obstacles.push({
        x: (occupiedLane - 1) * .65,
        progress: onBorder ? -.32 - random() * .08 : 0, checked: false, hit: false,
        shape: Math.floor(random() * 3), size: onBorder ? .6 + random() * .15 : .85 + random() * (.2 + difficulty * .15),
        type: obstacleType(),
      });
    }
    race.spawnIn = interval;
    }
  }
  for (const obstacle of race.obstacles) {
    obstacle.progress += dt * pace;
    if (!obstacle.checked && obstacle.progress >= .82) {
      obstacle.checked = true;
      const collision = obstacle.type === "arch"
        ? Math.abs(obstacle.x-racer.x)+radius > obstacle.opening
        : Math.abs(obstacle.x - racer.x) < radius + .12 * (obstacle.size ?? 1);
      if (collision) {
        obstacle.hit = true;
        race.defeated = true;
        break;
      }
    }
  }
  race.obstacles = race.obstacles.filter(obstacle => obstacle.progress < 1.15);
}
