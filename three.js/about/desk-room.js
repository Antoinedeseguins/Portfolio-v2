import * as THREE from "../vendor/three.module.js";

// Everything is built in code below, in the site's cool greys and blue.
// The slate wardrobe, with light handles.
const CABINET = { body: 0x7d8894, handle: 0xc9d0d6 };
// The toolbox on the wardrobe's bottom shelf: classic red, steel bar and latches, black rubber grip.
const TOOLBOX = { box: 0xc8453b, inside: 0x8f2f28, rim: 0xd9584d, metal: 0xc9d0d6, rubber: 0x2b333b };
// The toolbox fall, in seconds: land on the floor, settle; contents leave from scatter and fly for flight.
const FALL = { land: .45, end: .75, scatter: .25, flight: .5 };
// Where each loose piece of the toolbox lands when it is knocked over, in wardrobe units: x, y, z, turn, lying on its side.
const SPILL = [];
// The desk built below: same anthracite as before, light pulls, darker drawer insides.
const DESK = { body: 0x3a4148, pull: 0xc9d0d6, inside: 0x2b3238 };
// The 90s computer built below: beige-era shapes in the site's light greys, dark screen and power LED that light up.
const RETRO_PC = { case: 0xd3d9de, caseShade: 0xb3bcc4, slot: 0x2b333b, screen: 0x1d2227, led: 0x2b333b };
const LED_ON = 0xe0392f;
// The boot sequence and desktop on the CRT.
const SCREEN = {
  black: "#0d1013", flash: "#e8f2ff", boot: "#10161d", bar: "#f2f6fa", barTrack: "#26313c",
  glyphs: "#f2f6fa", fringeRed: "#e0392f", fringeCyan: "#3fd0e0", desktop: "#2f7f86", icon: "#f2f4f6", iconLabel: "#cfe6e8",
  taskbar: "#c9d0d6", start: "#4caf6a", cursor: "#ffffff", page: "#ffffff", close: "#e05a4f",
};
// The coffee mug on the desk: white, in the site's light grey, full of coffee.
const MUG = { mug: 0xeef1f3, coffee: 0x4a2e22 };
const NOTE = { paper: 0xf4f5f2, tape: 0x9cbbe0 };
// Camera angles: front right, slightly above.
const VIEW_ELEVATION = THREE.MathUtils.degToRad(24);
const VIEW_AZIMUTH = THREE.MathUtils.degToRad(32);

function spring(value = 0) {
  return { value, velocity: 0, target: value };
}

function stepSpring(s, dt, stiffness = 170, damping = 18) {
  s.velocity += ((s.target - s.value) * stiffness - s.velocity * damping) * dt;
  s.value += s.velocity * dt;
  return Math.abs(s.target - s.value) > 1e-4 || Math.abs(s.velocity) > 1e-4;
}

// A box whose back face shrinks towards a smaller rectangle: the tapered rear of a CRT.
function taperedBox(width, height, depth, backScale) {
  const geometry = new THREE.BoxGeometry(width, height, depth);
  const position = geometry.attributes.position;
  for (let i = 0; i < position.count; i++) {
    if (position.getZ(i) >= 0) continue;
    position.setX(i, position.getX(i) * backScale);
    position.setY(i, position.getY(i) * backScale - height * (1 - backScale) * .25);
  }
  geometry.computeVertexNormals();
  return geometry;
}

// A 90s desktop PC (flat case, CRT on top), facing +z, standing on y = 0.
// Sizes are in desk units: the desk is .72 wide and .38 deep.
function buildRetroComputer() {
  const pc = new THREE.Group();
  const part = (geometry, material, x, y, z) => {
    const mesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ name: material }));
    mesh.position.set(x, y, z);
    pc.add(mesh);
    return mesh;
  };

  // Flat desktop case with a floppy drive, a CD tray and a power LED.
  part(new THREE.BoxGeometry(.25, .075, .15), "case", 0, .0375, 0);
  part(new THREE.BoxGeometry(.25, .006, .15), "caseShade", 0, .003, 0);
  part(new THREE.BoxGeometry(.07, .03, .004), "caseShade", .07, .04, .076);
  part(new THREE.BoxGeometry(.05, .005, .004), "slot", .07, .044, .078);
  part(new THREE.BoxGeometry(.08, .018, .004), "caseShade", -.05, .045, .076);
  part(new THREE.BoxGeometry(.008, .008, .004), "led", -.108, .022, .077).name = "led";

  // CRT monitor on a swivel foot; only the case below is the power switch (see the click handler).
  for (const mesh of [
    part(new THREE.CylinderGeometry(.05, .06, .015, 16), "caseShade", 0, .0825, -.01),
    part(new THREE.BoxGeometry(.34, .29, .04), "case", 0, .235, .02),
    part(taperedBox(.32, .27, .19, .62), "caseShade", 0, .23, -.095),
  ]) mesh.userData.monitor = true;
  const screen = part(new THREE.BoxGeometry(.27, .21, .004), "screen", 0, .24, .041);
  screen.name = "screen";

  return pc;
}

// Wardrobe after the Kenney bookcase it replaces: side panels ending in short legs, a top, a back and three
// shelves inside, and two doors hinged on their outer edges. Spans x 0 → .4, z -.25 → 0, y 0 → .85.
function buildCabinet() {
  const cabinet = new THREE.Group();
  const part = (parent, width, height, depth, material, x, y, z) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), new THREE.MeshStandardMaterial({ name: material }));
    mesh.position.set(x, y, z);
    parent.add(mesh);
    return mesh;
  };
  const width = .4, depth = .25, height = .85, post = .04, legs = .115, top = .03;
  const inside = { left: post, right: width - post, bottom: legs, top: height - top };
  const innerWidth = inside.right - inside.left, innerHeight = inside.top - inside.bottom;
  // The carcass (sides with their legs, top, bottom, back) reads as one piece: it gets a single outline that skips
  // the joins between its boxes, instead of the per-box edges the other parts get.
  const carcass = [];
  const outlineBox = (width, height, depth, x, y, z) => {
    carcass.push(new THREE.Box3().setFromCenterAndSize(new THREE.Vector3(x, y, z), new THREE.Vector3(width, height, depth)));
  };
  const shell = (width, height, depth, x, y, z) => {
    part(cabinet, width, height, depth, "body", x, y, z).userData.noEdges = true;
    outlineBox(width, height, depth, x, y, z);
  };
  // Each side is a single solid, notched at the bottom into a front and a back leg: a separate leg box
  // would leave a hidden face at the join that the shadows pick up as a hairline.
  const profile = new THREE.Shape([
    [0, 0], [post, 0], [post, legs], [depth - post, legs], [depth - post, 0], [depth, 0], [depth, inside.top], [0, inside.top],
  ].map(([u, v]) => new THREE.Vector2(u, v)));
  const sideGeometry = new THREE.ExtrudeGeometry(profile, { depth: post, bevelEnabled: false });
  sideGeometry.rotateY(Math.PI / 2);
  for (const x of [0, width - post]) {
    const side = new THREE.Mesh(x ? sideGeometry.clone() : sideGeometry, new THREE.MeshStandardMaterial({ name: "body" }));
    side.position.x = x;
    side.userData.noEdges = true;
    cabinet.add(side);
    outlineBox(post, innerHeight, depth, x + post / 2, inside.bottom + innerHeight / 2, -depth / 2);
    for (const z of [-post / 2, -depth + post / 2]) outlineBox(post, legs, post, x + post / 2, legs / 2, z);
  }
  shell(width, top, depth, width / 2, height - top / 2, -depth / 2);
  const doorWidth = innerWidth / 2 - .001, doorDepth = .018, doorInset = .018;
  // The bottom stops behind the recessed doors instead of sticking out under them.
  const floorDepth = depth - doorInset - doorDepth;
  shell(innerWidth, .02, floorDepth, width / 2, inside.bottom - .01, -depth + floorDepth / 2);
  shell(innerWidth, innerHeight, .02, width / 2, inside.bottom + innerHeight / 2, -depth + .01);
  for (let k = 1; k <= 3; k++) part(cabinet, innerWidth, .015, depth - .07, "body", width / 2, inside.bottom + innerHeight * k / 4, -depth / 2 - .015);

  // Each door sits slightly back inside the frame; the handles meet at the central seam.
  const [doorLeft, doorRight] = [-1, 1].map((side) => {
    const door = new THREE.Group();
    // Hinged on the front outer edge, so the door swings out without cutting into the frame.
    door.position.set(side < 0 ? inside.left : inside.right, inside.bottom, -doorInset);
    part(door, doorWidth, innerHeight, doorDepth, "body", -side * doorWidth / 2, innerHeight / 2, -doorDepth / 2);
    part(door, .015, .06, .02, "handle", -side * (doorWidth - .02), innerHeight * .42, .01);
    cabinet.add(door);
    return door;
  });
  return { cabinet, doorLeft, doorRight, outline: outlineBoxes(carcass) };
}

// Outline of a union of axis-aligned boxes: each box edge is kept only where both of its faces are exposed,
// so flush joins between boxes leave no line. Edges are split wherever another box starts or ends along them.
function outlineBoxes(boxes, eps = .0015) {
  const inside = (p) => boxes.some((b) => p.x > b.min.x + 1e-6 && p.x < b.max.x - 1e-6 && p.y > b.min.y + 1e-6 && p.y < b.max.y - 1e-6 && p.z > b.min.z + 1e-6 && p.z < b.max.z - 1e-6);
  const axes = ["x", "y", "z"];
  const positions = [];
  const probe = new THREE.Vector3();
  for (const box of boxes) {
    for (let a = 0; a < 3; a++) {
      const [b, c] = axes.filter((_, i) => i !== a);
      for (const sb of [-1, 1]) {
        for (const sc of [-1, 1]) {
          const start = box.min.clone(), end = box.max.clone();
          start[b] = end[b] = sb < 0 ? box.min[b] : box.max[b];
          start[c] = end[c] = sc < 0 ? box.min[c] : box.max[c];
          const from = start[axes[a]], to = end[axes[a]];
          const cuts = [...new Set([from, to, ...boxes.flatMap((other) => [other.min[axes[a]], other.max[axes[a]]])])]
            .filter((v) => v >= from && v <= to).sort((m, n) => m - n);
          for (let i = 0; i < cuts.length - 1; i++) {
            const p = start.clone();
            p[axes[a]] = (cuts[i] + cuts[i + 1]) / 2;
            const check = (db, dc) => { probe.copy(p); probe[b] += db * eps; probe[c] += dc * eps; return !inside(probe); };
            if (!(check(sb, sc) && check(sb, -sc) && check(-sb, sc))) continue;
            const segmentStart = start.clone(), segmentEnd = start.clone();
            segmentStart[axes[a]] = cuts[i];
            segmentEnd[axes[a]] = cuts[i + 1];
            positions.push(...segmentStart.toArray(), ...segmentEnd.toArray());
          }
        }
      }
    }
  }
  return new THREE.BufferGeometry().setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
}

// What the CRT shows once switched on, drawn from big readable shapes (any text would be a blur at this size):
// a power-on flash, flickering white symbols over a filling progress bar, then a desktop with three icons and a taskbar.
const BOOT = { flash: .25, logo: 1.1, end: 1.35 };
// Part of the loading bar, as a fraction, during which the picture glitches.
const GLITCH = { from: .45, to: .7 };
// A coffee short circuit, in seconds: the picture tears until tear, then collapses to a dot and goes black at end.
const CRASH = { tear: .55, end: .9 };
// The first boot after a short circuit, in seconds: boots normally until boot, tears until tear, dies at end.
const FAIL = { boot: .55, tear: 1.05, end: 1.35 };
// Smoke puffs rising from the computer case after the short circuit: how many, the gap between them, how long each lasts.
const SMOKE = { puffs: 8, gap: .14, life: 1.3, colour: 0x5f676f };
const CLOSE_BOX = { x: 232, y: 6, size: 18 };
const GLYPHS = "01{}<>/\\#$%&*+=?!;:[]";
function createScreenDisplay() {
  const canvas = document.createElement("canvas");
  canvas.width = 258;
  canvas.height = 200;
  const context = canvas.getContext("2d");
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const { width, height } = canvas;
  const rect = (colour, x, y, w, h) => { context.fillStyle = colour; context.fillRect(x, y, w, h); };
  const copy = document.createElement("canvas");
  copy.width = canvas.width;
  copy.height = canvas.height;
  const copyContext = copy.getContext("2d");
  // Tears the current picture into horizontal bands shifted sideways, with red and cyan fringes; frame picks the pattern.
  const glitch = (frame) => {
    copyContext.drawImage(canvas, 0, 0);
    let seed = frame * 7919 + 13;
    const random = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
    for (let y = 0; y < height;) {
      const band = 4 + Math.floor(random() * 22);
      const shift = random() < .55 ? (random() - .5) * 60 : 0;
      if (shift) {
        context.drawImage(copy, 0, y, width, band, shift, y, width, band);
        context.globalCompositeOperation = "lighter";
        context.globalAlpha = .5;
        rect(random() < .5 ? SCREEN.fringeRed : SCREEN.fringeCyan, shift < 0 ? width + shift : 0, y, Math.abs(shift), band);
        context.globalAlpha = 1;
        context.globalCompositeOperation = "source-over";
      }
      y += band;
    }
  };

  let page = null;
  // The desktop's mouse pointer, in canvas pixels; it mirrors the visitor's own mouse (see point()).
  const cursor = { x: width * .6, y: height * .45 };
  const drawCursor = () => {
    context.beginPath();
    context.moveTo(cursor.x, cursor.y);
    for (const [dx, dy] of [[0, 17], [4.5, 13], [7.5, 20], [10.5, 18.6], [7.6, 12], [12.5, 12]]) context.lineTo(cursor.x + dx * 1.5, cursor.y + dy * 1.5);
    context.closePath();
    context.fillStyle = SCREEN.cursor;
    context.strokeStyle = SCREEN.black;
    context.lineWidth = 2;
    context.lineJoin = "round";
    context.fill();
    context.stroke();
  };
  const desktop = () => {
    rect(SCREEN.desktop, 0, 0, width, height);
    // Three big icons down the left, each with its label bar.
    for (let i = 0; i < 3; i++) {
      rect(SCREEN.icon, 20, 14 + i * 54, 36, 30);
      rect(SCREEN.iconLabel, 14, 50 + i * 54, 48, 6);
    }
    // An opened icon: a blank white page over the desktop, with a red close box.
    if (page !== null) {
      rect(SCREEN.page, 0, 0, width, height - 22);
      rect(SCREEN.close, CLOSE_BOX.x, CLOSE_BOX.y, CLOSE_BOX.size, CLOSE_BOX.size);
    }
    // Taskbar with a start button.
    rect(SCREEN.taskbar, 0, height - 22, width, 22);
    rect(SCREEN.start, 4, height - 18, 34, 14);
    drawCursor();
  };

  const draw = (seconds) => {
    if (seconds < BOOT.flash) {
      // The tube warming up: a bright line opening into the picture.
      rect(SCREEN.black, 0, 0, width, height);
      const open = Math.min(1, seconds / BOOT.flash);
      rect(SCREEN.flash, 0, height / 2 - open * height / 2, width, Math.max(2, open * height));
    } else if (seconds < BOOT.logo) {
      rect(SCREEN.boot, 0, 0, width, height);
      // Hacker-style code rain: a grid of white symbols reshuffled a dozen times a second, then a progress bar filling up.
      context.fillStyle = SCREEN.glyphs;
      context.font = "700 20px monospace";
      context.textAlign = "center";
      context.textBaseline = "middle";
      let seed = Math.floor(seconds * 12) * 9301 + 49297;
      const random = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
      for (let row = 0; row < 6; row++) {
        for (let column = 0; column < 9; column++) {
          if (random() < .2) continue;
          context.globalAlpha = .45 + random() * .55;
          context.fillText(GLYPHS[Math.floor(random() * GLYPHS.length)], 25 + column * 26, 24 + row * 22);
        }
      }
      context.globalAlpha = 1;
      const progress = (seconds - BOOT.flash) / (BOOT.logo - BOOT.flash);
      rect(SCREEN.barTrack, 54, 168, 150, 12);
      rect(SCREEN.bar, 56, 170, 146 * Math.min(1, progress), 8);
      // An unstable build: for a moment the picture tears into shifted bands with colour fringes, then snaps back clean.
      if (progress > GLITCH.from && progress < GLITCH.to) glitch(Math.floor(seconds * 30));
    } else {
      desktop();
      // The desktop fades in from black.
      const fade = Math.max(0, 1 - (seconds - BOOT.logo) / (BOOT.end - BOOT.logo));
      if (fade > 0) { context.globalAlpha = fade; rect(SCREEN.black, 0, 0, width, height); context.globalAlpha = 1; }
    }
    texture.needsUpdate = true;
  };
  // A switched-off tube shows nothing, not a dimmed copy of the last picture: plain white, tinted by the
  // material to the same dark glass as before.
  let blank = false;
  const clear = () => {
    if (blank) return;
    rect("#ffffff", 0, 0, width, height);
    texture.needsUpdate = blank = true;
  };
  const show = (seconds) => { blank = false; draw(seconds); };
  // A click on the desktop at canvas pixel (x, y): opens the icon under it, or closes the open page.
  const click = (x, y) => {
    const inside = (left, top, w, h) => x >= left && x <= left + w && y >= top && y <= top + h;
    if (page !== null) {
      if (inside(CLOSE_BOX.x, CLOSE_BOX.y, CLOSE_BOX.size, CLOSE_BOX.size)) page = null;
    } else {
      const icon = [0, 1, 2].find((i) => inside(12, 10 + i * 54, 52, 48));
      if (icon === undefined) return;
      page = icon;
    }
    show(BOOT.end);
  };
  const reset = () => { page = null; };
  // Moves the desktop pointer to (u, v), fractions of the screen from its top left, and redraws the desktop.
  const point = (u, v) => {
    cursor.x = THREE.MathUtils.clamp(u, 0, 1) * width;
    cursor.y = THREE.MathUtils.clamp(v, 0, 1) * height;
    show(BOOT.end);
  };
  // A short circuit, seconds in: the desktop tears and flashes, then the picture collapses into a bright line and a dot.
  // Heavy tearing with white flashes over whatever picture paint() draws.
  const tear = (seconds, paint) => {
    paint();
    const frame = Math.floor(seconds * 30);
    glitch(frame);
    glitch(frame + 101);
    if (frame % 4 === 0) { context.globalAlpha = .45; rect(SCREEN.flash, 0, 0, width, height); context.globalAlpha = 1; }
  };
  // An old tube switching off, u from 0 to 1: the picture squashes into a bright line, then a dot, then black.
  const collapse = (u) => {
    rect(SCREEN.black, 0, 0, width, height);
    const lineHeight = u < .5 ? THREE.MathUtils.lerp(height, 3, u / .5) : 3;
    const lineWidth = u < .5 ? width : THREE.MathUtils.lerp(width, 3, (u - .5) / .5);
    if (u < 1) rect(SCREEN.flash, (width - lineWidth) / 2, (height - lineHeight) / 2, lineWidth, lineHeight);
  };
  // A short circuit, seconds in: the desktop tears and flashes, then the picture collapses.
  const crash = (seconds) => {
    blank = false;
    if (seconds < CRASH.tear) tear(seconds, desktop);
    else collapse(Math.min(1, (seconds - CRASH.tear) / (CRASH.end - CRASH.tear)));
    texture.needsUpdate = true;
  };
  // The first boot after a short circuit, seconds in: it starts, stutters and tears, then gives up.
  const fail = (seconds) => {
    blank = false;
    if (seconds < FAIL.boot) draw(seconds);
    else if (seconds < FAIL.tear) tear(seconds, () => draw(FAIL.boot));
    else collapse(Math.min(1, (seconds - FAIL.tear) / (FAIL.end - FAIL.tear)));
    texture.needsUpdate = true;
  };
  clear();
  return { texture, draw: show, clear, click, reset, crash, fail, point, width, height };
}

// An open red metal tote toolbox: rolled rim, latches, tapered ends holding a carry bar with a rubber grip.
// Empty for now. Stands on y = 0, about .2 wide and .1 deep in the wardrobe's units.
function buildToolbox() {
  const toolbox = new THREE.Group();
  const add = (parent, geometry, material, x, y, z) => {
    const mesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ name: material }));
    mesh.position.set(x, y, z);
    parent.add(mesh);
    return mesh;
  };
  const box = (w, h, d) => new THREE.BoxGeometry(w, h, d);
  const rod = (radius, length, sides = 16) => new THREE.CylinderGeometry(radius, radius, length, sides);

  // Body: floor, front and back walls with a rolled rim, latches on the front.
  add(toolbox, box(.2, .006, .1), "inside", 0, .003, 0);
  for (const side of [-1, 1]) {
    add(toolbox, box(.188, .06, .006), "box", 0, .03, side * .047);
    add(toolbox, box(.19, .007, .011), "rim", 0, .061, side * .047);
  }
  for (const x of [-.06, .06]) add(toolbox, box(.014, .016, .004), "metal", x, .046, .052);
  // Tapered end walls carrying the bar.
  const end = new THREE.Shape([[-.05, 0], [.05, 0], [.022, .1], [-.022, .1]].map(([u, v]) => new THREE.Vector2(u, v)));
  const endGeometry = new THREE.ExtrudeGeometry(end, { depth: .008, bevelEnabled: false }).rotateY(Math.PI / 2).translate(-.004, 0, 0);
  for (const side of [-1, 1]) add(toolbox, side < 0 ? endGeometry : endGeometry.clone(), "box", side * .096, 0, 0);
  const bar = add(toolbox, rod(.005, .192), "metal", 0, .09, 0);
  bar.rotation.z = Math.PI / 2;
  add(bar, rod(.009, .08), "rubber", 0, 0, 0);

  // Empty for now; loose pieces added here, in the order of SPILL, fly out when the box is knocked over.
  return { toolbox, loose: [] };
}

// A coffee mug, standing on y = 0: hollow body, coffee near the rim, a handle on its right side.
function buildMug() {
  const mug = new THREE.Group();
  const add = (geometry, material, y = 0) => {
    const mesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ name: material, side: THREE.DoubleSide }));
    mesh.position.y = y;
    mug.add(mesh);
    return mesh;
  };
  const radius = .022, height = .05;
  add(new THREE.CylinderGeometry(radius, radius * .94, height, 24, 1, true), "mug", height / 2);
  add(new THREE.CircleGeometry(radius * .94, 24).rotateX(-Math.PI / 2), "mug", .001);
  add(new THREE.CircleGeometry(radius * .97, 24).rotateX(-Math.PI / 2), "coffee", height * .82).name = "coffee";
  const handle = add(new THREE.TorusGeometry(.012, .0035, 8, 16, Math.PI), "mug", height / 2);
  handle.rotation.z = -Math.PI / 2;
  handle.position.x = radius;
  return mug;
}

// A spilled coffee puddle: a flat blob with a wobbly outline, lying on y = 0, about .08 across.
function buildPuddle() {
  const points = [];
  for (let i = 0; i < 18; i++) {
    const angle = i / 18 * Math.PI * 2;
    const r = .034 * (1 + Math.sin(i * 2.7) * .18 + Math.cos(i * 1.3) * .1);
    points.push(new THREE.Vector2(Math.cos(angle) * r * 1.3, Math.sin(angle) * r));
  }
  const geometry = new THREE.ShapeGeometry(new THREE.Shape(points)).rotateX(-Math.PI / 2);
  return new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ name: "coffee" }));
}

// Office desk: a three-drawer pedestal on short feet on the left, two legs and a back rail on the right.
// Spans x 0 → .72, z -.38 → 0, top at y .384. Returns the desk and its drawers, each sliding out along +z.
function buildDesk() {
  const desk = new THREE.Group();
  const part = (parent, width, height, depth, material, x, y, z) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), new THREE.MeshStandardMaterial({ name: material }));
    mesh.position.set(x, y, z);
    parent.add(mesh);
    return mesh;
  };
  const top = .384, slab = .03, under = top - slab;
  part(desk, .72, slab, .38, "body", .36, top - slab / 2, -.19);

  // The pedestal stops short of the floor and stands on a short foot at each corner.
  const pedestal = { x: .125, width: .22, depth: .35, front: -.015, bottom: .06 };
  const pedestalHeight = under - pedestal.bottom;
  part(desk, pedestal.width, pedestalHeight, pedestal.depth, "body", pedestal.x, pedestal.bottom + pedestalHeight / 2, pedestal.front - pedestal.depth / 2);
  for (const x of [pedestal.x - pedestal.width / 2 + .0125, pedestal.x + pedestal.width / 2 - .0125]) {
    for (const z of [pedestal.front - .0125, pedestal.front - pedestal.depth + .0125]) part(desk, .025, pedestal.bottom, .025, "body", x, pedestal.bottom / 2, z);
  }
  for (const z of [-.03, -.35]) part(desk, .03, under, .03, "body", .69, under / 2, z);
  // Back and right-side panels closing the knee space below the top.
  part(desk, .44, .26, .015, "body", .455, under - .13, -.355);
  part(desk, .015, .26, .29, "body", .69, under - .13, -.19);

  // Each drawer: a front with a pull, and a tray hidden inside the pedestal until it slides out.
  const gap = .01, frontHeight = (pedestalHeight - gap * 4) / 3;
  const trayWidth = pedestal.width - .04, trayDepth = .26, trayHeight = frontHeight - .03;
  const drawers = [0, 1, 2].map((i) => {
    const drawer = new THREE.Group();
    drawer.position.set(pedestal.x, pedestal.bottom + gap + frontHeight / 2 + i * (frontHeight + gap), pedestal.front);
    part(drawer, pedestal.width - .02, frontHeight, .014, "body", 0, 0, .007);
    part(drawer, .06, .01, .012, "pull", 0, frontHeight / 2 - .025, .02);
    const floor = -frontHeight / 2 + .012;
    part(drawer, trayWidth, .006, trayDepth, "inside", 0, floor, -trayDepth / 2);
    for (const side of [-1, 1]) part(drawer, .006, trayHeight, trayDepth, "inside", side * trayWidth / 2, floor + trayHeight / 2, -trayDepth / 2);
    part(drawer, trayWidth, trayHeight, .006, "inside", 0, floor + trayHeight / 2, -trayDepth);
    desk.add(drawer);
    return drawer;
  });
  return { desk, drawers };
}

export function enableDeskRoom(host) {
  const canvas = document.createElement("canvas");
  canvas.className = "about-room-canvas";
  canvas.setAttribute("aria-hidden", "true");
  host.append(canvas);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(26, 1, 0.1, 50);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x7d8a99, 2.2));
  const sun = new THREE.DirectionalLight(0xffffff, 2.6);
  sun.position.set(1.2, 3, 2.2);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.radius = 6;
  // Pushes shadow lookups off the surface so the hidden faces at flush joins don't draw hairlines.
  sun.shadow.normalBias = .004;
  Object.assign(sun.shadow.camera, { left: -1.5, right: 1.5, top: 1.5, bottom: -1.5, near: .5, far: 8 });
  scene.add(sun);
  const fill = new THREE.DirectionalLight(0xb9d4ff, .9);
  fill.position.set(2, 1, 1);
  scene.add(fill);
  // A cool rim light from behind outlines the furniture against the pale page.
  const rim = new THREE.DirectionalLight(0xcfe0ff, 2.4);
  rim.position.set(-1.5, 1.8, -2.5);
  scene.add(rim);

  const pivot = new THREE.Group();
  scene.add(pivot);
  const room = new THREE.Group();
  pivot.add(room);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(6, 6), new THREE.ShadowMaterial({ color: 0x1c2321, opacity: .16 }));
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  room.add(floor);

  // Interactive parts: each has a spring driven between 0 (rest) and 1 (open / on).
  const parts = [];
  let radius = .8;
  let disposed = false;
  let frame = 0;
  let last = 0;


  // Thin dark strokes on the hard edges give an illustrated, technical-drawing look.
  const edgeMaterial = new THREE.LineBasicMaterial({ color: 0x1b2127, transparent: true, opacity: .32 });

  function recolour(object, overrides = {}) {
    const meshes = [];
    object.traverse((child) => { if (child.isMesh) meshes.push(child); });
    meshes.forEach((child) => {
      child.castShadow = true;
      child.receiveShadow = true;
      const source = Array.isArray(child.material) ? child.material : [child.material];
      const materials = source.map((material) => {
        const colour = overrides[material.name] ?? 0xc9d0d6;
        // Faces sit a hair behind their edge strokes so the lines never flicker into dashes.
        return new THREE.MeshStandardMaterial({ name: material.name, color: colour, side: material.side, roughness: 1, metalness: 0, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 });
      });
      child.material = Array.isArray(child.material) ? materials : materials[0];
      if (child.userData.noEdges) return;
      const edges = new THREE.LineSegments(new THREE.EdgesGeometry(child.geometry, 30), edgeMaterial);
      edges.raycast = () => {};
      child.add(edges);
    });
  }

  // A paper note taped near the top of a door's inner face, only seen once the door swings open.
  function addNote(door) {
    door.updateWorldMatrix(true, true);
    const box = new THREE.Box3().setFromObject(door);
    const min = door.worldToLocal(box.min.clone()), max = door.worldToLocal(box.max.clone());
    const width = Math.abs(max.x - min.x) * .68;
    const note = new THREE.Group();
    const paper = new THREE.Mesh(new THREE.PlaneGeometry(width, width * 1.15), new THREE.MeshStandardMaterial({ color: NOTE.paper, roughness: 1, side: THREE.DoubleSide }));
    const tape = new THREE.Mesh(new THREE.PlaneGeometry(width * .45, width * .14), new THREE.MeshStandardMaterial({ color: NOTE.tape, roughness: 1, side: THREE.DoubleSide }));
    tape.position.set(0, width * .575, .001);
    const outline = new THREE.LineSegments(new THREE.EdgesGeometry(paper.geometry), edgeMaterial);
    outline.raycast = () => {};
    paper.add(outline);
    paper.receiveShadow = tape.receiveShadow = true;
    note.add(paper, tape);
    // Inner face is the door's back (-z); the note faces inwards, slightly askew.
    const inner = Math.min(min.z, max.z) - .002;
    note.position.set((min.x + max.x) / 2, Math.max(min.y, max.y) - width * .9, inner);
    note.rotation.set(0, Math.PI, THREE.MathUtils.degToRad(-4));
    door.add(note);
  }

  function addPart(object, apply) {
    const part = { object, apply, state: spring() };
    object.traverse((child) => { if (child.isMesh) child.userData.part = part; });
    parts.push(part);
    return part;
  }

  const { desk, drawers } = buildDesk();
  const { cabinet, doorLeft, doorRight, outline } = buildCabinet();
  recolour(desk, DESK);
  recolour(cabinet, CABINET);
  const cabinetOutline = new THREE.LineSegments(outline, edgeMaterial);
  cabinetOutline.raycast = () => {};
  cabinet.add(cabinetOutline);
  // A toolbox on the bottom shelf, seen once the doors open.
  const { toolbox, loose } = buildToolbox();
  recolour(toolbox, TOOLBOX);
  // Right at the front edge of the shelf, just behind the closed doors: ready to fall.
  toolbox.position.set(.2, .116, -.105);
  toolbox.rotation.set(0, .18, 0, "YXZ");
  cabinet.add(toolbox);

  // Desk spans x 0 → .72, z -.38 → 0, top at y .384; the cabinet stands to its right.
  room.add(desk);
  cabinet.scale.setScalar(1.2);
  cabinet.position.set(.79, 0, -.02);
  room.add(cabinet);

  const computer = buildRetroComputer();
  recolour(computer, RETRO_PC);
  computer.position.set(.34, .384, -.25);
  room.add(computer);
  // The mug sits in a "tipper" group whose origin is the mug's bottom centre: the tipper turns to face the way the mug
  // falls and pitches over the bottom edge on that side, while the mug inside keeps its handle where it was.
  const mug = buildMug();
  recolour(mug, MUG);
  mug.scale.setScalar(1.35);
  const tipper = new THREE.Group();
  tipper.rotation.order = "YXZ";
  tipper.add(mug);
  room.add(tipper);
  const mugSpot = new THREE.Vector3(.63, .384, -.15), handleYaw = -.5;
  const mugRadius = .022 * 1.35, mugHeight = .05 * 1.35;
  // Falls forward, or, while the computer is on, towards its case.
  const fallYaw = { forward: handleYaw, computer: Math.atan2(-.16, -.05) };
  const mugEdge = new THREE.Vector3(0, 0, mugRadius), mugHinge = new THREE.Vector3(), mugOffset = new THREE.Vector3();
  let mugYaw = fallYaw.forward;
  const faceFall = (yaw) => {
    mugYaw = yaw;
    tipper.rotation.y = yaw;
    mug.rotation.y = handleYaw - yaw;
    mugHinge.set(Math.sin(yaw), 0, Math.cos(yaw)).multiplyScalar(mugRadius).add(mugSpot);
  };
  faceFall(fallYaw.forward);
  const puddle = buildPuddle();
  recolour(puddle, MUG);
  puddle.receiveShadow = true;
  puddle.castShadow = false;
  // Hidden and tiny until spilled, so it doesn't widen the room's bounds the camera is fitted to.
  puddle.visible = false;
  puddle.scale.setScalar(.001);
  puddle.userData.size = 1;
  room.add(puddle);
  // Lays the puddle out past where the rim lands; spilled towards the computer it runs on under the case.
  const placePuddle = () => {
    const towardsComputer = mugYaw === fallYaw.computer;
    const reach = mugHeight + (towardsComputer ? .03 : 0);
    puddle.position.set(Math.sin(mugYaw) * reach, .0008, Math.cos(mugYaw) * reach).add(mugHinge);
    puddle.rotation.y = mugYaw;
    puddle.userData.size = towardsComputer ? 1.4 : 1;
  };
  const coffee = mug.getObjectByName("coffee");
  // Once spilled, the coffee stays on the desk and the mug stays empty, even when it is stood back up.
  let spilled = false, placed = false;
  const mugPart = addPart(mug, (t) => {
    tipper.rotation.x = Math.PI / 2 * t;
    tipper.position.copy(mugHinge).sub(mugOffset.copy(mugEdge).applyEuler(tipper.rotation));
    const spread = spilled ? 1 : THREE.MathUtils.clamp((t - .7) / .3, 0, 1);
    if (spread > 0 && !placed) { placePuddle(); placed = true; }
    if (spread === 0 && !spilled) placed = false;
    if (spread === 1 && !spilled) {
      spilled = true;
      // Coffee in the computer: it cuts out.
      if (mugYaw === fallYaw.computer && screen.state.target === 1) shortCircuit();
    }
    coffee.visible = !spilled && t < .4;
    puddle.visible = spread > 0;
    puddle.scale.setScalar(Math.max(.001, spread) * puddle.userData.size);
  });
  mugPart.onToggle = (over) => { if (over) faceFall(screen.state.target === 1 && !spilled ? fallYaw.computer : fallYaw.forward); };
  const screenMaterial = computer.getObjectByName("screen").material;
  const screenOff = new THREE.Color(RETRO_PC.screen), screenOn = new THREE.Color(0xffffff);
  const display = createScreenDisplay();
  screenMaterial.map = screenMaterial.emissiveMap = display.texture;
  screenMaterial.needsUpdate = true;
  let bootStart = 0;
  const ledMaterial = computer.getObjectByName("led").material;
  const ledOff = new THREE.Color(RETRO_PC.led), ledOn = new THREE.Color(LED_ON);
  // Smoke puffs that rise from the front right of the case after a short circuit, drifting clear of the monitor.
  const smoke = Array.from({ length: SMOKE.puffs }, (_, i) => {
    const puff = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 0), new THREE.MeshStandardMaterial({ color: SMOKE.colour, transparent: true, depthWrite: false, flatShading: true }));
    puff.raycast = () => {};
    // Hidden and tiny until it puffs out, so it doesn't widen the room's bounds the camera is fitted to.
    puff.visible = false;
    puff.scale.setScalar(.001);
    puff.userData.drift = new THREE.Vector3(.04 + Math.sin(i * 2.3) * .03, 0, .02 + Math.cos(i * 1.7) * .02);
    computer.add(puff);
    return puff;
  });
  const poseSmoke = (seconds) => {
    smoke.forEach((puff, i) => {
      const u = (seconds - .25 - i * SMOKE.gap) / SMOKE.life;
      puff.visible = u > 0 && u < 1;
      if (!puff.visible) return;
      puff.position.set(.11, .07 + u * .18, .06).addScaledVector(puff.userData.drift, u);
      puff.scale.setScalar(.018 + u * .05);
      puff.rotation.set(u * 2, u * 3 + i, 0);
      puff.material.opacity = .9 * (1 - u) * Math.min(1, u * 6);
    });
  };
  const smokeEnd = .25 + (SMOKE.puffs - 1) * SMOKE.gap + SMOKE.life;
  // fried: shorted out and not yet tried again, so the next boot fails once. failing: that failed boot is playing.
  let crashStart = null, fried = false, failing = false;
  const screen = addPart(computer, (t) => {
    screenMaterial.color.lerpColors(screenOff, screenOn, t);
    screenMaterial.emissive.setScalar(t * .5);
    // The power LED glows red while the computer is on, and stutters while it shorts out or fails to boot.
    const stutter = (crashStart !== null || failing) && screen.state.target === 1 ? (Math.sin(performance.now() * .09) > 0 ? 1 : .15) : 1;
    ledMaterial.color.lerpColors(ledOff, ledOn, t * stutter);
    ledMaterial.emissive.copy(ledOn).multiplyScalar(t * stutter * .6);
    if (t < .02 && !screen.state.target) display.clear();
  });
  // Coffee in the case: the picture tears and collapses, the computer cuts out and smoke rises from it.
  const shortCircuit = () => { crashStart = performance.now(); fried = true; };
  // Each switch-on replays the boot; frames keep coming until the desktop is up. Right after a short circuit the
  // first try fails and cuts out; the next one works.
  screen.onToggle = (on) => {
    if (!on) { failing = false; return; }
    crashStart = null;
    poseSmoke(-1);
    failing = fried;
    fried = false;
    bootStart = performance.now();
    display.reset();
    display.draw(0);
  };
  const screenReady = () => screen.state.target === 1 && crashStart === null && !failing && performance.now() - bootStart >= BOOT.end * 1000;
  screen.busy = (now) => {
    if (crashStart !== null) {
      const seconds = (now - crashStart) / 1000;
      if (seconds < CRASH.end && screen.state.target === 1) display.crash(seconds);
      else screen.state.target = 0;
      poseSmoke(seconds);
      if (seconds < smokeEnd) return true;
      crashStart = null;
      return false;
    }
    if (!screen.state.target) return false;
    const seconds = (now - bootStart) / 1000;
    if (failing) {
      if (seconds < FAIL.end) { display.fail(seconds); return true; }
      failing = false;
      screen.state.target = 0;
      return false;
    }
    display.draw(seconds);
    return seconds < BOOT.end;
  };

  for (const drawer of drawers) {
    const rest = drawer.position.z;
    addPart(drawer, (t) => { drawer.position.z = rest + t * .16; });
  }
  addNote(doorLeft);
  addPart(cabinet, (t) => { doorLeft.rotation.y = -t * 1.9; doorRight.rotation.y = t * 1.9; });

  // Clicking the toolbox knocks it off the shelf edge: it tips over and drops, accelerating, lands on
  // its front with a little rock, and its contents fly out on arcs, spinning, before bouncing to rest around it.
  // Clicking again plays the same fall backwards, a bit faster, to tidy everything away.
  const spill = loose.map((object, i) => {
    const [x, y, z, yaw, lay] = SPILL[i];
    return {
      object,
      delay: FALL.scatter + i * .035,
      spin: new THREE.Vector3(Math.sin(i * 2.1), 1, Math.cos(i * 1.7)).normalize(),
      turns: i % 2 ? 1 : -1,
      home: { position: object.position.clone(), quaternion: object.quaternion.clone() },
      target: { position: new THREE.Vector3(x, y, z), quaternion: new THREE.Quaternion().setFromEuler(new THREE.Euler(lay ? Math.PI / 2 : 0, yaw, 0, "YXZ")) },
      start: null,
    };
  });
  // The box tips over its front bottom edge, which stays on the shelf lip at first, then falls with it to the floor.
  const frontEdge = new THREE.Vector3(0, 0, .05);
  const lip = toolbox.position.clone().add(frontEdge.clone().applyEuler(toolbox.rotation));
  const landed = new THREE.Euler(Math.PI / 2, toolbox.rotation.y, 0, "YXZ");
  const floorEdge = new THREE.Vector3(toolbox.position.x, .05, .06).add(frontEdge.clone().applyEuler(landed));
  const hinge = new THREE.Vector3(), offset = new THREE.Vector3();
  const spinQuaternion = new THREE.Quaternion();
  const easeIn = (u) => u * u;
  const easeOut = (u) => 1 - (1 - u) * (1 - u);
  const poseToolbox = (time) => {
    const drop = THREE.MathUtils.clamp(time / FALL.land, 0, 1);
    const settle = THREE.MathUtils.clamp((time - FALL.land) / (FALL.end - FALL.land), 0, 1);
    // Tipping a quarter turn around its front edge, which only leaves the lip late in the fall; on landing it rocks back a
    // little and settles.
    toolbox.rotation.x = Math.PI / 2 * easeIn(drop) - Math.sin(settle * Math.PI * 2) * .12 * (1 - settle);
    hinge.lerpVectors(lip, floorEdge, drop ** 3);
    toolbox.position.copy(hinge).sub(offset.copy(frontEdge).applyEuler(toolbox.rotation));
    toolbox.position.y += Math.sin(settle * Math.PI) * .012 * (1 - settle);
  };
  const posePiece = (piece, time) => {
    const flight = (time - piece.delay) / FALL.flight;
    if (flight <= 0) {
      if (piece.start && piece.object.parent !== toolbox) {
        toolbox.add(piece.object);
        piece.object.position.copy(piece.home.position);
        piece.object.quaternion.copy(piece.home.quaternion);
      }
      return;
    }
    if (piece.object.parent !== cabinet) {
      if (!piece.start) {
        // Where it leaves the box from: always the same moment of the fall, so it can be captured once.
        poseToolbox(piece.delay);
        toolbox.updateWorldMatrix(true, true);
        cabinet.attach(piece.object);
        piece.start = { position: piece.object.position.clone(), quaternion: piece.object.quaternion.clone() };
        poseToolbox(time);
      } else {
        cabinet.add(piece.object);
      }
    }
    const s = Math.min(1, flight);
    const along = easeOut(s);
    piece.object.position.lerpVectors(piece.start.position, piece.target.position, along);
    // An arc up and down, then two small bounces once on the floor.
    const bounce = Math.max(0, flight - 1) / .5;
    piece.object.position.y += s < 1 ? Math.sin(s * Math.PI) * .05 : Math.abs(Math.sin(Math.min(bounce, 1) * Math.PI * 2)) * .008 * (1 - Math.min(bounce, 1));
    piece.object.quaternion.slerpQuaternions(piece.start.quaternion, piece.target.quaternion, along);
    piece.object.quaternion.premultiply(spinQuaternion.setFromAxisAngle(piece.spin, piece.turns * Math.PI * 2 * (1 - along)));
  };
  let fallTime = 0, fallClock = null;
  const fall = addPart(toolbox, () => {});
  fall.busy = (now) => {
    const dt = fallClock === null ? 0 : Math.min(.05, (now - fallClock) / 1000);
    fallClock = now;
    const end = Math.max(FALL.end, (spill.at(-1)?.delay ?? 0) + FALL.flight * 1.5);
    const before = fallTime;
    fallTime = fall.state.target ? Math.min(end, fallTime + dt) : Math.max(0, fallTime - dt * 1.4);
    poseToolbox(fallTime);
    for (const piece of spill) posePiece(piece, fallTime);
    const moving = fallTime !== before || (fall.state.target ? fallTime < end : fallTime > 0);
    if (!moving) fallClock = null;
    return moving;
  };

  // The camera is fitted to the furniture alone, so props, spills and effects never change how big the room looks.
  const box = new THREE.Box3();
  for (const furniture of [desk, cabinet, computer]) box.expandByObject(furniture);
  const centre = box.getCenter(new THREE.Vector3());
  room.position.set(-centre.x, 0, -centre.z);
  pivot.position.y = -box.getSize(new THREE.Vector3()).y / 2;
  radius = box.getBoundingSphere(new THREE.Sphere()).radius;
  resize();
  host.classList.add("has-room");
  wake();

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();

  function pickHit(event) {
    const rect = canvas.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) return null;
    pointer.set(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1);
    raycaster.setFromCamera(pointer, camera);
    return raycaster.intersectObjects(room.children, true)[0] ?? null;
  }

  // The part under the pointer, if clicking there does something (once the computer is on, its monitor frame does
  // nothing and its screen only reacts once booted).
  function pick(event) {
    const object = pickHit(event)?.object;
    const on = screen.state.target === 1;
    if (!object || (on && object.userData.monitor) || (on && object.name === "screen" && !screenReady())) return null;
    return object.userData.part ?? null;
  }

  const events = new AbortController();
  const options = { signal: events.signal };
  // The canvas lets clicks through (it overflows onto the text column), so the page listens instead and only acts
  // when the pointer is over a piece of the room; links and buttons keep their own clicks.
  const onControl = (event) => event.target instanceof Element && event.target.closest("a, button, input, .project-dock");
  const pointing = (on) => document.documentElement.classList.toggle("is-pointing-room", on);
  document.addEventListener("pointermove", (event) => {
    pointing(!onControl(event) && Boolean(pick(event)));
    // Once the desktop is up, its pointer follows the visitor's mouse: exactly under it over the screen, and anywhere
    // else on the page as if the browser window were that screen.
    // Over the screen the real pointer is hidden, so it seems to turn into the desktop's one.
    const hit = screenReady() ? pickHit(event) : null;
    const onScreen = !onControl(event) && hit?.object.name === "screen" && Boolean(hit.uv);
    document.documentElement.classList.toggle("is-on-room-screen", onScreen);
    if (!screenReady()) return;
    if (onScreen) display.point(hit.uv.x, 1 - hit.uv.y);
    else display.point(event.clientX / window.innerWidth, event.clientY / window.innerHeight);
    wake();
  }, options);
  document.addEventListener("click", (event) => {
    if (onControl(event)) return;
    const hit = pickHit(event);
    const part = hit?.object.userData.part;
    if (!part) return;
    // Any part of the computer switches it on, but only the case switches it off: once on, the monitor's frame does
    // nothing and its screen is for the desktop.
    const monitor = hit.object.userData.monitor || hit.object.name === "screen";
    if (monitor && part === screen && screen.state.target === 1) {
      if (hit.object.userData.monitor) return;
      if (screenReady() && hit.uv) display.click(hit.uv.x * display.width, (1 - hit.uv.y) * display.height);
      wake();
      return;
    }
    part.state.target = part.state.target ? 0 : 1;
    part.onToggle?.(part.state.target === 1);
    wake();
  }, options);

  function resize() {
    // The canvas overflows its frame (see .about-room-canvas) so things can fall or spill past the frame's edges;
    // the camera still frames the room in the frame and renders the overflow around it.
    const frameWidth = host.clientWidth, frameHeight = host.clientHeight;
    const width = canvas.clientWidth, height = canvas.clientHeight;
    if (!width || !height || !frameWidth || !frameHeight) return;
    renderer.setSize(width, height, false);
    camera.aspect = frameWidth / frameHeight;
    camera.setViewOffset(frameWidth, frameHeight, canvas.offsetLeft, canvas.offsetTop, width, height);
    // Keep the whole room in view whatever the frame's shape: fit its bounding sphere to the narrower field of view.
    const vertical = THREE.MathUtils.degToRad(camera.fov) / 2;
    const horizontal = Math.atan(Math.tan(vertical) * camera.aspect);
    const distance = radius * .84 / Math.sin(Math.min(vertical, horizontal));
    camera.position.set(Math.sin(VIEW_AZIMUTH) * Math.cos(VIEW_ELEVATION) * distance, Math.sin(VIEW_ELEVATION) * distance, Math.cos(VIEW_AZIMUTH) * Math.cos(VIEW_ELEVATION) * distance);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
    wake();
  }

  const observer = new ResizeObserver(resize);
  observer.observe(canvas);

  function tick(now) {
    frame = 0;
    const dt = Math.min(.033, last ? (now - last) / 1000 : .016);
    last = now;
    let moving = false;
    for (const part of parts) {
      moving |= stepSpring(part.state, dt);
      if (part.busy?.(now)) moving = true;
      part.apply(part.state.value);
    }
    renderer.render(scene, camera);
    if (moving && !disposed) wake();
    else last = 0;
  }

  function wake() {
    if (!frame && !disposed) frame = requestAnimationFrame(tick);
  }

  return () => {
    disposed = true;
    cancelAnimationFrame(frame);
    events.abort();
    pointing(false);
    document.documentElement.classList.remove("is-on-room-screen");
    observer.disconnect();
    scene.traverse((child) => {
      if (!child.isMesh && !child.isLineSegments) return;
      child.geometry.dispose();
      (Array.isArray(child.material) ? child.material : [child.material]).forEach((m) => { m.map?.dispose(); m.dispose(); });
    });
    renderer.dispose();
    canvas.remove();
  };
}
