import * as THREE from "../../vendor/r180/three.module.js";

// Light pulses running along the controller's wires to the Arduino: along one wire, or along several at once, leaving
// and arriving together (a pulse takes the same time whatever the length of its wire).
export function createControllerSignal(model) {
  const geometry = new THREE.SphereGeometry(.035, 10, 8);
  const trains = model.signalPaths.map(() => {
    const group = new THREE.Group();
    model.root.add(group);
    group.visible = false;
    const particles = Array.from({ length: 8 }, (_, i) => {
      const material = new THREE.MeshBasicMaterial({ color: i ? 0xffb89a : 0xfff2dc, transparent: true, depthWrite: false, toneMapped: false });
      const particle = new THREE.Mesh(geometry, material);
      particle.scale.setScalar(1 - i * .075);
      group.add(particle);
      return particle;
    });
    return { group, particles };
  });
  let wires = [], elapsed = 0;
  const hide = () => trains.forEach(train => { train.group.visible = false; });
  return {
    get active() { return wires.length > 0; },
    // `paths`: the index of a signal path, or a list of them.
    play(paths) {
      hide();
      wires = [paths].flat();
      elapsed = 0;
    },
    stop() { wires = []; hide(); },
    update(dt, visible, reducedMotion) {
      if (!wires.length) return 0;
      if (!visible || reducedMotion) { this.stop(); return 0; }
      elapsed = (elapsed + dt) % 2.6;
      const progress = elapsed / 1.6;
      for (const index of wires) {
        const curve = model.signalPaths[index], { group, particles } = trains[index];
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
      }
      const arrival = Math.max(0, 1 - Math.abs(elapsed - 1.7) / .3);
      return .4 * Math.sin(arrival * Math.PI / 2) ** 2;
    },
    dispose() { trains.forEach(train => train.particles.forEach(particle => particle.material.dispose())); },
  };
}
