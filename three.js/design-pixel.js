// One design pixel in screen pixels: --u in CSS/styles.css, 1 on the reference screen and larger or smaller with the
// viewport on desktops. Mini-games multiply their fixed sizes and speeds by it to keep their proportions to the page.
export function designPixel() {
  return parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--u")) || 1;
}
