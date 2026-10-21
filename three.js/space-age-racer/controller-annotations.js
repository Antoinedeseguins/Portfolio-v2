import * as THREE from "../vendor/three.module.js";

export function attachControllerAnnotations(frame, model, camera, actions, events) {
  const viewer = frame.querySelector(".controller-viewer");
  const openButton = frame.querySelector('[data-viewer-action="open"]');
  const panel = frame.querySelector(".controller-detail");
  const connector = frame.querySelector(".controller-detail-connector");
  const points = Object.fromEntries([...frame.querySelectorAll("[data-hotspot]")].map(button => [button.dataset.hotspot, button]));
  const copy = {
    left: ["Left lever", "The lever angle sets the left engine’s power. The difference in angle between the two levers steers the pod racer."],
    right: ["Right lever", "The lever angle sets the right engine’s power. The difference in angle between the two levers steers the pod racer."],
    boost: ["Boost button", "Pressing the button sends a signal to the Arduino, which triggers the pod racer’s boost in the game."],
    arduino: ["Arduino Uno", "The Arduino reads the physical controls and passes their inputs to the game."],
    potentiometers: ["Left potentiometer", "Tilting the left handle rotates this potentiometer’s shaft. The Arduino reads its angle to determine the left engine’s power."],
    potentiometerRight: ["Right potentiometer", "Tilting the right handle rotates this potentiometer’s shaft. The Arduino reads its angle to determine the right engine’s power."],
  };
  let active = null, lastOpened = null;
  function renderDetail() {
    if (!active) return;
    const [title, text] = copy[active === "body" ? "arduino" : active];
    panel.querySelector("h3").textContent = title;
    panel.querySelector(".controller-detail-copy p").textContent = text;
  }
  function select(id) {
    if (id === active) return;
    active = id;
    panel.hidden = !id;
    for (const [key, button] of Object.entries(points)) button.setAttribute("aria-pressed", String(key === id));
    if (id) actions.select(id === "left" ? "lever0" : id === "right" ? "lever1" : id === "boost" ? "boost" : id === "potentiometers" ? "sensors" : id === "potentiometerRight" ? "sensorsRight" : lastOpened ? "arduino" : "levers");
    else actions.select("levers");
    renderDetail();
  }
  openButton.addEventListener("click", actions.toggleOpen, events);
  frame.querySelector('[data-viewer-action="reset"]').addEventListener("click", () => { select(null); actions.reset(); }, events);
  const fullscreen = frame.querySelector('[data-viewer-action="fullscreen"]');
  if (!frame.requestFullscreen) fullscreen.hidden = true;
  fullscreen.addEventListener("click", () => {
    const operation = document.fullscreenElement === frame ? document.exitFullscreen() : frame.requestFullscreen();
    operation.catch(error => console.warn("Fullscreen unavailable", error));
  }, events);
  for (const [id, point] of Object.entries(points)) {
    point.addEventListener("pointerenter", event => { if (event.pointerType !== "touch") actions.highlight(id); }, events);
    point.addEventListener("pointerleave", () => actions.highlight(null), events);
    point.addEventListener("focus", () => actions.highlight(id), events);
    point.addEventListener("blur", () => actions.highlight(null), events);
    point.addEventListener("click", () => {
      if (id === "body" && !lastOpened) { select(null); actions.toggleOpen(); }
      else select(id);
    }, events);
  }
  return {
    update(opened) {
      if (opened !== lastOpened) {
        lastOpened = opened;
        viewer.dataset.coverOpen = String(opened);
        openButton.setAttribute("aria-pressed", String(opened));
        openButton.firstChild.textContent = "Replace cover ";
        points.body.setAttribute("aria-label", opened ? "About the Arduino Uno" : "Remove front cover");
        if (!opened && ["potentiometers", "potentiometerRight", "body"].includes(active)) {
          active = null; panel.hidden = true;
          actions.select("levers");
          points.potentiometers.setAttribute("aria-pressed", "false"); points.potentiometerRight.setAttribute("aria-pressed", "false"); points.body.setAttribute("aria-pressed", "false");
        }
        openButton.hidden = !opened;
        renderDetail();
      }
      const rect = viewer.getBoundingClientRect();
      const anchors = {
        left: model.levers[0].localToWorld(new THREE.Vector3(0, 2.55, .27)),
        right: model.levers[1].localToWorld(new THREE.Vector3(-.18, 2.55, .27)),
        boost: model.boost.localToWorld(new THREE.Vector3(0, .04, 0)),
        body: opened ? model.board.localToWorld(new THREE.Vector3(0, .2, .1)) : model.shell.localToWorld(model.frontPanelRest.clone().add(new THREE.Vector3(0, 0, .1))),
        potentiometers: model.sensors[0].localToWorld(new THREE.Vector3(0, .02, 0)),
        potentiometerRight: model.sensors[1].localToWorld(new THREE.Vector3(0, .02, 0)),
      };
      for (const [id, position] of Object.entries(anchors)) {
        const p = position.project(camera), x = (p.x + 1) * rect.width / 2, y = (1 - p.y) * rect.height / 2;
        points[id].hidden = (["potentiometers", "potentiometerRight"].includes(id) && !opened) || p.z < -1 || p.z > 1 || x < 10 || x > rect.width - 10 || y < 10 || y > rect.height - 10;
        points[id].style.left = `${x}px`; points[id].style.top = `${y}px`;
      }
      const selectedPoint = points[active];
      connector.style.display = selectedPoint && !selectedPoint.hidden ? "" : "none";
      if (selectedPoint && !selectedPoint.hidden) {
        const x = parseFloat(selectedPoint.style.left), y = parseFloat(selectedPoint.style.top);
        const box = panel.getBoundingClientRect();
        const left = box.left - rect.left, right = box.right - rect.left;
        const top = box.top - rect.top, bottom = box.bottom - rect.top;
        const edgeX = x < left ? left : x > right ? right : THREE.MathUtils.clamp(x, left + 12, right - 12);
        const edgeY = x < left || x > right ? THREE.MathUtils.clamp(y, top + 20, bottom - 20) : y > bottom ? bottom : top;
        const bendX = edgeX + (x < edgeX ? -12 : 12);
        connector.querySelector("path").setAttribute("d", `M${x.toFixed(1)} ${y.toFixed(1)} L${bendX.toFixed(1)} ${edgeY.toFixed(1)} L${edgeX.toFixed(1)} ${edgeY.toFixed(1)}`);
      }
    },
  };
}
