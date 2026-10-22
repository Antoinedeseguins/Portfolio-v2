export function createControllerDemo() {
  let selected = null, elapsed = 0;
  return {
    select(part) { selected = part; elapsed = 0; },
    cancel() { selected = null; },
    get active() {
      return selected === "boost" || selected === "arduino";
    },
    update(dt, reducedMotion) {
      if (reducedMotion) { this.cancel(); }
      elapsed += dt;
      const boostPhase = elapsed % 2.6;
      const press = selected === "boost" && boostPhase < .5 ? Math.sin(Math.PI * boostPhase / .5) ** 2 : 0;
      const led = selected === "arduino" ? .15 + .35 * Math.sin(elapsed * Math.PI / 1.4) ** 2 : 0;
      return { press, led };
    },
  };
}
