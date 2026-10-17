const activeGames = new Set();
let original = null;

// Several toys can share a page; one ending must not unlock another's session.
export function createResumeLock() {
  const token = {};
  return active => {
    const link = document.querySelector(".resume-link");
    if (active) {
      if (activeGames.has(token)) return;
      if (!activeGames.size && link) {
        original = { href: link.getAttribute("href"), tabindex: link.getAttribute("tabindex") };
      }
      activeGames.add(token);
    } else {
      if (!activeGames.delete(token)) return;
    }
    if (!link) return;
    if (activeGames.size) {
      link.setAttribute("aria-disabled", "true");
      link.setAttribute("tabindex", "-1");
      link.removeAttribute("href");
    } else {
      link.removeAttribute("aria-disabled");
      for (const name of ["href", "tabindex"]) {
        if (original?.[name] != null) link.setAttribute(name, original[name]);
        else link.removeAttribute(name);
      }
      original = null;
    }
  };
}
