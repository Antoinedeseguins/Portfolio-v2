export function createGameScore(page, gameId) {
  const anchor = page?.querySelector(".project-copy > .copy-rule");
  const element = document.createElement("span");
  element.className = "mini-game-score";
  element.hidden = true;
  anchor?.classList.add("game-score-anchor");
  anchor?.append(element);
  const key = `${gameId}-best`;
  let best = 0, score = 0;
  try { best = Math.max(0, Number(localStorage.getItem(key)) || 0); } catch {}
  const update = value => {
    score = Math.max(0, Math.floor(value));
    element.textContent = `HIGH ${String(best).padStart(5, "0")}  ${String(score).padStart(5, "0")}`;
  };
  const hide = () => {
    element.hidden = true;
    if (score > best) {
      best = score;
      try { localStorage.setItem(key, String(best)); } catch {}
    }
  };
  return {
    update,
    show() { update(0); element.hidden = false; },
    hide,
    dispose() { hide(); element.remove(); },
  };
}
