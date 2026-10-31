import * as THREE from "../../vendor/r180/three.module.js";

// Proportions reconstructed from controller/1.webp and the four prototype photos.
// Interior is an explanatory model, not a dimensionally exact CAD reconstruction.
export function createController() {
  const root = new THREE.Group(), shell = new THREE.Group();
  root.add(shell);
  const mats = {};
  for (const [name, color] of Object.entries({ shell: 0x414d4d, trim: 0x303a3c, metal: 0x8e9797, wood: 0xffffff, endgrain: 0xffffff, rubber: 0x20282a, board: 0x246d78, chip: 0x283239, silver: 0xbac1c2, red: 0xd34d2f, violet: 0x7352a4, wire: 0x547e91, black: 0x364348, arrow: 0x3d8de0 })) {
    mats[name] = new THREE.MeshStandardMaterial({ color, roughness: name === "metal" || name === "silver" ? .4 : .85, metalness: name === "metal" || name === "silver" ? .65 : .05 });
  }
  // Small deterministic grain textures keep the timber matte, with no asset download.
  for (const [name, tint] of [["wood", 0], ["endgrain", 6]]) {
    const size = 256, data = new Uint8Array(size * size * 4);
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
      const u = x / size, v = y / size;
      const bend = Math.sin(u * Math.PI * 2) * 1.5 + Math.sin(u * Math.PI * 4) * .35;
      const grain = Math.sin(v * Math.PI * 64 + bend) * 3.5
        + Math.sin(v * Math.PI * 142 + bend * 1.8) * 1.7;
      const noise = (Math.sin(x * 12.9898 + y * 78.233) * 43758.5453) % 1;
      const shade = grain + noise * 1.6;
      const i = (y * size + x) * 4;
      data[i] = 198 + tint + shade;
      data[i + 1] = 171 + tint + shade;
      data[i + 2] = 132 + tint + shade;
      data[i + 3] = 255;
    }
    const texture = new THREE.DataTexture(data, size, size);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.magFilter = THREE.LinearFilter;
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.generateMipmaps = true; texture.needsUpdate = true;
    Object.assign(mats[name], { map: texture, bumpMap: texture, bumpScale: .012, metalness: 0, roughness: .94 });
  }
  const picks = [];
  function add(geo, mat, pos, parent = root, part = null) {
    const m = new THREE.Mesh(geo, mats[mat]);
    m.position.set(...pos); m.castShadow = m.receiveShadow = true;
    if (part) { m.userData.part = part; picks.push(m); }
    parent.add(m); return m;
  }
  const box = (size, mat, pos, parent, part) => {
    if (mat !== "wood" && mat !== "endgrain") return add(new THREE.BoxGeometry(...size), mat, pos, parent, part);
    const object = rounded(...size, .025, mat, pos, parent, part);
    // Project in model units so thin rails and large blocks share the same grain scale.
    const positions = object.geometry.attributes.position, normals = object.geometry.attributes.normal, uv = object.geometry.attributes.uv;
    for (let i = 0; i < positions.count; i++) {
      const u = Math.abs(normals.getX(i)) > .5 ? positions.getZ(i) : positions.getX(i);
      const v = Math.abs(normals.getY(i)) > .5 ? positions.getZ(i) : positions.getY(i);
      uv.setXY(i, u * .6, v * .6);
    }
    uv.needsUpdate = true;
    return object;
  };
  const cyl = (r, h, mat, pos, parent, part) => add(new THREE.CylinderGeometry(r, r, h, 24), mat, pos, parent, part);
  function rounded(w, h, d, radius, mat, pos, parent, part) {
    const s = new THREE.Shape(), x = -w / 2, y = -h / 2, r = radius;
    s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r);
    s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r);
    s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
    const g = new THREE.ExtrudeGeometry(s, { depth: d - .04, bevelEnabled: true, bevelSegments: 2, steps: 1, bevelSize: .02, bevelThickness: .02 });
    g.translate(0, 0, -d / 2 + .02);
    return add(g, mat, pos, parent, part);
  }
  function wire(points, mat, parent = root) {
    const curve = new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p)));
    return add(new THREE.TubeGeometry(curve, 30, .018, 5, false), mat, [0, 0, 0], parent);
  }
  // The removable enclosure is separate from the wooden chassis and controls.
  rounded(6.35, .16, 2.35, .08, "trim", [0, .02, 0], shell);
  box([5.95, .11, 2.04], "endgrain", [0, .16, 0], root, "structure");
  // Slightly overlap the plinth so rounded/bevelled edges cannot reveal the wood.
  const frontPanel = rounded(6.22, 1.23, .13, .12, "shell", [0, .67, 1.13], shell, "cover");
  const frontPanelRest = frontPanel.position.clone();
  rounded(6.22, 1.23, .13, .12, "shell", [0, .67, -1.13], shell, "structure");
  for (const side of [-1, 1]) {
    const end = box([.15, 1.23, 2.14], "shell", [side * 3.03, .67, 0], shell, "structure");
    // Side inset follows its enclosure piece.
    box([.018, .78, 1.65], "trim", [side * .086, 0, 0], end);
  }
  const roof = new THREE.Group(); shell.add(roof); roof.position.y = 1.32;
  box([3.35, .13, 2.17], "shell", [0, 0, 0], roof, "structure");
  for (const side of [-1, 1]) {
    box([.6, .13, 2.17], "shell", [side * 2.73, 0, 0], roof, "structure");
    for (const z of [-.88, .88]) box([.63, .13, .4], "shell", [side * 2.02, 0, z], roof, "structure");
  }
  const levers = [], sensors = [], couplings = [], leverWires = [], signalPaths = [], axleRigs = [], rotationArrows = [];
  for (const [index, side] of [-1, 1].entries()) {
    const x = side * 2.04;
    box([1.4, .44, 1.55], "wood", [x, .44, 0], root, "structure");
    for (const z of [-.66, .66]) box([1.5, .18, .15], "endgrain", [x, .74, z], root, "structure");
    const axleRig = new THREE.Group(); axleRig.position.set(x, .72, 0); root.add(axleRig); axleRigs.push(axleRig);
    const axle = cyl(.067, 1.85, "silver", [0, 0, 0], axleRig, "sensors"); axle.rotation.z = Math.PI / 2;
    box([.45, .012, .022], "black", [side * -.68, .067, 0], axleRig);
    box([.012, .1, .022], "black", [side * -.93, 0, 0], axleRig);
    // Rotation gauge: two arcs grow from the top of the axle, forwards or backwards with the lever.
    // The viewer reveals them with a draw range and moves the tip to the end of the visible arc.
    const arrow = new THREE.Group(); arrow.position.set(side * 1.06, .72, 0); root.add(arrow);
    const gauge = { radius: .38, sweep: Math.PI * .75, segments: 48, radial: 6, offset: side * -.06 };
    const gaugeMaterial = mats.arrow.clone();
    gaugeMaterial.transparent = true;
    gaugeMaterial.emissive.set(0x3d8de0).multiplyScalar(.35);
    mats[`gauge${index}`] = gaugeMaterial;
    const arcs = [1, -1].map(direction => {
      const points = [];
      for (let i = 0; i <= gauge.segments; i++) {
        const a = direction * gauge.sweep * i / gauge.segments;
        points.push(new THREE.Vector3(gauge.offset, Math.cos(a) * gauge.radius, Math.sin(a) * gauge.radius));
      }
      const mesh = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), gauge.segments, .02, gauge.radial, false), gaugeMaterial);
      arrow.add(mesh);
      return mesh;
    });
    const tip = new THREE.Mesh(new THREE.ConeGeometry(.056, .14, 12), gaugeMaterial);
    arrow.add(tip);
    Object.assign(arrow.userData, { gauge, arcs, tip, material: gaugeMaterial });
    arrow.visible = false; rotationArrows.push(arrow);
    const bearing = rounded(.46, .37, .4, .04, "trim", [x, .74, 0], root, "sensors");
    for (const z of [-.3, .3]) cyl(.046, .035, "silver", [x, .68, z], root);
    const sensor = cyl(.17, .17, "metal", [side * 2.84, .72, 0], root, "sensors"); sensor.rotation.z = Math.PI / 2;
    sensors.push(sensor);
    const coupling = cyl(.08, .27, "red", [side * 2.62, .72, 0], root, "sensors"); coupling.rotation.z = Math.PI / 2;
    couplings.push(coupling);
    box([.1, .53, .65], "wood", [side * 2.94, .5, 0], root, "structure");
    const pivot = new THREE.Group(); root.add(pivot); pivot.position.set(x, .72, 0);
    box([.23, 2.4, .25], "shell", [0, 1.26, 0], pivot, `lever${index}`);
    rounded(1.43, .42, .5, .12, "trim", [side * -.18, 2.55, 0], pivot, `lever${index}`);
    // Triangular bracing between the upright and grip.
    const brace = new THREE.Shape(); brace.moveTo(-.05, 0); brace.lineTo(side * .48, .34); brace.lineTo(-.05, .34); brace.closePath();
    const braceMesh = add(new THREE.ExtrudeGeometry(brace, { depth: .12, bevelEnabled: false }), "shell", [0, 2.05, -.06], pivot, `lever${index}`);
    levers.push(pivot);
    // Route around the front/back of the wooden supports, then into the centre.
    wire([[side * 2.84, .78, -.1], [side * 2.85, .76, -.5], [side * 2.84, .55, -.94], [side * 2.45, .34, -.94], [side * 1.65, .29, -.94], [side * 1.08, .29, -.94], [side * .68, .32, -.73], [side * .37, .48, -.25]], "wire");
    signalPaths.push(wire([[side * 2.84, .73, .1], [side * 2.85, .71, .5], [side * 2.84, .52, .94], [side * 2.45, .31, .94], [side * 1.65, .28, .94], [side * 1.08, .28, .94], [side * .65, .32, .68], [side * .37, .48, .3]], "red").geometry.parameters.path);
    leverWires.push(bearing, braceMesh);
  }
  // Uno-like board: visible layout follows the central board in the photos.
  const board = new THREE.Group(); root.add(board); board.position.set(0, .3, 0);
  box([.96, .07, 1.26], "board", [0, 0, 0], board, "arduino");
  box([.22, .11, .57], "chip", [.03, .09, -.02], board, "arduino");
  box([.28, .22, .27], "silver", [-.22, .12, .55], board, "arduino");
  box([.2, .19, .26], "black", [.28, .1, .53], board, "arduino");
  for (const side of [-1, 1]) {
    box([.12, .15, .78], "chip", [side * .37, .1, -.08], board, "arduino");
    for (let i = 0; i < 8; i++) box([.045, .035, .045], "silver", [side * .37, .19, -.42 + i * .095], board);
  }
  for (const x of [-.22, .23]) cyl(.055, .15, "silver", [x, .1, -.47], board);
  const led = box([.05, .02, .07], "red", [.2, .08, .27], board);
  // The right grip's inner end faces the opposite handle (negative local X).
  const boost = cyl(.115, .065, "red", [-.94, 2.55, 0], levers[1], "boost"); boost.rotation.z = Math.PI / 2;
  signalPaths.push(wire([[2.04, .88, .18], [2.04, .93, .5], [2.04, .93, .94], [1.53, .9, .94], [1.08, .65, .94], [.7, .35, .74], [.37, .48, .35]], "black").geometry.parameters.path);
  // Visible fasteners on the top lid.
  for (const x of [-2.83, 2.83]) for (const z of [-.84, .84]) cyl(.045, .015, "metal", [x, .085, z], roof);
  return { root, shell, frontPanel, frontPanelRest, roof, roofRest: roof.position.clone(), picks, levers, sensors, couplings, signalPaths, axleRigs, rotationArrows, boost, board, led, materials: mats };
}
