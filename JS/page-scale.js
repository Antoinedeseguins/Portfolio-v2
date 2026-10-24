// Desktop screens show the portfolio as it looks on a 1920 × 927 viewport, scaled as a whole: up without limit, down
// to 80% so text stays readable (phones and tablets, below the three-column layout, are left alone). The root is
// zoomed, the stylesheet divides its viewport units by --z, and every script is shown that reference-sized viewport:
// window size, element boxes, pointer positions and pixel ratio are all expressed in it. Media queries still see the
// real screen, so the breakpoints that must follow the scaled viewport are classes set here.
(() => {
  const REFERENCE = { width: 1920, height: 927 };
  const DESKTOP = 1181, MIN_ZOOM = .8;
  const root = document.documentElement;
  const own = (target, key) => Object.getOwnPropertyDescriptor(target, key);
  const realWidth = own(window, "innerWidth").get, realHeight = own(window, "innerHeight").get;
  const realRatio = own(window, "devicePixelRatio").get;
  let zoom = 1;

  function update() {
    const width = realWidth.call(window), height = realHeight.call(window);
    zoom = width < DESKTOP ? 1 : Math.max(MIN_ZOOM, Math.min(width / REFERENCE.width, height / REFERENCE.height));
    root.style.zoom = zoom === 1 ? "" : String(zoom);
    root.style.setProperty("--z", String(zoom));
    root.classList.toggle("is-wide-view", width / zoom >= 1601);
    root.classList.toggle("is-short-view", width > 900 && height / zoom <= 760);
  }

  const scaled = (get) => function () { return get.call(this) / zoom; };
  Object.defineProperty(window, "innerWidth", { configurable: true, get: scaled(realWidth) });
  Object.defineProperty(window, "innerHeight", { configurable: true, get: scaled(realHeight) });
  Object.defineProperty(window, "devicePixelRatio", { configurable: true, get: () => realRatio.call(window) * zoom });

  const rect = Element.prototype.getBoundingClientRect;
  Element.prototype.getBoundingClientRect = function () {
    const box = rect.call(this);
    return zoom === 1 ? box : new DOMRect(box.x / zoom, box.y / zoom, box.width / zoom, box.height / zoom);
  };
  for (const key of ["clientWidth", "clientHeight"]) {
    const get = own(Element.prototype, key).get;
    Object.defineProperty(Element.prototype, key, { configurable: true, get() { return this === root ? get.call(this) / zoom : get.call(this); } });
  }
  for (const key of ["clientX", "clientY", "pageX", "pageY", "x", "y"]) {
    Object.defineProperty(MouseEvent.prototype, key, { configurable: true, get: scaled(own(MouseEvent.prototype, key).get) });
  }
  const fromPoint = Document.prototype.elementFromPoint;
  Document.prototype.elementFromPoint = function (x, y) { return fromPoint.call(this, x * zoom, y * zoom); };

  update();
  window.addEventListener("resize", update);
})();
