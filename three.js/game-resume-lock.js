// The mini-games and toys being played. While any is, the resume link is disabled; while a game that pauses the
// slideshow is (all but toys made with `pausesSlideshow: false`), the page is flagged with html[data-game-playing],
// which pauses the media slideshow until it ends (JS/main.js listens for "game-playing-change").
const activeGames = new Set();
let original = null;

// Several toys can share a page; one ending must not unlock another's session.
export function createResumeLock({ pausesSlideshow = true } = {}) {
  const token = { pausesSlideshow };
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
    const playing = [...activeGames].some(game => game.pausesSlideshow);
    if (playing !== document.documentElement.hasAttribute("data-game-playing")) {
      document.documentElement.toggleAttribute("data-game-playing", playing);
      document.dispatchEvent(new Event("game-playing-change"));
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
