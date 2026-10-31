import * as THREE from "../../vendor/r180/three.module.js";

export function createControllerSignal(model) {
  const group = new THREE.Group();
  model.root.add(group);
  const geometry = new THREE.SphereGeometry(.035, 10, 8);
  const particles = Array.from({ length: 8 }, (_, i) => {
    const material = new THREE.MeshBasicMaterial({ color: i ? 0xffb89a : 0xfff2dc, transparent: true, depthWrite: false, toneMapped: false });
    const particle = new THREE.Mesh(geometry, material);
    particle.scale.setScalar(1 - i * .075);
    group.add(particle);
    return particle;
  });
  let curve = null, elapsed = 0;
  group.visible = false;
  return {
    get active() { return curve !== null; },
    play(index) {
      curve = model.signalPaths[index];
      elapsed = 0;
    },
    stop() { curve = null; group.visible = false; },
    update(dt, visible, reducedMotion) {
      if (!curve) return 0;
      if (!visible || reducedMotion) { this.stop(); return 0; }
      elapsed = (elapsed + dt) % 2.6;
      const progress = elapsed / 1.6;
      group.visible = progress < 1.12;
      particles.forEach((particle, i) => {
        const t = progress - i * .016;
        particle.visible = t >= 0 && t <= 1;
        if (particle.visible) {
          particle.position.copy(curve.getPointAt(t));
          const fadeIn = THREE.MathUtils.smoothstep(t, 0, .12);
          const fadeOut = 1 - THREE.MathUtils.smoothstep(t, .88, 1);
          particle.material.opacity = .65 * (1 - i / particles.length) * fadeIn * fadeOut;
        }
      });
      const arrival = Math.max(0, 1 - Math.abs(elapsed - 1.7) / .3);
      return .4 * Math.sin(arrival * Math.PI / 2) ** 2;
    },
    dispose() { particles.forEach(particle => particle.material.dispose()); },
  };
}
