import * as THREE from "../vendor/r180/three.module.js";
import { GLTFLoader } from "../vendor/r180/GLTFLoader.js";
import { mergeGeometries } from "../vendor/r180/BufferGeometryUtils.js";

// Everything is built in code below, in the site's cool greys and blue.
// The slate wardrobe, with light handles.
const CABINET = { body: 0x7d8894, handle: 0xc9d0d6 };
// The toolbox on the wardrobe's bottom shelf: classic red, steel bar and latches, black rubber grip.
const TOOLBOX = { box: 0xc8453b, inside: 0x8f2f28, rim: 0xd9584d, metal: 0xc9d0d6, rubber: 0x2b333b };
// The cartoon claw hammer in it: dark grey shaft in a slightly lighter grey grip, light steel head; its handle length
// and head size (against the head as drawn).
const HAMMER = { handle: 0x2f363d, grip: 0x4d565f, steel: 0x9aa4ae, handleLength: .115, headSize: 1 };
// A Wera Kraftform screwdriver beside it: black handle with Wera green soft pads, steel blade; how far its handle's
// three lobes swell out and in (a fraction of its radius), and how much bigger than drawn it is made so it still reads
// as a Wera once small on the floor.
const SCREWDRIVER = { kraftform: 0x22b573, kraftformBlack: 0x1d2126, chrome: 0x98a2ac, lobes: .07, size: 1.2 };
// Knipex combination pliers behind the hammer: chromed head and its stamped boss, Knipex red and blue two-component
// handles with a grey anti-slip patch; how long they are, nose to handle ends.
const PLIERS = { knipexSteel: 0xcfd5db, knipexMark: 0xcfd5db, knipexRed: 0xd7262e, knipexBlue: 0x2d4fb8, knipexGrey: 0x5b6169,
  length: .121 };
// The dark outline drawn round the tools in it, and its thickness in CSS pixels.
const TOOL_OUTLINE = { colour: 0x1b2127, width: .6 };
// The thin dark strokes on the furniture's and things' hard edges: their colour and how strongly they show (at one
// screen pixel wide).
const EDGE_STROKE = { colour: 0x1b2127, opacity: .4 };
// The Zelda chest behind the toolbox: warm brown wood, dark iron straps, gold lock plate.
const CHEST = { wood: 0x8a5a2e, iron: 0x2f3439, gold: 0xe0b53c, keyhole: 0x1d2126 };
// Zelda clay pots round the chest, hidden with it behind the toolbox: terracotta, a darker band round the shoulder, dark
// inside. Each: x, z on the bottom shelf in wardrobe units, scale, turn.
const POTS = {
  clay: 0xb5653a, band: 0x8a4526, inside: 0x2a1a12,
  pots: [[.088, -.18, 1, 0], [.235, -.185, 1, .6], [.272, -.205, .8, 1.2]],
};
// The VHS cassette left of the toolbox: black shell, white label, smoky window, dark tape round white hubs; it leans
// lean rad on the wardrobe side. Its label's scribbles: [colour, row, from x, to x, crossed out] on a 256 x 64 label.
const VHS = {
  shell: 0x1d2126, label: 0xeeeae0, window: 0x3a4148, tape: 0x241f1c, hub: 0xeef1f3, lean: .25,
  scribbles: [["#c8302a", 0, 14, 150, true], ["#2f5fb0", 0, 160, 236, false], ["#1d2126", 1, 14, 120, true], ["#c8302a", 1, 130, 210, true], ["#2f5fb0", 2, 30, 200, false]],
};
// The toolbox fall, in seconds: land on the floor, settle. Its contents ride along until it lands, then go on alone.
const FALL = { land: .45, end: .75 };
// How the toolbox's contents move once loose, worked out as rigid bodies (see simulateDrops), in wardrobe units:
// gravity (about 2.3 m to a unit), the simulation step and the rate the result is kept at, in seconds; a piece counts
// as at rest once it has stayed within rest units and turn radians of where it was for settle seconds, or after
// longest seconds. The friction of a tool against another, and against the box's painted inside: both slip more than
// a tool on the floor (each tool's own friction).
const DROP = { gravity: 4.2, step: 1 / 600, rate: 120, rest: .0005, turn: .005, settle: .15, longest: 3, slip: .2, boxSlip: .25 };
// The desk built below: same anthracite as before, light pulls, darker drawer insides.
const DESK = { body: 0x3a4148, pull: 0xc9d0d6, inside: 0x2b3238 };
// A drawer slides out travel. What lies in it feels a jolt from how hard the drawer moves (push): it slides once the
// jolt beats friction, then friction stops it; it never ends up further than reach from where it was put. Things differ
// a little in weight (spread); the light cartridges move less (cartridge). Tall things also rock on their base, each
// its own way: tipped over by tip, brought back upright by their weight (upright, rock), swaying sideways by sway.
// The cube is heavy and stiff; the duck is light and bouncy, and wobbles off to the side.
const DRAWER_JOLT = {
  travel: .16, push: .18, friction: .9, reach: .02, spread: .2, cartridge: .7,
  cube: { tip: 12, upright: 330, rock: 9, sway: 0 },
  duck: { tip: 14, upright: 170, rock: 4.5, sway: .45 },
};
// The 90s computer built below: beige-era shapes in the site's light greys, dark screen and power LED that light up.
const RETRO_PC = { case: 0xd3d9de, caseShade: 0xb3bcc4, slot: 0x2b333b, screen: 0x000000, led: 0x2b333b, postIt: 0xf3d34a };
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
// Wayfarer sunglasses on the desk: glossy black frame and arms (frame gloss = roughness), the classic dark green lenses
// with a sheen (shine = roughness), silver rivets.
const SUNGLASSES = { frame: 0x121416, lens: 0x26302a, rivet: 0xd5dade, gloss: .4, shine: .2 };
// Classic cube colours, matched to the scene's existing reds, yellows and blues; the core shows between the cubies.
const RUBIK = { white: 0xeef1f3, yellow: 0xf3d34a, red: 0xc8453b, orange: 0xe8833a, blue: 0x4a86c8, green: 0x49a868, core: 0x2b333b };
// The note on the door: blank paper held by blue tape. Slam the doors enough times in a row (clicks within seconds)
// and the tape gives: the note flutters down to the floor (in seconds), showing a hole knocked through the door
// behind it (splintered rim, dark inside) with a small golden key hidden in it.
// Opening the door lifts the note off it: at most lift (a fraction of its width) at its bottom edge, gathering gust
// per unit of the door's opening speed and dying away over settle seconds, a ripple running down it ripple times a
// second.
const NOTE = { paper: 0xf4f5f2, tape: 0x9cbbe0, slams: 6, within: 2.5, fall: 1.8, lift: .18, gust: 1.5, settle: .45, ripple: 1.6 };
// The key glows: its light colour and strength.
const HOLE = { rim: 0x5f6873, dark: 0x15191d, key: 0xf2c443, glow: 0xffc634, shine: 1.2 };
// Zelda's row of hearts on the door, in pixel art: dark outline, red fill with a white glint, and the used-up ones
// left as dark empty containers. Five hearts, a heart and a half of them full at first (counted in half hearts). Once
// all full, a pale gleam runs along them laps times, flourish seconds each.
const HEARTS = {
  outline: "#2a1416", fill: "#e0303a", glint: "#ffffff", empty: "#5a4a4c", gleam: "#ffc2c6",
  count: 5, startHalves: 3, flourish: .7, laps: 3,
};
// Stickers on the wardrobe door, under the note, all painted on canvases: StarCraft's Terran emblem, Team Vitality's
// bee, Counter-Strike's logo and Twitch's. Each has a white die-cut backing with a cut line in the shade the edge
// strokes give the wardrobe.
// They have seen some life: a corner may have come unstuck and folded back over (how far it stands off the sticker, how
// far in the fold runs as a share of the sticker, and how far over it turns, in degrees), and they are a little faded,
// scuffed, grimy and nicked at the edges. A holo one's rainbow: how strongly it glows, how many bands cross it, and how
// fast they slide as the angle changes.
const STICKERS = {
  cutBacking: "#f4f5f2", cutLine: "#5e6771",
  peel: .0004, peelFrom: .14, fold: 160,
  holo: .22, holoBands: 1.2, holoShift: 3,
  // A glossy one's streak of light: how bright, how narrow (higher is narrower), how many cross it, how fast they slide,
  // and where they sit (a share of the gap between two): off the ink once the door is wide open, so it only shines on
  // the swing.
  gloss: { strength: .45, sharpness: 8, bands: .4, shift: 3, phase: .8 },
  fade: .1, scuffs: 7, scuff: "rgba(255, 255, 255, .45)", grime: "rgba(90, 80, 60, .07)", nicks: 6,
  // StarCraft's Terran emblem (drawn white), reprinted in black. In the game it is yellow: { colour: "#f2c12e", outline:
  // "#1d2125", width: 9 } prints it so, inside a thin dark outline (its width in the picture's pixels).
  terran: { colour: "#000000" },
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
// TARS from Interstellar: brushed metal slabs, a dark display with a pale readout line, its name stencilled in faint
// orange.
const TARS = { metal: 0xaeb5bc, screen: 0x24292e, readout: 0x9cbbe0, name: "#e8833a", nameOpacity: .85 };
// A click makes it walk on the spot: steps in a given time (seconds), how far its legs swing and its body slabs rock
// (radians) and how high the body bobs at each step.
const TARS_STRIDE = { time: 2.6, steps: 4, legs: .3, arms: .025, bob: .006 };
// Meanwhile its readout refreshes: every so often (seconds) each line is rewritten to a new length, from shortest to
// longest (scene units).
const TARS_READOUT = { every: .22, shortest: .005, longest: .021 };
// The rubber duck of rubber-duck debugging: yellow body and head, orange beak, black eyes. A click squeezes it: it
// squashes and hops (times in seconds). Its outline: colour and thickness in desk units.
const DUCK = { body: 0xf3d34a, beak: 0xe8833a, eye: 0x1d2126, outline: 0x2b333b, line: .0012, squeeze: .14, hop: .36 };
// Matrix's red and blue pills in a blister pack: silver foil card, clear bubbles (opacity), one pill of each.
const BLISTER = { foil: 0xc9d0d6, bubble: 0xeef4f8, opacity: .3, red: 0xd0302a, blue: 0x2f6fd0 };
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
// It can be switched off (enabled: it then stays put and ignores clicks). For now (stay) it comes back out where it went
// in, onto the top shelf, instead of travelling between shelves.
const PORTAL_TRIP = { enabled: true, stay: true, open: .3, fall: .35, fly: .4, close: .35 };
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
  const postIt = part(new THREE.BoxGeometry(.06, .06, .002), "postIt", .172, .31, .0445);
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

  // Each door sits slightly back inside the frame; the handles stand either side of the central seam.
  const [doorLeft, doorRight] = [-1, 1].map((side) => {
    const door = new THREE.Group();
    // Hinged on the front outer edge, so the door swings out without cutting into the frame.
    door.position.set(side < 0 ? inside.left : inside.right, inside.bottom, -doorInset);
    part(door, doorWidth, innerHeight, doorDepth, "body", -side * doorWidth / 2, innerHeight / 2, -doorDepth / 2);
    part(door, .015, .06, .02, "handle", -side * (doorWidth - .025), innerHeight * .42, .01);
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
// A click on the pills: first the Matrix takes over whatever the screen shows, for intro seconds: it goes wrong now and
// then, then more and more (the same bugs as the rain's, below), with up to lines thin green lines flashing across it
// at once and its colours draining to green, and goes dark over its last dark seconds.
// Then the code rain, in seconds (time, fading in and out over fade): a grid of columns x rows, each column falling
// at a speed between speed[0] and speed[1] rows a second with a trail of symbols.
// Its bugs: the rain is cut into stretches of every seconds; in odds of them it glitches for length seconds (a torn
// band tall[0] to tall[1] px high, its slices slid up to reach / 2 px, or a roll of the whole picture), the
// whole screen warped in waves up to wave px.
const MATRIX = {
  intro: 1.6, lines: 9, dark: .25,
  time: 3.5, fade: .35, columns: 18, rows: 14, trail: 9, speed: [12, 24],
  bugs: { every: .45, length: .18, odds: .9, reach: 90, tall: [24, 70], wave: 10 },
  black: "#020803", rain: "#22d34b", head: "#d8ffe0", glyphs: "ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜ0123456789Z:.=*+<>",
};
// Then the message, typed out at rate letters a second in size px type, its cursor blinking every blink seconds,
// left on screen for hold seconds once typed: it flickers on about flicker of its frames, and tears apart and fades
// away over its last out seconds.
const MATRIX_MESSAGE = { text: "Wake up...", size: 32, rate: 14, blink: .45, hold: 2, flicker: .12, out: .5 };
// The whole show: the takeover, the rain, then the message typed and left a moment.
const MATRIX_END = MATRIX.intro + MATRIX.time + MATRIX_MESSAGE.text.length / MATRIX_MESSAGE.rate + MATRIX_MESSAGE.hold;
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
  // An old tube switching off, u from 0 to 1: the picture squashes into a bright line (of colour line, on dark), then a
  // dot, then black.
  const collapse = (u, line = SCREEN.flash, dark = SCREEN.black) => {
    rect(dark, 0, 0, width, height);
    const lineHeight = u < .5 ? THREE.MathUtils.lerp(height, 3, u / .5) : 3;
    const lineWidth = u < .5 ? width : THREE.MathUtils.lerp(width, 3, (u - .5) / .5);
    if (u < 1) rect(line, (width - lineWidth) / 2, (height - lineHeight) / 2, lineWidth, lineHeight);
  };
  // A short circuit, seconds in: the desktop tears and flashes, then the picture collapses. If it hits during the
  // Matrix show (show: how far into it), the show carries on instead, torn by its green bugs at their worst with green
  // flashes, and collapses into a green line.
  const crash = (seconds, show = null) => {
    blank = false;
    const u = Math.min(1, (seconds - CRASH.tear) / (CRASH.end - CRASH.tear));
    if (show === null) {
      if (seconds < CRASH.tear) tear(seconds, desktop);
      else collapse(u);
    } else if (seconds < CRASH.tear) {
      matrix(show + seconds);
      const frame = Math.floor(seconds * 30);
      greenBugs(frame, 1);
      greenBugs(frame + 101, 1);
      greenify(1);
      greenLines(frame, MATRIX.lines);
      if (frame % 4 === 0) { context.globalAlpha = .45; rect(MATRIX.head, 0, 0, width, height); context.globalAlpha = 1; }
    } else collapse(u, MATRIX.head, MATRIX.black);
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
  // A repeatable random number in [0, 1) for each n.
  const chance = (n) => { const x = Math.sin(n * 91.7 + 17.3) * 43758.5453; return x - Math.floor(x); };
  // The picture between from and to cut into thin bands, most of them slid sideways by up to reach / 2; frame picks
  // the pattern.
  const slip = (frame, reach, from = 0, to = height) => {
    copyContext.drawImage(canvas, 0, 0);
    rect(MATRIX.black, 0, from, width, to - from);
    for (let top = from, n = 0; top < to; n++) {
      const band = Math.min(to - top, 2 + Math.floor(chance(frame * 31 + n) * 6));
      const shift = chance(frame * 17 + n + 300) < .65 ? (chance(frame * 7 + n + 600) - .5) * reach : 0;
      context.drawImage(copy, 0, top, width, band, shift, top, width, band);
      top += band;
    }
  };
  // The whole picture rolled down by a jumping amount, what drops off the bottom coming back in at the top, with a
  // bright green seam; frame picks the amount.
  const roll = (frame) => {
    const drop = Math.floor(height * (.15 + chance(frame + 350) * .5));
    copyContext.drawImage(canvas, 0, 0);
    context.drawImage(copy, 0, 0, width, height - drop, 0, drop, width, height - drop);
    context.drawImage(copy, 0, height - drop, width, drop, 0, 0, width, drop);
    rect(MATRIX.rain, 0, drop - 1, width, 2);
  };
  // Each thin row slid sideways along a wave up to wave px that ripples down the screen; frame picks where it is.
  const warp = (frame, wave) => {
    copyContext.drawImage(canvas, 0, 0);
    rect(MATRIX.black, 0, 0, width, height);
    const phase = chance(frame + 420) * Math.PI * 2;
    for (let y = 0; y < height; y += 2) {
      const shift = Math.sin(y * .06 + phase) * wave + Math.sin(y * .23 + phase * 3) * wave * .35;
      context.drawImage(copy, 0, y, width, 2, shift, y, width, 2);
    }
  };
  // Every colour in the picture turned towards the rain's green by amount (0 to 1), keeping its lightness.
  const greenify = (amount) => {
    context.globalCompositeOperation = "color";
    context.globalAlpha = amount;
    rect(MATRIX.rain, 0, 0, width, height);
    context.globalAlpha = 1;
    context.globalCompositeOperation = "source-over";
  };
  // The Matrix's bugs at strength u (0 to 1), frame picking their pattern: a band of the picture slips sideways, from
  // u .4 it also warps and from u .5 it may roll.
  const greenBugs = (frame, u) => {
    const { reach, tall, wave } = MATRIX.bugs;
    const bandHeight = (tall[0] + chance(frame + 140) * (tall[1] - tall[0])) * (.5 + u);
    const top = chance(frame + 210) * (height - bandHeight);
    slip(frame, reach * (.3 + .7 * u), top, top + bandHeight);
    if (u > .5 && chance(frame + 800) < .4) roll(frame);
    if (u > .4) warp(frame, wave * u);
  };
  // count thin green lines flashing across the picture, frame picking where: most across the whole screen, some only
  // part of it; a few pale like the rain's heads. 2 to 4 px, as the screen is shown small.
  const greenLines = (frame, count) => {
    for (let i = 0; i < count; i++) {
      const n = frame * 13 + i * 5;
      const whole = chance(n + 1200) < .6, from = whole ? 0 : chance(n + 1201) * width * .7;
      context.globalAlpha = .5 + chance(n + 1202) * .5;
      rect(chance(n + 1203) < .25 ? MATRIX.head : MATRIX.rain, from, Math.floor(chance(n + 1204) * height),
        whole ? width : width * (.15 + chance(n + 1205) * .5), 2 + Math.floor(chance(n + 1206) * 3));
    }
    context.globalAlpha = 1;
  };

  // What the screen showed when the Matrix took over: its picture, or black if it was off (beforeBlank).
  const before = document.createElement("canvas");
  before.width = width;
  before.height = height;
  let beforeBlank = false;
  const keepBefore = () => {
    const beforeContext = before.getContext("2d");
    beforeContext.fillStyle = MATRIX.black;
    beforeContext.fillRect(0, 0, width, height);
    if (!blank) beforeContext.drawImage(canvas, 0, 0);
    beforeBlank = blank;
  };
  // The Matrix taking over, seconds in. The picture kept by keepBefore goes wrong now and then, then more and more
  // often until it never stops: a band of it slips sideways, later it also rolls and warps; its colours drain to green;
  // and it goes dark for the rain. A dark screen instead lets the rain break through in torn bands, a few now and then
  // at first, then more and more, slid sideways less and less, until the rain fills it and carries on. Either way thin
  // green lines, a few then many, flash across it.
  const takeOver = (seconds) => {
    const { intro, lines, dark, bugs } = MATRIX;
    const u = Math.min(1, seconds / intro), frame = Math.floor(seconds * 24);
    if (beforeBlank) {
      drawRain(seconds);
      copyContext.drawImage(canvas, 0, 0);
      rect(MATRIX.black, 0, 0, width, height);
      // The bands change a dozen times a second.
      const pattern = Math.floor(seconds * 12);
      for (let top = 0, n = 0; top < height; n++) {
        const band = Math.min(height - top, 6 + Math.floor(chance(pattern * 37 + n) * 26));
        if (chance(pattern * 53 + n + 1500) < .04 + .96 * u * u) {
          const shift = (chance(pattern * 19 + n + 1600) - .5) * bugs.reach * (1 - u);
          context.drawImage(copy, 0, top, width, band, shift, top, width, band);
        }
        top += band;
      }
    } else {
      context.drawImage(before, 0, 0);
      if (chance(frame + 700) < .15 + .85 * u * u) greenBugs(frame, u);
      greenify(u * u);
    }
    greenLines(frame, Math.round(lines * u * u) + (chance(frame + 900) < .3 + u ? 1 : 0));
    const fade = (seconds - (intro - dark)) / dark;
    if (fade > 0 && !beforeBlank) { context.globalAlpha = Math.min(1, fade); rect(MATRIX.black, 0, 0, width, height); context.globalAlpha = 1; }
    texture.needsUpdate = true;
  };
  // The Matrix show, seconds in: the takeover, the rain, then the message.
  const matrix = (seconds) => {
    blank = false;
    if (seconds < MATRIX.intro) takeOver(seconds);
    else if (seconds < MATRIX.intro + MATRIX.time) rain(seconds);
    else message(seconds - MATRIX.intro - MATRIX.time);
  };
  // The Matrix's falling green code, seconds into the show: columns of symbols raining at their own speeds, each led
  // by a pale head and trailing off into the dark; the symbols keep changing.
  const drawRain = (seconds) => {
    const { columns, rows, trail, speed } = MATRIX;
    const cellWidth = width / columns, cellHeight = height / rows;
    rect(MATRIX.black, 0, 0, width, height);
    context.font = `700 ${Math.round(cellHeight * .9)}px monospace`;
    context.textAlign = "center";
    context.textBaseline = "middle";
    // The same column always gets the same speed and start, so the rain flows from frame to frame.
    const hash = (n) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
    for (let column = 0; column < columns; column++) {
      const rate = speed[0] + hash(column) * (speed[1] - speed[0]);
      const head = (seconds * rate + hash(column + 50) * (rows + trail)) % (rows + trail);
      for (let back = 0; back < trail; back++) {
        const row = Math.floor(head) - back;
        if (row < 0 || row >= rows) continue;
        const symbol = MATRIX.glyphs[Math.floor(hash(column * 31 + row * 7 + Math.floor(seconds * 9 + hash(row + column)) * 13) * MATRIX.glyphs.length)];
        context.fillStyle = back === 0 ? MATRIX.head : MATRIX.rain;
        context.globalAlpha = back === 0 ? 1 : 1 - back / trail;
        context.fillText(symbol, (column + .5) * cellWidth, (row + .5) * cellHeight);
      }
    }
    context.globalAlpha = 1;
  };
  // The rain on its own, seconds into the show (from MATRIX.intro): fades in from black, unless it broke through a
  // dark screen and is already there, and out to black.
  const rain = (show) => {
    drawRain(show);
    const seconds = show - MATRIX.intro;
    // Bugs in the Matrix: in most stretches of the rain, the picture glitches for a split second. The whole screen
    // warps in waves, and each time something else goes wrong too, in turn: a band of it tears sideways, or the whole
    // picture rolls down like a losing hold. All in the rain's green.
    const { every, length, odds, reach, tall, wave } = MATRIX.bugs;
    const stretch = Math.floor(seconds / every), start = stretch * every + chance(stretch) * (every - length);
    if (stretch > 0 && chance(stretch + 70) < odds && seconds >= start && seconds < start + length) {
      const bandHeight = tall[0] + chance(stretch + 140) * (tall[1] - tall[0]);
      const top = chance(stretch + 210) * (height - bandHeight);
      const frame = Math.floor(seconds * 24);
      const kind = ["tear", "roll"][stretch % 2];
      if (kind === "tear") slip(frame, reach, top, top + bandHeight);
      else roll(frame);
      warp(frame, wave);
      // Back to the rain's green: any colour the glitches made takes its hue, keeping its lightness.
      greenify(1);
    }
    const fade = Math.max(0, beforeBlank ? 0 : 1 - seconds / MATRIX.fade, 1 - (MATRIX.time - seconds) / MATRIX.fade);
    if (fade > 0) { context.globalAlpha = Math.min(1, fade); rect(SCREEN.black, 0, 0, width, height); context.globalAlpha = 1; }
    texture.needsUpdate = true;
  };
  // After the rain, seconds in: the message typed out letter by letter on the black screen, top left, with a blinking
  // block cursor after it. Once typed it flickers now and then, and at the end it tears apart and fades away.
  const message = (seconds) => {
    const { text, size, rate, blink, hold, flicker, out } = MATRIX_MESSAGE;
    rect(MATRIX.black, 0, 0, width, height);
    context.font = `700 ${size}px monospace`;
    context.textAlign = "left";
    context.textBaseline = "top";
    context.fillStyle = MATRIX.rain;
    const frame = Math.floor(seconds * 24), typedAt = text.length / rate, leaving = seconds - (typedAt + hold - out);
    // A flicker: a frame here and there drawn faint and nudged sideways.
    const flickering = seconds > typedAt && chance(frame) < flicker;
    if (flickering) {
      context.globalAlpha = .3 + chance(frame + 500) * .3;
      context.translate(Math.round((chance(frame + 900) - .5) * 8), 0);
    }
    // Broken into lines between words wherever it would run past the screen's right margin.
    const margin = 14, lineHeight = size * 1.3, lines = [""];
    for (const word of text.split(" ")) {
      const line = lines[lines.length - 1], longer = line ? `${line} ${word}` : word;
      if (line && context.measureText(longer).width > width - 2 * margin - size * .6) lines.push(word);
      else lines[lines.length - 1] = longer;
    }
    let left = Math.floor(seconds * rate), x = margin, y = margin + 6;
    lines.forEach((line, i) => {
      if (left <= 0 && i > 0) return;
      const shown = line.slice(0, Math.max(0, left));
      context.fillText(shown, margin, margin + 6 + i * lineHeight);
      x = margin + context.measureText(shown).width;
      y = margin + 6 + i * lineHeight;
      // The space at the line break counts as a letter typed.
      left -= line.length + 1;
    });
    const typing = Math.floor(seconds * rate) < text.length;
    if (leaving < 0 && (typing || Math.floor(seconds / blink) % 2 === 0)) rect(MATRIX.rain, x + 2, y, size * .55, size);
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.globalAlpha = 1;
    // Leaving: the text cut into thin bands slid sideways, further and further, while it fades to black.
    if (leaving > 0) {
      const u = Math.min(1, leaving / out);
      slip(frame, 70 * u);
      context.globalAlpha = u * u;
      rect(MATRIX.black, 0, 0, width, height);
      context.globalAlpha = 1;
    }
    texture.needsUpdate = true;
  };
  clear();
  return { texture, draw: show, clear, click, reset, crash, fail, keepBefore, matrix, point, width, height };
}

// A VHS cassette standing on its long edge on y = 0, its top face (label and window) towards +z: .095 long, .052 tall,
// .013 thick, about half life size like the wardrobe's other things. On that face, a white label along the top and the
// window below it, showing the two reels of tape round their white hubs.
function buildVhs() {
  const vhs = new THREE.Group();
  const add = (geometry, material, x, y, z) => {
    const mesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ name: material }));
    mesh.position.set(x, y, z);
    vhs.add(mesh);
    return mesh;
  };
  const long = .095, tall = .052, thick = .013, face = thick / 2;
  add(new THREE.BoxGeometry(long, tall, thick), "shell", 0, tall / 2, 0);
  add(new THREE.BoxGeometry(long * .82, tall * .26, .0008), "label", 0, tall * .76, face + .0004).name = "label";
  add(new THREE.BoxGeometry(long * .62, tall * .34, .0008), "window", 0, tall * .38, face + .0004);
  // Round shapes: no edge strokes, they would only draw smudges.
  for (const side of [-1, 1]) {
    const tape = add(new THREE.CylinderGeometry(tall * .15, tall * .15, .0006, 24).rotateX(Math.PI / 2), "tape", side * long * .22, tall * .38, face + .0011);
    const hub = add(new THREE.CylinderGeometry(tall * .06, tall * .06, .0006, 16).rotateX(Math.PI / 2), "hub", side * long * .22, tall * .38, face + .0015);
    tape.userData.noEdges = hub.userData.noEdges = true;
  }
  return vhs;
}

// A small Zelda treasure chest standing on y = 0, its front towards +z: a wooden box under a rounded lid, held by dark
// iron straps and a rim, with a gold lock plate on the front. .07 wide, .045 deep, about .046 tall. The lid is its own
// group hinged on the back top edge (named "lid"), ready to open.
function buildChest() {
  const chest = new THREE.Group();
  const width = .07, depth = .045, body = .024, radius = depth / 2;
  const add = (parent, geometry, material, x, y, z) => {
    const mesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ name: material }));
    mesh.position.set(x, y, z);
    parent.add(mesh);
    return mesh;
  };
  add(chest, new THREE.BoxGeometry(width, body, depth), "wood", 0, body / 2, 0);
  // The lid: half a log lying along x, hinged at the back.
  const lid = new THREE.Group();
  lid.name = "lid";
  lid.position.set(0, body, -radius);
  chest.add(lid);
  const dome = (r, length, material) => add(lid, new THREE.CylinderGeometry(r, r, length, 20, 1, false, 0, Math.PI).rotateZ(Math.PI / 2), material, 0, 0, radius);
  dome(radius, width, "wood");
  // Iron straps over the lid and down the body, and a rim where the lid meets the body.
  for (const x of [-width * .3, width * .3]) {
    dome(radius + .0012, .007, "iron").position.x = x;
    add(chest, new THREE.BoxGeometry(.007, body, depth + .0024), "iron", x, body / 2, 0);
  }
  add(chest, new THREE.BoxGeometry(width + .002, .004, depth + .002), "iron", 0, body - .002, 0);
  // The gold lock plate hanging from the lid's front edge, with its keyhole.
  add(chest, new THREE.BoxGeometry(.014, .016, .002), "gold", 0, body - .004, depth / 2 + .0012);
  add(chest, new THREE.BoxGeometry(.003, .006, .001), "keyhole", 0, body - .006, depth / 2 + .0025);
  return chest;
}

// A Zelda clay pot standing on y = 0: round belly, narrow neck, flared lip, a darker band round the shoulder and a dark
// mouth. .036 tall, .035 across the belly.
function buildPot() {
  const pot = new THREE.Group();
  const lathe = (points, material) => {
    const mesh = new THREE.Mesh(new THREE.LatheGeometry(points.map(([r, y]) => new THREE.Vector2(r, y)), 24), new THREE.MeshStandardMaterial({ name: material }));
    // Round shapes: no edge strokes, they would only draw smudges.
    mesh.userData.noEdges = true;
    pot.add(mesh);
    return mesh;
  };
  lathe([[0, 0], [.011, 0], [.0155, .005], [.0175, .013], [.0165, .021], [.0125, .028], [.0085, .031], [.0085, .033], [.0105, .035], [.011, .036], [.0075, .036], [.0072, .033]], "clay");
  lathe([[.0172, .017], [.0178, .0175], [.0178, .0205], [.0168, .021]], "band");
  const mouth = new THREE.Mesh(new THREE.CircleGeometry(.0074, 20).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ name: "inside" }));
  mouth.position.y = .033;
  mouth.userData.noEdges = true;
  pot.add(mouth);
  return pot;
}

// An open red metal tote toolbox: rolled rim, latches, tapered ends holding a carry bar with a rubber grip.
// Stands on y = 0, about .2 wide and .1 deep in the wardrobe's units.
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

  // Loose pieces: they fall out when the box is knocked over.
  // The hammer lying on its side on the box floor, handle to the left, head to the right with the claw to the back: the
  // head just fits across between the front and back walls.
  const hammer = buildHammer();
  hammer.position.set(-.07, .006 + .009 * HAMMER.headSize, .012);
  hammer.rotation.set(Math.PI / 2, Math.PI / 2, 0, "YXZ");
  toolbox.add(hammer);
  // The screwdriver lying on top of the pliers (placed below), along the groove between their handles, handle to the
  // left, blade to the right, on the face between two lobes of its handle.
  const screwdriver = buildScrewdriver();
  screwdriver.position.set(-.088, .0289, -.0205);
  screwdriver.rotation.set(0, Math.PI / 3, -Math.PI / 2, "ZXY");
  toolbox.add(screwdriver);
  // The pliers lying flat on the box floor on their guards, under the screwdriver, in the strip behind the hammer's
  // handle, handles to the left, nose to the right short of the hammer's head, the stamped boss up.
  const pliers = buildPliers();
  pliers.position.set(.029, .006 + 72 * PLIERS.length / 1275, -.0205);
  pliers.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(new THREE.Vector3(-1, 0, 0), new THREE.Vector3(0, 0, 1),
    new THREE.Vector3(0, 1, 0)));
  toolbox.add(pliers);
  return { toolbox, loose: [hammer, screwdriver, pliers] };
}

// A Wera Kraftform Plus screwdriver (after the user's photos, tmp/kraft*) lying along +y from the end of its handle at
// y = 0, its handle measured off the side view (tmp/kraft.PNG): rounded triangular section (three lobes) in black hard
// plastic, a domed back end, swelling to its thickest a little behind the middle then slimming down a long neck to a
// big hexagonal anti-roll collar. Two rings of green soft pads, one behind and one in front of the thickest part with a
// black band between them: six long pads with round ends round each ring, one on each lobe and one on each face, thin
// black gaps between them (the real one joins them by thin green bars, left out here). Then a round steel blade with a
// cross tip, shorter than life so it fits the box. Drawn about .1 long, then scaled by SCREWDRIVER.size.
function buildScrewdriver() {
  const screwdriver = new THREE.Group();
  const { lobes } = SCREWDRIVER;
  // The handle's turned profile (radius, y), and its surface's distance from the axis at y and a lobe angle (from +x
  // towards +z, the lobes at 0 and every third of a turn).
  const profile = [[0, 0], [.003, .00013], [.005, .00053], [.0063, .0012], [.007, .002], [.0087, .0053], [.01, .01],
    [.0107, .0147], [.011, .0187], [.0109, .022], [.0103, .0267], [.0093, .03], [.0087, .036], [.008, .0413], [.0072, .048],
    [.0067, .0533], [.0068, .0565], [0, .0565]];
  const radiusAt = (y, angle) => {
    const k = profile.findIndex(([, py], i) => i > 0 && py >= y);
    const [r0, y0] = profile[Math.max(0, k - 1)], [r1, y1] = profile[Math.max(0, k)];
    const r = y1 > y0 ? r0 + (r1 - r0) * (y - y0) / (y1 - y0) : r1;
    return r * (1 + lobes * Math.cos(3 * angle));
  };
  const handle = new THREE.LatheGeometry(profile.map(([r, y]) => new THREE.Vector2(r, y)), 48);
  const position = handle.attributes.position;
  for (let i = 0; i < position.count; i++) {
    const x = position.getX(i), z = position.getZ(i);
    const swell = 1 + lobes * Math.cos(3 * Math.atan2(z, x));
    position.setX(i, x * swell);
    position.setZ(i, z * swell);
  }
  handle.computeVertexNormals();
  const add = (geometry, y, material) => {
    const mesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ name: material }));
    mesh.position.y = y;
    mesh.userData.noEdges = true;
    screwdriver.add(mesh);
    return mesh;
  };
  add(handle, 0, "kraftformBlack");
  // The green pads, all in one mesh: each a patch a little proud of the handle, centred on a lobe angle and a height,
  // half as wide (radians) and half as tall, its ends rounded off as round as it is wide and its rim tucked down into
  // the handle.
  const vertices = [], index = [];
  const pad = (angle, y, wide, tall) => {
    const across = 16, along = 32, raise = .0004, tuck = -.0004;
    const end = Math.min(tall, wide * radiusAt(y, angle));
    const first = vertices.length / 3, row = across + 3;
    for (let j = 0; j <= along + 2; j++) {
      const t = THREE.MathUtils.clamp(-1 + 2 * (j - 1) / along, -1, 1);
      // Rows bunch up towards the round ends, where the outline turns fastest.
      const v = Math.sin(t * Math.PI / 2);
      const past = Math.abs(v) * tall - (tall - end);
      const width = past > 0 ? wide * Math.sqrt(Math.max(0, 1 - (past / end) ** 2)) : wide;
      for (let i = 0; i < row; i++) {
        const u = THREE.MathUtils.clamp(-1 + 2 * (i - 1) / across, -1, 1);
        const rim = i === 0 || i === row - 1 || j === 0 || j === along + 2;
        const a = angle + u * width, h = y + v * tall;
        const r = radiusAt(h, a) + (rim ? tuck : raise);
        vertices.push(Math.cos(a) * r, h, Math.sin(a) * r);
      }
    }
    for (let j = 0; j < along + 2; j++) for (let i = 0; i < row - 1; i++) {
      const p = first + j * row + i;
      index.push(p, p + row, p + 1, p + 1, p + row, p + row + 1);
    }
  };
  for (const { y, tall } of [{ y: .0095, tall: .0078 }, { y: .0297, tall: .0077 }]) {
    for (let k = 0; k < 6; k++) pad(k * Math.PI / 3, y, .41, tall);
  }
  const pads = new THREE.BufferGeometry();
  pads.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
  pads.setIndex(index);
  pads.computeVertexNormals();
  // Drawn without the tools' dark outline, which would only ring each pad.
  add(pads, 0, "kraftform").userData.noOutline = true;
  // The collar: a six-sided barrel with flat faces, then the blade and its cross tip.
  const collar = new THREE.LatheGeometry([[0, .0563], [.0074, .0563], [.0085, .0573], [.0089, .0585], [.0085, .0597],
    [.0074, .0607], [.0026, .061], [0, .061]].map(([r, y]) => new THREE.Vector2(r, y)), 6).toNonIndexed();
  collar.computeVertexNormals();
  add(collar, 0, "kraftformBlack");
  add(new THREE.CylinderGeometry(.0021, .0021, .037, 12), .061 + .037 / 2, "chrome");
  add(new THREE.CylinderGeometry(.0006, .0021, .005, 4), .098 + .0025, "chrome");
  const { size } = SCREWDRIVER;
  for (const part of screwdriver.children) part.position.multiplyScalar(size), part.scale.setScalar(size);

  // As a rigid body (see simulateDrops), mass 1: plastic handle and steel blade, so the centre of mass sits near the
  // collar. Inertia of a thin rod, very little about its own axis. Contact points: the three lobes along the handle (on
  // which it rests, and which stop it rolling far), and the blade. Plastic on the floor: a livelier knock than the
  // hammer's. For knocks against the other pieces: the handle and the blade as capsules.
  const ridges = [.002, .0095, .0187, .03, .045, .055];
  const points = ridges.flatMap((y) => [0, 1, 2].map((k) => {
    const angle = k * Math.PI * 2 / 3, r = radiusAt(y, angle);
    return [Math.cos(angle) * r, y, Math.sin(angle) * r];
  }));
  for (const y of [.07, .085, .102]) for (const [x, z] of [[.0021, 0], [-.0021, 0], [0, .0021], [0, -.0021]]) points.push([x, y, z]);
  screwdriver.userData.body = {
    com: new THREE.Vector3(0, .042 * size, 0),
    inertia: new THREE.Vector3(.0009, .00004, .0009).multiplyScalar(size * size),
    points: points.map(([x, y, z]) => new THREE.Vector3(x, y, z).multiplyScalar(size)),
    bounce: .25,
    friction: .4,
    capsules: [
      { a: new THREE.Vector3(0, .008 * size, 0), b: new THREE.Vector3(0, .046 * size, 0), radius: .0105 * size },
      { a: new THREE.Vector3(0, .056 * size, 0), b: new THREE.Vector3(0, .102 * size, 0), radius: .0025 * size },
    ],
  };
  return screwdriver;
}

// Knipex combination pliers (03 05 180) after the user's photos (tmp/knipex*), closed, their outline measured pixel by
// pixel off the flat side view (tmp/knipex3.jpg: nose at x 205 px, handle ends near 1480, both halves averaged into a
// mirror pair). Drawn with their length along +x from the nose at x = 0, the upper handle towards +y and the face with
// the joint's stamped boss towards +z, PLIERS.length long. The head: two chromed jaws meeting on the centre line, fine
// teeth at the nose, a pipe grip with three big teeth each side, then the cutting edges up to the joint, chamfered all
// round and thinning towards the nose; on the joint a raised boss stamped KNIPEX 03-180 GERMANY with a six-lobed rivet
// in its middle. Each handle: a faceted red guard behind the joint, then a rounded grip, red on its inner side and blue
// on its outer side, the blue wide near the guard with a grey anti-slip patch along the outer edge, thinning to a
// strip down the middle and widening again over the rounded end.
function buildPliers() {
  const pliers = new THREE.Group();
  const k = PLIERS.length / 1275;
  // A point of the photo (x px, height px above the centre line) in the pliers' own space.
  const at = (x, y) => new THREE.Vector2((x - 205) * k, y * k);
  const add = (geometry, material, edges = false) => {
    const mesh = new THREE.Mesh(geometry, Array.isArray(material)
      ? material.map((name) => new THREE.MeshStandardMaterial({ name }))
      : new THREE.MeshStandardMaterial({ name: material }));
    mesh.userData.noEdges = !edges;
    pliers.add(mesh);
    return mesh;
  };
  // A value read off a table of [x px, value] rows at x, straight between the rows.
  const read = (table, x, column = 1) => {
    if (x <= table[0][0]) return table[0][column];
    const i = table.findIndex((row) => row[0] >= x);
    if (i < 0) return table.at(-1)[column];
    const a = table[i - 1], b = table[i];
    return a[column] + (b[column] - a[column]) * (x - a[0]) / (b[0] - a[0]);
  };

  // The head, 70 px thick at the joint and .55 of that at the nose. The jaws' meeting line from the nose back: fine
  // teeth, then the pipe grip (the upper jaw's side of it; the lower jaw's is its mirror), then the cutting edges a
  // hair apart back to the handles.
  const half = 35;
  const teeth = [];
  for (let i = 0; i < 7; i++) teeth.push([206 + i * 9.4, 0], [206 + (i + .5) * 9.4, 5]);
  teeth.push([272, 0]);
  const grip = [[282, 8], [287, 6], [294, 18], [299, 12], [306, 20], [311, 14], [318, 20], [324, 15], [348, 1.5]];
  for (const side of [1, -1]) {
    const outline = [[206, 20 * side], [410, 87 * side], [600, 87 * side], [600, 1.5 * side],
      ...grip.map(([x, y]) => [x, y * side]).reverse(), ...[...teeth].reverse()];
    const bevel = .00022;
    const depth = 2 * half * k - 2 * bevel;
    const geometry = new THREE.ExtrudeGeometry(new THREE.Shape(outline.map(([x, y]) => at(x, y))), {
      depth, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelOffset: -bevel, bevelSegments: 1,
    }).translate(0, 0, -depth / 2);
    const position = geometry.attributes.position;
    for (let i = 0; i < position.count; i++) {
      const u = THREE.MathUtils.smoothstep(position.getX(i) / k + 205, 206, 430);
      position.setZ(i, position.getZ(i) * (.55 + .45 * u));
    }
    geometry.computeVertexNormals();
    add(geometry, "knipexSteel", true);
  }
  // The boss on the joint, a little proud of the head, stamped on its face (the stamp is drawn on once the pliers are
  // recoloured, see knipexStamp), with the rivet's six-lobed head in its middle; the rivet's plain other end below.
  const joint = at(533, -5);
  const boss = add(new THREE.CylinderGeometry(80 * k, 85 * k, 6 * k, 64).rotateX(Math.PI / 2),
    ["knipexSteel", "knipexMark", "knipexSteel"]);
  boss.name = "knipexBoss";
  boss.position.set(joint.x, joint.y, (half + 1) * k);
  const flower = new THREE.Shape();
  for (let i = 0; i <= 96; i++) {
    const angle = i / 96 * Math.PI * 2, r = 28 * k * (1 + .13 * Math.cos(6 * angle));
    flower[i ? "lineTo" : "moveTo"](Math.cos(angle) * r, Math.sin(angle) * r);
  }
  const rivet = add(new THREE.ExtrudeGeometry(flower, { depth: 1.5 * k, bevelEnabled: true, bevelThickness: k,
    bevelSize: k, bevelSegments: 2 }), "knipexSteel");
  rivet.position.set(joint.x, joint.y, (half + 4) * k);
  const pin = add(new THREE.CylinderGeometry(52 * k, 56 * k, 4 * k, 48).rotateX(-Math.PI / 2), "knipexSteel");
  pin.position.set(joint.x, joint.y, -(half + .5) * k);
  for (const part of [boss, rivet, pin]) part.userData.noOutline = true;

  // The handles, measured as [x px, outer edge, inner edge, half thickness] in px from the centre line: the guard, then
  // the grip up to where its rounded end starts. Along the grip, the blue's inner border and the grey patch's, across
  // the grip from -1 on its inner edge to 1 on its outer edge (beyond 1: none).
  const guard = [[600, 106.5, 2, 36], [615, 120, 2.5, 48], [630, 132, 3, 57], [650, 147, 5, 65], [665, 154, 6.5, 70],
    [680, 160, 7.5, 72], [695, 155, 9.5, 71], [710, 145.5, 12, 68], [722, 140, 14.5, 65], [732, 136.5, 16, 63]];
  const handle = [[725, 136, 16, 63], [740, 134, 18, 62], [760, 130.5, 22.5, 60], [780, 131.5, 27, 59], [800, 135, 31.5, 58],
    [830, 141.5, 39, 56], [850, 146.5, 44, 55], [870, 151, 48.5, 54.5], [900, 158.5, 56.5, 53.5], [930, 165, 63.5, 52.5],
    [950, 170, 68.5, 52], [980, 176.5, 77, 51], [1000, 180.5, 80.5, 50.5], [1030, 184.5, 88, 50], [1060, 188, 93.5, 49.5],
    [1100, 190.5, 98.5, 49], [1130, 191, 99, 48.5], [1160, 190.5, 99, 48], [1200, 187.5, 95.5, 47.5],
    [1250, 181, 91, 47], [1300, 172.5, 85.5, 46], [1350, 164, 80.5, 45], [1400, 156.5, 77, 44], [1440, 150, 76.5, 43]];
  const blue = [[725, 0], [760, -.1], [800, -.15], [900, -.14], [930, -.09], [945, .2], [960, .48], [980, .62],
    [1000, .67], [1350, .66], [1370, .58], [1380, .41], [1390, .07], [1400, -.08], [1440, -.1]];
  const grey = [[725, 1.1], [745, .85], [860, .85], [880, 1.1]];
  // The grip's section: a rounded square (squareness 3), out along n (in the pliers' plane) and up along z.
  const square = 3;
  const bend = (v) => Math.sign(v) * Math.abs(v) ** (2 / square);
  // Where across the section a border at b (-1 inner .. 1 outer) falls, as an angle from the outer edge.
  const angleOf = (b) => Math.acos(THREE.MathUtils.clamp(Math.sign(b) * Math.abs(b) ** (square / 2), -1, 1));
  for (const side of [1, -1]) {
    // A tube through sections: each { centre (Vector2), across (Vector2, half width in the plane), up (half thickness),
    // from, to (angles round it, 0 = the outer edge, a quarter turn = the +z face) }; segments round each.
    const tube = (sections, segments, flat = false) => {
      const vertices = [], index = [];
      sections.forEach(({ centre, across, up, from, to }, j) => {
        for (let i = 0; i <= segments; i++) {
          const angle = from + (to - from) * i / segments;
          const p = centre.clone().addScaledVector(across, bend(Math.cos(angle)));
          vertices.push(p.x, p.y * side, up * bend(Math.sin(angle)));
          if (j && i < segments) {
            const a = (j - 1) * (segments + 1) + i, b = a + segments + 1;
            if (side > 0) index.push(a, a + 1, b, a + 1, b + 1, b);
            else index.push(a, b, a + 1, a + 1, b, b + 1);
          }
        }
      });
      let geometry = new THREE.BufferGeometry();
      geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
      geometry.setIndex(index);
      if (!flat) geometry.computeVertexNormals();
      geometry = geometry.toNonIndexed();
      if (flat) geometry.computeVertexNormals();
      return geometry;
    };
    // A section at x px of a table, square to the centre line there.
    const section = (table, x) => {
      const outer = read(table, x, 1), inner = read(table, x, 2);
      const ahead = (read(table, x + 5, 1) + read(table, x + 5, 2) - read(table, x - 5, 1) - read(table, x - 5, 2)) / 2;
      const along = new THREE.Vector2(10, ahead).normalize();
      const width = (outer - inner) / 2 * along.x;
      return { centre: at(x, (outer + inner) / 2), across: new THREE.Vector2(-along.y, along.x).multiplyScalar(width * k),
        up: read(table, x, 3) * k, along };
    };
    // The guard: eight facets round it, each flat across and smooth along, closed at both ends.
    const guardSections = guard.map(([x]) => ({ ...section(guard, x), from: Math.PI / 8, to: Math.PI * 17 / 8 }));
    const shut = (s) => ({ ...s, across: new THREE.Vector2(), up: 0 });
    const guardShell = mergeGeometries([
      ...Array.from({ length: 8 }, (_, f) => {
        const from = Math.PI / 8 + f * Math.PI / 4;
        return tube(guardSections.map((s) => ({ ...s, from, to: from + Math.PI / 4 })), 1);
      }),
      tube([guardSections[0], shut(guardSections[0])], 8, true),
      tube([shut(guardSections.at(-1)), guardSections.at(-1)], 8, true),
    ]);
    // The grip, then its rounded end: sections stepping on along the centre line, shrinking to nothing.
    const gripSections = [];
    for (let x = 725; x <= 1440; x += 15) gripSections.push({ ...section(handle, x), x });
    const last = gripSections.at(-1);
    for (let j = 1; j <= 8; j++) {
      const turn = j / 8 * Math.PI / 2;
      gripSections.push({ ...last, centre: last.centre.clone().addScaledVector(last.along, last.across.length() * Math.sin(turn)),
        across: last.across.clone().multiplyScalar(Math.cos(turn)), up: last.up * Math.cos(turn) ** .7 });
    }
    // Split round into red (inner side), blue (outer side) and grey (outer edge), along the grip's borders.
    const borders = gripSections.map(({ x = 1440 }) => ({ b: angleOf(read(blue, x)), g: read(grey, x) > 1 ? 0 : angleOf(read(grey, x)) }));
    const strip = (from, to, segments) => tube(gripSections.map((s, j) => ({ ...s, from: from(borders[j]), to: to(borders[j]) })), segments);
    const parts = [guardShell, strip(({ b }) => b, ({ b }) => Math.PI * 2 - b, 20),
      strip(({ g }) => g, ({ b }) => b, 6), strip(({ b }) => -b, ({ g }) => -g, 6), strip(({ g }) => -g, ({ g }) => g, 4)];
    add(mergeGeometries(parts, true), ["knipexRed", "knipexRed", "knipexBlue", "knipexBlue", "knipexGrey"]);
  }

  // As a rigid body (see simulateDrops), mass 1: the steel head weighs about half, so the centre of mass sits just
  // behind the guards. Inertia of a flat bar .11 by .033, grown with the square of the size. Contact points: the
  // head's corners, and round each guard and grip, on both faces. Steel and plastic on the floor: a dull knock. For
  // knocks against the other pieces: the head and each handle as capsules.
  const corner = .79;
  const points = [[206, 20, half * .55], [410, 87, half], [600, 87, half], [533, 0, half + 5]].flatMap(([x, y, z]) =>
    [[x, y, z], [x, -y, z], [x, y, -z], [x, -y, -z]].map(([px, py, pz]) => [(px - 205) * k, py * k, pz * k]));
  for (const side of [1, -1]) for (const [x, outer, inner, up] of [...guard.filter((_, i) => i % 3 === 0), ...handle.filter((_, i) => i % 4 === 0), handle.at(-1)]) {
    const centre = (outer + inner) / 2, width = (outer - inner) / 2;
    for (const across of [-corner, corner]) for (const z of [-corner, corner]) points.push([(x - 205) * k, side * (centre + across * width) * k, z * up * k]);
  }
  points.push(...[1, -1].map((side) => [(1476 - 205) * k, side * 111 * k, 0]));
  const capsule = (x1, y1, x2, y2, radius) => ({ a: new THREE.Vector3((x1 - 205) * k, y1 * k, 0), b: new THREE.Vector3((x2 - 205) * k, y2 * k, 0), radius: radius * k });
  pliers.userData.body = {
    com: new THREE.Vector3((700 - 205) * k, 0, 0),
    inertia: new THREE.Vector3(.0001, .001, .0011).multiplyScalar((PLIERS.length / .11) ** 2),
    points: points.map(([x, y, z]) => new THREE.Vector3(x, y, z)),
    bounce: .2,
    friction: .45,
    capsules: [capsule(300, 40, 590, 55, 33), capsule(300, -40, 590, -55, 33),
      ...[1, -1].flatMap((side) => [capsule(640, side * 80, 900, side * 107, 50), capsule(900, side * 107, 1150, side * 145, 46),
        capsule(1150, side * 145, 1440, side * 113, 42)])],
  };
  return pliers;
}

// The stamp on the pliers' joint boss, to lay over its face: KNIPEX 03-180 reading clockwise up its left side and over
// the top, GERMANY reading the other way down its right side, round the rim of a sunk middle; in grey on white, so the
// steel colour shows through.
function knipexStamp() {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 256;
  const pen = canvas.getContext("2d");
  pen.fillStyle = "#fff";
  pen.fillRect(0, 0, 256, 256);
  pen.translate(128, 128);
  const ring = (radius, colour, width) => {
    pen.strokeStyle = colour;
    pen.lineWidth = width;
    pen.beginPath();
    pen.arc(0, 0, radius, 0, Math.PI * 2);
    pen.stroke();
  };
  ring(122, "#e9ecef", 6);
  ring(68, "#7f868e", 4);
  ring(64, "#f4f6f8", 3);
  pen.font = "bold 30px Arial, sans-serif";
  pen.textAlign = "center";
  pen.textBaseline = "middle";
  // Letters round a circle from an angle (canvas angles, clockwise from the right), clockwise with their tops out, or
  // anticlockwise with their tops in; each raised: a light edge above, a shadow below.
  const arc = (text, start, clockwise) => {
    let angle = start;
    for (const letter of text) {
      const step = (pen.measureText(letter).width + 3) / 95;
      angle += (clockwise ? 1 : -1) * step / 2;
      pen.save();
      pen.rotate(angle);
      pen.translate(95, 0);
      pen.rotate(clockwise ? Math.PI / 2 : -Math.PI / 2);
      for (const [colour, dy] of [["#ffffff", -1.5], ["#5d646b", 1.5], ["#9aa1a8", 0]]) {
        pen.fillStyle = colour;
        pen.fillText(letter, 0, dy);
      }
      pen.restore();
      angle += (clockwise ? 1 : -1) * step / 2;
    }
  };
  // The boss's face shows the canvas a quarter turn anticlockwise: these start KNIPEX at its bottom and GERMANY at its
  // lower right.
  arc("KNIPEX 03-180", Math.PI * .06, true);
  arc("GERMANY", -Math.PI * .12, false);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

// A chunky cartoon claw hammer standing on the end of its handle at y = 0, the handle along +y: a short thick shaft in
// a fat rounded grip, and across the top a plain head in one piece: a block with its flat striking face towards -x,
// running out into a straight claw sloping down to a blunt tip towards +x. The handle is HAMMER.handleLength long; the
// head, drawn .065 across and .018 thick, is scaled by HAMMER.headSize.
function buildHammer() {
  const hammer = new THREE.Group();
  const add = (geometry, material, x, y, round = true) => {
    const mesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ name: material }));
    mesh.position.set(x, y, 0);
    // Round parts: no edge strokes, they would only stripe them.
    mesh.userData.noEdges = round;
    hammer.add(mesh);
    return mesh;
  };
  const { handleLength: length, headSize: size } = HAMMER;
  const top = length + .007 * size;
  add(new THREE.CylinderGeometry(.0068, .0068, length, 14), "handle", 0, length / 2);
  add(new THREE.CapsuleGeometry(.0092, .036, 6, 16), "grip", 0, .027);
  // The head seen from the side (x along it, y up), extruded across with slightly rounded edges.
  const profile = [[-.027, -.011], [-.027, .011], [.012, .011], [.038, -.004], [.035, -.008], [.012, -.001], [.008, -.011]];
  const shape = new THREE.Shape(profile.map(([x, y]) => new THREE.Vector2(x, y)));
  const bevel = { bevelEnabled: true, bevelThickness: .002, bevelSize: .0015, bevelSegments: 2 };
  const head = add(new THREE.ExtrudeGeometry(shape, { depth: .014, ...bevel }).translate(0, 0, -.007), "steel", 0, top, false);
  head.scale.setScalar(size);

  // As a rigid body (see simulateDrops), mass 1: the steel head weighs .7, the handle .3, so the centre of mass sits
  // high up the handle. Inertia about it from a point-mass head with its bar and a thick rod handle. Contact points
  // trace the grip and shaft (a square of four lines, enough for it to lie still) and the head's profile on both sides.
  // Steel on the floor: a dull knock that hardly bounces, and a fair grip. For knocks against the other pieces: the
  // handle, the head's block and its claw as capsules.
  const handle = [[0, .0092], [.027, .0092], [.054, .0092], [length * .75, .0068], [length - .005, .0068]].flatMap(([y, r]) => [[r, y, 0], [-r, y, 0], [0, y, r], [0, y, -r]]);
  const corners = profile.flatMap(([x, y]) => [[x, y, -.009], [x, y, .009]]);
  hammer.userData.body = {
    com: new THREE.Vector3(0, .7 * top + .3 * length / 2, 0),
    inertia: new THREE.Vector3(.0012, .0004, .0014),
    points: [...handle, ...corners.map(([x, y, z]) => [x * size, top + y * size, z * size])].map(([x, y, z]) => new THREE.Vector3(x, y, z)),
    bounce: .15,
    friction: .45,
    capsules: [
      { a: new THREE.Vector3(0, .009, 0), b: new THREE.Vector3(0, length - .007, 0), radius: .0085 },
      { a: new THREE.Vector3(-.018 * size, top, 0), b: new THREE.Vector3(.004 * size, top, 0), radius: .01 * size },
      { a: new THREE.Vector3(.012 * size, top + .003 * size, 0), b: new THREE.Vector3(.033 * size, top - .005 * size, 0), radius: .005 * size },
    ],
  };
  return hammer;
}

// Works out how loose rigid bodies move from their start poses and velocities until they all come to rest, and at least
// busy seconds (while what they lie on still moves): gravity, the ground and walls each one's contact points sink into
// (groundAt gives, for a point and a time, how deep it has sunk into which surface, how fast that surface moves there
// and, if not the body's own, the friction against it: { depth, normal, velocity, friction }, or nothing) pushing back
// and rubbing, and the bodies knocking into each other (with DROP.slip between them), all by impulses, a few passes per
// step. Each body: mass 1, com and contact points in the object's own space, the diagonal inertia about com along those
// axes, bounce (restitution), friction, and the capsules (segment a to b, radius) it is made of for knocks between
// bodies. Each start: position and quaternion of the object's origin, velocity of its com, angular velocity. Returns
// each object's pose every 1 / DROP.rate seconds.
function simulateDrops(bodies, starts, groundAt, busy = 0) {
  const states = bodies.map((body, k) => {
    const { com, inertia } = body, start = starts[k];
    const q = start.quaternion.clone();
    const x = start.position.clone().add(com.clone().applyQuaternion(q));
    return {
      body, q, x, v: start.velocity.clone(), w: start.angular.clone(),
      inverse: new THREE.Vector3(1 / inertia.x, 1 / inertia.y, 1 / inertia.z),
      held: { x: x.clone(), q: q.clone() }, still: 0, track: [],
    };
  });
  const back = new THREE.Quaternion();
  // The inverse inertia in the room's axes, applied to a vector.
  const turnBy = (state, vector) => vector.applyQuaternion(back.copy(state.q).invert()).multiply(state.inverse).applyQuaternion(state.q);
  const pointVelocity = (state, r) => new THREE.Vector3().crossVectors(state.w, r).add(state.v);
  // How much an impulse along a direction at r changes the speed there: 1 / that is the effective mass.
  const reach = (state, r, direction) => 1 + turnBy(state, new THREE.Vector3().crossVectors(r, direction)).cross(r).dot(direction);
  const push = (state, r, impulse) => {
    state.v.add(impulse);
    state.w.add(turnBy(state, new THREE.Vector3().crossVectors(r, impulse)));
  };
  // A point of the object's own space, from its com in the room's axes.
  const lever = (state, point) => point.clone().sub(state.body.com).applyQuaternion(state.q);
  const keep = () => {
    for (const { track, x, q, body } of states) track.push({ position: x.clone().sub(body.com.clone().applyQuaternion(q)), quaternion: q.clone() });
  };
  // The speed of a contact on a relative to the same spot on b (or on the ground), the effective mass along a
  // direction there, and an impulse given to a and taken from b.
  const relative = (contact) => {
    const speed = pointVelocity(contact.a, contact.r);
    return speed.sub(contact.b ? pointVelocity(contact.b, contact.rb) : contact.drift);
  };
  const mass = (contact, direction) => 1 / (reach(contact.a, contact.r, direction) + (contact.b ? reach(contact.b, contact.rb, direction) : 0));
  const give = (contact, impulse) => {
    push(contact.a, contact.r, impulse);
    if (contact.b) push(contact.b, contact.rb, impulse.clone().negate());
  };
  const every = Math.round(1 / (DROP.step * DROP.rate));
  const spin = new THREE.Quaternion();
  for (let i = 0; i * DROP.step < DROP.longest && (i * DROP.step < busy || states.some((state) => state.still < DROP.settle)); i++) {
    if (i % every === 0) keep();
    // Contacts with the ground and walls (normal out of them), and between bodies (normal from b towards a).
    const contacts = [];
    for (const state of states) {
      state.v.y -= DROP.gravity * DROP.step;
      for (const point of state.body.points) {
        const r = lever(state, point);
        const hit = groundAt(r.clone().add(state.x), i * DROP.step);
        if (hit) contacts.push({ a: state, r, n: hit.normal, depth: hit.depth, drift: hit.velocity, bounce: state.body.bounce, friction: hit.friction ?? state.body.friction });
      }
    }
    for (let k = 0; k < states.length; k++) for (let m = k + 1; m < states.length; m++) {
      const a = states[k], b = states[m];
      for (const one of a.body.capsules) for (const two of b.body.capsules) {
        const [pa, pb] = closestOnSegments(lever(a, one.a).add(a.x), lever(a, one.b).add(a.x), lever(b, two.a).add(b.x), lever(b, two.b).add(b.x));
        const n = pa.clone().sub(pb);
        const gap = n.length();
        const depth = one.radius + two.radius - gap;
        if (depth <= 0 || gap < 1e-9) continue;
        n.divideScalar(gap);
        const at = pb.addScaledVector(n, two.radius - depth / 2);
        contacts.push({
          a, b, r: at.clone().sub(a.x), rb: at.clone().sub(b.x), n, depth,
          bounce: Math.min(a.body.bounce, b.body.bounce), friction: DROP.slip,
        });
      }
    }
    for (const contact of contacts) {
      // It only bounces off a real knock, so resting contacts don't jitter.
      const approach = relative(contact).dot(contact.n);
      Object.assign(contact, { target: approach < -.05 ? -contact.bounce * approach : 0, normal: 0, side: new THREE.Vector3() });
    }
    for (let pass = 0; pass < 8; pass++) {
      for (const contact of contacts) {
        const { n } = contact;
        const normal = Math.max(0, contact.normal + (contact.target - relative(contact).dot(n)) * mass(contact, n));
        give(contact, n.clone().multiplyScalar(normal - contact.normal));
        contact.normal = normal;
        // Friction opposes the sliding along the contact, at most friction times the push there.
        const slide = relative(contact);
        slide.addScaledVector(n, -slide.dot(n));
        const speed = slide.length();
        if (speed < 1e-9) continue;
        slide.divideScalar(speed);
        const side = contact.side.clone().addScaledVector(slide, -speed * mass(contact, slide));
        const limit = contact.friction * contact.normal;
        if (side.length() > limit) side.setLength(limit);
        give(contact, side.clone().sub(contact.side));
        contact.side.copy(side);
      }
    }
    // Lifts each one out of the ground or wall it sank deepest into during the step, and eases bodies that sank into each
    // other apart.
    for (const state of states) {
      const sunk = contacts.filter((contact) => contact.a === state && !contact.b);
      if (!sunk.length) continue;
      const deepest = sunk.reduce((most, contact) => (contact.depth > most.depth ? contact : most));
      state.x.addScaledVector(deepest.n, deepest.depth * .5);
    }
    for (const contact of contacts) if (contact.b) {
      contact.a.x.addScaledVector(contact.n, contact.depth * .25);
      contact.b.x.addScaledVector(contact.n, -contact.depth * .25);
    }
    for (const state of states) {
      const { x, v, w, q, held } = state;
      x.addScaledVector(v, DROP.step);
      spin.set(w.x, w.y, w.z, 0).multiply(q);
      q.set(q.x + spin.x * DROP.step / 2, q.y + spin.y * DROP.step / 2, q.z + spin.z * DROP.step / 2, q.w + spin.w * DROP.step / 2).normalize();
      if (x.distanceTo(held.x) < DROP.rest && q.angleTo(held.q) < DROP.turn) state.still += DROP.step;
      else state.still = 0, held.x.copy(x), held.q.copy(q);
    }
  }
  keep();
  return states.map((state) => state.track);
}

// The closest points between segments p1 q1 and p2 q2.
function closestOnSegments(p1, q1, p2, q2) {
  const d1 = q1.clone().sub(p1), d2 = q2.clone().sub(p2), r = p1.clone().sub(p2);
  const a = d1.dot(d1), e = d2.dot(d2), f = d2.dot(r), c = d1.dot(r), b = d1.dot(d2);
  const clamp = (value) => THREE.MathUtils.clamp(value, 0, 1);
  const denominator = a * e - b * b;
  let s = denominator > 1e-12 ? clamp((b * f - c * e) / denominator) : 0;
  let t = (b * s + f) / e;
  if (t < 0 || t > 1) {
    t = clamp(t);
    s = clamp((b * t - c) / a);
  }
  return [p1.clone().addScaledVector(d1, s), p2.clone().addScaledVector(d2, t)];
}

// The edge strokes of a geometry, as line segments: like THREE.EdgesGeometry, every edge where its faces fold by more
// than angle degrees and every open border, but not where it is shaded smoothly across the fold (the same normal on
// both faces at both ends of the edge): those are the facets of a curved surface (a cylinder's sides, a torus, a
// model's rounded parts), and stroking them only covers it in short stripes.
function creaseLines(geometry, angle) {
  const position = geometry.attributes.position, normal = geometry.attributes.normal, index = geometry.index;
  const corner = (i) => (index ? index.getX(i) : i);
  const key = (v) => `${Math.round(position.getX(v) * 1e6)},${Math.round(position.getY(v) * 1e6)},${Math.round(position.getZ(v) * 1e6)}`;
  const sameNormal = (v, w) => Boolean(normal) && normal.getX(v) * normal.getX(w) + normal.getY(v) * normal.getY(w) + normal.getZ(v) * normal.getZ(w) > .9999;
  const limit = Math.cos(THREE.MathUtils.degToRad(angle));
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();
  const open = new Map(), lines = [];
  const push = (v, w) => lines.push(position.getX(v), position.getY(v), position.getZ(v), position.getX(w), position.getY(w), position.getZ(w));
  for (let i = 0; i < (index ? index.count : position.count); i += 3) {
    const corners = [corner(i), corner(i + 1), corner(i + 2)];
    a.fromBufferAttribute(position, corners[0]);
    b.fromBufferAttribute(position, corners[1]);
    c.fromBufferAttribute(position, corners[2]);
    const face = new THREE.Triangle(a, b, c).getNormal(new THREE.Vector3());
    if (face.lengthSq() === 0) continue;
    for (let k = 0; k < 3; k++) {
      const v = corners[k], w = corners[(k + 1) % 3], kv = key(v), kw = key(w);
      if (kv === kw) continue;
      const id = kv < kw ? `${kv}|${kw}` : `${kw}|${kv}`;
      const other = open.get(id);
      if (!other) { open.set(id, { v, w, kv, face }); continue; }
      open.delete(id);
      // The other face's corners at this edge's two ends.
      const [ov, ow] = other.kv === kv ? [other.v, other.w] : [other.w, other.v];
      if (other.face.dot(face) <= limit && !(sameNormal(v, ov) && sameNormal(w, ow))) push(v, w);
    }
  }
  for (const { v, w } of open.values()) push(v, w);
  const lineGeometry = new THREE.BufferGeometry();
  lineGeometry.setAttribute("position", new THREE.Float32BufferAttribute(lines, 3));
  return lineGeometry;
}

// Sets an object to its pose time seconds into a track from simulateDrops, between the kept poses.
function followTrack(object, track, time) {
  const at = THREE.MathUtils.clamp(time * DROP.rate, 0, track.length - 1);
  const i = Math.min(Math.floor(at), track.length - 2), u = at - i;
  if (i < 0) return object.position.copy(track[0].position), object.quaternion.copy(track[0].quaternion);
  object.position.lerpVectors(track[i].position, track[i + 1].position, u);
  object.quaternion.slerpQuaternions(track[i].quaternion, track[i + 1].quaternion, u);
}

// A coffee mug, standing on y = 0: hollow body, coffee near the rim, a handle on its right side.
// Wayfarer sunglasses standing on y = 0 with their arms open towards -z, as if put down on a desk: a thick black
// frame, wider at the top with its outer top corners swept up, dark green lenses following its shape, a silver rivet in
// each outer top corner, and thick arms sloping down from those corners to rest their tips on the desk. About .085
// across, a little bigger than life like the mug.
function buildSunglasses() {
  const glasses = new THREE.Group();
  const depth = .005, armLength = .078, bridge = .011;
  // A smooth closed outline through corner points, each corner rounded off between the midpoints of its edges.
  const outline = (points, side) => {
    const shape = new THREE.Shape();
    const at = (i) => new THREE.Vector2(points[(i + points.length) % points.length][0] * side, points[(i + points.length) % points.length][1]);
    const middle = (i) => at(i).add(at(i + 1)).multiplyScalar(.5);
    shape.moveTo(middle(-1).x, middle(-1).y);
    points.forEach((_, i) => {
      const corner = at(i), next = middle(i);
      shape.quadraticCurveTo(corner.x, corner.y, next.x, next.y);
    });
    return shape;
  };
  // Lens and frame outlines for the right eye, x outwards from the lens centre (mirrored for the left).
  const lens = [[-.0145, -.0115], [.0135, -.0115], [.0185, .0085], [.0175, .0125], [-.0165, .0105], [-.0175, -.001]];
  const frame = [[-.0175, -.0145], [.0165, -.0145], [.0225, .0115], [.0225, .0175], [-.0195, .0145], [-.0205, -.002]];
  const centre = .0205 + bridge / 2, height = .0145;
  // An arm seen from the side: a strip .006 tall along a line that runs straight for bend, then curves down by drop
  // over the rest of its length, ending in a round tip. Drawn with its length along x, then turned to run along -z,
  // .0035 thick.
  const armHeight = .006, armThick = .0035, bend = .056, drop = .012;
  const spine = (u) => (u <= bend ? 0 : -drop * ((u - bend) / (armLength - bend)) ** 2);
  const armSide = new THREE.Shape(), steps = 24;
  const along = Array.from({ length: steps + 1 }, (_, i) => armLength * i / steps);
  // Offsets along the line's normal, so the strip keeps its height round the curve.
  const edge = (u, offset) => {
    const slope = (spine(Math.min(armLength, u + .001)) - spine(Math.max(0, u - .001))) / .002;
    const length = Math.hypot(1, slope);
    return new THREE.Vector2(u - offset * slope / length, spine(u) + offset / length);
  };
  along.forEach((u, i) => { const p = edge(u, armHeight / 2); if (i) armSide.lineTo(p.x, p.y); else armSide.moveTo(p.x, p.y); });
  const tipAngle = Math.atan2(spine(armLength) - spine(armLength - .001), .001);
  armSide.absarc(...edge(armLength, 0).toArray(), armHeight / 2, tipAngle + Math.PI / 2, tipAngle - Math.PI / 2, true);
  for (const u of along.slice().reverse()) { const p = edge(u, -armHeight / 2); armSide.lineTo(p.x, p.y); }
  const armGeometry = new THREE.ExtrudeGeometry(armSide, { depth: armThick, bevelEnabled: false, curveSegments: 8 })
    .translate(0, 0, -armThick / 2).rotateY(Math.PI / 2);
  // The arm's tilt (about x) that sets the lowest point of its underside on the desk, from a hinge that high.
  const armTilt = (hinge) => {
    let low = -.6, high = 0;
    const lowest = (tilt) => Math.min(...along.map((u) => hinge + (spine(u) - armHeight / 2) * Math.cos(tilt) + u * Math.sin(tilt)));
    for (let i = 0; i < 30; i++) { const mid = (low + high) / 2; if (lowest(mid) < 0) low = mid; else high = mid; }
    return (low + high) / 2;
  };
  for (const side of [-1, 1]) {
    const ring = outline(frame, side);
    ring.holes.push(outline(lens, side));
    const front = new THREE.Mesh(new THREE.ExtrudeGeometry(ring, { depth, bevelEnabled: false, curveSegments: 5 }), new THREE.MeshStandardMaterial({ name: "frame" }));
    front.position.set(side * centre, height, -depth);
    const glass = new THREE.Mesh(new THREE.ShapeGeometry(outline(lens, side), 5), new THREE.MeshStandardMaterial({ name: "lens", side: THREE.DoubleSide }));
    glass.position.set(side * centre, height, -depth / 2);
    glass.name = "lens";
    glass.userData.noEdges = true;
    glasses.add(front, glass);
    // The rivet on the front, in the swept-up corner.
    const rivet = new THREE.Mesh(new THREE.CylinderGeometry(.0013, .0013, .0008, 12).rotateX(Math.PI / 2), new THREE.MeshStandardMaterial({ name: "rivet" }));
    rivet.position.set(side * (centre + .0185), height + .0135, .0003);
    rivet.userData.noEdges = true;
    glasses.add(rivet);
    // Each thick arm leaves the frame's outer top corner and slopes down to the desk, its end curving down round where
    // the ear would be and finished round.
    const top = height + .0145;
    const arm = new THREE.Mesh(armGeometry, new THREE.MeshStandardMaterial({ name: "frame" }));
    arm.position.set(side * (centre + .0205), top - .003, -depth);
    arm.rotation.x = armTilt(top - .003);
    glasses.add(arm);
  }
  // The bridge: a thick bar joining the two fronts high up.
  const bar = new THREE.Mesh(new THREE.BoxGeometry(bridge + .004, .006, depth), new THREE.MeshStandardMaterial({ name: "frame" }));
  bar.position.set(0, height + .0075, -depth / 2);
  glasses.add(bar);
  return glasses;
}

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

// A blister pack lying on y = 0, .064 x .036: a foil card with two capsule bubbles side by side, red pill on the left,
// blue on the right, each pill lying in its bubble along z.
function buildBlister() {
  const blister = new THREE.Group();
  const cardHeight = .0015;
  const card =new THREE.Mesh(new THREE.BoxGeometry(.064, cardHeight, .036), new THREE.MeshStandardMaterial({ name: "foil" }));
  card.position.y = cardHeight / 2;
  blister.add(card);
  for (const [x, pill] of [[-.016, "red"], [.016, "blue"]]) {
    // Round shapes: no edge strokes, they would only draw smudges.
    const capsule = new THREE.Mesh(new THREE.CapsuleGeometry(.0052, .011, 8, 20).rotateX(Math.PI / 2), new THREE.MeshStandardMaterial({ name: pill }));
    capsule.position.set(x, cardHeight + .0045, 0);
    capsule.userData.noEdges = true;
    blister.add(capsule);
    // The bubble: a flattened capsule whose lower half sinks into the card.
    const bubble = new THREE.Mesh(new THREE.CapsuleGeometry(.0072, .013, 8, 20).rotateX(Math.PI / 2), new THREE.MeshStandardMaterial({ name: "bubble" }));
    bubble.position.set(x, cardHeight, 0);
    bubble.scale.y = 1.45;
    bubble.name = "bubble";
    bubble.userData.noEdges = true;
    blister.add(bubble);
  }
  return blister;
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

// TARS from Interstellar: four tall slabs side by side, each cut by a joint near its top, and a dark display with
// lines of text across the middle two, just under that joint. Stands on y = 0, centred on x, its front facing +z;
// about .1 tall. Switched on, as if mid-stride: the middle pair (the body) rides up a little and each outer slab
// swings forward from its top joint, each by its own angle.
function buildTars() {
  const tars = new THREE.Group();
  const part = (parent, width, height, depth, material, x, y, z) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), new THREE.MeshStandardMaterial({ name: material }));
    mesh.position.set(x, y, z);
    parent.add(mesh);
    return mesh;
  };
  const height = .1, slab = .014, gap = .002, depth = .035, joint = .022, seam = .0015, lift = .008;
  // A slab whose top rests at y = top: a short head block over the long one, a thin seam between them.
  const addSlab = (parent, x, top) => {
    part(parent, slab, joint, depth, "metal", x, top - joint / 2, 0);
    const rest = height - joint - seam;
    part(parent, slab, rest, depth, "metal", x, top - height + rest / 2, 0);
  };
  // Its joints, each with its rest angle and which way it swings on a stride: legs one way, body slabs the other.
  const joints = [];
  const body = new THREE.Group();
  body.position.y = lift;
  tars.add(body);
  // Its two slabs tilt a touch each way about their top joints, little enough to stay behind the screen, which stands
  // out far enough for them to rock a little on a stride.
  for (const [i, tilt] of [[1, -.035], [2, .02]]) {
    const arm = new THREE.Group();
    arm.position.set((i - 1.5) * (slab + gap), height, 0);
    arm.rotation.x = tilt;
    addSlab(arm, 0, 0);
    body.add(arm);
    joints.push({ group: arm, rest: tilt, way: -1 });
    // Its name goes down the front of the left one, under the screen, added once it is recoloured.
    if (i === 1) tars.userData.nameplate = { slab: arm, width: slab * .6, height: .032, y: -.076, z: depth / 2 + .0003 };
  }
  const screen = { width: 2 * slab + gap - .003, height: .024, y: height - joint - seam - .005 - .012 };
  part(body, screen.width, screen.height, .004, "screen", 0, screen.y, depth / 2 + .001);
  // Left-aligned lines of text, the way its settings read out, each kept with its rest width so a stride can rewrite it.
  const left = -screen.width / 2 + .003;
  const lines = [.019, .013, .016].map((width, k) => ({
    width, mesh: part(body, width, .0022, .001, "readout", left + width / 2, screen.y + .0065 - k * .0065, depth / 2 + .0035),
  }));
  for (const [i, swing] of [[0, .05], [3, .32]]) {
    const limb = new THREE.Group();
    limb.position.set((i - 1.5) * (slab + gap), height, 0);
    limb.rotation.x = -swing;
    addSlab(limb, 0, 0);
    tars.add(limb);
    joints.push({ group: limb, rest: -swing, way: 1 });
  }
  // Back down so the lowest corner of the swung slabs rests on y = 0.
  const lowest = new THREE.Box3().setFromObject(tars).min.y;
  for (const child of tars.children) child.position.y -= lowest;
  tars.userData.stride = { body, joints, lines, left };
  return tars;
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
    // The drawer's own pieces, to tell them from what gets put in it.
    drawer.userData.shell = new Set(drawer.children);
    // The inner face of the tray's back wall, for things that slide in the drawer.
    drawer.userData.back = -trayDepth + .003;
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

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true });
  // The room is drawn into sampled, multisampled and at supersample times the screen's pixels each way, so small things
  // such as the tools on the floor come out smooth; then each screen pixel's patch of it is averaged onto the canvas,
  // which matches the screen's pixels one for one (see resize). Left to the browser, scaling a bigger canvas down to
  // the screen samples it unevenly wherever the two don't line up (a canvas placed a fraction of a pixel off, a screen
  // scaled to 125 %), and thin lines break into steps. Supersample is 2, or 1 where the browser draws without a
  // graphics card, and on screens of 2x and more, fine enough already.
  const gl = renderer.getContext();
  let graphics = String(gl.getParameter(gl.RENDERER));
  if (graphics === "WebKit WebGL") {
    const unmasked = gl.getExtension("WEBGL_debug_renderer_info");
    if (unmasked) graphics = String(gl.getParameter(unmasked.UNMASKED_RENDERER_WEBGL));
  }
  const software = /swiftshader|llvmpipe|software|basic render/i.test(graphics);
  let supersample = 1;
  const sampled = new THREE.WebGLRenderTarget(1, 1, { samples: 4, colorSpace: THREE.SRGBColorSpace });
  // The averaging: four taps between the sampled pixels of each screen pixel's patch (all at its middle when there is
  // just one), its colour then encoded for the screen, which wants it premultiplied by its alpha (as it is stored).
  const shrink = new THREE.ShaderMaterial({
    uniforms: { map: { value: sampled.texture }, offset: { value: new THREE.Vector2() } },
    vertexShader: "varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }",
    fragmentShader: `uniform sampler2D map; uniform vec2 offset; varying vec2 vUv;
      void main() {
        vec4 colour = (texture2D(map, vUv - offset) + texture2D(map, vUv + offset)
          + texture2D(map, vUv + vec2(offset.x, -offset.y)) + texture2D(map, vUv + vec2(-offset.x, offset.y))) * .25;
        if (colour.a > 0.0) colour.rgb /= colour.a;
        gl_FragColor = colour;
        #include <colorspace_fragment>
        gl_FragColor.rgb *= gl_FragColor.a;
      }`,
    blending: THREE.NoBlending, depthTest: false, depthWrite: false,
  });
  const flat = new THREE.Scene(), flatCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const shrinkQuad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), shrink);
  shrinkQuad.frustumCulled = false;
  flat.add(shrinkQuad);
  // Draws the room into sampled, then averages it onto the canvas.
  const draw = () => {
    renderer.setRenderTarget(sampled);
    renderer.render(scene, camera);
    renderer.setRenderTarget(null);
    renderer.render(flat, flatCamera);
  };
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  // The tools' outline thickness in the canvas's pixels and the canvas's size in them, kept up to date by resize.
  const outlineUniforms = { outlineWidth: { value: TOOL_OUTLINE.width }, outlineResolution: { value: new THREE.Vector2(1, 1) } };
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


  // Thin dark strokes on the hard edges give an illustrated, technical-drawing look. A stroke is always one pixel of the
  // sampled picture wide: when supersampled, it is drawn that much darker (see resize) so it still reads as one screen
  // pixel.
  const edgeMaterial = new THREE.LineBasicMaterial({ color: EDGE_STROKE.colour, transparent: true, opacity: EDGE_STROKE.opacity });
  // It and its copies, whose darkness resize keeps up to date.
  const strokeMaterials = [edgeMaterial];

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
      const edges = new THREE.LineSegments(creaseLines(child.geometry, angle), edgeMaterial);
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
    // Given ink ({ colour, outline, width }), the picture is reprinted in that colour, inside that outline if any. A
    // glossy one has its dark ink varnished: a streak of light slides over it as the angle changes, the paper stays matt.
    const sticker = (source, width, x, y, tilt, peel, lift = 0, holo = false, ink = null, gloss = false) => {
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
      if (gloss) {
        // A narrow band of light the same way, added only as dark as the picture is there (the varnished ink).
        const { strength, sharpness, bands, shift, phase } = STICKERS.gloss;
        mesh.material.onBeforeCompile = (shader) => {
          shader.fragmentShader = shader.fragmentShader.replace("#include <emissivemap_fragment>", `#include <emissivemap_fragment>
            float glossBand = fract(dot(normal, normalize(vViewPosition)) * ${shift.toFixed(2)}
              + normalize(vViewPosition).x * ${shift.toFixed(2)} + (vMapUv.x + vMapUv.y) * ${bands.toFixed(2)} + ${phase.toFixed(2)});
            float glossInk = 1. - dot(diffuseColor.rgb, vec3(.3333));
            totalEmissiveRadiance += pow(max(0., 1. - abs(glossBand - .5) * 2.), ${sharpness.toFixed(1)}) * glossInk * ${strength.toFixed(2)};`);
        };
        // Its shader differs from a holo one's though the function reads the same: keep three.js from sharing them.
        mesh.material.customProgramCacheKey = () => "sticker-gloss";
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
      image.onload = () => apply(dieCutImage(ink ? inkImage(image, ink) : image));
      image.src = new URL(`./${source}`, import.meta.url).href;
    };

    // Spread out down the door under the note, zigzagging from side to side, each at its own angle. In note widths:
    // across from the door's middle (+ is the viewer's left), and down from the note's bottom edge, 1.825 note widths
    // below the door's top.
    const at = (across, down) => [face.centre + note * across, face.top - note * (1.825 + down)];

    // StarCraft's Terran emblem (terran.png), centred above the Vitality bee, its black ink glossy.
    sticker("terran.png", note * .75, ...at(0, 1.1), -6, null, 0, false, STICKERS.terran, true);

    // Team Vitality's bee, from the team's logo (vita.webp), on the left, a holo one.
    sticker("vita.webp", note * .65, ...at(.2, 2.25), 10, null, 0, true);

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

  // A picture with a transparent surround reprinted in one colour, inside an outline of another width wide if given, on
  // a canvas grown to fit the outline.
  function inkImage(image, { colour, outline, width = 0 }) {
    const fill = (shade) => {
      const shape = document.createElement("canvas");
      shape.width = image.naturalWidth;
      shape.height = image.naturalHeight;
      const shapeContext = shape.getContext("2d");
      shapeContext.drawImage(image, 0, 0);
      shapeContext.globalCompositeOperation = "source-in";
      shapeContext.fillStyle = shade;
      shapeContext.fillRect(0, 0, shape.width, shape.height);
      return shape;
    };
    const pad = width + 2;
    const canvas = document.createElement("canvas");
    canvas.width = image.naturalWidth + pad * 2;
    canvas.height = image.naturalHeight + pad * 2;
    const context = canvas.getContext("2d");
    // The outline: the shape in its colour drawn shifted all round two circles.
    const ring = outline && fill(outline);
    for (const radius of outline ? [width / 2, width] : []) {
      for (let i = 0; i < 32; i++) {
        const angle = i / 32 * Math.PI * 2;
        context.drawImage(ring, pad + Math.cos(angle) * radius, pad + Math.sin(angle) * radius);
      }
    }
    context.drawImage(fill(colour), pad, pad);
    return canvas;
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
    // Its layer, drawn on the canvas once whole: the shifted copies can leave pinholes in a nook they close off, so
    // anything see-through the outside doesn't reach is filled in its colour.
    const grow = (colour, radius) => {
      const shape = silhouette(colour);
      const layer = document.createElement("canvas");
      layer.width = canvas.width;
      layer.height = canvas.height;
      const layerContext = layer.getContext("2d", { willReadFrequently: true });
      layerContext.drawImage(shape, 0, 0);
      for (const ring of [radius / 3, radius * 2 / 3, radius]) {
        for (let i = 0; i < 32; i++) {
          const angle = i / 32 * Math.PI * 2;
          layerContext.drawImage(shape, Math.cos(angle) * ring, Math.sin(angle) * ring);
        }
      }
      const pixels = layerContext.getImageData(0, 0, layer.width, layer.height);
      const { data } = pixels, outside = new Uint8Array(layer.width * layer.height);
      const clear = (i) => data[i * 4 + 3] < 128;
      const edge = [];
      for (let x = 0; x < layer.width; x++) edge.push(x, (layer.height - 1) * layer.width + x);
      for (let y = 0; y < layer.height; y++) edge.push(y * layer.width, y * layer.width + layer.width - 1);
      while (edge.length) {
        const i = edge.pop();
        if (outside[i] || !clear(i)) continue;
        outside[i] = 1;
        const x = i % layer.width;
        if (x > 0) edge.push(i - 1);
        if (x < layer.width - 1) edge.push(i + 1);
        if (i >= layer.width) edge.push(i - layer.width);
        if (i < outside.length - layer.width) edge.push(i + layer.width);
      }
      const rgb = parseInt(colour.slice(1), 16);
      for (let i = 0; i < outside.length; i++) {
        if (!outside[i] && clear(i)) data.set([rgb >> 16, (rgb >> 8) & 255, rgb & 255, 255], i * 4);
      }
      layerContext.putImageData(pixels, 0, 0);
      context.drawImage(layer, 0, 0);
    };
    grow(STICKERS.cutLine, border + line);
    grow(STICKERS.cutBacking, border);
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
    // The paper in a grid fine enough to bend (see liftNote), its outline running round the grid's rim.
    const across = 6, down = 10, height = width * 1.15;
    const paper = new THREE.Mesh(new THREE.PlaneGeometry(width, height, across, down), new THREE.MeshStandardMaterial({ color: NOTE.paper, roughness: 1, side: THREE.DoubleSide }));
    const tape = new THREE.Mesh(new THREE.PlaneGeometry(width * .45, width * .14), new THREE.MeshStandardMaterial({ color: NOTE.tape, roughness: 1, side: THREE.DoubleSide }));
    tape.position.set(0, width * .575, .001);
    const corner = (i, j) => j * (across + 1) + i;
    const rim = [
      ...Array.from({ length: across }, (_, i) => corner(i, 0)), ...Array.from({ length: down }, (_, j) => corner(across, j)),
      ...Array.from({ length: across }, (_, i) => corner(across - i, down)), ...Array.from({ length: down }, (_, j) => corner(0, down - j)),
    ];
    const outline = new THREE.LineLoop(new THREE.BufferGeometry(), edgeMaterial);
    outline.geometry.setAttribute("position", new THREE.Float32BufferAttribute(rim.length * 3, 3));
    outline.raycast = () => {};
    paper.add(outline);
    const flat = paper.geometry.attributes.position.clone();
    // Lifts the paper off the door by lift (a fraction of its width), most at its free bottom edge, nothing at the
    // taped top, with a ripple phase turns along its way running down it.
    const bend = (lift, phase) => {
      const position = paper.geometry.attributes.position;
      for (let i = 0; i < position.count; i++) {
        const x = flat.getX(i), y = flat.getY(i);
        const s = (height / 2 - y) / height;
        const wave = .65 + .35 * Math.sin((s * 1.3 - phase) * Math.PI * 2);
        position.setZ(i, lift * width * s ** 1.5 * wave * (1 + .2 * x / (width / 2)));
      }
      position.needsUpdate = true;
      paper.geometry.computeVertexNormals();
      rim.forEach((k, n) => outline.geometry.attributes.position.setXYZ(n, position.getX(k), position.getY(k), position.getZ(k)));
      outline.geometry.attributes.position.needsUpdate = true;
    };
    bend(0, 0);
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
    return { note, tape, hole, key: keyGroup, bend };
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
  // Opening the door draws air past its inner face: the note lifts off it from the bottom, a ripple running down it,
  // and settles back flat. Pinned only: once shaken loose it flutters down as it is.
  let noteLift = 0, notePhase = 0, noteClock = 0;
  parts.push({
    object: pinned.note, state: spring(), apply() {},
    busy(now) {
      if (flyaway || (!noteLift && doors.state.velocity <= 0)) return (noteClock = 0), false;
      const dt = noteClock ? Math.min(.033, (now - noteClock) / 1000) : 0;
      noteClock = now;
      noteLift = Math.min(1, noteLift + Math.max(0, doors.state.velocity) * NOTE.gust * dt) * Math.exp(-dt / NOTE.settle);
      notePhase += dt * NOTE.ripple;
      if (noteLift < .01) noteLift = 0;
      pinned.bend(noteLift * NOTE.lift, notePhase);
      return noteLift > 0;
    },
  });
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
  recolour(toolbox, { ...TOOLBOX, ...HAMMER, ...SCREWDRIVER, ...PLIERS });
  const knipexBoss = toolbox.getObjectByName("knipexBoss");
  knipexBoss.material[1].map = knipexStamp();
  knipexBoss.material[1].needsUpdate = true;
  // The tools' silhouettes drawn a touch darker, as for the duck: a copy of each part turned inside out, whose back
  // shows only round the edges, pushed out on screen by TOOL_OUTLINE.width pixels along the part's surface: the line
  // keeps its thickness on a thin blade as round a hammer's head, at any size of the room. It follows the normals
  // averaged where faces meet at a crease, so it doesn't split open at the corners.
  const toolOutline = new THREE.MeshBasicMaterial({ color: TOOL_OUTLINE.colour, side: THREE.BackSide });
  toolOutline.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, outlineUniforms);
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nattribute vec3 outlineNormal;\nuniform float outlineWidth;\nuniform vec2 outlineResolution;")
      .replace("#include <project_vertex>", `#include <project_vertex>
        vec2 outlineDirection = (projectionMatrix * vec4(normalMatrix * outlineNormal, 0.0)).xy * outlineResolution;
        if (dot(outlineDirection, outlineDirection) > 1e-12) {
          gl_Position.xy += normalize(outlineDirection) * outlineWidth * 2.0 / outlineResolution * gl_Position.w;
        }`);
  };
  const creaseNormals = (geometry) => {
    if (geometry.attributes.outlineNormal) return;
    if (!geometry.attributes.normal) geometry.computeVertexNormals();
    const position = geometry.attributes.position, normal = geometry.attributes.normal;
    const sums = new Map();
    const keys = Array.from({ length: position.count }, (_, i) => {
      const key = [position.getX(i), position.getY(i), position.getZ(i)].map((v) => Math.round(v * 1e5)).join();
      if (!sums.has(key)) sums.set(key, new THREE.Vector3());
      sums.get(key).add(new THREE.Vector3().fromBufferAttribute(normal, i));
      return key;
    });
    const averaged = new Float32Array(position.count * 3);
    keys.forEach((key, i) => {
      const sum = sums.get(key);
      const n = sum.lengthSq() > 1e-12 ? sum.clone().normalize() : new THREE.Vector3().fromBufferAttribute(normal, i);
      averaged.set([n.x, n.y, n.z], i * 3);
    });
    geometry.setAttribute("outlineNormal", new THREE.BufferAttribute(averaged, 3));
  };
  const toolParts = [];
  for (const tool of loose) tool.traverse((child) => { if (child.isMesh && !child.userData.noOutline) toolParts.push(child); });
  toolParts.forEach((mesh) => {
    creaseNormals(mesh.geometry);
    const hull = new THREE.Mesh(mesh.geometry, toolOutline);
    hull.raycast = () => {};
    mesh.add(hull);
  });
  // Right at the front edge of the shelf, just behind the closed doors: ready to fall.
  toolbox.position.set(.2, .116, -.105);
  toolbox.rotation.set(0, .18, 0, "YXZ");
  cabinet.add(toolbox);
  // A VHS cassette in the gap left of the toolbox, mostly hidden behind it: standing on its long edge, its label and
  // window turned to the toolbox, leaning back against the wardrobe's left side (inner face at x .04).
  const vhs = buildVhs();
  recolour(vhs, VHS);
  vhs.position.set(.04 + .0065 + .052 * Math.sin(VHS.lean) + .001, .116, -.13);
  vhs.rotation.set(-VHS.lean, Math.PI / 2, 0, "YXZ");
  cabinet.add(vhs);
  // A Zelda treasure chest hidden behind the toolbox, against the back wall (inner face at z -.23), found once the
  // toolbox is knocked over. Not animated yet.
  const chest = buildChest();
  recolour(chest, CHEST);
  chest.scale.setScalar(1);
  chest.position.set(.165, .116, -.178);
  cabinet.add(chest);
  // Clay pots standing round it.
  for (const [x, z, scale, turn] of POTS.pots) {
    const pot = buildPot();
    recolour(pot, POTS);
    pot.scale.setScalar(scale);
    pot.position.set(x, .116, z);
    pot.rotation.y = turn;
    cabinet.add(pot);
  }
  // Its label, recorded over again and again: rows of felt-pen scribbles in red, blue and black, some crossed out.
  const labelPicture = document.createElement("canvas");
  labelPicture.width = 256;
  labelPicture.height = 64;
  const pen = labelPicture.getContext("2d");
  pen.fillStyle = "#ffffff";
  pen.fillRect(0, 0, 256, 64);
  pen.lineCap = pen.lineJoin = "round";
  let seed = 7;
  const random = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
  VHS.scribbles.forEach(([colour, row, from, to, crossed]) => {
    pen.strokeStyle = colour;
    pen.lineWidth = 3;
    const y = 12 + row * 20;
    // Handwriting at this size: a quick zigzag of letters, each a little taller or shorter.
    pen.beginPath();
    pen.moveTo(from, y + 4);
    for (let x = from; x < to; x += 5) pen.lineTo(x + 2.5, y - 4 - random() * 4), pen.lineTo(x + 5, y + 4);
    pen.stroke();
    if (!crossed) return;
    pen.lineWidth = 4;
    pen.beginPath();
    pen.moveTo(from - 4, y + 1);
    pen.lineTo(to + 4, y - 2);
    pen.stroke();
  });
  const labelTexture = new THREE.CanvasTexture(labelPicture);
  labelTexture.colorSpace = THREE.SRGBColorSpace;
  const label = vhs.getObjectByName("label");
  label.material.map = labelTexture;
  label.material.needsUpdate = true;

  // Desk spans x 0 → .72, z -.38 → 0, top at y .384; the cabinet stands to its right.
  room.add(desk);
  cabinet.scale.setScalar(1.2);
  cabinet.position.set(.79, 0, -.02);
  room.add(cabinet);

  const computer = buildRetroComputer();
  recolour(computer, RETRO_PC);
  computer.position.set(.34, .384, -.25);
  room.add(computer);
  // Wayfarer sunglasses on the free left part of the desk, turned so both lenses and both arms show.
  const sunglasses = buildSunglasses();
  recolour(sunglasses, SUNGLASSES);
  // Glossy acetate, dark glass with a sheen and metal rivets, rather than the matt finish everything else gets.
  sunglasses.traverse((child) => {
    if (!child.isMesh) return;
    const name = child.material.name;
    child.material.roughness = name === "lens" ? SUNGLASSES.shine : name === "frame" ? SUNGLASSES.gloss : .3;
    if (name === "rivet") child.material.metalness = .8;
  });
  sunglasses.position.set(.13, .384, -.09);
  sunglasses.rotation.y = -.25;
  room.add(sunglasses);
  // The red and blue pills at the front of the middle drawer, before the Rubik's cube and the duck, a little bigger than life so they read.
  const blister = buildBlister();
  recolour(blister, BLISTER);
  // Clear plastic: set after the recolour, which makes every material opaque.
  for (const bubble of blister.children.filter((child) => child.name === "bubble")) {
    Object.assign(bubble.material, { transparent: true, opacity: BLISTER.opacity, roughness: .15, depthWrite: false });
    bubble.castShadow = false;
  }
  blister.position.set(-.02, drawers[1].userData.floor, -.104);
  blister.rotation.y = -.15;
  blister.scale.setScalar(1.6);
  drawers[1].add(blister);
  // A click on the pack plays the Matrix code rain on the screen (it claims the click, so the drawer stays put).
  blister.traverse((child) => { if (child.isMesh) child.userData.onClick = () => playMatrix(); });
  // A Rubik's cube lying in the middle drawer, set back from the front but still in the part that slides out (.16).
  const rubiksCube = buildRubiksCube();
  recolour(rubiksCube, RUBIK);
  const middleDrawer = drawers[1];
  rubiksCube.position.set(.025, middleDrawer.userData.floor, -.156);
  rubiksCube.rotation.y = -.45;
  rubiksCube.userData.tips = DRAWER_JOLT.cube;
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
  const duckSpot = new THREE.Vector3(-.045, middleDrawer.userData.floor, -.161);
  duck.position.copy(duckSpot);
  duck.rotation.y = .5;
  duck.scale.setScalar(duckSize);
  duck.userData.tips = DRAWER_JOLT.duck;
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
    cartridge.userData.jolt = DRAWER_JOLT.cartridge;
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
  // TARS standing in the middle of the compartment above the toolbox (shelf top at y .299 in wardrobe units), turned
  // halfway towards the camera.
  const tars = buildTars();
  recolour(tars, TARS);
  // Its name, written top to bottom on a see-through picture.
  const nameplate = tars.userData.nameplate;
  const nameCanvas = document.createElement("canvas");
  nameCanvas.width = 64;
  nameCanvas.height = 256;
  const nameContext = nameCanvas.getContext("2d");
  nameContext.translate(32, 128);
  nameContext.rotate(Math.PI / 2);
  nameContext.font = "bold 58px sans-serif";
  nameContext.textAlign = "center";
  nameContext.textBaseline = "middle";
  nameContext.fillStyle = TARS.name;
  nameContext.fillText("TARS", 0, 2, 240);
  const nameTexture = new THREE.CanvasTexture(nameCanvas);
  nameTexture.colorSpace = THREE.SRGBColorSpace;
  nameTexture.anisotropy = 4;
  const tarsName = new THREE.Mesh(new THREE.PlaneGeometry(nameplate.width, nameplate.height),
    new THREE.MeshStandardMaterial({ map: nameTexture, transparent: true, opacity: TARS.nameOpacity, roughness: 1 }));
  tarsName.position.set(0, nameplate.y, nameplate.z);
  nameplate.slab.add(tarsName);
  tars.position.set(.2, .299, -.13);
  tars.rotation.y = VIEW_AZIMUTH / 2;
  tars.scale.setScalar(.85);
  cabinet.add(tars);
  // A click on it walks it on the spot: legs and body slabs rock back and forth, the body bobbing at each step, easing
  // in and out of its pose, while its readout lines keep being rewritten, back to their rest lengths at the end. It
  // claims the click, so the wardrobe stays open.
  const { body: tarsBody, joints: tarsJoints, lines: tarsLines, left: tarsLeft } = tars.userData.stride;
  const tarsBodyY = tarsBody.position.y;
  const writeLine = ({ mesh, width }, length) => {
    mesh.scale.x = length / width;
    mesh.position.x = tarsLeft + length / 2;
  };
  let strideStart = null, readoutTick = -1;
  parts.push({
    object: tars, state: spring(), apply() {},
    busy(now) {
      if (strideStart === null) return false;
      const u = Math.min(1, (now - strideStart) / (TARS_STRIDE.time * 1000));
      const ease = Math.sin(Math.PI * u), step = Math.sin(Math.PI * 2 * TARS_STRIDE.steps * u);
      for (const { group, rest, way } of tarsJoints) {
        group.rotation.x = rest + way * ease * step * (way > 0 ? TARS_STRIDE.legs : TARS_STRIDE.arms);
      }
      tarsBody.position.y = tarsBodyY + ease * Math.abs(step) * TARS_STRIDE.bob;
      const tick = Math.floor((now - strideStart) / (TARS_READOUT.every * 1000));
      if (tick !== readoutTick && u < 1) {
        readoutTick = tick;
        const { shortest, longest } = TARS_READOUT;
        for (const line of tarsLines) writeLine(line, shortest + Math.random() * (longest - shortest));
      }
      if (u === 1) {
        for (const line of tarsLines) writeLine(line, line.width);
        strideStart = null;
        readoutTick = -1;
      }
      return true;
    },
  });
  tars.traverse((child) => {
    if (child.isMesh) child.userData.onClick = () => { strideStart ??= performance.now(); };
  });
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
    // The pictures match the sampled one the room is drawn into, which the portals look them up by.
    bufferSize.set(sampled.width, sampled.height);
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
    strokeMaterials.push(strokes);
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
    // Trip switched off: no longer a part, so it neither takes clicks nor shows the pointing hand.
    if (!PORTAL_TRIP.enabled) {
      parts.splice(parts.indexOf(part), 1);
      companionCube.traverse((child) => { delete child.userData.part; });
    }
    // Clicks during a trip are ignored.
    part.onToggle = (up) => {
      if (trip) { part.state.target = up ? 0 : 1; return; }
      trip = PORTAL_TRIP.stay
        ? { start: performance.now(), from: stops.top, to: stops.top }
        : { start: performance.now(), from: stops[up ? "middle" : "top"], to: stops[up ? "top" : "middle"] };
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
  // Lays the puddle out ahead of where the rim lands, so it spreads in front of the mug rather than under it; spilled
  // towards the computer it runs on under the case.
  const placePuddle = () => {
    const towardsComputer = mugYaw === fallYaw.computer;
    const reach = mugHeight + .03;
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
  // crashShow: how far into the Matrix show the short circuit hit, if it did.
  let crashStart = null, fried = false, failing = false, crashShow = null;
  // The Matrix code rain set off by the pills: when it started, and whether the screen was off before it.
  let matrixStart = null, matrixWasOff = false;
  const screen = addPart(computer, (t) => {
    screenMaterial.color.lerpColors(screenOff, screenOn, t);
    screenMaterial.emissive.setScalar(t * .5);
    // Off, plain black: as a black metal it gives back none of the room's light either, where a matt black still
    // greys a little in it.
    screenMaterial.metalness = 1 - t;
    // The power LED glows red while the computer is on, and stutters while it shorts out or fails to boot.
    const stutter = (crashStart !== null || failing) && screen.state.target === 1 ? (Math.sin(performance.now() * .09) > 0 ? 1 : .15) : 1;
    ledMaterial.color.lerpColors(ledOff, ledOn, t * stutter);
    ledMaterial.emissive.copy(ledOn).multiplyScalar(t * stutter * PC_LED_ON.glow);
    if (t < .02 && !screen.state.target) display.clear();
  });
  // Coffee in the case: the picture tears and collapses, the computer cuts out and smoke rises from it.
  const shortCircuit = () => {
    crashStart = performance.now();
    crashShow = matrixStart === null ? null : (crashStart - matrixStart) / 1000;
    fried = true;
    matrixStart = null;
  };
  // A click on the pills: the screen lights up, even with the computer off, glitches as the Matrix takes over what it
  // showed, shows the code rain and its message for a few seconds, then goes back to what it was. Not while the
  // computer shorts out or fails to boot.
  function playMatrix() {
    if (crashStart !== null || failing) return;
    if (matrixStart === null) {
      matrixWasOff = screen.state.target === 0;
      display.keepBefore();
    }
    matrixStart = performance.now();
    screen.state.target = 1;
  }
  // Each switch-on replays the boot; frames keep coming until the desktop is up. Right after a short circuit the
  // first try fails and cuts out; the next one works.
  screen.onToggle = (on) => {
    matrixStart = null;
    if (!on) { failing = false; return; }
    crashStart = null;
    poseSmoke(-1);
    failing = fried;
    fried = false;
    bootStart = performance.now();
    display.reset();
    display.draw(0);
  };
  const screenReady = () => screen.state.target === 1 && crashStart === null && !failing && matrixStart === null && performance.now() - bootStart >= BOOT.end * 1000;
  screen.busy = (now) => {
    if (crashStart !== null) {
      const seconds = (now - crashStart) / 1000;
      if (seconds < CRASH.end && screen.state.target === 1) display.crash(seconds, crashShow);
      else screen.state.target = 0;
      poseSmoke(seconds);
      if (seconds < smokeEnd) return true;
      crashStart = null;
      return false;
    }
    if (matrixStart !== null) {
      const seconds = (now - matrixStart) / 1000;
      if (seconds < MATRIX_END) { display.matrix(seconds); return true; }
      matrixStart = null;
      // Back to how it was: switched off again, or the desktop (or the rest of the boot) as before.
      if (matrixWasOff) { screen.state.target = 0; return false; }
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
    const part = addPart(drawer, (t) => { drawer.position.z = rest + t * DRAWER_JOLT.travel; });
    // What lies in the drawer lags behind a sharp pull or push: it slides against friction and stops where it is, and
    // tall things (userData.tips) also rock on their base and settle back. Each thing rides in its own holders, so its
    // own moves (the duck's squeeze) are left alone; each reacts a bit differently. It never ends up further than reach
    // from where it was put, nor past the tray's front or back wall.
    drawer.updateWorldMatrix(true, true);
    const drawerAt = new THREE.Vector3().setFromMatrixPosition(drawer.matrixWorld);
    const loose = drawer.children.filter((child) => !drawer.userData.shell.has(child)).map((object, i) => {
      const box = new THREE.Box3().setFromObject(object).translate(drawerAt.clone().negate());
      const back = Math.max(-DRAWER_JOLT.reach, drawer.userData.back - box.min.z);
      const front = Math.min(DRAWER_JOLT.reach, -box.max.z);
      // slider (slides along z) → rocker (turns about the middle of the object's base) → object back in place.
      const base = new THREE.Vector3((box.min.x + box.max.x) / 2, box.min.y, (box.min.z + box.max.z) / 2);
      const slider = new THREE.Group(), rocker = new THREE.Group(), inner = new THREE.Group();
      rocker.position.copy(base);
      inner.position.copy(base).negate();
      drawer.add(slider);
      slider.add(rocker);
      rocker.add(inner);
      inner.add(object);
      return {
        slider, rocker, tips: object.userData.tips, halfDepth: (box.max.z - box.min.z) / 2, floor: base.y,
        give: object.userData.jolt ?? 1 + (i % 3) * DRAWER_JOLT.spread,
        slide: 0, speed: 0, tilt: spring(), back: Math.min(0, back), front: Math.max(0, front),
      };
    });
    let lastVelocity = 0, lastTime = 0;
    part.busy = (now) => {
      const dt = lastTime && now - lastTime < 100 ? (now - lastTime) / 1000 : .016;
      lastTime = now;
      const acceleration = (part.state.velocity - lastVelocity) / dt * DRAWER_JOLT.travel;
      lastVelocity = part.state.velocity;
      const { push, friction } = DRAWER_JOLT;
      let moving = false;
      for (const thing of loose) {
        // The jolt felt in the drawer, the other way from where it moves.
        const jolt = -push * thing.give * acceleration;
        if (thing.speed === 0) {
          // Held by friction until the jolt beats it.
          if (Math.abs(jolt) > friction) thing.speed = (jolt - Math.sign(jolt) * friction) * dt;
        } else {
          const speed = thing.speed + (jolt - Math.sign(thing.speed) * friction) * dt;
          // Stops once friction has used up its speed, unless the jolt keeps it going.
          thing.speed = Math.sign(speed) !== Math.sign(thing.speed) && Math.abs(jolt) <= friction ? 0 : speed;
        }
        thing.slide += thing.speed * dt;
        if (thing.slide <= thing.back || thing.slide >= thing.front) {
          thing.slide = THREE.MathUtils.clamp(thing.slide, thing.back, thing.front);
          thing.speed = 0;
        }
        thing.slider.position.z = thing.slide;
        if (thing.speed !== 0) moving = true;
        if (!thing.tips) continue;
        // Rocks onto the edge the jolt pushes it over, which stays on the floor; its weight brings it back. Each tall
        // thing rocks its own way (its tips settings), and may also sway sideways as it goes.
        const { tilt } = thing, { tip, upright, rock, sway } = thing.tips;
        tilt.velocity += (tip * jolt - upright * tilt.value - rock * tilt.velocity) * dt;
        tilt.value += tilt.velocity * dt;
        thing.rocker.rotation.x = tilt.value;
        thing.rocker.rotation.z = tilt.value * sway;
        thing.rocker.position.y = thing.floor + thing.halfDepth * Math.abs(Math.sin(tilt.value));
        moving ||= Math.abs(tilt.value) > 1e-4 || Math.abs(tilt.velocity) > 1e-3;
      }
      return moving;
    };
  }

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

  // Clicking the toolbox knocks it off the shelf edge: it tips over and drops, accelerating, and lands on its front with
  // a little rock. Its contents ride along until it lands, then carry on with the speed and spin they had: they drop
  // onto its front wall, now the bottom, slide and tumble out of it and come to rest on the floor around it.
  // Clicking again plays the same fall backwards, a bit faster, to tidy everything away.
  // The box tips over its front bottom edge, which stays on the shelf lip at first, then falls with it to the floor.
  const frontEdge = new THREE.Vector3(0, 0, .05);
  const lip = toolbox.position.clone().add(frontEdge.clone().applyEuler(toolbox.rotation));
  const landed = new THREE.Euler(Math.PI / 2, toolbox.rotation.y, 0, "YXZ");
  const floorEdge = new THREE.Vector3(toolbox.position.x, .05, .06).add(frontEdge.clone().applyEuler(landed));
  const hinge = new THREE.Vector3(), offset = new THREE.Vector3();
  const easeIn = (u) => u * u;
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
  // The box as its contents feel it, in its own space: a tray open at the top (floor, front and back walls, end walls
  // rising into the tapered ends that carry the bar). Not the bar: once the box lies on its front the bar spans the
  // opening at mid height, lower than the hammer's head is tall, and would keep the hammer in. For a point sunk into
  // it: how deep, and the shallowest way out (back into the tray, or out of the box), else nothing.
  const outOfBox = (p) => {
    const ax = Math.abs(p.x), az = Math.abs(p.z), sx = Math.sign(p.x) || 1, sz = Math.sign(p.z) || 1;
    const ways = [];
    const way = (depth, x, y, z) => ways.push({ depth, normal: new THREE.Vector3(x, y, z) });
    if (ax < .1 && az < .05 && p.y > 0 && p.y < .006) {
      way(.006 - p.y, 0, 1, 0);
      way(p.y, 0, -1, 0);
      way(.1 - ax, sx, 0, 0);
      way(.05 - az, 0, 0, sz);
    } else if (ax < .094 && az > .044 && az < .05 && p.y > 0 && p.y < .065) {
      way(az - .044, 0, 0, -sz);
      way(.05 - az, 0, 0, sz);
      way(.065 - p.y, 0, 1, 0);
    } else if (ax > .092 && ax < .1 && p.y > 0 && p.y < .1 && az < .05 - .28 * p.y) {
      way(ax - .092, -sx, 0, 0);
      way(.1 - ax, sx, 0, 0);
      way(.05 - .28 * p.y - az, 0, 0, sz);
      way(.1 - p.y, 0, 1, 0);
    }
    return ways.length ? ways.reduce((most, next) => (next.depth < most.depth ? next : most)) : null;
  };
  // A piece's pose in the wardrobe's space while it rides in the box, time seconds into the fall.
  const ridingPose = (object, time) => {
    poseToolbox(time);
    toolbox.updateMatrix();
    object.updateMatrix();
    const position = new THREE.Vector3(), quaternion = new THREE.Quaternion();
    new THREE.Matrix4().multiplyMatrices(toolbox.matrix, object.matrix).decompose(position, quaternion, new THREE.Vector3());
    return { position, quaternion };
  };
  // What the contents rest on and knock against once the box has landed: the floor, and the box (it ignores the box's
  // short rock as it settles). Of the two, the shallowest it has sunk into is the one it came through.
  const up = new THREE.Vector3(0, 1, 0), still = new THREE.Vector3();
  const landedBox = new THREE.Matrix4(), landedSpace = new THREE.Matrix4();
  const groundAt = (point) => {
    const floor = point.y < 0 ? { depth: -point.y, normal: up, velocity: still } : null;
    const hit = outOfBox(point.clone().applyMatrix4(landedSpace));
    if (!hit || (floor && floor.depth < hit.depth)) return floor;
    return { depth: hit.depth, normal: hit.normal.transformDirection(landedBox), velocity: still, friction: DROP.boxSlip };
  };
  // The pieces' way out, worked out once and together, so they knock into each other: each leaves the box as it lands,
  // with the speed and spin it had just before. Worked out once the page is idle, so loading doesn't wait for it, or at
  // the first knock if that comes sooner.
  let spill = null, fallEnd = FALL.end, fallTime = 0, fallClock = null;
  const workOutSpill = () => {
    if (spill) return;
    poseToolbox(FALL.end);
    toolbox.updateMatrix();
    landedBox.copy(toolbox.matrix);
    landedSpace.copy(toolbox.matrix).invert();
    const starts = loose.map((object) => {
      const lag = .004;
      const before = ridingPose(object, FALL.land - lag), start = ridingPose(object, FALL.land);
      const { com } = object.userData.body;
      const velocity = com.clone().applyQuaternion(start.quaternion).add(start.position)
        .sub(com.clone().applyQuaternion(before.quaternion).add(before.position)).divideScalar(lag);
      const turn = start.quaternion.clone().multiply(before.quaternion.clone().invert());
      const angle = 2 * Math.acos(THREE.MathUtils.clamp(turn.w, -1, 1));
      const axis = new THREE.Vector3(turn.x, turn.y, turn.z);
      const angular = axis.lengthSq() > 1e-12 ? axis.normalize().multiplyScalar((angle > Math.PI ? angle - 2 * Math.PI : angle) / lag) : new THREE.Vector3();
      return { ...start, velocity, angular };
    });
    const tracks = simulateDrops(loose.map((object) => object.userData.body), starts, groundAt);
    spill = loose.map((object, k) => ({
      object, track: tracks[k], duration: (tracks[k].length - 1) / DROP.rate,
      home: { position: object.position.clone(), quaternion: object.quaternion.clone() },
    }));
    fallEnd = Math.max(FALL.end, ...spill.map((piece) => FALL.land + piece.duration));
    poseToolbox(fallTime);
  };
  if ("requestIdleCallback" in window) requestIdleCallback(workOutSpill, { timeout: 4000 });
  else setTimeout(workOutSpill, 2000);
  const posePiece = (piece, time) => {
    if (time <= FALL.land) {
      if (piece.object.parent !== toolbox) {
        toolbox.add(piece.object);
        piece.object.position.copy(piece.home.position);
        piece.object.quaternion.copy(piece.home.quaternion);
      }
      return;
    }
    if (piece.object.parent !== cabinet) cabinet.add(piece.object);
    followTrack(piece.object, piece.track, time - FALL.land);
  };
  const fall = addPart(toolbox, () => {});
  fall.busy = (now) => {
    if (!fall.state.target && fallTime === 0) return false;
    workOutSpill();
    const dt = fallClock === null ? 0 : Math.min(.05, (now - fallClock) / 1000);
    fallClock = now;
    const before = fallTime;
    fallTime = fall.state.target ? Math.min(fallEnd, fallTime + dt) : Math.max(0, fallTime - dt * 1.4);
    poseToolbox(fallTime);
    for (const piece of spill) posePiece(piece, fallTime);
    const moving = fallTime !== before || (fall.state.target ? fallTime < fallEnd : fallTime > 0);
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
  // fades in once they are ready. Compiled for drawing into sampled, as they will.
  renderer.setRenderTarget(sampled);
  const shadersReady = renderer.compileAsync(scene, camera);
  renderer.setRenderTarget(null);
  shadersReady.catch(() => {}).then(() => {
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
    // The canvas overflows its frame by a quarter of it on each side (see .about-room-canvas) so things can fall or
    // spill past the frame's edges; the camera still frames the room in the frame and renders the overflow around it.
    // Its edges are moved to the nearest screen pixels and its picture is exactly that many pixels, so the browser shows
    // it as drawn. Sizes below in screen pixels.
    if (!host) return;
    const frame = host.getBoundingClientRect();
    if (!frame.width || !frame.height) return;
    const ratio = window.devicePixelRatio || 1;
    const left = Math.round((frame.left - frame.width * .25) * ratio), top = Math.round((frame.top - frame.height * .25) * ratio);
    const width = Math.round((frame.right + frame.width * .25) * ratio) - left;
    const height = Math.round((frame.bottom + frame.height * .25) * ratio) - top;
    Object.assign(canvas.style, {
      left: `${left / ratio - frame.left}px`, top: `${top / ratio - frame.top}px`, width: `${width / ratio}px`, height: `${height / ratio}px`,
    });
    supersample = software || ratio >= 2 ? 1 : 2;
    renderer.setSize(width, height, false);
    sampled.setSize(width * supersample, height * supersample);
    shrink.uniforms.offset.value.set((supersample - 1) / 2 / sampled.width, (supersample - 1) / 2 / sampled.height);
    outlineUniforms.outlineResolution.value.set(sampled.width, sampled.height);
    outlineUniforms.outlineWidth.value = TOOL_OUTLINE.width * ratio * supersample;
    for (const material of strokeMaterials) material.opacity = Math.min(1, EDGE_STROKE.opacity * supersample);
    camera.aspect = frame.width / frame.height;
    camera.setViewOffset(frame.width * ratio, frame.height * ratio, left - frame.left * ratio, top - frame.top * ratio, width, height);
    // Keep the whole room in view whatever the frame's shape: fit its bounding sphere to the narrower field of view.
    const vertical = THREE.MathUtils.degToRad(camera.fov) / 2;
    const horizontal = Math.atan(Math.tan(vertical) * camera.aspect);
    const distance = radius * .84 / Math.sin(Math.min(vertical, horizontal));
    camera.position.set(Math.sin(VIEW_AZIMUTH) * Math.cos(VIEW_ELEVATION) * distance, Math.sin(VIEW_ELEVATION) * distance, Math.cos(VIEW_AZIMUTH) * Math.cos(VIEW_ELEVATION) * distance);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
    wake();
  }

  // Kept fitted as the frame changes size, the page zooms (the screen's pixels change), or the fonts arriving move it.
  const observer = new ResizeObserver(resize);
  window.addEventListener("resize", resize);
  document.fonts?.ready.then(resize);

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
    draw();
    if (moving) wake();
    else last = 0;
  }

  function wake() {
    if (!frame && attached && compiled) frame = requestAnimationFrame(tick);
  }

  return {
    // Read straight after drawing, while the canvas still holds the frame (at the screen's pixels).
    picture(type, quality) {
      beforeRender?.();
      draw();
      return canvas.toDataURL(type, quality);
    },
    // Shows the room in this frame, straight away if it is ready and otherwise once the shaders are in.
    attach(next) {
      host = next;
      host.append(canvas);
      observer.disconnect();
      observer.observe(host);
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
