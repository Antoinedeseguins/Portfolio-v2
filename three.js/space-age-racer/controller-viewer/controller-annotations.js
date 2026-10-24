import * as THREE from "../../vendor/three.module.js";
import { designPixel } from "../../design-pixel.js";

export function attachControllerAnnotations(frame, model, camera, actions, events, descriptions) {
  const viewer = frame.querySelector(".controller-viewer");
  const panel = frame.querySelector(".controller-detail");
  const connector = frame.querySelector(".controller-detail-connector");
  const points = Object.fromEntries([...frame.querySelectorAll("[data-hotspot]")].map(button => [button.dataset.hotspot, button]));
  let active = null, lastOpened = null;
  function renderDetail() {
    const { title, description } = descriptions[active === "body" ? "arduino" : active || "overview"];
    panel.hidden = false;
    panel.querySelector("h3").textContent = title;
    panel.querySelector(".controller-detail-copy p").textContent = description;
    panel.querySelector(".controller-detail-copy").dataset.label = active ? "Component" : "Overview";
  }
  function select(id) {
    if (id === active) return;
    active = id;
    for (const [key, button] of Object.entries(points)) button.setAttribute("aria-pressed", String(key === id));
    if (id) actions.select(id === "left" ? "lever0" : id === "right" ? "lever1" : id === "boost" ? "boost" : id === "potentiometers" ? "sensors" : id === "potentiometerRight" ? "sensorsRight" : lastOpened ? "arduino" : "levers");
    else actions.select("levers");
    renderDetail();
    panel.classList.remove("is-revealing");
    connector.classList.remove("is-revealing");
    if (id) {
      // Restart the reveal when switching directly between component points.
      void panel.offsetWidth;
      panel.classList.add("is-revealing");
      connector.classList.add("is-revealing");
    }
  }
  frame.querySelector('[data-viewer-action="reset"]').addEventListener("click", () => { select(null); actions.reset(); }, events);
  for (const [id, point] of Object.entries(points)) {
    point.addEventListener("pointerenter", event => { if (event.pointerType !== "touch") actions.highlight(id); }, events);
    point.addEventListener("pointerleave", () => actions.highlight(null), events);
    point.addEventListener("focus", () => actions.highlight(id), events);
    point.addEventListener("blur", () => actions.highlight(null), events);
    point.addEventListener("click", () => {
      if (id === "body" && !lastOpened) actions.toggleOpen();
      else select(id);
    }, events);
  }
  // The boost point sits on the button itself, so pressing it presses the button too.
  points.boost.addEventListener("pointerdown", event => { if (event.button === 0) actions.pressBoost(true); }, events);
  for (const type of ["pointerup", "pointerleave", "pointercancel"]) points.boost.addEventListener(type, () => actions.pressBoost(false), events);
  points.boost.addEventListener("keydown", event => { if (event.key === " " || event.key === "Enter") actions.pressBoost(true); }, events);
  points.boost.addEventListener("keyup", () => actions.pressBoost(false), events);
  renderDetail();
  return {
    update(opened) {
      if (opened !== lastOpened) {
        lastOpened = opened;
        viewer.dataset.coverOpen = String(opened);
        points.body.setAttribute("aria-label", opened ? "About the Arduino Uno" : "Remove front cover");
        if (!opened && ["potentiometers", "potentiometerRight", "body"].includes(active)) {
          active = null;
          actions.select("levers");
          points.potentiometers.setAttribute("aria-pressed", "false"); points.potentiometerRight.setAttribute("aria-pressed", "false"); points.body.setAttribute("aria-pressed", "false");
        }
        renderDetail();
      }
      const rect = viewer.getBoundingClientRect(), unit = designPixel();
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
        const edge = 10 * unit;
        points[id].hidden = (["potentiometers", "potentiometerRight"].includes(id) && !opened) || p.z < -1 || p.z > 1 || x < edge || x > rect.width - edge || y < edge || y > rect.height - edge;
        points[id].style.left = `${x}px`; points[id].style.top = `${y}px`;
      }
      const selectedPoint = points[active];
      connector.style.display = selectedPoint && !selectedPoint.hidden ? "" : "none";
      if (selectedPoint && !selectedPoint.hidden) {
        const x = parseFloat(selectedPoint.style.left), y = parseFloat(selectedPoint.style.top);
        // Use the final layout position, independent of the reveal's translation.
        const left = panel.offsetLeft, right = left + panel.offsetWidth;
        const top = panel.offsetTop, bottom = top + panel.offsetHeight;
        const edgeX = x < left ? left : x > right ? right : THREE.MathUtils.clamp(x, left + 12 * unit, right - 12 * unit);
        const edgeY = x < left || x > right ? THREE.MathUtils.clamp(y, top + 20 * unit, bottom - 20 * unit) : y > bottom ? bottom : top;
        const bendX = edgeX + (x < edgeX ? -12 : 12) * unit;
        const path = connector.querySelector("path");
        path.setAttribute("pathLength", "1");
        path.setAttribute("d", `M${x.toFixed(1)} ${y.toFixed(1)} L${bendX.toFixed(1)} ${edgeY.toFixed(1)} L${edgeX.toFixed(1)} ${edgeY.toFixed(1)}`);
      }
    },
  };
}
