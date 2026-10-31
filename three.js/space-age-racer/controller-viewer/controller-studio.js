import * as THREE from "../../vendor/r180/three.module.js";

// Transparent studio floor: the CSS backdrop remains continuous behind the scene.
export function createControllerStudio(scene, renderer, keyLight) {
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.set(2048, 2048);
  Object.assign(keyLight.shadow.camera, { left: -7, right: 7, top: 7, bottom: -7, near: .5, far: 22 });
  keyLight.shadow.normalBias = .025;
  keyLight.shadow.bias = -.00015;
  keyLight.shadow.radius = 5;
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), new THREE.ShadowMaterial({ color: 0x44515a, opacity: .28, depthWrite: false }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -.115;
  floor.receiveShadow = true;
  scene.add(floor);

  // Broad ambient contact shadow softens the tighter directional shadow.
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 256;
  const context = canvas.getContext("2d");
  const gradient = context.createRadialGradient(128, 128, 20, 128, 128, 125);
  gradient.addColorStop(0, "rgba(55,65,72,.12)");
  gradient.addColorStop(.4, "rgba(55,65,72,.06)");
  gradient.addColorStop(1, "rgba(55,65,72,0)");
  context.fillStyle = gradient;
  context.fillRect(0, 0, 256, 256);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const contact = new THREE.Mesh(new THREE.PlaneGeometry(7, 3.5), new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false, toneMapped: false }));
  contact.rotation.x = -Math.PI / 2;
  contact.position.y = -.105;
  scene.add(contact);

  // Faint ground-plane arcs echo the reference without adding interface elements.
  const rings = [];
  for (const [radius, opacity] of [[3.8, .16], [5.1, .11], [6.6, .065]]) {
    const points = [];
    for (let i = 0; i < 160; i++) {
      const a = i / 160 * Math.PI * 2;
      points.push(new THREE.Vector3(Math.cos(a) * radius, -.108, Math.sin(a) * radius));
    }
    const ring = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(points), new THREE.LineBasicMaterial({ color: 0xf1f4f4, transparent: true, opacity, depthWrite: false }));
    rings.push(ring); scene.add(ring);
    const ticks = [];
    for (let i = 0; i < 72; i++) {
      const a = i / 72 * Math.PI * 2;
      const length = i % 6 === 0 ? .16 : .07;
      for (const r of [radius, radius + length]) {
        ticks.push(new THREE.Vector3(Math.cos(a) * r, -.108, Math.sin(a) * r));
      }
    }
    const graduations = new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(ticks), new THREE.LineBasicMaterial({ color: 0xf1f4f4, transparent: true, opacity: opacity * .85, depthWrite: false }));
    rings.push(graduations); scene.add(graduations);
  }
  return {
    // Do not let a below-floor orbit reveal a floating shadow plane.
    update(camera) {
      const visible = camera.position.y > 0;
      floor.visible = contact.visible = visible;
      rings.forEach(ring => { ring.visible = visible; });
    },
    dispose() {
      texture.dispose();
      floor.material.dispose(); contact.material.dispose();
      rings.forEach(ring => ring.material.dispose());
      keyLight.shadow.dispose();
    },
  };
}
