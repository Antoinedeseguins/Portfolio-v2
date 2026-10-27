import * as THREE from "../vendor/three.module.js";
import { GLTFLoader } from "../vendor/GLTFLoader.js";

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
const RETRO_PC = { case: 0xd3d9de, caseShade: 0xb3bcc4, slot: 0x2b333b, screen: 0x1d2227, led: 0x2b333b, postIt: 0xf3d34a };
const LED_ON = 0xe0392f;
// The computer's power LED once on: a vivid red that glows.
const PC_LED_ON = { colour: 0xff2414, glow: 1.4 };
// The boot sequence and desktop on the CRT.
const SCREEN = {
  black: "#0d1013", flash: "#e8f2ff", boot: "#10161d", bar: "#f2f6fa", barTrack: "#26313c",
  glyphs: "#f2f6fa", fringeRed: "#e0392f", fringeCyan: "#3fd0e0", desktop: "#2f7f86", icon: "#f2f4f6", iconLabel: "#cfe6e8",
  taskbar: "#c9d0d6", start: "#4caf6a", cursor: "#ffffff", page: "#ffffff", close: "#e05a4f",
};
// The coffee mug on the desk: white, in the site's light grey, full of coffee.
const MUG = { mug: 0xeef1f3, coffee: 0x4a2e22 };
// Classic cube colours, matched to the scene's existing reds, yellows and blues; the core shows between the cubies.
const RUBIK = { white: 0xeef1f3, yellow: 0xf3d34a, red: 0xc8453b, orange: 0xe8833a, blue: 0x4a86c8, green: 0x49a868, core: 0x2b333b };
// The note on the door: blank paper held by blue tape. Slam the doors enough times in a row (clicks within seconds)
// and the tape gives: the note flutters down to the floor (in seconds), showing a hole knocked through the door
// behind it (splintered rim, dark inside) with a small golden key hidden in it.
const NOTE = { paper: 0xf4f5f2, tape: 0x9cbbe0, slams: 6, within: 2.5, fall: 1.8 };
// The key glows: its light colour and strength.
const HOLE = { rim: 0x5f6873, dark: 0x15191d, key: 0xf2c443, glow: 0xffc634, shine: 1.2 };
// Zelda's row of hearts on the door, in pixel art: dark outline, red fill with a white glint, and the used-up ones
// left as dark empty containers. Five hearts, a heart and a half of them full at first (counted in half hearts). Once
// all full, a pale gleam runs along them laps times, flourish seconds each.
const HEARTS = {
  outline: "#2a1416", fill: "#e0303a", glint: "#ffffff", empty: "#5a4a4c", gleam: "#ffc2c6",
  count: 5, startHalves: 3, flourish: .7, laps: 3,
};
// Stickers on the wardrobe door, under the note, all painted on canvases: Team Vitality's bee, Counter-Strike's logo
// and Twitch's. Each has a white die-cut backing with a cut line in the shade the edge strokes give the wardrobe.
// They have seen some life: a corner may have come unstuck and folded back over (how far it stands off the sticker, how
// far in the fold runs as a share of the sticker, and how far over it turns, in degrees), and they are a little faded,
// scuffed, grimy and nicked at the edges. A holo one's rainbow: how strongly it glows, how many bands cross it, and how
// fast they slide as the angle changes.
const STICKERS = {
  cutBacking: "#f4f5f2", cutLine: "#5e6771",
  peel: .0004, peelFrom: .14, fold: 160,
  holo: .22, holoBands: 1.2, holoShift: 3,
  fade: .1, scuffs: 7, scuff: "rgba(255, 255, 255, .45)", grime: "rgba(90, 80, 60, .07)", nicks: 6,
};
// The e-sport pass on its lanyard: Vitality-yellow strap, steel clip, dark magnet, white card; sizes in note widths
// (strap width, card width and height, how far the clip hangs below the magnet) and thickness in door units; the
// card's print; and its sway: spring stiffness and damping, how hard a jolt of the door and a click push it, and the
// top speed clicks can give it (in clicks).
const LANYARD = {
  strap: 0xf2d22e, clip: 0xc9d0d6, magnet: 0x2b333b, card: 0xf4f5f2,
  print: { paper: "#f4f5f2", band: "#f2d22e", photo: "#9aa3ad", ink: "#5e6771" },
  strapWidth: .04, cardSize: [.28, .4], drop: .5, depth: .0012,
  stiffness: 30, damping: 1.6, kick: .25, flick: 1.6, flickCap: 1.5,
};
// The original Game Boy: warm grey case, dark bezel round a pea-green screen, dark power LED (red once on), black
// D-pad, magenta A and B, grey Start and Select.
const GAMEBOY = { case: 0xcdcfc8, bezel: 0x585d6a, screen: 0x9aa84a, led: 0x4a2b2b, dpad: 0x2b333b, button: 0xa3285e, pill: 0x8d939a };
// Switched on, its screen shows the boot: the Nintendo logo slides down from the top and stops in the middle. In the
// Game Boy's own four greens, at its 160 × 144 resolution; times in seconds.
const GAMEBOY_BOOT = { lightest: "#9bbc0f", darkest: "#0f380f", slide: 1.4, end: 1.6 };
// Game Boy cartridges beside it: Pokémon Red and Blue in their coloured plastic, and a plain grey one. Each has a
// lighter label and darker grip ridges.
const CARTRIDGES = {
  red: { shell: 0xc8453b, label: 0xe57a6f, ridge: 0x8f2f28 },
  blue: { shell: 0x4a86c8, label: 0x86b0e0, ridge: 0x2f5e93 },
  grey: { shell: 0xb9bdb6, label: 0xe5e7e2, ridge: 0x8d939a },
};
// The Nomai mask from Outer Wilds, in its in-game colours: pale grey face, mid-grey frames, silver arms banded in darker
// grey with gold edges and dots, and yellow eyes with a dark core; its stand matches the desk.
const NOMAI = { frame: 0x9ea4ab, face: 0xdde0e3, arm: 0xbcc1c7, band: 0x868c94, gold: 0xc9a64a, eye: 0xe0bf4a, pupil: 0x2b333b, stand: 0x3a4148 };
// The rubber duck of rubber-duck debugging: yellow body and head, orange beak, black eyes. A click squeezes it: it
// squashes and hops (times in seconds). Its outline: colour and thickness in desk units.
const DUCK = { body: 0xf3d34a, beak: 0xe8833a, eye: 0x1d2126, outline: 0x2b333b, line: .0012, squeeze: .14, hop: .36 };
// Mario's ? block: golden body, white question mark with a brown drop shadow, brown rivets in the corners.
const QUESTION_BLOCK = { body: 0xf0ad2e, mark: 0xf7f4ea, shadow: 0x8a5420, rivet: 0x8a5420 };
// Portal's Companion Cube: dark core, light corner bumpers and edge handles, pale face plates with pink hearts.
const COMPANION_CUBE = { core: 0x5e6771, bumper: 0xd3d9de, handle: 0xc9d0d6, plate: 0xe5e8eb, heart: 0xe8749e };
// WoW's hearthstone: grey stone close to the wardrobe's slate, a little lighter, on a plinth matching the desk; its
// outline's colour and how much bigger than the stone it is; its rune's teal blue (picked from the game's icon) and
// glow, its thin darker rim (width as a share of the picture), and the rune picture's middle and width in the stone's
// own units.
const HEARTHSTONE = {
  stone: 0x9ea7b0, plinth: 0x3a4148, outline: 0x5d666f, hull: 1.025,
  rune: 0x2fa6cc, glow: .5, runeRim: 0x14566b, runeRimWidth: .016, runeCentre: [0, 0], runeSize: 2,
};
// The cube's trip through a pair of portals, in seconds: both open, it drops into the first, shoots out of the second
// (on the back wall above), then they close. Portals: glowing rim and paler inside, radius across and along.
const PORTAL_TRIP = { open: .3, fall: .35, fly: .4, close: .35 };
const PORTALS = { blue: { rim: 0x2f8cff, inside: 0xb5dcff }, orange: { rim: 0xff8a1a, inside: 0xffd6aa }, across: .056, along: .073 };
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
  const screen = part(new THREE.BoxGeometry(.29, .225, .004), "screen", 0, .24, .041);
  screen.name = "screen";
  // A yellow sticky note on the right of the monitor frame, overhanging its edge a little. It stands just clear of
  // the frame and the glass so neither shows through it.
  const postIt = part(new THREE.BoxGeometry(.06, .06, .002), "postIt", .158, .31, .0445);
  postIt.rotation.z = THREE.MathUtils.degToRad(-7);
  postIt.userData.monitor = true;

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

// A solved Rubik's cube standing on y = 0, .042 across: 27 cubies coloured on their outer faces, all layers aligned.
// White up, green front, red right.
function buildRubiksCube() {
  const cube = new THREE.Group();
  const size = .042, step = size / 3, gap = .0007;
  // Face order is BoxGeometry's: +x, -x, +y, -y, +z, -z.
  const normals = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
  const colours = ["red", "orange", "white", "yellow", "green", "blue"];
  const geometry = new THREE.BoxGeometry(step - gap, step - gap, step - gap);
  for (const x of [-1, 0, 1]) for (const y of [-1, 0, 1]) for (const z of [-1, 0, 1]) {
    const position = [x, y, z];
    const faces = normals.map((normal, face) => normal.some((n, axis) => n && n === position[axis]) ? colours[face] : "core");
    const cubie = new THREE.Mesh(geometry, faces.map((name) => new THREE.MeshStandardMaterial({ name })));
    cubie.position.set(x * step, y * step + size / 2, z * step);
    cube.add(cubie);
  }
  return cube;
}

// The original Game Boy, lying on its back on y = 0 with the screen end towards -z: .066 wide, .109 long, .018 thick
// (the Rubik's cube's scale). Drawn in centimetres on its front face, with the big rounded corner bottom right.
function buildGameBoy() {
  const front = new THREE.Group();
  const add = (geometry, material, x, y, z, turn = 0) => {
    const mesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ name: material }));
    mesh.position.set(x, y, z);
    mesh.rotation.z = turn;
    front.add(mesh);
    return mesh;
  };
  // A rectangle with rounded corners, the bottom right one possibly rounder, extruded towards +z.
  const plate = (width, height, depth, radius, bottomRight = radius) => {
    const shape = new THREE.Shape();
    shape.moveTo(radius, 0);
    shape.lineTo(width - bottomRight, 0);
    shape.absarc(width - bottomRight, bottomRight, bottomRight, -Math.PI / 2, 0, false);
    shape.lineTo(width, height - radius);
    shape.absarc(width - radius, height - radius, radius, 0, Math.PI / 2, false);
    shape.lineTo(radius, height);
    shape.absarc(radius, height - radius, radius, Math.PI / 2, Math.PI, false);
    shape.lineTo(0, radius);
    shape.absarc(radius, radius, radius, Math.PI, Math.PI * 1.5, false);
    return new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false, curveSegments: 12 }).translate(-width / 2, -height / 2, 0);
  };
  const disc = (radius, depth) => new THREE.CylinderGeometry(radius, radius, depth, 20).rotateX(Math.PI / 2).translate(0, 0, depth / 2);
  const box = (width, height, depth) => new THREE.BoxGeometry(width, height, depth).translate(0, 0, depth / 2);

  const thick = 2.4;
  add(plate(9, 14.8, thick, .4, 2.2), "case", 4.5, 7.4, 0);
  add(plate(7.2, 6, .1, .3, 1.2), "bezel", 4.5, 10.6, thick);
  add(box(4.8, 4.3, .05), "screen", 4.5, 10.55, thick + .1).name = "gameBoyScreen";
  add(disc(.15, .1), "led", 1.4, 11.2, thick + .1).name = "gameBoyLed";
  for (const turn of [0, Math.PI / 2]) add(box(2, .65, .3), "dpad", 2.2, 4.9, thick, turn);
  add(disc(.55, .3), "button", 7.4, 5.6, thick);
  add(disc(.55, .3), "button", 5.9, 4.9, thick);
  for (const x of [3.6, 5.1]) add(plate(1, .3, .15, .15), "pill", x, 2.4, thick, .45);

  // Laid on its back: the front faces up and its top end points away, into -z.
  const gameBoy = new THREE.Group();
  front.scale.setScalar(.0074);
  front.rotation.x = -Math.PI / 2;
  gameBoy.add(front);
  return gameBoy;
}

// A Game Boy cartridge lying on its back on y = 0, label up and its grip end towards -z: .042 wide, .048 long, .006
// thick, at the Game Boy's scale. Drawn in centimetres on its front face.
function buildCartridge() {
  const front = new THREE.Group();
  const add = (width, height, depth, material, y, z) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth).translate(0, 0, depth / 2), new THREE.MeshStandardMaterial({ name: material }));
    mesh.position.set(0, y, z);
    front.add(mesh);
    return mesh;
  };
  const thick = .8;
  add(5.7, 6.5, thick, "shell", 0, 0);
  add(4.4, 3.8, .05, "label", -.5, thick);
  for (let i = 0; i < 4; i++) add(4.4, .12, .05, "ridge", 2.1 + i * .3, thick).userData.noEdges = true;

  const cartridge = new THREE.Group();
  front.scale.setScalar(.0074);
  front.rotation.x = -Math.PI / 2;
  cartridge.add(front);
  return cartridge;
}

// A rubber duck sitting on y = 0, facing +z, about .045 tall: a plump body, a round head over its front, a flat beak,
// two eyes and a tail tipped up behind.
function buildRubberDuck() {
  const duck = new THREE.Group();
  const add = (geometry, material, x, y, z) => {
    const mesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ name: material }));
    mesh.position.set(x, y, z);
    duck.add(mesh);
    return mesh;
  };
  add(new THREE.SphereGeometry(.02, 28, 18), "body", 0, .016, 0).scale.set(1, .8, 1.3);
  add(new THREE.ConeGeometry(.008, .016, 16), "body", 0, .024, -.023).rotation.x = -.85;
  add(new THREE.SphereGeometry(.013, 28, 18), "body", 0, .037, .011);
  add(new THREE.SphereGeometry(.0075, 20, 12), "beak", 0, .034, .024).scale.set(1.15, .42, 1.25);
  for (const side of [-1, 1]) {
    // Too small for edge strokes to read as anything but smudges.
    add(new THREE.SphereGeometry(.0022, 10, 8), "eye", side * .0068, .041, .0205).userData.noEdges = true;
  }
  return duck;
}

// Mario's ? block, standing on y = 0, .12 across: on each side a pixel-art question mark with its drop shadow and a
// rivet in each corner.
function buildQuestionBlock() {
  const block = new THREE.Group();
  const size = .12;
  const add = (geometry, material, parent = block) => {
    const mesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ name: material }));
    parent.add(mesh);
    return mesh;
  };
  add(new THREE.BoxGeometry(size, size, size).translate(0, size / 2, 0), "body");

  // The question mark on a grid of 6 × 9 pixels, its hook traced as one outline so no joins draw lines across it.
  const pixel = .0085;
  const polygon = (points) => new THREE.Shape(points.map(([x, y]) => new THREE.Vector2((x - 3) * pixel, (y - 4.5) * pixel)));
  const hook = polygon([
    [1, 9], [5, 9], [5, 8], [6, 8], [6, 6], [5, 6], [5, 5], [4, 5], [4, 3], [2, 3], [2, 5], [3, 5], [3, 6], [4, 6],
    [4, 8], [2, 8], [2, 6], [0, 6], [0, 8], [1, 8],
  ]);
  const dot = polygon([[2, 0], [4, 0], [4, 2], [2, 2]]);
  const extrude = (shape, depth) => new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false });
  const rivet = new THREE.BoxGeometry(.011, .011, .003).translate(0, 0, .0015);
  for (let i = 0; i < 4; i++) {
    const face = new THREE.Group();
    face.rotation.y = i * Math.PI / 2;
    face.position.y = size / 2;
    block.add(face);
    const front = new THREE.Group();
    front.position.z = size / 2;
    face.add(front);
    for (const shape of [hook, dot]) {
      // The shadow sits one pixel down and right, flatter, so the mark stands in front of it.
      const shadow = add(extrude(shape, .002), "shadow", front);
      shadow.position.set(pixel * .8, -pixel * .8, 0);
      add(extrude(shape, .004), "mark", front);
    }
    const inset = size / 2 - .014;
    for (const [x, y] of [[-1, 1], [1, 1], [-1, -1], [1, -1]]) add(rivet, "rivet", front).position.set(x * inset, y * inset, 0);
  }
  return block;
}

// WoW's hearthstone, after the game's icon: a thick oval pebble like a puck, a little narrower at one end (+y), its
// broad face towards +z. Rounded all over rather than cut: a sphere pushed out towards a rounded box (its faces flatten,
// its rim stays round), in a few flat facets so it still reads as worked stone, its rim a little uneven. About 2.5
// tall, 1.9 wide and 1 thick, centred on its middle.
function buildHearthstone() {
  // Poles at the middle of each face, so the faces are rings round their centre.
  const geometry = new THREE.SphereGeometry(1, 20, 12).rotateX(Math.PI / 2).toNonIndexed();
  const position = geometry.attributes.position;
  const flatten = .6;
  const pushed = (value) => Math.sign(value) * Math.abs(value) ** flatten;
  for (let i = 0; i < position.count; i++) {
    const x = position.getX(i), y = position.getY(i), z = position.getZ(i);
    const reach = pushed(Math.hypot(x, y)), angle = Math.atan2(y, x);
    const along = Math.cos(angle), up = Math.sin(angle);
    // The rim pushed in or out a little, the same way wherever faces meet.
    const noise = Math.sin(Math.round(along * 1000) * 12.9898 + Math.round(up * 1000) * 78.233) * 43758.5453;
    const chip = 1 + (noise - Math.floor(noise) - .5) * .06;
    // The top half reaches a little further and narrows, the bottom half is fuller.
    const width = .95 * (up > 0 ? 1 - .2 * up : 1) * chip, height = (up > 0 ? 1.3 : 1.15) * chip;
    position.setXYZ(i, along * reach * width, up * reach * height, pushed(z) * .5);
  }
  geometry.computeVertexNormals();
  const stone = new THREE.Group();
  stone.add(new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ name: "stone" })));
  return stone;
}

// A portal lying flat on a surface, facing up, drawn like the game's: through it, the view from its twin (a picture
// of the screen the size of the canvas, set as `view`, once `through` is 1), else a pale inside shading to the
// portal's colour with a slow swirl; a bright rim (white-hot at its core) whose edge ripples all the time, its colour
// bleeding a little into the view; and a soft halo fading out round it. Unlit, so it shines. Radius 1 (the halo
// reaches past it); scaled to size, and to nothing while closed. Its `time` uniform is moved on by whoever animates it.
function buildPortal({ rim, inside }) {
  const material = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: {
      time: { value: 0 }, rim: { value: new THREE.Color(rim) }, inside: { value: new THREE.Color(inside) },
      view: { value: null }, through: { value: 0 }, screen: { value: new THREE.Vector2(1, 1) },
    },
    vertexShader: `
      varying vec2 vPoint;
      void main() {
        // Laid flat, the plane's own across and along are x and z.
        vPoint = position.xz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }`,
    fragmentShader: `
      uniform float time;
      uniform vec3 rim;
      uniform vec3 inside;
      uniform sampler2D view;
      uniform float through;
      uniform vec2 screen;
      varying vec2 vPoint;
      void main() {
        float angle = atan(vPoint.y, vPoint.x);
        // The edge ripples: a few waves of different sizes running round it.
        float edge = 1.0 + .035 * sin(angle * 6.0 + time * 3.1) + .02 * sin(angle * 11.0 - time * 4.7) + .012 * sin(angle * 19.0 + time * 7.3);
        float r = length(vPoint) / edge;
        vec3 colour;
        float alpha;
        if (r < 1.0) {
          float swirl = .5 + .5 * sin(r * 9.0 - time * 2.4 + angle * 2.0);
          colour = mix(inside, rim, smoothstep(.15, 1.0, r) * .85 + swirl * .1);
          if (through > .5) {
            // The far side, where it has anything; the portal's own inside where it shows only empty sky.
            vec4 far = texture2D(view, gl_FragCoord.xy / screen);
            colour = mix(mix(inside, far.rgb, far.a), rim, smoothstep(.55, 1.0, r) * .7);
          }
          alpha = .92 + .08 * through;
        } else {
          colour = rim;
          alpha = .55 * exp(-(r - 1.0) / .12);
        }
        // The rim: a narrow bright band, white-hot in its middle.
        float band = exp(-pow((r - 1.0) / .07, 2.0));
        colour = mix(colour, mix(rim, vec3(1.0), .55 * band), band);
        alpha = max(alpha, band);
        gl_FragColor = vec4(colour, alpha);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
  const portal = new THREE.Mesh(new THREE.PlaneGeometry(2.8, 2.8).rotateX(-Math.PI / 2), material);
  portal.raycast = () => {};
  portal.scale.setScalar(0);
  portal.visible = false;
  return portal;
}

// Names the pieces of the Companion Cube model (2 across, centred on the origin) by their shape, for recolour: the
// core, a thin round plate on each face, a bumper on each corner and a handle along each edge. The hearts are only
// in the model's texture, so each plate gets one in relief.
function paintCompanionCube(model) {
  model.updateMatrixWorld(true);
  const box = new THREE.Box3(), size = new THREE.Vector3(), centre = new THREE.Vector3();
  const plates = [];
  model.traverse((child) => {
    if (!child.isMesh) return;
    box.setFromObject(child).getSize(size);
    const thinnest = Math.min(size.x, size.y, size.z);
    const name = size.x > 1.5 ? "core" : thinnest < .15 ? "plate" : thinnest > .6 ? "bumper" : "handle";
    child.material = new THREE.MeshStandardMaterial({ name });
    if (name !== "plate") return;
    // The plate's outward direction is its thin axis, on the side of the cube it sits.
    box.getCenter(centre);
    const axis = ["x", "y", "z"].find((a) => size[a] === thinnest);
    const normal = new THREE.Vector3();
    normal[axis] = Math.sign(centre[axis]);
    plates.push({ outer: centre.clone().setComponent("xyz".indexOf(axis), box[normal[axis] > 0 ? "max" : "min"][axis]), normal });
  });
  // The heart traced from the classic parametric curve, standing on the plate.
  const heartWidth = .42;
  const points = [];
  for (let i = 0; i < 48; i++) {
    const t = i / 48 * Math.PI * 2;
    const x = 16 * Math.sin(t) ** 3, y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
    points.push(new THREE.Vector2(x / 32 * heartWidth, (y + 2.5) / 32 * heartWidth));
  }
  const heart = new THREE.ExtrudeGeometry(new THREE.Shape(points), { depth: .025, bevelEnabled: false });
  for (const { outer, normal } of plates) {
    const mesh = new THREE.Mesh(heart, new THREE.MeshStandardMaterial({ name: "heart" }));
    // Point up on the sides; on the top and bottom, towards the back.
    mesh.up.set(0, normal.y ? 0 : 1, normal.y ? -1 : 0);
    mesh.position.copy(outer);
    mesh.lookAt(outer.clone().add(normal));
    model.add(mesh);
  }
}

// The Nomai mask from Outer Wilds: a diamond face with three diamond eyes and a chin with a nose down it, ringed by
// hooked arms (two horns, two side brackets, two bottom arms). Built flat in a plane facing +z, about 1 across and
// centred on the origin, with its back on z = 0.
function buildNomaiMask() {
  const mask = new THREE.Group();
  const slab = (shape, depth, material, z = 0) => {
    const geometry = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false, curveSegments: 20 });
    const mesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ name: material }));
    mesh.position.z = z;
    mask.add(mesh);
    return mesh;
  };
  const polygon = (points) => new THREE.Shape(points.map(([x, y]) => new THREE.Vector2(x, y)));
  const diamond = (x, y, r) => polygon([[x, y + r], [x - r, y], [x, y - r], [x + r, y]]);

  // The two sides of a band of the given width along a polyline, with mitred corners: the one on the left of the
  // direction of travel first.
  const bandSides = (points, width) => {
    const normal = ([ax, ay], [bx, by]) => {
      const length = Math.hypot(bx - ax, by - ay);
      return [-(by - ay) / length, (bx - ax) / length];
    };
    const left = [], right = [];
    points.forEach((point, i) => {
      const before = normal(points[Math.max(0, i - 1)], points[Math.max(1, i)]);
      const after = normal(points[Math.min(i, points.length - 2)], points[Math.min(i + 1, points.length - 1)]);
      const mx = before[0] + after[0], my = before[1] + after[1], length = Math.hypot(mx, my);
      const reach = width / 2 / ((mx * after[0] + my * after[1]) / length);
      left.push([point[0] + mx / length * reach, point[1] + my / length * reach]);
      right.push([point[0] - mx / length * reach, point[1] - my / length * reach]);
    });
    return [left, right];
  };

  // A closed outline (counter-clockwise) pushed out by the same distance along every side, with mitred corners.
  const outset = (points, distance) => points.map((point, i) => {
    const previous = points[(i + points.length - 1) % points.length], next = points[(i + 1) % points.length];
    const outward = ([ax, ay], [bx, by]) => {
      const length = Math.hypot(bx - ax, by - ay);
      return [(by - ay) / length, -(bx - ax) / length];
    };
    const before = outward(previous, point), after = outward(point, next);
    const mx = before[0] + after[0], my = before[1] + after[1], length = Math.hypot(mx, my);
    const reach = distance / ((mx * after[0] + my * after[1]) / length);
    return [point[0] + mx / length * reach, point[1] + my / length * reach];
  });
  // The face (drawn after the arms): a raised diamond whose lower half runs on into a chin narrowing downwards, on a
  // backing of the same outline whose rim shows all round it. Both end on their right corner.
  const face = [[0, .27], [-.25, .02], [-.11, -.12], [-.07, -.29], [.07, -.29], [.11, -.12], [.25, .02]];
  const backing = outset(face, .035);

  // The arms, mirrored left and right, sit just behind the face, which covers the ends that reach into it. Their
  // outer parts, apart from the bottom arms, are sections of one ring, cut apart between the pieces.
  // Each horn rises from a post beside the top corner, follows the ring down and ends in a hook turned inwards.
  // Each side bracket is one piece: a short top bar turned in, the ring down the side, and a
  // diagonal from the face's side corner merging into the ring above the bracket's foot.
  // Each bottom arm leaves the face's lower edge and bends in to meet its twin under the chin (see below).
  const ring = { inner: .41, outer: .48 };
  const degrees = THREE.MathUtils.degToRad;
  const onRing = (radius, from, to, steps = 8) => Array.from({ length: steps + 1 }, (_, i) => {
    const angle = degrees(from + (steps ? (to - from) * i / steps : 0));
    return [Math.cos(angle) * radius, Math.sin(angle) * radius];
  });
  for (const side of [1, -1]) {
    const mirror = (shape) => side > 0 ? shape : polygon(shape.getPoints().map(({ x, y }) => [-x, y]).reverse());
    const angleAt = (radius, y) => Math.asin(y / radius) * 180 / Math.PI;
    // The horn ends 30° above the horizontal, cut square across the ring, with the same spur as the bottom arms turned in at
    // its end, its back sloping into the ring. The end face runs straight on into the spur's front, so their shared
    // corner is left out (see the bottom arm).
    const post = { left: .035, right: .105 }, hornEnd = 30, spur = { height: .035, width: .035 };
    // Pointing in to the centre at the horn's end, and back up along the ring.
    const inwards = [-Math.cos(degrees(hornEnd)), -Math.sin(degrees(hornEnd))], upRing = [inwards[1], -inwards[0]];
    const [hornEndInside] = onRing(ring.inner, hornEnd, hornEnd, 0);
    const hornSpurTop = [hornEndInside[0] + inwards[0] * spur.height, hornEndInside[1] + inwards[1] * spur.height];
    const hornSpurBack = hornEnd + (spur.width + spur.height) / ring.inner * 180 / Math.PI;
    slab(mirror(polygon([
      [post.left, .2], ...onRing(ring.outer, 90 - angleAt(ring.outer, post.left), hornEnd),
      hornSpurTop, [hornSpurTop[0] + upRing[0] * spur.width, hornSpurTop[1] + upRing[1] * spur.width],
      ...onRing(ring.inner, hornSpurBack, 90 - angleAt(ring.inner, post.right), 6), [post.right, .2],
    ])), .035, "arm");
    // The side bracket's diagonal carries the face's upper edge on past its side corner, at 45°; the bottom arm runs
    // parallel just below it, past a cut that goes on through the ring. Both leave the face flush with its lower edge.
    const direction = [Math.SQRT1_2, -Math.SQRT1_2], down = [-Math.SQRT1_2, -Math.SQRT1_2];
    const corner = backing[backing.length - 1];
    const below = (distance) => [corner[0] + down[0] * distance, corner[1] + down[1] * distance];
    // Where the 45° line from a point inside the ring crosses the circle of that radius.
    const crossing = ([x, y], radius) => {
      const b = x * direction[0] + y * direction[1], t = -b + Math.sqrt(b * b - (x * x + y * y - radius * radius));
      return [x + direction[0] * t, y + direction[1] * t];
    };
    const angleOf = ([x, y]) => Math.atan2(y, x) * 180 / Math.PI;
    const cut = .07, diagonal = .06;
    const bracketLow = below(diagonal);
    const barTop = .12, barBottom = .075;
    slab(mirror(polygon([
      [.34, barBottom],
      ...onRing(ring.inner, angleAt(ring.inner, barBottom), angleOf(crossing(corner, ring.inner)), 4), corner,
      bracketLow, ...onRing(ring.outer, angleOf(crossing(bracketLow, ring.outer)), angleAt(ring.outer, barTop)), [.34, barTop],
    ])), .035, "arm");
    // The bottom arm runs inside the ring: down the diagonal to a sharp bend, then nearly straight in towards the middle,
    // meeting its twin under the chin like the bottom of a heart, and ends in a short spur turned up towards the chin,
    // whose back slopes down into the arm so it reads as part of it.
    // From the bend, the arm heads in to its tip at 40° below the horizontal.
    const start = below(diagonal * 1.5 + cut), bend = crossing(start, .44), inward = degrees(40), reach = .264;
    const tip = [bend[0] - Math.cos(inward) * reach, bend[1] - Math.sin(inward) * reach];
    const [outside, inside] = bandSides([start, bend, tip], diagonal);
    const end = outside.at(-1), endInside = inside.at(-1);
    const toTip = [tip[0] - bend[0], tip[1] - bend[1]], toTipLength = Math.hypot(...toTip);
    const back = [-toTip[0] / toTipLength, -toTip[1] / toTipLength], spurUp = [(endInside[0] - end[0]) / diagonal, (endInside[1] - end[1]) / diagonal];
    const spurTop = [endInside[0] + spurUp[0] * spur.height, endInside[1] + spurUp[1] * spur.height];
    slab(mirror(polygon([
      // The end face runs straight on into the spur's front, so the corner between them is left out: a point in line
      // with both would leave a flat sliver in the triangulation, and its edge would show as a line.
      ...outside, spurTop, [spurTop[0] + back[0] * spur.width, spurTop[1] + back[1] * spur.width],
      [endInside[0] + back[0] * (spur.width + spur.height), endInside[1] + back[1] * (spur.width + spur.height)],
      ...inside.slice(0, -1).reverse(),
    ])), .035, "arm");

    // After the in-game mask's patterned horns: the outer half of each arm in a darker band edged with gold, with a
    // few gold dots along it. Laid on the arms' front face, without outlines, which would be noise at this size.
    const trim = (outerEdge, innerEdge, material, depth) => {
      slab(mirror(polygon([...outerEdge, ...innerEdge.slice().reverse()])), depth, material, .035).userData.noEdges = true;
    };
    const dot = ([x, y]) => {
      slab(mirror(new THREE.Shape().absarc(x, y, .011, 0, Math.PI * 2, false)), .006, "gold", .035).userData.noEdges = true;
    };
    const stripe = { inner: .447, gold: .468 };
    // The ring sections, kept a few degrees clear of their slanted or squared-off ends.
    for (const [from, to, dots] of [
      [90 - angleAt(ring.outer, post.left) - 4, hornEnd + 1, [72, 56, 40]],
      [angleOf(crossing(bracketLow, ring.outer)) + 4, angleAt(ring.outer, barTop) - 1, [-12, 4]],
    ]) {
      trim(onRing(ring.outer, from, to), onRing(stripe.inner, from, to), "band", .004);
      trim(onRing(ring.outer, from, to), onRing(stripe.gold, from, to), "gold", .006);
      for (const angle of dots) dot(onRing((stripe.inner + stripe.gold) / 2, angle, angle, 0)[0]);
    }
    // The bottom arm, along its outer side.
    const path = [start, bend, tip];
    trim(outside, path, "band", .004);
    trim(outside, bandSides(path, diagonal - 2 * (ring.outer - stripe.gold))[0], "gold", .006);
    const dotLine = bandSides(path, diagonal * .55)[0];
    const along = (a, b, f) => [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f];
    dot(along(dotLine[0], dotLine[1], .75));
    dot(along(dotLine[1], dotLine[2], .5));
  }
  slab(polygon(backing), .04, "frame");
  slab(polygon(face), .025, "face", .04);
  // The nose: a raised bar from where the three eyes meet down the middle of the chin, a hair lower than the eye
  // frames so they cover its top, framing a strip in the face's colour like the eyes frame their lenses.
  slab(polygon([[-.03, .02], [.03, .02], [.03, -.2], [-.03, -.2]]), .018, "frame", .065);
  slab(polygon([[-.012, -.02], [.012, -.02], [.012, -.18], [-.012, -.18]]), .01, "face", .078);
  // Three diamond eyes, each a raised frame around a yellow lens with a dark core.
  for (const [x, y] of [[0, .13], [-.11, .02], [.11, .02]]) {
    slab(diamond(x, y, .105), .02, "frame", .065);
    slab(diamond(x, y, .075), .01, "eye", .08).name = "eye";
    slab(diamond(x, y, .02), .006, "pupil", .09);
  }
  return mask;
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

  // The pedestal stops short of the floor and stands on a short foot at each corner. It is hollow, so an open drawer
  // shows its tray running on back inside: two sides, a back, and a shelf under each drawer and above the top one,
  // sitting behind the gaps between the fronts. Like the wardrobe's carcass, it gets one outline without the joins.
  const pedestal = { x: .125, width: .22, depth: .35, front: -.015, bottom: .06, wall: .015 };
  const pedestalHeight = under - pedestal.bottom;
  const gap = .01, frontHeight = (pedestalHeight - gap * 4) / 3;
  const carcass = [];
  const shell = (width, height, depth, x, y, z) => {
    part(desk, width, height, depth, "body", x, y, z).userData.noEdges = true;
    carcass.push(new THREE.Box3().setFromCenterAndSize(new THREE.Vector3(x, y, z), new THREE.Vector3(width, height, depth)));
  };
  const pedestalMiddle = pedestal.bottom + pedestalHeight / 2, pedestalBack = pedestal.front - pedestal.depth;
  for (const side of [-1, 1]) {
    shell(pedestal.wall, pedestalHeight, pedestal.depth, pedestal.x + side * (pedestal.width - pedestal.wall) / 2, pedestalMiddle, pedestal.front - pedestal.depth / 2);
  }
  const innerWidth = pedestal.width - 2 * pedestal.wall;
  shell(innerWidth, pedestalHeight, pedestal.wall, pedestal.x, pedestalMiddle, pedestalBack + pedestal.wall / 2);
  for (let i = 0; i <= 3; i++) {
    shell(innerWidth, gap, pedestal.depth - pedestal.wall, pedestal.x, pedestal.bottom + gap / 2 + i * (frontHeight + gap), pedestal.front - (pedestal.depth - pedestal.wall) / 2);
  }
  for (const x of [pedestal.x - pedestal.width / 2 + .0125, pedestal.x + pedestal.width / 2 - .0125]) {
    for (const z of [pedestal.front - .0125, pedestal.front - pedestal.depth + .0125]) part(desk, .025, pedestal.bottom, .025, "body", x, pedestal.bottom / 2, z);
  }
  for (const z of [-.03, -.35]) part(desk, .03, under, .03, "body", .69, under / 2, z);
  // Back and right-side panels closing the knee space below the top.
  part(desk, .44, .26, .015, "body", .455, under - .13, -.355);
  part(desk, .015, .26, .29, "body", .69, under - .13, -.19);

  // Each drawer: a front with a pull, and a tray hidden inside the pedestal until it slides out.
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
    // Height of the tray's floor surface, for things put in the drawer.
    drawer.userData.floor = floor + .003;
    desk.add(drawer);
    return drawer;
  });
  return { desk, drawers, outline: outlineBoxes(carcass) };
}

// The room is built once and kept for the whole visit of the site: leaving the page only takes its canvas off (it
// draws nothing meanwhile), and coming back puts it, as it was left, into the new page.
let deskRoom = null;
export const deskRoomBuilt = () => deskRoom !== null;
export function enableDeskRoom(host) {
  deskRoom ??= createDeskRoom();
  deskRoom.attach(host);
  return () => deskRoom.detach(host);
}
// The room as it stands, drawn and returned as a data URL (type and quality as for canvas.toDataURL). Used to make the
// picture shown in its place until it is ready (tools/desk-room-poster.html).
export const deskRoomPicture = (type, quality) => deskRoom?.picture(type, quality);

function createDeskRoom() {
  const canvas = document.createElement("canvas");
  canvas.className = "about-room-canvas";
  canvas.setAttribute("aria-hidden", "true");
  // The room's frame on the page it is shown on, if any (see attach).
  let host = null;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  // Lets single objects be cut by a plane (the Companion Cube passing through its portals).
  renderer.localClippingEnabled = true;

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
  // Drawing to do before each frame, if any (the view through the Companion Cube's portal).
  let beforeRender = null;
  let radius = .8;
  // Nothing is drawn while the room is off the page, nor before the shaders are compiled (see the end of the setup).
  let attached = false;
  let compiled = false;
  let frame = 0;
  let last = 0;


  // Thin dark strokes on the hard edges give an illustrated, technical-drawing look.
  const edgeMaterial = new THREE.LineBasicMaterial({ color: 0x1b2127, transparent: true, opacity: .32 });

  // edgeAngle: how sharp a fold must be, in degrees, to get an edge stroke; either one angle, or angles by material
  // name with "*" for the rest.
  function recolour(object, overrides = {}, edgeAngle = 30) {
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
      const angle = typeof edgeAngle === "number" ? edgeAngle : edgeAngle[source[0].name] ?? edgeAngle["*"];
      const edges = new THREE.LineSegments(new THREE.EdgesGeometry(child.geometry, angle), edgeMaterial);
      edges.raycast = () => {};
      child.add(edges);
    });
  }

  // A paper note taped near the top of a door's inner face, only seen once the door swings open.
  // A door's bounds in its own space, taken before anything is stuck on it.
  function doorFace(door) {
    door.updateWorldMatrix(true, true);
    const box = new THREE.Box3().setFromObject(door);
    const min = door.worldToLocal(box.min.clone()), max = door.worldToLocal(box.max.clone());
    return { min, max, width: Math.abs(max.x - min.x), centre: (min.x + max.x) / 2, top: Math.max(min.y, max.y), bottom: Math.min(min.y, max.y), inner: Math.min(min.z, max.z) };
  }

  // Stickers on the same door as the note, slightly askew.
  function addStickers(door, face) {
    const note = face.width * .68;
    // A sticker from a picture with a transparent surround (a file next to this module), cut out with a white border
    // once it is in: the picture is width wide, centred on (x, y), turned by tilt degrees and lifted by lift off the
    // door so it can cover the stickers under it. If peel is given, its corner that way (an angle in degrees, 0 = the
    // picture's right, 90 its top) has come unstuck and folded back over it, showing the white back of the paper. A holo
    // sticker shimmers with rainbow bands that slide across it as it is seen from another angle (the door swinging).
    const sticker = (source, width, x, y, tilt, peel, lift = 0, holo = false) => {
      const plane = new THREE.PlaneGeometry(1, 1, 24, 24);
      if (peel !== null) {
        const position = plane.attributes.position;
        const towards = new THREE.Vector2(Math.cos(THREE.MathUtils.degToRad(peel)), Math.sin(THREE.MathUtils.degToRad(peel)));
        // The fold line runs across that corner; everything past it turns over about it, nearly flat again.
        const reach = Math.abs(towards.x) / 2 + Math.abs(towards.y) / 2, start = reach * (1 - STICKERS.peelFrom * 2);
        const fold = THREE.MathUtils.degToRad(STICKERS.fold);
        for (let i = 0; i < position.count; i++) {
          const past = position.getX(i) * towards.x + position.getY(i) * towards.y - start;
          if (past <= 0) continue;
          const back = past * (Math.cos(fold) - 1);
          // Out of the door is +z here: the sticker is turned round to face into the wardrobe.
          position.setXYZ(i, position.getX(i) + towards.x * back, position.getY(i) + towards.y * back, past * Math.sin(fold) * width + STICKERS.peel);
        }
        plane.computeVertexNormals();
      }
      const mesh = new THREE.Mesh(plane, new THREE.MeshStandardMaterial({ roughness: 1, alphaTest: .5, visible: false }));
      if (holo) {
        // Bands of hue running diagonally across the picture, shifted by the angle it is seen at, added as glow.
        mesh.material.onBeforeCompile = (shader) => {
          shader.fragmentShader = shader.fragmentShader.replace("#include <emissivemap_fragment>", `#include <emissivemap_fragment>
            float holoBand = fract(dot(normal, normalize(vViewPosition)) * ${STICKERS.holoShift.toFixed(2)}
              + normalize(vViewPosition).x * ${STICKERS.holoShift.toFixed(2)} + (vMapUv.x + vMapUv.y) * ${STICKERS.holoBands.toFixed(2)});
            totalEmissiveRadiance += (.5 + .5 * cos(6.2832 * (holoBand + vec3(0., .33, .67)))) * ${STICKERS.holo.toFixed(2)};`);
        };
      }
      // Its back, plain paper in the backing's white, seen where the corner has turned over.
      const paper = new THREE.Mesh(plane, new THREE.MeshStandardMaterial({ roughness: 1, side: THREE.BackSide, alphaTest: .5, visible: false }));
      paper.raycast = () => {};
      mesh.add(paper);
      mesh.receiveShadow = true;
      // Tiny until the picture is in, so it doesn't widen the room's bounds the camera is fitted to.
      mesh.scale.setScalar(.001);
      mesh.position.set(x, y, face.inner - .002 - lift);
      mesh.rotation.set(0, Math.PI, THREE.MathUtils.degToRad(tilt));
      door.add(mesh);
      const apply = ({ canvas, logoWidth }) => {
        weather(canvas, Math.round(Math.abs(x * 1e5 + y * 1e3)) + 1);
        const texture = new THREE.CanvasTexture(canvas);
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.anisotropy = 4;
        mesh.material.map = texture;
        mesh.material.visible = true;
        mesh.material.needsUpdate = true;
        const back = document.createElement("canvas");
        back.width = canvas.width;
        back.height = canvas.height;
        const backContext = back.getContext("2d");
        backContext.drawImage(canvas, 0, 0);
        backContext.globalCompositeOperation = "source-in";
        backContext.fillStyle = STICKERS.cutBacking;
        backContext.fillRect(0, 0, back.width, back.height);
        const backTexture = new THREE.CanvasTexture(back);
        backTexture.colorSpace = THREE.SRGBColorSpace;
        Object.assign(paper.material, { map: backTexture, visible: true });
        paper.material.needsUpdate = true;
        const scale = width / logoWidth;
        mesh.scale.set(canvas.width * scale, canvas.height * scale, 1);
        wake();
      };
      const image = new Image();
      image.onload = () => apply(dieCutImage(image));
      image.src = new URL(`./${source}`, import.meta.url).href;
    };

    // Spread out down the door under the note, zigzagging from side to side, each at its own angle. In note widths:
    // across from the door's middle (+ is the viewer's left), and down from the note's bottom edge, 1.825 note widths
    // below the door's top.
    const at = (across, down) => [face.centre + note * across, face.top - note * (1.825 + down)];

    // Team Vitality's bee, from the team's logo (vita.png), on the left, a holo one.
    sticker("vita.png", note * .65, ...at(.2, 2.25), 10, null, 0, true);

    // Counter-Strike's logo (cs.png, on a white surround), on the right.
    sticker("cs.png", note * .6, ...at(-.16, 3.2), -8, null, .0008);

    // Twitch's logo (twitch.png), on the left, peeling at its top left.
    sticker("twitch.png", note * .68, ...at(.18, 4.15), 6, 130);
  }

  // An e-sport event pass on a lanyard, hung from a magnet on the same door, to the right of the Vitality sticker,
  // above the Counter-Strike one: a yellow strap in a V down to a metal clip and a card (no real text, only its shapes: a yellow band, a
  // photo, a few lines and a barcode). Returns the pivot at the magnet, which swings it in the door's plane.
  function addLanyard(door, face) {
    const note = face.width * .68;
    const pivot = new THREE.Group();
    pivot.position.set(face.centre - note * .36, face.top - note * (1.825 + 1.74), face.inner - .003);
    // Turned round like the stickers, so +z points out of the door.
    pivot.rotation.set(0, Math.PI, 0);
    door.add(pivot);
    const { cardSize: card, depth } = LANYARD;
    const cardWidth = note * card[0], cardHeight = note * card[1], drop = note * LANYARD.drop;
    const lanyard = new THREE.Group();
    const add = (geometry, material) => {
      const mesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ name: material }));
      lanyard.add(mesh);
      return mesh;
    };
    add(new THREE.CylinderGeometry(note * .05, note * .05, depth * 2, 16).rotateX(Math.PI / 2), "magnet").position.z = depth;
    // Each strap runs from the magnet down to a top corner of the clip.
    for (const side of [-1, 1]) {
      const end = new THREE.Vector2(side * note * .06, -drop), length = end.length();
      const band = add(new THREE.BoxGeometry(note * LANYARD.strapWidth, length, depth), "strap");
      band.position.set(end.x / 2, end.y / 2, depth * 2.5);
      band.rotation.z = Math.atan2(end.x, -end.y);
    }
    add(new THREE.BoxGeometry(note * .14, note * .07, depth * 1.5), "clip").position.set(0, -drop, depth * 2.5);
    const cardBox = add(new THREE.BoxGeometry(cardWidth, cardHeight, depth), "card");
    cardBox.position.set(0, -drop - note * .035 - cardHeight / 2, depth * 2);
    recolour(lanyard, LANYARD);
    // The card's printed face, painted on a canvas.
    const canvas = document.createElement("canvas");
    canvas.width = 128;
    canvas.height = Math.round(128 * card[1] / card[0]);
    const context = canvas.getContext("2d");
    const { width: w, height: h } = canvas;
    context.fillStyle = LANYARD.print.paper;
    context.fillRect(0, 0, w, h);
    context.fillStyle = LANYARD.print.band;
    context.fillRect(0, 0, w, h * .24);
    context.fillStyle = LANYARD.print.photo;
    context.fillRect(w * .1, h * .32, w * .34, w * .4);
    context.fillStyle = LANYARD.print.ink;
    for (const [y, length] of [[.34, .4], [.42, .32], [.5, .36]]) context.fillRect(w * .52, h * y, w * length, h * .035);
    for (let x = w * .12; x < w * .88; x += 4 + (x * 7 % 5)) context.fillRect(x, h * .78, 2 + (x * 3 % 3), h * .12);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 4;
    const print = new THREE.Mesh(new THREE.PlaneGeometry(cardWidth * .96, cardHeight * .96), new THREE.MeshStandardMaterial({ map: texture, roughness: 1 }));
    print.position.set(0, 0, depth / 2 + .0002);
    cardBox.add(print);
    pivot.add(lanyard);
    return pivot;
  }

  // A sticker's picture worn by time, the same way each visit (seed): a little faded, a few light scuffs across it, a
  // faint grime, and small nicks out of its edge.
  function weather(canvas, seed) {
    const context = canvas.getContext("2d", { willReadFrequently: true });
    const random = () => {
      seed = (seed * 16807 + 12345) % 2147483647;
      return Math.abs(seed % 10000) / 10000;
    };
    const { width, height } = canvas;
    context.save();
    context.globalCompositeOperation = "source-atop";
    context.fillStyle = `rgba(255, 255, 255, ${STICKERS.fade})`;
    context.fillRect(0, 0, width, height);
    context.fillStyle = STICKERS.grime;
    for (let i = 0; i < 40; i++) {
      context.beginPath();
      context.arc(random() * width, random() * height, 2 + random() * 6, 0, Math.PI * 2);
      context.fill();
    }
    context.strokeStyle = STICKERS.scuff;
    context.lineCap = "round";
    for (let i = 0; i < STICKERS.scuffs; i++) {
      const x = random() * width, y = random() * height, angle = random() * Math.PI, length = 12 + random() * 40;
      context.lineWidth = 1 + random() * 1.5;
      context.beginPath();
      context.moveTo(x, y);
      context.lineTo(x + Math.cos(angle) * length, y + Math.sin(angle) * length);
      context.stroke();
    }
    // Nicks: small bites out of the edge, where a point on the sticker has see-through just beside it.
    const { data } = context.getImageData(0, 0, width, height);
    const solid = (x, y) => x >= 0 && y >= 0 && x < width && y < height && data[(Math.floor(y) * width + Math.floor(x)) * 4 + 3] > 128;
    context.globalCompositeOperation = "destination-out";
    context.fillStyle = "#000";
    for (let made = 0, tries = 0; made < STICKERS.nicks && tries < 4000; tries++) {
      const x = random() * width, y = random() * height;
      if (!solid(x, y) || (solid(x + 6, y) && solid(x - 6, y) && solid(x, y + 6) && solid(x, y - 6))) continue;
      context.beginPath();
      context.arc(x, y, 2 + random() * 3, 0, Math.PI * 2);
      context.fill();
      made++;
    }
    context.restore();
  }

  // An image with a transparent surround, cropped to its content and laid on a white die-cut backing with a thin
  // outline in the shade the edge strokes give the wardrobe, drawn on a canvas. Returns the canvas and the width the
  // image itself takes on it.
  function dieCutImage(image, logoWidth = 256, border = 16, line = 3) {
    const probe = document.createElement("canvas");
    probe.width = image.naturalWidth || image.width;
    probe.height = image.naturalHeight || image.height;
    const probeContext = probe.getContext("2d", { willReadFrequently: true });
    probeContext.drawImage(image, 0, 0);
    const pixels = probeContext.getImageData(0, 0, probe.width, probe.height);
    const { data } = pixels;
    // An image on a plain white surround instead of a transparent one: the pure white reached from its edges is cleared.
    // Whites inside the picture, even near-white ones, are kept.
    const white = (i) => data[i * 4 + 3] > 0 && data[i * 4] >= 252 && data[i * 4 + 1] >= 252 && data[i * 4 + 2] >= 252;
    if (white(0)) {
      const queue = [];
      for (let x = 0; x < probe.width; x++) queue.push(x, (probe.height - 1) * probe.width + x);
      for (let y = 0; y < probe.height; y++) queue.push(y * probe.width, y * probe.width + probe.width - 1);
      while (queue.length) {
        const i = queue.pop();
        if (!white(i)) continue;
        data[i * 4 + 3] = 0;
        const x = i % probe.width;
        if (x > 0) queue.push(i - 1);
        if (x < probe.width - 1) queue.push(i + 1);
        if (i >= probe.width) queue.push(i - probe.width);
        if (i < data.length / 4 - probe.width) queue.push(i + probe.width);
      }
      probeContext.putImageData(pixels, 0, 0);
    }
    let left = probe.width, right = 0, top = probe.height, bottom = 0;
    for (let y = 0; y < probe.height; y++) {
      for (let x = 0; x < probe.width; x++) {
        if (data[(y * probe.width + x) * 4 + 3] < 16) continue;
        left = Math.min(left, x); right = Math.max(right, x); top = Math.min(top, y); bottom = Math.max(bottom, y);
      }
    }
    const scale = logoWidth / (right - left + 1), logoHeight = Math.round((bottom - top + 1) * scale);
    const margin = border + line + 2;
    const canvas = document.createElement("canvas");
    canvas.width = logoWidth + margin * 2;
    canvas.height = logoHeight + margin * 2;
    const context = canvas.getContext("2d");
    // The image's shape filled with one colour, pushed out by a radius: drawn shifted all round a few circles.
    const silhouette = (colour) => {
      const shape = document.createElement("canvas");
      shape.width = canvas.width;
      shape.height = canvas.height;
      const shapeContext = shape.getContext("2d");
      shapeContext.drawImage(probe, left, top, right - left + 1, bottom - top + 1, margin, margin, logoWidth, logoHeight);
      shapeContext.globalCompositeOperation = "source-in";
      shapeContext.fillStyle = colour;
      shapeContext.fillRect(0, 0, shape.width, shape.height);
      return shape;
    };
    const grow = (shape, radius) => {
      context.drawImage(shape, 0, 0);
      for (const ring of [radius / 3, radius * 2 / 3, radius]) {
        for (let i = 0; i < 32; i++) {
          const angle = i / 32 * Math.PI * 2;
          context.drawImage(shape, Math.cos(angle) * ring, Math.sin(angle) * ring);
        }
      }
    };
    grow(silhouette(STICKERS.cutLine), border + line);
    grow(silhouette(STICKERS.cutBacking), border);
    context.drawImage(probe, left, top, right - left + 1, bottom - top + 1, margin, margin, logoWidth, logoHeight);
    return { canvas, logoWidth };
  }

  // The row of hearts in the top left corner of the door's inner face, above the note: one 9 × 8 pixel heart each,
  // drawn on a see-through canvas. Each click on it fills half a heart more; filling the last one, or clicking the full
  // row, plays a flourish: a gleam runs along the hearts a few times while the row swells and settles each time.
  function addHearts(door, face) {
    const note = face.width * .68;
    const heart = [
      ".XX...XX.",
      "XFFX.XFFX",
      "XFGFXFFFX",
      "XFFFFFFFX",
      ".XFFFFFX.",
      "..XFFFX..",
      "...XFX...",
      "....X....",
    ];
    const pixel = 6, gap = 2;
    const canvas = document.createElement("canvas");
    canvas.width = (heart[0].length * HEARTS.count + gap * (HEARTS.count - 1)) * pixel;
    canvas.height = heart.length * pixel;
    const context = canvas.getContext("2d");
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.magFilter = THREE.NearestFilter;
    let halves = HEARTS.startHalves;
    // gleam: where the flourish's gleam is along the row, in hearts from the first (none when off the row).
    const draw = (gleam = -9) => {
      for (let index = 0; index < HEARTS.count; index++) {
        const left = index * (heart[0].length + gap);
        // How much of this heart is full: 1, .5 (its left half) or 0.
        const fill = THREE.MathUtils.clamp(halves / 2 - index, 0, 1);
        const red = Math.abs(gleam - index) < .6 ? HEARTS.gleam : HEARTS.fill;
        heart.forEach((line, y) => [...line].forEach((cell, x) => {
          if (cell === ".") return;
          const filled = fill === 1 || (fill === .5 && x < heart[0].length / 2);
          context.fillStyle = cell === "X" ? HEARTS.outline : !filled ? HEARTS.empty : cell === "G" ? HEARTS.glint : red;
          context.fillRect((left + x) * pixel, y * pixel, pixel, pixel);
        }));
      }
      texture.needsUpdate = true;
    };
    draw();
    const width = note * .95, height = width * canvas.height / canvas.width;
    const hearts = new THREE.Mesh(new THREE.PlaneGeometry(width, height), new THREE.MeshStandardMaterial({ map: texture, roughness: 1, alphaTest: .5, side: THREE.DoubleSide }));
    hearts.receiveShadow = true;
    // Facing inwards like the note; the door's +x is the viewer's left.
    hearts.position.set(face.centre + face.width / 2 - note * .1 - width / 2, face.top - note * .3, face.inner - .002);
    hearts.rotation.y = Math.PI;
    let flourish = null;
    parts.push({
      object: hearts, state: spring(), apply() {},
      busy(now) {
        if (flourish === null) return false;
        const laps = (now - flourish) / (HEARTS.flourish * 1000);
        if (laps >= HEARTS.laps) {
          flourish = null;
          hearts.scale.setScalar(1);
          draw();
          return false;
        }
        // Each lap: the gleam runs from just before the first heart to just past the last, the row swelling and back.
        const u = laps % 1;
        draw(-1 + u * (HEARTS.count + 1));
        hearts.scale.setScalar(1 + .1 * Math.sin(Math.PI * u));
        return true;
      },
    });
    hearts.userData.onClick = () => {
      if (halves < HEARTS.count * 2) {
        halves++;
        draw();
      }
      // A flourish under way plays to the end before another can start.
      if (halves === HEARTS.count * 2 && flourish === null) flourish = performance.now();
    };
    door.add(hearts);
  }

  function addNote(door, face) {
    const { min, max } = face;
    const width = face.width * .68;
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
    const back = Math.min(min.z, max.z), inner = back - .002;
    note.position.set((min.x + max.x) / 2, Math.max(min.y, max.y) - width * 1.25, inner);
    note.rotation.set(0, Math.PI, THREE.MathUtils.degToRad(-4));
    door.add(note);

    // Behind it, a hole knocked through the door, a small key hidden in it: flat shapes laid on the door's inner face,
    // between it and the note, facing inwards like the note.
    const hole = new THREE.Group();
    hole.position.set(note.position.x, note.position.y - width * .05, back);
    hole.rotation.y = Math.PI;
    const layer = (shape, material, lift, depth = 0) => {
      const geometry = depth ? new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false }) : new THREE.ShapeGeometry(shape);
      const mesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ name: material }));
      mesh.position.z = lift;
      hole.add(mesh);
      return mesh;
    };
    // A ragged outline: a circle whose radius jumps in and out every few degrees, the rim a little wider than the dark.
    const jags = [1, .8, 1.06, .76, .97, .84, 1.1, .79, 1, .87, 1.04, .74, .95, .83];
    const ragged = (radius, turn) => new THREE.Shape(jags.map((jag, i) => {
      const angle = turn + i / jags.length * Math.PI * 2;
      return new THREE.Vector2(Math.cos(angle) * radius * jag, Math.sin(angle) * radius * jag * .9);
    }));
    layer(ragged(width * .36, .2), "rim", .0004);
    layer(ragged(width * .3, 0), "dark", .0007);
    // Zelda's small key, slanted across the hole: a ring bow, a shaft and two teeth.
    const key = new THREE.Shape();
    const unit = width * .052;
    key.absarc(0, 3.2 * unit, 1.6 * unit, 0, Math.PI * 2, false);
    const bowHole = new THREE.Path();
    bowHole.absarc(0, 3.2 * unit, .8 * unit, 0, Math.PI * 2, true);
    key.holes.push(bowHole);
    const shaft = new THREE.Shape([[-.45, 1.8], [.45, 1.8], [.45, -4], [-.45, -4]].map(([x, y]) => new THREE.Vector2(x * unit, y * unit)));
    const teeth = [-4, -2.6].map((y) => new THREE.Shape([[.45, y], [1.5, y], [1.5, y + .9], [.45, y + .9]].map(([x, yy]) => new THREE.Vector2(x * unit, yy * unit))));
    // Its pieces kept together, so the key can be taken out in one go.
    const keyGroup = new THREE.Group();
    keyGroup.rotation.z = -.7;
    for (const shape of [key, shaft, ...teeth]) keyGroup.add(layer(shape, "key", .0012, .0006));
    hole.add(keyGroup);
    recolour(hole, HOLE);
    // The key glows gold, so it catches the eye from the dark of the hole.
    hole.traverse((child) => {
      if (child.material?.name !== "key") return;
      child.material.emissive.set(HOLE.glow);
      child.material.emissiveIntensity = HOLE.shine;
    });
    // Hidden while the note covers it: the note sits so close that the key's strokes would show through it.
    hole.visible = false;
    door.add(hole);
    return { note, tape, hole, key: keyGroup };
  }

  function addPart(object, apply) {
    const part = { object, apply, state: spring() };
    object.traverse((child) => { if (child.isMesh) child.userData.part = part; });
    parts.push(part);
    return part;
  }

  const { desk, drawers, outline: deskOutline } = buildDesk();
  const { cabinet, doorLeft, doorRight, outline } = buildCabinet();
  recolour(desk, DESK);
  recolour(cabinet, CABINET);
  const pedestalOutline = new THREE.LineSegments(deskOutline, edgeMaterial);
  pedestalOutline.raycast = () => {};
  desk.add(pedestalOutline);
  const cabinetOutline = new THREE.LineSegments(outline, edgeMaterial);
  cabinetOutline.raycast = () => {};
  cabinet.add(cabinetOutline);
  // The doors open on a click anywhere on the wardrobe. Registered before the things stored inside, which then claim
  // their own clicks.
  const leftFace = doorFace(doorLeft);
  const pinned = addNote(doorLeft, leftFace);
  addHearts(doorLeft, leftFace);
  addStickers(doorLeft, leftFace);
  const lanyard = addLanyard(doorLeft, leftFace);
  const doors = addPart(cabinet, (t) => { doorLeft.rotation.y = -t * 1.9; doorRight.rotation.y = t * 1.9; });
  // The pass swings from its magnet: each jolt of the door (its swing speeding up or slowing down) or a click on it
  // pushes it aside, then it sways back and settles.
  const passSway = spring();
  let passDoor = 0, passTime = 0;
  lanyard.traverse((child) => {
    if (!child.isMesh) return;
    // A click pushes it the way it is already going, so clicks in a row swing it further instead of jerking it back;
    // its speed is capped.
    child.userData.onClick = () => {
      const way = Math.sign(passSway.velocity) || 1;
      passSway.velocity = way * Math.min(Math.abs(passSway.velocity) + LANYARD.flick, LANYARD.flick * LANYARD.flickCap);
      wake();
    };
  });
  parts.push({
    object: lanyard, state: spring(), apply() {},
    busy(now) {
      const dt = passTime ? Math.min(.033, (now - passTime) / 1000) : 0;
      passTime = now;
      passSway.velocity -= (doors.state.velocity - passDoor) * LANYARD.kick;
      passDoor = doors.state.velocity;
      const moving = stepSpring(passSway, dt, LANYARD.stiffness, LANYARD.damping);
      lanyard.rotation.z = passSway.value;
      if (!moving) passTime = 0;
      return moving;
    },
  });
  // Slammed too often in a row, the doors shake the note loose: its tape vanishes and it flutters down to the floor
  // in front of the wardrobe, swaying side to side and settling flat.
  let slams = [], flyaway = null;
  doors.onToggle = (open) => {
    const now = performance.now();
    slams = slams.filter((time) => now - time < NOTE.within * 1000);
    slams.push(now);
    // Only on a swing open, so it falls out of the wardrobe rather than through a shut door.
    if (slams.length < NOTE.slams || !open || flyaway) return;
    const { note, tape, hole } = pinned;
    tape.removeFromParent();
    hole.visible = true;
    room.attach(note);
    note.traverse((child) => { child.userData.part = undefined; });
    flyaway = {
      start: now, from: note.position.clone(), turn: note.quaternion.clone(),
      to: new THREE.Vector3(note.position.x - .12, .0015, note.position.z + .26),
      lying: new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, 0, .5)),
    };
  };
  const sway = new THREE.Quaternion(), swayAxis = new THREE.Vector3(0, 0, 1);
  parts.push({
    object: pinned.note, state: spring(), apply() {},
    busy(now) {
      if (!flyaway || flyaway.done) return false;
      const u = Math.min(1, (now - flyaway.start) / (NOTE.fall * 1000));
      const { note } = pinned;
      // Drifts forward and down, slowing as air catches it, rocking from side to side less and less.
      note.position.lerpVectors(flyaway.from, flyaway.to, 1 - (1 - u) ** 1.5);
      note.position.y = THREE.MathUtils.lerp(flyaway.from.y, flyaway.to.y, u * u * (3 - 2 * u));
      note.position.x += Math.sin(u * Math.PI * 4) * .035 * (1 - u);
      note.quaternion.slerpQuaternions(flyaway.turn, flyaway.lying, Math.min(1, u * 1.3));
      note.quaternion.multiply(sway.setFromAxisAngle(swayAxis, Math.sin(u * Math.PI * 4) * .5 * (1 - u)));
      if (u === 1) flyaway.done = true;
      return true;
    },
  });
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
  // A Rubik's cube lying in the middle drawer, set back from the front but still in the part that slides out (.16).
  const rubiksCube = buildRubiksCube();
  recolour(rubiksCube, RUBIK);
  const middleDrawer = drawers[1];
  rubiksCube.position.set(.025, middleDrawer.userData.floor, -.11);
  rubiksCube.rotation.y = -.45;
  middleDrawer.add(rubiksCube);
  // A rubber duck beside it, back from the drawer front (which would hide it from above), looking out, a little
  // bigger than life so it reads. A click squeezes it (it claims the click, so the drawer stays put).
  const duck = buildRubberDuck();
  recolour(duck, DUCK);
  // Its round shapes give the edge strokes nothing to draw, so each gets a dark outline round its silhouette instead:
  // a slightly bigger copy turned inside out, whose back shows only round the edges.
  const outlineMaterial = new THREE.MeshBasicMaterial({ color: DUCK.outline, side: THREE.BackSide });
  for (const mesh of duck.children.filter((child) => child.isMesh && !child.userData.noEdges)) {
    mesh.geometry.computeBoundingSphere();
    const hull = new THREE.Mesh(mesh.geometry, outlineMaterial);
    hull.scale.setScalar(1 + DUCK.line / mesh.geometry.boundingSphere.radius);
    hull.raycast = () => {};
    mesh.add(hull);
  }
  const duckSize = 1.3;
  const duckSpot = new THREE.Vector3(-.045, middleDrawer.userData.floor, -.115);
  duck.position.copy(duckSpot);
  duck.rotation.y = .5;
  duck.scale.setScalar(duckSize);
  middleDrawer.add(duck);
  let squeezed = null;
  parts.push({
    object: duck, state: spring(), apply() {},
    busy(now) {
      if (squeezed === null) return false;
      const time = (now - squeezed) / 1000, { squeeze, hop } = DUCK;
      if (time >= squeeze + hop) {
        squeezed = null;
        duck.scale.setScalar(duckSize);
        duck.position.copy(duckSpot);
        return false;
      }
      if (time < squeeze) {
        // Squashed flat and wide, as if pressed.
        const press = Math.sin(Math.PI * time / squeeze);
        duck.scale.set(1 + .18 * press, 1 - .3 * press, 1 + .18 * press).multiplyScalar(duckSize);
        duck.position.copy(duckSpot);
      } else {
        // Springs up stretched, lands and wobbles back to shape.
        const u = (time - squeeze) / hop;
        const stretch = Math.sin(Math.PI * 3 * u) * (1 - u) * .12;
        duck.scale.set(1 - stretch / 2, 1 + stretch, 1 - stretch / 2).multiplyScalar(duckSize);
        duck.position.copy(duckSpot).y += Math.sin(Math.PI * Math.min(1, u * 1.6)) * .018;
      }
      return true;
    },
  });
  duck.traverse((child) => {
    if (!child.isMesh) return;
    child.userData.onClick = () => { squeezed = performance.now(); };
  });
  // A Game Boy lying in the top drawer, screen end towards the back, in the part that slides out.
  const gameBoy = buildGameBoy();
  recolour(gameBoy, GAMEBOY);
  const topDrawer = drawers[drawers.length - 1];
  gameBoy.position.set(-.032, topDrawer.userData.floor, -.08);
  gameBoy.rotation.y = .3;
  gameBoy.scale.setScalar(1.2);
  topDrawer.add(gameBoy);
  // Its cartridges: Red and Blue stood on their long sides in the strip between it and the tray's left wall, labels to
  // the camera, Red leaning on the wall and Blue on Red; a grey one lying flat further back.
  const addCartridge = (name) => {
    const cartridge = buildCartridge();
    recolour(cartridge, CARTRIDGES[name]);
    topDrawer.add(cartridge);
    return cartridge;
  };
  const greyCartridge = addCartridge("grey");
  greyCartridge.position.set(.045, topDrawer.userData.floor, -.225);
  greyCartridge.rotation.y = .1;
  // Leaning .45 rad off upright, a cartridge's lower back edge rests .019 below its centre and its top reaches .009
  // towards the wall; Blue sits one cartridge thickness out from Red, along Red's front.
  for (const [name, x, y, z] of [["red", -.078, .019, -.09], ["blue", -.0721, .0218, -.11]]) {
    const cartridge = addCartridge(name);
    cartridge.position.set(x, topDrawer.userData.floor + y, z);
    cartridge.rotation.z = .45 - Math.PI / 2;
  }
  // The Nomai mask stands on a small stand at the left end of the wardrobe's top shelf (shelf top at y .651 in wardrobe units, inside
  // x .04 → .36), scaled to fit under the top, with the mask held parallel to the screen (turned and leaning back by
  // the camera's own angles): anything else looks skewed this far from the middle of the view.
  const nomai = new THREE.Group();
  const stand = (width, height, depth, x, y, z) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), new THREE.MeshStandardMaterial({ name: "stand" }));
    mesh.position.set(x, y, z);
    nomai.add(mesh);
  };
  stand(.09, .014, .06, 0, .007, 0);
  stand(.012, .07, .012, 0, .049, -.012);
  const mask = buildNomaiMask();
  mask.scale.setScalar(.2);
  mask.position.set(0, .112, -.008);
  mask.rotation.x = -VIEW_ELEVATION;
  nomai.add(mask);
  recolour(nomai, NOMAI);
  nomai.position.set(.11, .651, -.13);
  nomai.scale.setScalar(.65);
  nomai.rotation.y = VIEW_AZIMUTH;
  cabinet.add(nomai);
  // A small ? block kept as a souvenir in the middle of the wardrobe's middle shelf (shelf top at y .475 in wardrobe
  // units, shelf z -.23 → -.05). Set aside for now: built but not added, as a hidden mesh would still catch clicks.
  const questionBlock = buildQuestionBlock();
  recolour(questionBlock, QUESTION_BLOCK);
  questionBlock.scale.setScalar(.6);
  questionBlock.position.set(.2, .475, -.14);
  // Portal's Companion Cube in its place on the top shelf, right of the Nomai mask, turned a little: a model's shapes,
  // painted in the room's flat colours with its edge strokes. It lives in the room rather than the wardrobe so it can
  // travel: a click opens a blue portal under it and an orange one standing on the back wall of the compartment
  // below; it drops through and shoots out of the back wall onto the middle shelf. The next click sends it back up the
  // same way. In wardrobe units: middle shelf top .475, top shelf .651, back wall z -.23; each wall portal stands
  // .065 above its shelf.
  cabinet.updateMatrix();
  const inWardrobe = (x, y, z) => new THREE.Vector3(x, y, z).applyMatrix4(cabinet.matrix);
  const stops = {
    middle: { spot: inWardrobe(.2, .475, -.14), turn: .35, wall: inWardrobe(.2, .54, -.23) },
    top: { spot: inWardrobe(.23, .651, -.13), turn: .1, wall: inWardrobe(.23, .716, -.23) },
  };
  const companionCube = new THREE.Group();
  companionCube.position.copy(stops.top.spot);
  companionCube.rotation.order = "YXZ";
  companionCube.rotation.y = stops.top.turn;
  companionCube.scale.setScalar(cabinet.scale.x);
  room.add(companionCube);
  const portals = [buildPortal(PORTALS.blue), buildPortal(PORTALS.orange)];
  room.add(...portals);
  // Looking into either portal shows what lies beyond the other. For each, a second camera stands to the twin as the
  // real camera stands to the portal (turned round, since one is entered and the other left) and films the room into
  // a picture the portal shows. Its near plane is tilted onto the twin's surface, so the shelf or wall the twin sits
  // on never blocks the view. A portal facing away from the camera isn't filmed for.
  const farCamera = camera.clone();
  const looks = portals.map((portal, i) => {
    const view = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType });
    portal.material.uniforms.view.value = view.texture;
    return { portal, twin: portals[1 - i], view, uniforms: portal.material.uniforms };
  });
  const flip = new THREE.Matrix4().makeRotationX(Math.PI), unit = new THREE.Vector3(1, 1, 1);
  const portalFrame = (portal, out) => {
    portal.getWorldPosition(out.position);
    portal.getWorldQuaternion(out.turn);
    out.matrix.compose(out.position, out.turn, unit);
    out.facing.set(0, 1, 0).applyQuaternion(out.turn);
    return out;
  };
  const frameOf = () => ({ position: new THREE.Vector3(), turn: new THREE.Quaternion(), matrix: new THREE.Matrix4(), facing: new THREE.Vector3() });
  const entry = frameOf(), exit = frameOf();
  const bufferSize = new THREE.Vector2(), seen = new THREE.Vector3(), surface = new THREE.Plane(), clip = new THREE.Vector4(), corner = new THREE.Vector4();
  beforeRender = () => {
    for (const look of looks) look.uniforms.through.value = 0;
    if (!portals[0].visible) return;
    scene.updateMatrixWorld();
    camera.updateMatrixWorld();
    renderer.getDrawingBufferSize(bufferSize);
    // The portals themselves stay out of the pictures, and the shadows drawn for the last frame are reused.
    for (const portal of portals) portal.visible = false;
    const shadows = renderer.shadowMap.autoUpdate;
    renderer.shadowMap.autoUpdate = false;
    for (const look of looks) film(look);
    renderer.setRenderTarget(null);
    renderer.shadowMap.autoUpdate = shadows;
    for (const portal of portals) portal.visible = true;
  };
  function film({ portal, twin, view, uniforms }) {
    portalFrame(portal, entry);
    portalFrame(twin, exit);
    if (seen.setFromMatrixPosition(camera.matrixWorld).sub(entry.position).dot(entry.facing) <= 0) return;
    farCamera.matrixWorld.copy(exit.matrix).multiply(flip).multiply(entry.matrix.invert()).multiply(camera.matrixWorld);
    farCamera.matrixWorld.decompose(farCamera.position, farCamera.quaternion, farCamera.scale);
    farCamera.updateMatrixWorld();
    // Oblique near plane (Lengyel's): the twin's surface, in the far camera's space, facing out of it.
    surface.setFromNormalAndCoplanarPoint(exit.facing, exit.position).applyMatrix4(farCamera.matrixWorldInverse);
    farCamera.projectionMatrix.copy(camera.projectionMatrix);
    const e = farCamera.projectionMatrix.elements;
    clip.set(surface.normal.x, surface.normal.y, surface.normal.z, surface.constant);
    corner.set((Math.sign(clip.x) + e[8]) / e[0], (Math.sign(clip.y) + e[9]) / e[5], -1, (1 + e[10]) / e[14]);
    clip.multiplyScalar(2 / clip.dot(corner));
    e[2] = clip.x; e[6] = clip.y; e[10] = clip.z + 1; e[14] = clip.w;
    farCamera.projectionMatrixInverse.copy(farCamera.projectionMatrix).invert();
    if (view.width !== bufferSize.x || view.height !== bufferSize.y) view.setSize(bufferSize.x, bufferSize.y);
    uniforms.screen.value.copy(bufferSize);
    renderer.setRenderTarget(view);
    renderer.render(scene, farCamera);
    uniforms.through.value = 1;
  }
  // While it passes through a portal, the part of it beyond the surface is cut away: a plane in room space, turned
  // into world space each frame (the clipping planes live there). Out of reach while it isn't travelling.
  const cutHere = new THREE.Plane(new THREE.Vector3(0, 1, 0), 100), cut = new THREE.Plane();
  new GLTFLoader().loadAsync(new URL("companion_cube.glb", import.meta.url).href).then(({ scene: model }) => {
    paintCompanionCube(model);
    // Only its sharpest folds get strokes: its many small bevels would crowd it with lines. The white bumpers and
    // handles keep a few more, so their shapes read against each other.
    recolour(model, COMPANION_CUBE, { bumper: 45, handle: 45, "*": 70 });
    // Its own clipped copy of the edge strokes, so cutting it never cuts the rest of the room's.
    const strokes = edgeMaterial.clone();
    strokes.clippingPlanes = [cut];
    model.traverse((child) => {
      if (child.isLineSegments) child.material = strokes;
      else if (child.isMesh) Object.assign(child.material, { clippingPlanes: [cut], clipShadows: true });
    });
    // The model is 2 across, centred on its middle.
    const width = .065;
    model.scale.setScalar(width / 2);
    model.position.y = width / 2;
    companionCube.add(model);
    const height = width * companionCube.scale.y;
    let trip = null;
    const part = addPart(companionCube, () => {});
    // It starts up on the top shelf, so the first click sends it down.
    Object.assign(part.state, { value: 1, target: 1 });
    // Clicks during a trip are ignored.
    part.onToggle = (up) => {
      if (trip) { part.state.target = up ? 0 : 1; return; }
      trip = { start: performance.now(), from: stops[up ? "middle" : "top"], to: stops[up ? "top" : "middle"] };
      // The blue one lies on the shelf under it; the orange one stands on the back wall behind where it lands, facing
      // out (an upright oval).
      portals[0].position.copy(trip.from.spot).y += .0015;
      portals[1].position.copy(trip.to.wall).z += .0015;
      portals[1].rotation.x = Math.PI / 2;
      for (const portal of portals) portal.visible = true;
    };
    const { open, fall, fly, close } = PORTAL_TRIP;
    const easeOutBack = (x) => 1 + 2.2 * (x - 1) ** 3 + 1.2 * (x - 1) ** 2;
    part.busy = (now) => {
      if (!trip) return false;
      const time = (now - trip.start) / 1000, { from, to } = trip;
      // Portals grow open with a little overshoot, then shrink shut once it has landed.
      const shut = open + fall + fly;
      const size = time < shut ? easeOutBack(Math.min(1, time / open)) : 1 - Math.min(1, (time - shut) / close) ** 2;
      for (const portal of portals) {
        portal.scale.set(PORTALS.across * size, 1, PORTALS.along * size);
        portal.material.uniforms.time.value = now / 1000;
      }
      // Kept: what is above the blue portal (falling in), or in front of the orange one (shooting out); everything
      // otherwise.
      cutHere.normal.set(0, 1, 0);
      cutHere.constant = 100;
      if (time < open + fall) {
        // Waiting on the open portal, then dropping into it, faster and faster.
        const u = Math.max(0, time - open) / fall;
        companionCube.position.copy(from.spot).setY(from.spot.y - u * u * (height + .005));
        companionCube.rotation.set(0, from.turn, 0);
        cutHere.constant = -from.spot.y;
      } else if (time < shut) {
        // Shot out of the back wall at the speed it went in (what goes in comes out), centred on the portal, dropping
        // onto the shelf as it comes forward and turning towards its new angle.
        const v = (time - open - fall) / fly;
        const start = to.wall.z - height / 2 - .005, rise = to.wall.y - height / 2;
        companionCube.position.set(
          THREE.MathUtils.lerp(to.wall.x, to.spot.x, v),
          rise - (rise - to.spot.y) * v * v,
          THREE.MathUtils.lerp(start, to.spot.z, 1 - (1 - v) ** 1.6),
        );
        companionCube.rotation.set(0, THREE.MathUtils.lerp(from.turn, to.turn, v), 0);
        cutHere.normal.set(0, 0, 1);
        cutHere.constant = -to.wall.z;
      } else {
        // Landed: two small bounces.
        const w = Math.min(1, (time - shut) / close);
        companionCube.position.copy(to.spot).setY(to.spot.y + Math.abs(Math.sin(w * Math.PI * 2)) * .008 * (1 - w));
        companionCube.rotation.set(0, to.turn, 0);
      }
      cut.copy(cutHere).applyMatrix4(room.matrixWorld);
      if (time < shut + close) return true;
      trip = null;
      for (const portal of portals) portal.visible = false;
      return false;
    };
    wake();
  }).catch(() => {});
  // The hearthstone at the left of the middle shelf (shelf top at y .475 in wardrobe units), a little back from the
  // front, in the light and clear of where the Companion Cube lands, standing upright on a small eight-sided plinth,
  // its narrow end up and its face out, about .09 tall. Strokes only on its sharper folds (its bevels), so its face
  // stays clean. It lives in the room, like the Companion Cube, so the camera fit ignores it.
  const hearthstone = buildHearthstone();
  // Its silhouette gets a thin outline all round (a slightly bigger copy turned inside out, like the duck's), in the
  // faint shade of the edge strokes.
  recolour(hearthstone, HEARTHSTONE, 24);
  const stoneHull = new THREE.Mesh(hearthstone.children[0].geometry, new THREE.MeshBasicMaterial({ color: HEARTHSTONE.outline, side: THREE.BackSide }));
  stoneHull.scale.setScalar(HEARTHSTONE.hull);
  stoneHull.raycast = () => {};
  hearthstone.add(stoneHull);
  // Its rune (the user's white spiral on transparent, hearthstone.png), glowing blue, laid on the face's facets: a copy
  // of the stone just in front of it whose picture is projected straight on from the front. Faces turned away get none.
  const runeGeometry = hearthstone.children[0].geometry.clone();
  const runePosition = runeGeometry.attributes.position, runeNormal = runeGeometry.attributes.normal;
  const runeUv = new Float32Array(runePosition.count * 2);
  for (let i = 0; i < runePosition.count; i++) {
    const facingOut = runeNormal.getZ(i) > .2;
    runeUv[i * 2] = facingOut ? (runePosition.getX(i) - HEARTHSTONE.runeCentre[0]) / HEARTHSTONE.runeSize + .5 : -1;
    runeUv[i * 2 + 1] = facingOut ? (runePosition.getY(i) - HEARTHSTONE.runeCentre[1]) / HEARTHSTONE.runeSize + .5 : -1;
  }
  runeGeometry.setAttribute("uv", new THREE.BufferAttribute(runeUv, 2));
  // Its colours are painted into the picture, so the material stays white. Blended rather than cut out, so its edges
  // stay smooth.
  const runeMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff, emissive: 0xffffff, emissiveIntensity: HEARTHSTONE.glow, roughness: 1,
    transparent: true, depthWrite: false,
    visible: false, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1,
  });
  const rune = new THREE.Mesh(runeGeometry, runeMaterial);
  rune.raycast = () => {};
  hearthstone.add(rune);
  new THREE.ImageLoader().loadAsync(new URL("hearthstone.png", import.meta.url).href).then((image) => {
    // The spiral in the rune's blue, with a thin darker rim round it: the shape stamped in the rim colour all round its
    // place, then the shape itself on top.
    const tinted = (colour) => {
      const layer = document.createElement("canvas");
      layer.width = image.width;
      layer.height = image.height;
      const context = layer.getContext("2d");
      context.drawImage(image, 0, 0);
      context.globalCompositeOperation = "source-in";
      context.fillStyle = `#${new THREE.Color(colour).getHexString()}`;
      context.fillRect(0, 0, layer.width, layer.height);
      return layer;
    };
    const canvas = document.createElement("canvas");
    canvas.width = image.width;
    canvas.height = image.height;
    const context = canvas.getContext("2d");
    const rim = tinted(HEARTHSTONE.runeRim), fill = tinted(HEARTHSTONE.rune);
    const width = HEARTHSTONE.runeRimWidth * image.width;
    for (let step = 0; step < 32; step++) {
      const angle = (step / 32) * Math.PI * 2;
      context.drawImage(rim, Math.cos(angle) * width, Math.sin(angle) * width);
    }
    context.drawImage(fill, 0, 0);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 4;
    Object.assign(runeMaterial, { map: texture, emissiveMap: texture, visible: true });
    runeMaterial.needsUpdate = true;
    wake();
  }).catch(() => {});
  const hearthstoneSize = .036;
  hearthstone.scale.setScalar(hearthstoneSize);
  const plinthHeight = .012;
  const plinth = new THREE.Mesh(new THREE.CylinderGeometry(.022, .025, plinthHeight, 8), new THREE.MeshStandardMaterial({ name: "plinth" }));
  plinth.position.y = plinthHeight / 2;
  recolour(plinth, HEARTHSTONE);
  // Its foot sunk a little into the plinth, as if set in it.
  const hearthstoneBounds = new THREE.Box3().setFromObject(hearthstone);
  hearthstone.position.y = plinthHeight - .003 - hearthstoneBounds.min.y;
  const hearthstoneSpot = new THREE.Group();
  hearthstoneSpot.position.copy(inWardrobe(.09, .475, -.13));
  hearthstoneSpot.scale.setScalar(cabinet.scale.x);
  hearthstoneSpot.add(plinth, hearthstone);
  room.add(hearthstoneSpot);
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
  const ledOff = new THREE.Color(RETRO_PC.led), ledOn = new THREE.Color(PC_LED_ON.colour);
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
    ledMaterial.emissive.copy(ledOn).multiplyScalar(t * stutter * PC_LED_ON.glow);
    if (t < .02 && !screen.state.target) display.clear();
  });
  // Coffee in the case: the picture tears and collapses, the computer cuts out and smoke rises from it.
  const shortCircuit = () => {
    crashStart = performance.now();
    fried = true;
  };
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
    addPart(drawer, (t) => { drawer.position.z = rest + t * .16; });  }

  // Clicking the Game Boy switches it on: its LED glows and its screen lights up and plays the boot; clicking again
  // switches it off. Registered after the drawers, so its clicks are its own.
  const gameBoyScreen = gameBoy.getObjectByName("gameBoyScreen").material;
  const gameBoyLed = gameBoy.getObjectByName("gameBoyLed").material;
  const gameBoyDisplay = document.createElement("canvas");
  gameBoyDisplay.width = 160;
  gameBoyDisplay.height = 144;
  const gameBoyPicture = new THREE.CanvasTexture(gameBoyDisplay);
  gameBoyPicture.colorSpace = THREE.SRGBColorSpace;
  gameBoyPicture.magFilter = THREE.NearestFilter;
  const drawGameBoyBoot = (seconds) => {
    const context = gameBoyDisplay.getContext("2d");
    context.fillStyle = GAMEBOY_BOOT.lightest;
    context.fillRect(0, 0, 160, 144);
    const y = THREE.MathUtils.lerp(-10, 72, Math.min(1, seconds / GAMEBOY_BOOT.slide));
    context.fillStyle = GAMEBOY_BOOT.darkest;
    context.font = "bold 30px sans-serif";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText("Nintendo", 80, Math.round(y));
    gameBoyPicture.needsUpdate = true;
  };
  const screenDull = new THREE.Color(GAMEBOY.screen), screenLit = new THREE.Color(0xffffff);
  const gameBoyLedOff = new THREE.Color(GAMEBOY.led), gameBoyLedOn = new THREE.Color(LED_ON);
  let gameBoyStart = 0;
  const gameBoyPower = addPart(gameBoy, (t) => {
    const on = THREE.MathUtils.clamp(t, 0, 1);
    gameBoyScreen.color.lerpColors(screenDull, screenLit, on);
    gameBoyScreen.emissive.setScalar(on * .35);
    gameBoyLed.color.lerpColors(gameBoyLedOff, gameBoyLedOn, on);
    gameBoyLed.emissive.copy(gameBoyLedOn).multiplyScalar(on * .6);
    // Off, the screen is plain again.
    const lit = on > .02 || gameBoyPower.state.target === 1;
    if (lit !== Boolean(gameBoyScreen.map)) {
      gameBoyScreen.map = gameBoyScreen.emissiveMap = lit ? gameBoyPicture : null;
      gameBoyScreen.needsUpdate = true;
    }
  });
  gameBoyPower.onToggle = (on) => {
    if (!on) return;
    gameBoyStart = performance.now();
    drawGameBoyBoot(0);
  };
  gameBoyPower.busy = (now) => {
    if (!gameBoyPower.state.target) return false;
    const seconds = (now - gameBoyStart) / 1000;
    drawGameBoyBoot(seconds);
    return seconds < GAMEBOY_BOOT.end;
  };

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
  // The shaders compile in the background where the browser can, so the first frame doesn't freeze the page; the room
  // fades in once they are ready.
  renderer.compileAsync(scene, camera).catch(() => {}).then(() => {
    compiled = true;
    host?.classList.add("has-room");
    wake();
  });

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

  // The canvas lets clicks through (it overflows onto the text column), so the page listens instead and only acts
  // when the pointer is over a piece of the room; links and buttons keep their own clicks. Off the page, the room
  // ignores them.
  const onControl = (event) => event.target instanceof Element && event.target.closest("a, button, input, .project-dock");
  const pointing = (on) => document.documentElement.classList.toggle("is-pointing-room", on);
  document.addEventListener("pointermove", (event) => {
    if (!attached) return;
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
  });
  // Rapid clicks on the room would otherwise count as double and triple clicks and select nearby text (the page arrows).
  document.addEventListener("mousedown", (event) => {
    if (attached && !onControl(event) && pickHit(event)) event.preventDefault();
  });
  document.addEventListener("click", (event) => {
    if (!attached || onControl(event)) return;
    const hit = pickHit(event);
    // Some things on a door have a click of their own (the hearts) instead of opening or closing it.
    if (hit?.object.userData.onClick) {
      hit.object.userData.onClick();
      wake();
      return;
    }
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
  });

  function resize() {
    // The canvas overflows its frame (see .about-room-canvas) so things can fall or spill past the frame's edges;
    // the camera still frames the room in the frame and renders the overflow around it.
    if (!host) return;
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
    beforeRender?.();
    renderer.render(scene, camera);
    if (moving) wake();
    else last = 0;
  }

  function wake() {
    if (!frame && attached && compiled) frame = requestAnimationFrame(tick);
  }

  return {
    // Read straight after drawing, while the canvas still holds the frame.
    picture(type, quality) {
      beforeRender?.();
      renderer.render(scene, camera);
      return canvas.toDataURL(type, quality);
    },
    // Shows the room in this frame, straight away if it is ready and otherwise once the shaders are in.
    attach(next) {
      host = next;
      host.append(canvas);
      attached = true;
      if (compiled) host.classList.add("has-room");
      resize();
    },
    // Takes the room off this frame's page and stops it drawing; anything still moving carries on when it is back.
    detach(from) {
      // A newer page may already be showing it.
      if (host !== from) return;
      attached = false;
      cancelAnimationFrame(frame);
      frame = 0;
      last = 0;
      pointing(false);
      document.documentElement.classList.remove("is-on-room-screen");
      canvas.remove();
      host = null;
    },
  };
}
