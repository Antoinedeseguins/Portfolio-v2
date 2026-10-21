import * as THREE from "../vendor/three.module.js";

// Transparent studio floor: the CSS backdrop remains continuous behind the scene.
export function createControllerStudio(scene, renderer, keyLight) {
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.set(1024, 1024);
  Object.assign(keyLight.shadow.camera, { left: -5, right: 5, top: 5, bottom: -5, near: .5, far: 22 });
  keyLight.shadow.normalBias = .025;
  keyLight.shadow.bias = -.00015;
  keyLight.shadow.radius = 5;
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), new THREE.ShadowMaterial({ color: 0x44515a, opacity: .2, depthWrite: false }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -.115;
  floor.receiveShadow = true;
  scene.add(floor);

  // Broad ambient contact shadow softens the tighter directional shadow.
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 256;
  const context = canvas.getContext("2d");
  const gradient = context.createRadialGradient(128, 128, 20, 128, 128, 125);
  gradient.addColorStop(0, "rgba(55,65,72,.23)");
  gradient.addColorStop(.4, "rgba(55,65,72,.14)");
  gradient.addColorStop(1, "rgba(55,65,72,0)");
  context.fillStyle = gradient;
  context.fillRect(0, 0, 256, 256);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const contact = new THREE.Mesh(new THREE.PlaneGeometry(8.5, 4.7), new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false, toneMapped: false }));
  contact.rotation.x = -Math.PI / 2;
  contact.position.y = -.105;
  scene.add(contact);

  // Faint ground-plane arcs echo the reference without adding interface elements.
  const rings = [];
  for (const [radius, opacity] of [[3.8, .12], [5.1, .08], [6.6, .045]]) {
    const points = [];
    for (let i = 0; i < 160; i++) {
      const a = i / 160 * Math.PI * 2;
      points.push(new THREE.Vector3(Math.cos(a) * radius, -.108, Math.sin(a) * radius));
    }
    const ring = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(points), new THREE.LineBasicMaterial({ color: 0xf1f4f4, transparent: true, opacity, depthWrite: false }));
    rings.push(ring); scene.add(ring);
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
