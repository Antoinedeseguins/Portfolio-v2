import * as THREE from "../../vendor/three.module.js";

// Boost press kick: a short damped shake of the whole controller, an orange flash on the grip
// and a spray of sparks thrown out of the button that fall and fade.
const SPARKS = 34, LIFE = .6, SHAKE = .32, SIZE = .24;

export function createBoostBurst(scene, model) {
  const positions = new Float32Array(SPARKS * 3);
  const velocities = Array.from({ length: SPARKS }, () => new THREE.Vector3());
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  // Round soft sprite so sparks read as glowing dots rather than squares.
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 32;
  const context = canvas.getContext("2d");
  const gradient = context.createRadialGradient(16, 16, 0, 16, 16, 16);
  gradient.addColorStop(0, "rgba(255,255,255,1)");
  gradient.addColorStop(.35, "rgba(255,210,150,.9)");
  gradient.addColorStop(1, "rgba(255,120,60,0)");
  context.fillStyle = gradient;
  context.fillRect(0, 0, 32, 32);
  const sprite = new THREE.CanvasTexture(canvas);
  const material = new THREE.PointsMaterial({ map: sprite, color: 0xffa060, size: SIZE, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending });
  const sparks = new THREE.Points(geometry, material);
  sparks.frustumCulled = false;
  sparks.visible = false;
  scene.add(sparks);
  const flash = new THREE.PointLight(0xff7a40, 0, 3.2, 2);
  scene.add(flash);
  const rest = model.root.position.clone();
  const origin = new THREE.Vector3(), outward = new THREE.Vector3(), grip = new THREE.Vector3();
  let age = Infinity;

  return {
    trigger() {
      model.boost.getWorldPosition(origin);
      // The button sits on the grip's inner end, so sparks fly away from the grip's centre.
      model.levers[1].localToWorld(grip.set(-.18, 2.55, 0));
      outward.subVectors(origin, grip).setY(0).normalize();
      for (let i = 0; i < SPARKS; i++) {
        positions.set([origin.x, origin.y, origin.z], i * 3);
        velocities[i].copy(outward).multiplyScalar(2.2 + Math.random() * 2.8)
          .add(new THREE.Vector3((Math.random() - .5) * 2.4, 1 + Math.random() * 2.2, (Math.random() - .5) * 2.4));
      }
      geometry.attributes.position.needsUpdate = true;
      flash.position.copy(origin);
      age = 0;
    },
    // Returns whether the burst still needs frames.
    update(dt) {
      if (age >= LIFE && age >= SHAKE) return false;
      age += dt;
      const life = Math.min(1, age / LIFE);
      for (let i = 0; i < SPARKS; i++) {
        velocities[i].y -= 9 * dt;
        velocities[i].multiplyScalar(1 - 1.5 * dt);
        positions[i * 3] += velocities[i].x * dt;
        positions[i * 3 + 1] += velocities[i].y * dt;
        positions[i * 3 + 2] += velocities[i].z * dt;
      }
      geometry.attributes.position.needsUpdate = true;
      sparks.visible = life < 1;
      material.opacity = (1 - life) ** 1.5;
      material.size = SIZE * (1 - life * .6);
      flash.intensity = 10 * Math.max(0, 1 - age / .18) ** 2;
      // A few fast, decaying jolts, strongest along the grip's push direction.
      const shake = Math.max(0, 1 - age / SHAKE) ** 2 * .035;
      model.root.position.set(rest.x + Math.sin(age * 90) * shake * outward.x, rest.y + Math.sin(age * 73 + 1) * shake * .6, rest.z + Math.sin(age * 81 + 2) * shake);
      if (age >= SHAKE) model.root.position.copy(rest);
      return age < LIFE || age < SHAKE;
    },
    dispose() {
      geometry.dispose(); material.dispose(); sprite.dispose();
      scene.remove(sparks, flash);
      flash.dispose();
    },
  };
}
