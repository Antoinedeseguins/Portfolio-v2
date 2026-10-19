const siteBaseUrl = new URL(".", document.baseURI);
const useHashNavigation = ["localhost", "127.0.0.1", "[::1]"].includes(window.location.hostname)
  || window.location.port !== "";
const siteBaseElement = document.querySelector("base") || document.head.appendChild(document.createElement("base"));
siteBaseElement.href = siteBaseUrl.href;

const projects = [
  { id: "aeon", folder: "aeonmustdie/img", video: "Assets/aeonmustdie/aeon.mp4", images: ["aeon1.webp", "aeon2.webp", "aeon3.webp", "aeon4.webp", "aeon5.webp", "aeon6.webp", "aeon7.webp", "aeon8.webp", "aeon9.webp", "aeon10.webp", "aeon11.webp", "aeon12.webp", "aeon13.webp", "aeon14.webp", "aeon15.webp", "aeon16.webp", "aeon17.webp", "aeon18.webp"] },
  { id: "age", folder: "ageofsigmar/img", video: "Assets/ageofsigmar/age.mp4", images: ["age1.webp", "age2.webp", "age3.webp", "age4.webp", "age5.webp", "age6.webp", "age7.webp", "age8.webp", "age9.webp", "age10.webp", "age11.webp"] },
  { id: "arup", folder: "arup/img", video: "Assets/arup/ARUP.mp4", videoPoster: "arup1-back.webp", images: ["arup1.webp", "arup2.webp", "arup3.webp", "arup4.webp", "arup5.webp"] },
  { id: "impact", folder: "impact/img", video: "Assets/impact/impact.mp4", images: ["impact1.webp", "impact2.webp", "impact3.webp", "impact4.webp", "impact5.webp", "impact6.webp", "impact7.webp", "impact8.webp", "impact9.webp", "impact10.webp", "impact11.webp", "impact12.webp", "impact13.webp"] },
  { id: "necromunda", folder: "necromunda/img", video: "Assets/necromunda/necro.mp4", images: ["necro1.webp", "necro2.webp", "necro3.webp", "necro4.webp", "necro5.webp", "necro6.webp", "necro7.webp", "necro8.webp", "necro9.webp", "necro10.webp", "necro11.webp", "necro12.webp", "necro13.webp", "necro14.webp", "necro15.webp", "necro16.webp", "necro17.webp", "necro18.webp", "necro19.webp", "necro20.webp", "necro21.webp", "necro22.webp", "necro23.webp", "necro24.webp", "necro25.webp", "necro26.webp"] },
  { id: "proteo", folder: "proteo/img", images: ["proteo1.webp", "proteo2.webp", "proteo3.webp", "proteo4.webp", "proteo5.webp", "proteo6.webp", "proteo7.webp", "proteo8.webp", "proteo9.webp", "proteo10.webp", "proteo11.webp"] },
  { id: "source", folder: "source/img", video: "Assets/source/source.mp4", images: ["source1.webp", "source2.webp", "source3.webp", "source4.webp", "source5.webp", "source6.webp", "source7.webp", "source8.webp", "source9.webp"] },
  { id: "spaceage", folder: "spaceageracer/img", video: "Assets/spaceageracer/spaceage.mp4", images: ["spaceage1.webp", "spaceage2.webp", "spaceage3.webp", "spaceage4.webp", "spaceage5.webp", "spaceage6.webp", "spaceage7.webp", "spaceage8.webp", "spaceage9.webp"] },
  { id: "vahana", folder: "vahana/img", images: ["vahana1.webp", "vahana2.webp", "vahana3.webp"] },
];
const primaryProjectOrder = ["spaceage", "aeon", "age", "necromunda", "impact", "vahana", "proteo", "source", "arup"];
const transparentDockLogos = {
  spaceage: "Assets/spaceageracer/spaceage-logo.png?v=20261014-2",
  aeon: "Assets/aeonmustdie/aeon-logo.png",
  age: "Assets/ageofsigmar/age-logo.png",
  necromunda: "Assets/necromunda/necro-logo.png",
  arup: "Assets/arup/arup-logo.png",
  impact: "Assets/impact/impact-logo.png",
  source: "Assets/source/source-logo.png",
  proteo: "Assets/proteo/proteo-logo.png",
  vahana: "Assets/vahana/vahana-logo.png",
};
const aboutMedia = { id: "about", folder: "identity", images: ["background.png"] };
function projectSlug(title) {
  const slug = title.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-|-$/g, "");
  return { "Necromunda-Underhive-Wars": "Necromunda", "Age-of-Sigmar-Storm-Ground": "Age-of-Sigmar" }[slug] || slug;
}

function updatePageUrl(page) {
  const url = new URL(siteBaseUrl);
  if (page !== aboutMedia) {
    if (useHashNavigation) url.hash = projectSlug(page.title);
    else url.pathname = new URL(projectSlug(page.title), siteBaseUrl).pathname;
  }
  history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
}

function projectFromUrl() {
  const name = window.location.hash.slice(1) || decodeURIComponent(window.location.pathname.replace(/\/$/, "").split("/").pop());
  return projects.find((project) => project.id === name || projectSlug(project.title).toLowerCase() === name.toLowerCase());
}
const dockLogoBounds = {
  aeon: [91, 179, 1651, 620],
  age: [0, 134, 1773, 619],
  arup: [43, 224, 1688, 458],
  impact: [62, 112, 1682, 666],
  necromunda: [12, 200, 1750, 499],
  proteo: [42, 137, 1690, 586],
  source: [49, 103, 1689, 671],
  vahana: [24, 152, 1726, 583],
};
const orderedProjects = [
  ...primaryProjectOrder.map((id) => projects.find((project) => project.id === id)),
  ...projects.filter((project) => !primaryProjectOrder.includes(project.id)),
];

const projectView = document.querySelector("#project-view");
const projectRail = document.querySelector("#project-rail");
const aboutLink = document.querySelector("#about-link");
document.querySelector(".project-dock").addEventListener("contextmenu", (event) => {
  if (event.target instanceof Element && event.target.closest(".project-link img, svg.dock-logo, .about-preview")) {
    event.preventDefault();
  }
});
const pageArrows = document.querySelector("#page-arrows");
const previousProjectButton = document.querySelector("#previous-project");
const nextProjectButton = document.querySelector("#next-project");
let activeProjectId = "spaceage";
let activeImageIndex = 0;
let activeAboutImageIndex = 0;
let pageDrag = null;
let mediaDragActive = false;
let pendingHeroDirection = null;
let pendingHeroIndex = null;

function imagePath(project, imageName) {
  return `Assets/${project.folder}/${imageName}`;
}

function videoPoster(project) {
  return imagePath(project, project.videoPoster || project.images[0]);
}

function adjacentMediaIndex(project, currentIndex, direction) {
  const indices = project.images.map((_, index) => index);
  if (project.video) indices[0] = -1;
  if (supportsMiniGames() && project.toys?.length) indices.push(-2);
  const position = indices.indexOf(currentIndex);
  return indices[(position + direction + indices.length) % indices.length];
}

function renderHeroMarkup(project, imageIndex) {
  if (supportsMiniGames() && imageIndex === -2 && project.toys?.length) {
    const toy = project.toys[0];
    return `<div class="hero-frame toy-frame" data-toy="${escapeText(toy.id)}">
      <div class="hero-track"><canvas class="hero-image toy-canvas" tabindex="0" role="button" aria-label="${escapeText(project.title)}"></canvas></div>
    </div>`;
  }
  const media = imageIndex === -1 && project.video
    ? `<video class="hero-image" src="${project.video}" poster="${videoPoster(project)}" muted playsinline controlslist="nodownload" preload="metadata" aria-label="Vidéo de ${project.title}"></video><img class="hero-video-fallback" hidden src="${videoPoster(project)}" alt="" aria-hidden="true" fetchpriority="high" />`
    : `<img class="hero-image" src="${imagePath(project, project.images[imageIndex])}" alt="${project.title} — visuel ${imageIndex + 1}" fetchpriority="high" />`;
  return `<div class="hero-frame">
    <div class="hero-track">${media}</div>
    <button class="hero-arrow" type="button" data-media-direction="-1" aria-label="Média précédent"><span aria-hidden="true">‹</span></button>
    <button class="hero-arrow" type="button" data-media-direction="1" aria-label="Média suivant"><span aria-hidden="true">›</span></button>
  </div>`;
}

function enableGalleryDrag(gallery, initialScrollLeft = 0) {
  if (!gallery) return;
  const dragSensitivity = 1;
  const momentumSensitivity = .8;
  const momentumFriction = gallery === projectRail ? .002 : .0025;
  const maxMomentumDuration = gallery === projectRail ? 2600 : 2200;
  let drag = null;
  let suppressClick = false;
  let momentumFrame = null;
  let snapFrame = null;
  let settleTimer = null;
  let scrollDirection = 0;
  let nativeScrollActive = false;
  const supportsScrollEnd = "onscrollend" in gallery;
  const originals = [...gallery.children];
  if (!originals.length) return;
  while (gallery.children.length < 6) {
    originals.forEach((thumbnail) => gallery.append(thumbnail.cloneNode(true)));
  }
  const cycle = [...gallery.children];
  const makeCopies = () => {
    const fragment = document.createDocumentFragment();
    cycle.forEach((thumbnail) => {
      const copy = thumbnail.cloneNode(true);
      copy.removeAttribute("id");
      copy.tabIndex = -1;
      fragment.append(copy);
    });
    return fragment;
  };
  gallery.prepend(makeCopies());
  gallery.append(makeCopies());
  const cycleWidth = () => gallery.children[cycle.length].getBoundingClientRect().left - gallery.firstElementChild.getBoundingClientRect().left;
  const wrapScroll = (position = gallery.scrollLeft) => {
    const width = cycleWidth();
    if (width <= 0) return;
    const wrapped = width + ((position - width) % width + width) % width;
    if (drag) drag.scrollLeft += wrapped - position;
    if (Math.abs(gallery.scrollLeft - wrapped) > .1) gallery.scrollLeft = wrapped;
  };
  wrapScroll(initialScrollLeft);
  let lastScrollLeft = gallery.scrollLeft;
  gallery.addEventListener("scroll", () => {
    wrapScroll();
    const width = cycleWidth();
    let delta = gallery.scrollLeft - lastScrollLeft;
    if (width > 0) delta -= Math.round(delta / width) * width;
    if (Math.abs(delta) > .5) scrollDirection = Math.sign(delta);
    lastScrollLeft = gallery.scrollLeft;
    window.clearTimeout(settleTimer);
    settleTimer = null;
    if (!nativeScrollActive || supportsScrollEnd || drag || momentumFrame !== null || snapFrame !== null) return;
    settleTimer = window.setTimeout(() => {
      settleTimer = null;
      if (!nativeScrollActive || drag || momentumFrame !== null || snapFrame !== null) return;
      nativeScrollActive = false;
      snapToProject(scrollDirection);
    }, 240);
  }, { passive: true });
  gallery.addEventListener("scrollend", () => {
    if (!nativeScrollActive || drag || momentumFrame !== null || snapFrame !== null) return;
    nativeScrollActive = false;
    snapToProject(scrollDirection);
  });
  let previousWidth = cycleWidth();
  const resizeObserver = new ResizeObserver(() => {
    const width = cycleWidth();
    if (previousWidth > 0 && width > 0 && width !== previousWidth) {
      wrapScroll(gallery.scrollLeft / previousWidth * width);
    }
    previousWidth = width;
  });
  resizeObserver.observe(gallery);
  const stopMomentum = () => {
    window.clearTimeout(settleTimer);
    settleTimer = null;
    if (momentumFrame !== null) cancelAnimationFrame(momentumFrame);
    if (snapFrame !== null) cancelAnimationFrame(snapFrame);
    momentumFrame = null;
    snapFrame = null;
    gallery.classList.remove("is-coasting");
  };
  gallery.addEventListener("gallery-reveal", (event) => {
    const bounds = gallery.getBoundingClientRect();
    const matches = [...gallery.querySelectorAll(".gallery-thumb")]
      .filter((thumbnail) => Number(thumbnail.dataset.image) === event.detail.imageIndex);
    if (!matches.length || bounds.width <= 0) return;
    const step = cycleWidth() / cycle.length;
    const previousThumbnail = [...gallery.querySelectorAll(".gallery-thumb")].find((thumbnail) => {
      if (Number(thumbnail.dataset.image) !== event.detail.previousImageIndex) return false;
      const rect = thumbnail.getBoundingClientRect();
      return Math.abs(rect.left - bounds.left - 4 * step) < 2;
    });
    const nextPageThumbnail = event.detail.direction === 1 && previousThumbnail
      ? matches.find((thumbnail) => Math.abs(thumbnail.getBoundingClientRect().left - previousThumbnail.getBoundingClientRect().left - step) < 2)
      : null;
    // Choose the closest copy in the looping gallery and move only as far as needed.
    const offsets = matches.map((thumbnail) => {
      const rect = thumbnail.getBoundingClientRect();
      if (rect.left < bounds.left) return rect.left - bounds.left;
      if (rect.right > bounds.right) return rect.right - bounds.right;
      return 0;
    });
    const offset = nextPageThumbnail
      ? nextPageThumbnail.getBoundingClientRect().left - bounds.left
      : offsets.reduce((closest, value) => Math.abs(value) < Math.abs(closest) ? value : closest);
    if (Math.abs(offset) < 1) return;
    stopMomentum();
    nativeScrollActive = false;
    const start = gallery.scrollLeft;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      wrapScroll(start + offset);
      return;
    }
    const duration = event.detail.automatic ? 1800 : 900;
    const startedAt = performance.now();
    gallery.classList.add("is-coasting");
    const tick = (now) => {
      if (!gallery.isConnected) {
        stopMomentum();
        return;
      }
      const progress = Math.min((now - startedAt) / duration, 1);
      const eased = progress * progress * progress * (progress * (progress * 6 - 15) + 10);
      wrapScroll(start + offset * eased);
      if (progress === 1) {
        stopMomentum();
        return;
      }
      snapFrame = requestAnimationFrame(tick);
    };
    snapFrame = requestAnimationFrame(tick);
  });
  const snapToProject = (direction) => {
    if (!gallery.isConnected) return;
    stopMomentum();
    const step = cycleWidth() / cycle.length;
    if (step <= 0) return;
    const start = gallery.scrollLeft;
    const nearest = Math.round(start / step) * step;
    if (Math.abs(nearest - start) < 1) {
      wrapScroll(nearest);
      return;
    }
    const target = (direction > 0 ? Math.ceil(start / step) : direction < 0 ? Math.floor(start / step) : Math.round(start / step)) * step;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      wrapScroll(target);
      return;
    }
    const startedAt = performance.now();
    gallery.classList.add("is-coasting");
    const tick = (now) => {
      const progress = Math.min((now - startedAt) / 600, 1);
      const eased = progress * progress * progress * (progress * (progress * 6 - 15) + 10);
      wrapScroll(start + (target - start) * eased);
      if (progress === 1 || !gallery.isConnected) {
        snapFrame = null;
        gallery.classList.remove("is-coasting");
        return;
      }
      snapFrame = requestAnimationFrame(tick);
    };
    snapFrame = requestAnimationFrame(tick);
  };
  const startMomentum = (velocity, durationScale = 1) => {
    stopMomentum();
    if (Math.abs(velocity) < .08 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      snapToProject(Math.sign(velocity));
      return;
    }
    gallery.classList.add("is-coasting");
    const step = cycleWidth() / cycle.length;
    if (step <= 0) {
      stopMomentum();
      return;
    }
    const start = gallery.scrollLeft;
    const projected = start + velocity / momentumFriction;
    const target = (velocity > 0 ? Math.ceil(projected / step) : Math.floor(projected / step)) * step;
    const distance = target - start;
    // Fold alignment into the slowdown rather than adding a second movement.
    const duration = Math.min(maxMomentumDuration, 3 * Math.abs(distance / velocity)) * durationScale;
    const startedAt = performance.now();
    const tick = (now) => {
      if (!gallery.isConnected) {
        stopMomentum();
        return;
      }
      const progress = Math.min((now - startedAt) / duration, 1);
      wrapScroll(start + distance * (1 - (1 - progress) ** 3));
      if (progress === 1) {
        stopMomentum();
        return;
      }
      momentumFrame = requestAnimationFrame(tick);
    };
    momentumFrame = requestAnimationFrame(tick);
  };
  gallery.addEventListener("gallery-dispose", () => {
    stopMomentum();
    resizeObserver.disconnect();
  });
  gallery.addEventListener("gallery-nudge", (event) => {
    stopMomentum();
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      wrapScroll(gallery.scrollLeft + event.detail.direction * 120);
      snapToProject(event.detail.direction);
      return;
    }
    startMomentum(event.detail.direction * 1.4);
  });
  gallery.addEventListener("dragstart", (event) => event.preventDefault());
  gallery.addEventListener("wheel", () => {
    stopMomentum();
    nativeScrollActive = true;
  }, { passive: true });
  gallery.addEventListener("pointerdown", (event) => {
    if (event.pointerType !== "mouse") {
      stopMomentum();
      nativeScrollActive = true;
      return;
    }
    if (event.button !== 0) return;
    const interruptedScroll = momentumFrame !== null || snapFrame !== null || nativeScrollActive;
    stopMomentum();
    nativeScrollActive = false;
    suppressClick = false;
    drag = { pointerId: event.pointerId, startX: event.clientX, scrollLeft: gallery.scrollLeft, moved: false, interruptedScroll, lastX: event.clientX, lastTime: performance.now(), velocity: 0, direction: 0 };
  });
  gallery.addEventListener("pointermove", (event) => {
    if (!drag || event.pointerId !== drag.pointerId) return;
    const delta = event.clientX - drag.startX;
    const now = performance.now();
    if (Math.abs(drag.lastX - event.clientX) > .1) drag.direction = Math.sign(drag.lastX - event.clientX);
    const elapsed = now - drag.lastTime;
    if (elapsed > 0) {
      const speed = (drag.lastX - event.clientX) / elapsed * momentumSensitivity;
      drag.velocity = Math.max(-4, Math.min(4, drag.velocity * .25 + speed * .75));
      drag.lastX = event.clientX;
      drag.lastTime = now;
    }
    if (!drag.moved && Math.abs(delta) < 7) return;
    if (!drag.moved) {
      drag.moved = true;
      gallery.classList.add("is-dragging");
      gallery.setPointerCapture(event.pointerId);
    }
    wrapScroll(drag.scrollLeft - delta * dragSensitivity);
    event.preventDefault();
  });
  const finishDrag = (event) => {
    if (!drag || event.pointerId !== drag.pointerId) return;
    const releasedDrag = drag;
    suppressClick = drag.moved;
    drag = null;
    if (releasedDrag.moved && event.type === "pointerup" && performance.now() - releasedDrag.lastTime < 100) {
      if (Math.abs(releasedDrag.velocity) < .08) snapToProject(releasedDrag.direction);
      else startMomentum(releasedDrag.velocity, 1.25);
    } else if (releasedDrag.moved) {
      snapToProject(releasedDrag.direction);
    } else if (releasedDrag.interruptedScroll) {
      snapToProject(0);
    }
    gallery.classList.remove("is-dragging");
    if (gallery.hasPointerCapture(event.pointerId)) gallery.releasePointerCapture(event.pointerId);
    window.setTimeout(() => { suppressClick = false; }, 0);
  };
  gallery.addEventListener("pointerup", finishDrag);
  gallery.addEventListener("pointercancel", finishDrag);
  gallery.addEventListener("lostpointercapture", finishDrag);
  gallery.addEventListener("pointerleave", (event) => {
    if (drag && !drag.moved) finishDrag(event);
  });
  gallery.addEventListener("click", (event) => {
    if (!suppressClick) return;
    event.preventDefault();
    event.stopPropagation();
  }, true);
}

function projectNavigationDirection(project, clickedThumbnail = null) {
  if (clickedThumbnail) {
    const railBounds = projectRail.getBoundingClientRect();
    const railCenter = railBounds.left + railBounds.width / 2;
    const centerOf = (element) => {
      const bounds = element.getBoundingClientRect();
      return bounds.left + bounds.width / 2;
    };
    const activeCenters = [...projectRail.querySelectorAll('.project-link[aria-current="page"]')].map(centerOf);
    const reference = aboutLink.getAttribute("aria-pressed") === "true"
      ? centerOf(aboutLink)
      : activeCenters.reduce((nearest, center) => Math.abs(center - railCenter) < Math.abs(nearest - railCenter) ? center : nearest, activeCenters[0] ?? railCenter);
    return centerOf(clickedThumbnail) < reference ? -1 : 1;
  }
  const currentIndex = aboutLink.getAttribute("aria-pressed") === "true"
    ? -1
    : orderedProjects.findIndex((item) => item.id === activeProjectId);
  return orderedProjects.indexOf(project) < currentIndex ? -1 : 1;
}

function renderDockImage(project) {
  const src = transparentDockLogos[project.id] || `Assets/${project.folder.replace(/\/img$/, "")}/${project.id}-logo.png`;
  const bounds = dockLogoBounds[project.id];
  if (bounds) {
    return `<svg class="dock-logo" viewBox="${bounds.join(" ")}" preserveAspectRatio="xMidYMid meet" aria-hidden="true" focusable="false"><image href="${src}" width="1774" height="887" /></svg>`;
  }
  const image = `<img class="${transparentDockLogos[project.id] ? "dock-logo" : ""}" src="${src}" data-fallback="${imagePath(project, project.images[0])}" alt="" loading="lazy" />`;
  return image;
}

function renderProjectRail() {
  projectRail.style.setProperty("--visible-project-count", Math.min(9, orderedProjects.length));
  projectRail.innerHTML = orderedProjects.map((project, index) => `
    <button class="project-link" type="button" style="--loop-spacing-offset: ${index * 30 / orderedProjects.length}px" data-project="${project.id}" aria-label="Ouvrir ${project.title}" aria-current="${project.id === activeProjectId ? "page" : "false"}">
      ${renderDockImage(project)}
    </button>
  `).join("");
  enableGalleryDrag(projectRail);
}

function setAboutSelected(selected) {
  document.body.classList.toggle("is-about-page", selected);
  aboutLink.setAttribute("aria-pressed", String(selected));
  aboutLink.setAttribute("aria-current", selected ? "page" : "false");
}

projectRail.addEventListener("error", (event) => {
  const image = event.target;
  if (!(image instanceof HTMLImageElement) || !image.dataset.fallback) return;
  const fallback = image.dataset.fallback;
  delete image.dataset.fallback;
  image.classList.remove("dock-logo");
  image.src = fallback;
}, true);

let finishActivePageTransition = null;
let pendingPagePreview = null;

function replaceProjectView(markup, navigationDirection, animateTransition) {
  finishActivePageTransition?.();
  if (pageDrag) {
    const pointerId = pageDrag.pointerId;
    pageDrag = null;
    projectView.classList.remove("is-pointer-dragging");
    if (projectView.hasPointerCapture(pointerId)) projectView.releasePointerCapture(pointerId);
  }
  pendingHeroDirection = null;
  pendingHeroIndex = null;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const outgoingPage = animateTransition && !reducedMotion ? projectView.firstElementChild : null;
  if (outgoingPage) {
    // Preserve the grid position before switching to absolute positioning.
    // Recentring with percentages can shift at fractional browser zoom levels.
    const bounds = outgoingPage.getBoundingClientRect();
    const viewBounds = projectView.getBoundingClientRect();
    outgoingPage.style.setProperty("--page-outgoing-top", `${bounds.top - viewBounds.top}px`);
    outgoingPage.style.width = `${bounds.width}px`;
  }
  projectView.querySelectorAll("video").forEach((video) => {
    video.controls = false;
    video.pause();
  });
  [...projectView.children].forEach(page => page.dispatchEvent(new CustomEvent("page-dispose", {
    detail: { preserveVisual: animateTransition && !reducedMotion },
  })));
  projectView.querySelectorAll(".hero-frame, .toy-widget").forEach((frame) => frame.dispatchEvent(new CustomEvent("hero-dispose", {
    detail: { preserveVisual: animateTransition && !reducedMotion },
  })));
  projectView.querySelectorAll(".gallery").forEach((gallery) => gallery.dispatchEvent(new Event("gallery-dispose")));
  const outgoingScrollPositions = outgoingPage
    ? [...outgoingPage.querySelectorAll(".gallery")].map((gallery) => [gallery, gallery.scrollLeft])
    : [];
  projectView.dataset.navigationDirection = navigationDirection < 0 ? "previous" : "next";
  const preview = pendingPagePreview;
  pendingPagePreview = null;
  const template = document.createElement("template");
  if (!preview) template.innerHTML = markup;
  const incomingPage = preview || template.content.firstElementChild;
  incomingPage.classList.remove("page-drag-preview", "page-returning");
  incomingPage.removeAttribute("aria-hidden");
  incomingPage.removeAttribute("inert");
  incomingPage.style.removeProperty("translate");
  if (preview) {
    incomingPage.style.setProperty("--page-entry-opacity", "1");
    incomingPage.querySelectorAll("video").forEach((video) => {
      video.controls = false;
      video.autoplay = false;
    });
  }
  const dragOffset = parseFloat(outgoingPage?.style.getPropertyValue("--drag-offset")) || 0;
  incomingPage.style.setProperty("--page-entry-offset", `${navigationDirection * window.innerWidth + dragOffset}px`);
  if (preview) {
    // Keep the already displayed media mounted throughout the handoff.
    [...projectView.children].forEach((page) => {
      if (page !== incomingPage && page !== outgoingPage) page.remove();
    });
    if (outgoingPage) projectView.append(outgoingPage);
    else [...projectView.children].forEach((page) => { if (page !== incomingPage) page.remove(); });
  } else {
    projectView.replaceChildren(incomingPage, ...(outgoingPage ? [outgoingPage] : []));
  }
  if (!outgoingPage) return;
  incomingPage.classList.add("page-entering");
  previousProjectButton.disabled = true;
  nextProjectButton.disabled = true;

  outgoingPage.classList.remove("page-entering", "page-outgoing");
  outgoingPage.classList.add("page-outgoing");
  outgoingPage.setAttribute("aria-hidden", "true");
  outgoingPage.setAttribute("inert", "");
  outgoingPage.querySelectorAll("video").forEach((video) => video.removeAttribute("autoplay"));
  outgoingScrollPositions.forEach(([gallery, scrollLeft]) => { gallery.scrollLeft = scrollLeft; });
  let transitionFinished = false;
  let transitionTimer;
  const finishTransition = () => {
    if (transitionFinished) return;
    transitionFinished = true;
    window.clearTimeout(transitionTimer);
    outgoingPage.remove();
    outgoingPage.dispatchEvent(new Event("page-dispose"));
    outgoingPage.querySelectorAll(".hero-frame, .toy-widget").forEach((frame) => frame.dispatchEvent(new Event("hero-dispose")));
    incomingPage.classList.remove("page-entering");
    finishActivePageTransition = null;
    if (incomingPage === projectView.firstElementChild) {
      previousProjectButton.disabled = false;
      nextProjectButton.disabled = false;
      incomingPage.querySelectorAll(".hero-frame, .toy-widget").forEach((frame) => frame.dispatchEvent(new Event("hero-ready")));
    }
  };
  outgoingPage.addEventListener("animationend", (event) => {
    if (event.target === outgoingPage) finishTransition();
  });
  transitionTimer = window.setTimeout(finishTransition, 1000);
  finishActivePageTransition = finishTransition;
}

function enableHeroAutoplay(frame) {
  const project = aboutLink.getAttribute("aria-pressed") === "true" ? aboutMedia : projects.find((item) => item.id === activeProjectId);
  if (!project) return;
  const currentIndex = project.id === "about" ? activeAboutImageIndex : activeImageIndex;
  const video = frame.querySelector("video");
  let timer = null;
  let disposed = false;
  const clearTimer = () => {
    window.clearTimeout(timer);
    timer = null;
  };
  const advance = () => {
    clearTimer();
    if (disposed || !frame.isConnected || document.hidden || !project.images.length) return;
    if (video && !video.ended && !video.error) return;
    if (mediaDragActive || pageDrag || projectView.querySelector(".page-outgoing")) {
      timer = window.setTimeout(advance, 250);
      return;
    }
    const nextIndex = adjacentMediaIndex(project, currentIndex, 1);
    if (nextIndex === currentIndex) return;
    frame.dispatchEvent(new CustomEvent("hero-navigate", {
      detail: { direction: 1, imageIndex: nextIndex, automatic: true },
    }));
  };
  const schedule = () => {
    clearTimer();
    if (disposed || document.hidden) return;
    if (video) {
      if (video.ended) advance();
    } else if (project.images.length > 1) {
      timer = window.setTimeout(advance, 7000);
    }
  };
  video?.addEventListener("ended", advance);

  document.addEventListener("visibilitychange", schedule);
  frame.addEventListener("pointerdown", clearTimer);
  frame.addEventListener("pointerup", schedule);
  frame.addEventListener("pointercancel", schedule);
  frame.addEventListener("lostpointercapture", schedule);
  frame.addEventListener("hero-navigate", clearTimer);
  frame.addEventListener("hero-dispose", () => {
    disposed = true;
    clearTimer();
    document.removeEventListener("visibilitychange", schedule);
  });
  schedule();
}

const toyModules = {
  "source-light": () => import(new URL("three.js/source/source-light.js?v=62", document.baseURI).href),
  "magnetic-cube": () => import(new URL("three.js/impact/magnetic-cube.js?v=48", document.baseURI).href),
  "voxel-title": () => import(new URL("three.js/impact/magnetic-cube.js?v=48", document.baseURI).href),
};
const supportsMiniGames = () => window.matchMedia("(hover: hover) and (pointer: fine)").matches;

// Prepare Impact's font and renderer while the visitor browses the portfolio.
if (supportsMiniGames()) {
  void toyModules["voxel-title"]().catch(() => {});
  void document.fonts.load('700 128px "Raleway"', "Impact").catch(() => {});
}

function enableToy(frame) {
  if (!supportsMiniGames()) return;
  let disposed = false;
  let frozen = false;
  let instance = null;
  let frozenCanvas = null;
  const canvas = frame.querySelector("canvas");
  if (!canvas) return;
  const start = async () => {
    if (disposed || frozen || !frame.isConnected || frame.closest(".page-outgoing, .page-drag-preview")) return;
    try {
      const module = await toyModules[frame.dataset.toy]();
      const titleStyle = getComputedStyle(frame.closest("h1") || frame);
      if (frame.dataset.toyText) await document.fonts.load(`${titleStyle.fontWeight} 128px ${titleStyle.fontFamily}`, frame.dataset.toyText);
      if (disposed || frozen || !frame.isConnected) return;
      const surface = frame.classList.contains("toy-widget") ? frame.closest(".project-layout") : null;
      if (surface) {
        surface.classList.add("toy-stage");
        frame.tabIndex = -1;
        frame.setAttribute("role", "button");
        frame.setAttribute("aria-label", canvas.getAttribute("aria-label"));
        canvas.tabIndex = -1;
        canvas.setAttribute("aria-hidden", "true");
        canvas.classList.add("toy-surface-canvas");
        surface.append(canvas);
      }
      const createToy = module.createToy || module.createMagneticCube;
      instance = createToy(canvas, {
        color: frame.dataset.toyColor || 0x1769f5,
        text: frame.dataset.toyText || "",
        fontFamily: titleStyle.fontFamily,
        fontWeight: titleStyle.fontWeight,
        anchor: surface ? frame : null,
        surface,
      });
      canvas.dataset.ready = "true";
      frame.closest(".voxel-title")?.classList.add("is-ready");
      const label = frame.closest(".voxel-title")?.querySelector(".voxel-title-label");
      if (label) label.style.visibility = "hidden";
    } catch (error) {
      if (disposed || frozen) return;

      console.error("Interactive scene unavailable", error);
    }
  };
  frame.addEventListener("hero-dispose", (event) => {
    frozen = true;
    if (event.detail?.preserveVisual) {
      instance?.pause();
      const title = frame.closest(".voxel-title");
      if (title) {
        title.classList.remove("is-ready");
        title.querySelector(".voxel-title-label")?.style.removeProperty("visibility");
      }
      if (instance && canvas.isConnected && !frozenCanvas) {
        frozenCanvas = instance.snapshot({ hideTitle: Boolean(title) });
        frozenCanvas.className = canvas.className;
        frozenCanvas.style.cssText = canvas.style.cssText;
        frozenCanvas.dataset.ready = "true";
        frozenCanvas.setAttribute("aria-hidden", "true");
        canvas.replaceWith(frozenCanvas);
      }
    }
    else {
      disposed = true;
      instance?.dispose();
      instance = null;
      if (canvas.classList.contains("toy-surface-canvas")) canvas.remove();
      frozenCanvas?.remove();
    }
    frame.removeEventListener("hero-ready", start);
  });
  frame.addEventListener("hero-navigate", (event) => {
    if (disposed || frozen || projectView.querySelector(".page-outgoing")) return;
    const nextIndex = event.detail.imageIndex ?? adjacentMediaIndex(aboutMedia, activeAboutImageIndex, event.detail.direction);
    if (nextIndex !== activeAboutImageIndex) selectMediaImage(aboutMedia, nextIndex);
  });
  if (frame.closest(".page-entering")) frame.addEventListener("hero-ready", start, { once: true });
  else start();
}

function enableHeroDrag(frame) {
  if (frame.dataset.toy) {
    enableToy(frame);
    return;
  }
  const image = frame.querySelector(".hero-image");
  const track = frame.querySelector(".hero-track");
  if (image.tagName === "VIDEO") {
    const supportsHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const updateVideoControls = () => {
      image.controls = !frame.classList.contains("is-settling") && (!supportsHover || image.matches(":hover") || image.matches(":focus-visible"));
    };
    image.addEventListener("pointerenter", updateVideoControls);
    image.addEventListener("pointerleave", updateVideoControls);
    image.addEventListener("focus", updateVideoControls);
    image.addEventListener("blur", updateVideoControls);
    image.tabIndex = 0;
    updateVideoControls();
    const fallback = frame.querySelector(".hero-video-fallback");
    image.addEventListener("error", () => { fallback.hidden = false; });
    image.addEventListener("playing", () => { fallback.hidden = true; });
    if (image.error) fallback.hidden = false;
    image.muted = true;
    image.volume = 0.25;
    const startVideo = () => {
      if (frame.isConnected && !frame.closest(".page-outgoing, .page-drag-preview")) image.play().catch(() => {});
    };
    if (frame.closest(".page-entering")) {
      frame.addEventListener("hero-ready", startVideo, { once: true });
      frame.addEventListener("hero-dispose", () => frame.removeEventListener("hero-ready", startVideo), { once: true });
    } else {
      startVideo();
    }
  }
  let drag = null;
  let previews = [];
  let animations = [];
  let settling = false;
  let settlingTargetIndex = null;
  let sequence = 0;
  const cleanup = (event) => {
    const preserveVisual = event?.detail?.preserveVisual;
    sequence += 1;
    if (preserveVisual) animations.forEach((animation) => {
      try { animation.commitStyles(); } catch {}
    });
    animations.forEach((animation) => animation.cancel());
    animations = [];
    if (!preserveVisual) {
      previews.forEach((preview) => preview.remove());
      previews = [];
      track.style.translate = "0px 0px";
    }
    frame.classList.remove("is-dragging", "is-settling");
    settling = false;
    settlingTargetIndex = null;
    if (frame.isConnected && !frame.closest(".page-outgoing")) mediaDragActive = false;
    const pointerId = drag?.pointerId;
    drag = null;
    if (pointerId !== undefined && frame.hasPointerCapture(pointerId)) frame.releasePointerCapture(pointerId);
  };
  image.addEventListener("dragstart", (event) => event.preventDefault());
  const createPreviews = (project, currentIndex) => [-1, 1].map((direction) => {
    const preview = document.createElement("img");
    const index = adjacentMediaIndex(project, currentIndex, direction);
    preview.className = "hero-image hero-preview";
    preview.src = index === -2 ? "three.js/impact/cube.svg?v=6" : index === -1 ? videoPoster(project) : imagePath(project, project.images[index]);
    preview.alt = "";
    preview.setAttribute("aria-hidden", "true");
    preview.style.left = `${direction * 100}%`;
    preview.style.right = "auto";
    track.append(preview);
    return preview;
  });
  frame.addEventListener("pointerdown", (event) => {
    if (event.pointerType !== "mouse" || event.button !== 0 || event.target.closest("button")) return;
    if (image.tagName === "VIDEO" && event.clientY > frame.getBoundingClientRect().bottom - 48) return;
    if (settling || projectView.querySelector(".page-outgoing")) return;
    const project = aboutLink.getAttribute("aria-pressed") === "true" ? aboutMedia : projects.find((item) => item.id === activeProjectId);
    if (!project) return;
    const currentIndex = project.id === "about" ? activeAboutImageIndex : activeImageIndex;
    const width = frame.getBoundingClientRect().width;
    drag = { pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, deltaX: 0, moved: false, width, project, currentIndex };
    if (!previews.length) previews = createPreviews(project, currentIndex);
    mediaDragActive = true;
    frame.setPointerCapture(event.pointerId);
  });
  const finish = async (event, cancelled = false, forcedDirection = null, automatic = false) => {
    if (!drag || event.pointerId !== drag.pointerId) return;
    const releasedDrag = drag;
    drag = null;
    frame.classList.remove("is-dragging");
    if (frame.hasPointerCapture(event.pointerId)) frame.releasePointerCapture(event.pointerId);
    if (!releasedDrag.moved) {
      cleanup();
      return;
    }
    const threshold = Math.max(40, Math.min(100, releasedDrag.width * .12));
    const advance = forcedDirection !== null || (!cancelled && Math.abs(releasedDrag.deltaX) >= threshold);
    const direction = forcedDirection ?? (releasedDrag.deltaX < 0 ? 1 : -1);
    const transitionDuration = automatic ? 2000 : forcedDirection !== null ? 650 : 800;
    const nextIndex = releasedDrag.targetIndex ?? adjacentMediaIndex(releasedDrag.project, releasedDrag.currentIndex, direction);
    if (advance) {
      syncMediaGallery(nextIndex, direction, automatic);
    }
    const destination = advance ? -direction * releasedDrag.width : 0;
    const duration = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : transitionDuration;
    settling = true;
    settlingTargetIndex = advance ? nextIndex : releasedDrag.currentIndex;
    frame.classList.add("is-settling");
    const currentSequence = sequence;
    const incomingImage = advance ? previews[direction === 1 ? 1 : 0] : null;
    if (incomingImage) {
      await incomingImage.decode().catch(() => {});
      if (sequence !== currentSequence || !frame.isConnected) return;
    }
    if (advance && image.tagName === "VIDEO") {
      image.controls = false;
      image.pause();
    }
    animations = [track.animate([
      { translate: `${releasedDrag.deltaX}px 0` },
      { translate: `${destination}px 0` },
    ], { duration, easing: forcedDirection !== null && !automatic ? "cubic-bezier(.4, 0, .2, 1)" : "cubic-bezier(.22, 1, .36, 1)", fill: "forwards" })];
    Promise.all(animations.map((animation) => animation.finished)).then(() => {
      if (sequence !== currentSequence || !frame.isConnected) return;
      cleanup();
      if (advance) {
        selectMediaImage(releasedDrag.project, nextIndex, false, incomingImage);
      }
      const requestedDirection = pendingHeroDirection;
      const requestedIndex = pendingHeroIndex;
      pendingHeroDirection = null;
      pendingHeroIndex = null;
      if (requestedDirection !== null && requestedIndex !== (advance ? nextIndex : releasedDrag.currentIndex)) {
        projectView.querySelector(".hero-frame")?.dispatchEvent(new CustomEvent("hero-navigate", {
          detail: { direction: requestedDirection, imageIndex: requestedIndex },
        }));
      }
    }).catch(() => {});
  };
  frame.addEventListener("hero-navigate", (event) => {
    if (settling) {
      if (event.detail.imageIndex != null && event.detail.imageIndex === settlingTargetIndex) return;
      pendingHeroDirection = event.detail.direction;
      pendingHeroIndex = event.detail.imageIndex ?? null;
      return;
    }
    if (drag || projectView.querySelector(".page-outgoing")) return;
    const project = aboutLink.getAttribute("aria-pressed") === "true" ? aboutMedia : projects.find((item) => item.id === activeProjectId);
    if (!project) return;
    const currentIndex = project.id === "about" ? activeAboutImageIndex : activeImageIndex;
    if (event.detail.imageIndex != null && event.detail.imageIndex === currentIndex) return;
    const width = frame.getBoundingClientRect().width;
    if (!previews.length) previews = createPreviews(project, currentIndex);
    const targetIndex = event.detail.imageIndex ?? null;
    if (targetIndex !== null) {
      previews[event.detail.direction === 1 ? 1 : 0].src = targetIndex === -2 ? "three.js/impact/cube.svg?v=6" : targetIndex === -1 ? videoPoster(project) : imagePath(project, project.images[targetIndex]);
    }
    drag = { pointerId: -1, deltaX: 0, moved: true, width, project, currentIndex, targetIndex };
    mediaDragActive = true;
    finish({ pointerId: -1 }, false, event.detail.direction, event.detail.automatic === true);
  });
  frame.addEventListener("pointermove", (event) => {
    if (!drag || event.pointerId !== drag.pointerId) return;
    const deltaX = event.clientX - drag.startX;
    const deltaY = event.clientY - drag.startY;
    if (!drag.moved && Math.abs(deltaY) > Math.abs(deltaX) + 8) {
      finish(event, true);
      return;
    }
    if (!drag.moved && Math.abs(deltaX) < 7) return;
    drag.moved = true;
    drag.deltaX = Math.max(-drag.width, Math.min(drag.width, deltaX));
    frame.classList.add("is-dragging");
    track.style.translate = `${drag.deltaX}px 0`;
    window.getSelection()?.removeAllRanges();
    event.preventDefault();
  });
  frame.addEventListener("pointerup", (event) => finish(event));
  frame.addEventListener("pointercancel", (event) => finish(event, true));
  frame.addEventListener("lostpointercapture", (event) => finish(event, true));
  frame.addEventListener("hero-dispose", cleanup);
  const warmProject = aboutLink.getAttribute("aria-pressed") === "true" ? aboutMedia : projects.find(item => item.id === activeProjectId);
  if (warmProject) {
    const warmIndex = warmProject.id === "about" ? activeAboutImageIndex : activeImageIndex;
    previews = createPreviews(warmProject, warmIndex);
    previews.forEach(preview => { preview.decoding = "async"; preview.decode().catch(() => {}); });
  }
  enableHeroAutoplay(frame);
}

function renderMediaMarkup(project, imageIndex) {
  return `
    <div class="media-stack">
      ${renderHeroMarkup(project, imageIndex)}
      <div class="gallery-shell">
        <button class="gallery-arrow" type="button" data-gallery-direction="-1" aria-label="Images précédentes" title="Images précédentes"><span aria-hidden="true">‹</span></button>
        <div class="gallery" aria-label="Images de ${project.title}" tabindex="0">
          ${project.video ? `<button class="gallery-thumb video-thumb" type="button" data-image="-1" aria-label="Afficher la vidéo de ${project.title}" aria-pressed="${imageIndex === -1}"><img src="${imagePath(project, project.images[0])}" alt="" /><span class="video-play" aria-hidden="true"><svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="m9 5 11 7-11 7Z" /></svg></span></button>` : ""}
          ${(supportsMiniGames() ? project.toys || [] : []).map((toy) => `<button class="gallery-thumb toy-thumb" type="button" data-image="-2" aria-label="${escapeText(toy.title)}" aria-pressed="${imageIndex === -2}"><img src="three.js/impact/cube.svg?v=6" alt="" /></button>`).join("")}
          ${project.images.map((image, index) => project.video && index === 0 ? "" : `
            <button class="gallery-thumb" type="button" data-image="${index}" aria-label="Afficher l’image ${index + 1} de ${project.title}" aria-pressed="${index === imageIndex}">
              <img src="${imagePath(project, image)}" alt="" loading="${index < 5 ? "eager" : "lazy"}" />
            </button>
          `).join("")}
        </div>
        <button class="gallery-arrow" type="button" data-gallery-direction="1" aria-label="Images suivantes" title="Images suivantes"><span aria-hidden="true">›</span></button>
      </div>
    </div>
  `;
}

function renderProjectTag(tag) {
  return `<span>${escapeText(tag)}</span>`;
}

function escapeText(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[character]);
}

function projectPageMarkup(project, imageIndex) {
  return `
    <div class="project-layout${project.title.length >= 24 ? " has-long-title" : ""}">
      ${renderMediaMarkup(project, imageIndex)}
      <div class="project-copy">
        ${!supportsMiniGames() ? `<h1 class="project-title">${escapeText(project.title)}</h1>` : project.id === "age" ? `<div class="sigmar-title-row"><h1 class="project-title">${escapeText(project.title)}</h1><span class="sigmar-hammer" aria-hidden="true"><img src="three.js/ageofsigmar/storm-hammer-compact-v2.png?v=1" alt="" draggable="false" decoding="async" /></span></div>` : project.id === "spaceage" ? `<div class="space-racer-title-row"><div class="space-racer-heading"><h1 class="project-title">${escapeText(project.title)}</h1><button class="space-racer-play" type="button" aria-label="Play Space Age Racer" aria-pressed="false"><svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5 19 12 9 19Z" fill="currentColor"/></svg></button></div></div>` : project.id === "proteo" ? `<div class="proteo-title-row"><h1 class="project-title">${escapeText(project.title)}</h1><button class="proteo-play" type="button" aria-label="Attraper la boule Proteo" aria-pressed="false"><img src="three.js/proteo/proteo-ball-red.svg?v=7" alt="" draggable="false" /></button></div>` : project.id === "aeon" ? `<div class="aeon-title-row"><h1 class="project-title"><button class="aeon-strike" type="button" aria-label="${escapeText(project.title)}">${escapeText(project.title)}</button></h1><span class="aeon-fist-halo" aria-hidden="true"></span><img class="aeon-title-logo" src="three.js/aeon/fist-aeon.png" alt="" aria-hidden="true" draggable="false" /></div>` : project.id === "arup" ? `<div class="arup-title-row"><h1 class="project-title arup-title">
          <span class="arup-title-toggle" aria-pressed="false">
            <span class="arup-title-text">${[...project.title].map(letter => `<span>${escapeText(letter)}</span>`).join("")}</span>
            <span class="arup-title-logos" aria-hidden="true">${["A", "R", "U", "P"].map(letter => `<img src="three.js/ARUP/${letter}-logo.png" alt="" draggable="false" decoding="async" />`).join("")}</span>
          </span>
        </h1><button class="arup-play" type="button" aria-label="Play ARUP" aria-pressed="false"><svg class="arup-play-cube" viewBox="0 0 64 72" aria-hidden="true" focusable="false"><path fill="#ffe680" d="M32 4 59 19 32 35 5 19Z"/><path fill="#df493e" d="M5 19 32 35 32 67 5 51Z"/><path fill="#49a868" d="M32 35 59 19 59 51 32 67Z"/><path fill="none" stroke="#000" stroke-width="1" stroke-linejoin="round" d="M32 4 59 19V51L32 67 5 51V19ZM5 19 32 35 59 19M32 35V67"/></svg></button></div>` : project.titleToy?.id === "voxel-title" ? `<div class="project-title-row"><h1 class="project-title voxel-title">
          <span class="voxel-title-label">${escapeText(project.title)}</span>
          <span class="toy-widget" data-toy="voxel-title" data-toy-text="${escapeText(project.title)}" data-toy-color="#111111">
            <canvas class="hero-image toy-canvas" tabindex="0" role="button" aria-label="${escapeText(project.title)}"></canvas>
          </span>
        </h1>
        ${project.titleCube ? `<div class="toy-widget" data-toy="${escapeText(project.titleCube.id)}" data-toy-color="#ed5aaa">
          <canvas class="hero-image toy-canvas" tabindex="0" role="button" aria-label="Interactive cube"></canvas>
        </div>` : ""}
        </div>` : project.id === "necromunda" ? `<div class="necro-title-row"><h1 class="project-title necro-title">${escapeText(project.title)}</h1><button class="necro-play" type="button" aria-label="Jouer au stand de tir" aria-pressed="false"><img src="three.js/necromunda/rifle.svg?v=2" alt="" draggable="false" /><img class="necro-rifle-bolt" src="three.js/necromunda/rifle-bolt.svg" alt="" draggable="false" /></button></div>` : project.titleToy ? `<div class="project-title-row">
          <h1 class="project-title">${escapeText(project.title)}</h1>
          <div class="toy-widget" data-toy="${escapeText(project.titleToy.id)}" data-toy-color="#ed5aaa">
            <canvas class="hero-image toy-canvas" tabindex="0" role="button" aria-label="${escapeText(project.title)}"></canvas>
          </div>
        </div>` : `<h1 class="project-title">${escapeText(project.title)}</h1>`}
        <div class="copy-rule" aria-hidden="true"></div>
        ${project.context ? `<p class="project-subtitle">${escapeText(project.context)}</p>` : ""}
        ${project.tags.length ? `<div class="project-meta" aria-label="Domaines du projet">${project.tags.map(renderProjectTag).join("")}</div>` : ""}
        ${project.pitch ? `<p class="project-description">${(project.title ? project.pitch.split(project.title).map(escapeText).join(`<strong>${escapeText(project.title)}</strong>`) : escapeText(project.pitch)).replace(/Arduino controller/gi, phrase => `<strong>${phrase}</strong>`)}</p>` : ""}
        ${(project.paragraphs || []).filter((paragraph) => paragraph.title || paragraph.content).map((paragraph) => `
          <section class="project-paragraph">
            ${paragraph.title ? `<h2>${escapeText(paragraph.title)}</h2>` : ""}
            ${paragraph.content ? `<p class="project-description">${escapeText(paragraph.content)}</p>` : ""}
          </section>
        `).join("")}
      </div>
    </div>
  `;
}

function aboutPageMarkup() {
  return `
    <div class="about-layout">
      <div class="about-copy-wrap project-copy">
        <h1 class="about-title">${escapeText(aboutMedia.title1)}</h1>
        <div class="copy-rule" aria-hidden="true"></div>
        ${aboutMedia.title2 ? `<p class="project-subtitle">${escapeText(aboutMedia.title2)}</p>` : ""}
        ${aboutMedia.texte ? `<p class="project-description">${escapeText(aboutMedia.texte)}</p>` : ""}
      </div>
    </div>
  `;
}

function renderProject(project, imageIndex = project.video ? -1 : 0, galleryScrollLeft = 0, animateTransition = true, navigationDirection = 1) {
  activeProjectId = project.id;
  activeImageIndex = imageIndex;
  pageArrows.hidden = false;
  previousProjectButton.disabled = false;
  nextProjectButton.disabled = false;
  setAboutSelected(false);
  projectView.setAttribute("aria-busy", "true");
  const projectMarkup = projectPageMarkup(project, imageIndex);
  replaceProjectView(projectMarkup, navigationDirection, animateTransition);
  projectView.querySelectorAll(".arup-play, .space-racer-play, .necro-play, .proteo-play, .aeon-strike, .toy-canvas, .toy-widget").forEach(control => { control.tabIndex = -1; });
  const gallery = projectView.querySelector(".gallery");
  enableGalleryDrag(gallery, galleryScrollLeft);
  enableHeroDrag(projectView.querySelector(".hero-frame"));
  projectView.querySelectorAll(".toy-widget").forEach(enableToy);
  const arupTitle = projectView.querySelector(".arup-title-toggle");
  const proteoPlay = projectView.querySelector(".proteo-play");
  if (proteoPlay && supportsMiniGames()) import(new URL("three.js/proteo/proteo-shapes.js?v=26", document.baseURI).href)
    .then(module => { if (proteoPlay.isConnected && !proteoPlay.closest(".page-outgoing")) module.enableShapes(proteoPlay); })
    .catch(error => console.error("Proteo interaction could not be loaded", error));
  if (arupTitle && supportsMiniGames()) import(new URL("three.js/ARUP/arup-runner.js?v=63", document.baseURI).href)
    .then(module => { if (arupTitle.isConnected && !arupTitle.closest(".page-outgoing")) module.enableRunner(arupTitle); })
    .catch(error => console.error("ARUP interaction could not be loaded", error));
  const racerPlay = projectView.querySelector(".space-racer-play");
  if (racerPlay && supportsMiniGames())
    import(new URL("three.js/space-age-racer/space-racer.js?v=71", document.baseURI).href)
      .then(module => { if (racerPlay.isConnected && !racerPlay.closest(".page-outgoing")) module.enableRacer(racerPlay); })
      .catch(error => console.error("Racer interaction could not be loaded", error));
  const necroPlay = projectView.querySelector(".necro-play");
  if (necroPlay && window.matchMedia("(hover: hover) and (pointer: fine)").matches)
    import(new URL("three.js/necromunda/shooting-gallery.js?v=13", document.baseURI).href)
      .then(async module => {
        await document.fonts.ready;
        if (necroPlay.isConnected && !necroPlay.closest(".page-outgoing")) module.enableGallery(necroPlay);
      }).catch(error => console.error("Necromunda interaction could not be loaded", error));
  const aeonTitle = projectView.querySelector(".aeon-strike");
  if (aeonTitle && window.matchMedia("(hover: hover) and (pointer: fine)").matches)
    import(new URL("three.js/aeon/aeon-strike.js?v=90", document.baseURI).href)
      .then(async module => {
        const logo = aeonTitle.closest(".aeon-title-row")?.querySelector(".aeon-title-logo");
        await Promise.all([document.fonts.ready, logo?.decode().catch(() => {})]);
        if (aeonTitle.isConnected && !aeonTitle.closest(".page-outgoing")) module.enableStrikes(aeonTitle);
      })
      .catch(error => console.error("Aeon interaction could not be loaded", error));

  projectRail.querySelectorAll(".project-link").forEach((button) => {
    button.setAttribute("aria-current", button.dataset.project === project.id ? "page" : "false");
  });
  projectView.setAttribute("aria-busy", "false");
  updatePageUrl(project);
}

function renderAbout(navigationDirection = -1) {
  activeAboutImageIndex = 0;
  pageArrows.hidden = false;
  previousProjectButton.disabled = false;
  nextProjectButton.disabled = false;
  projectRail.querySelectorAll(".project-link").forEach((button) => button.setAttribute("aria-current", "false"));
  setAboutSelected(true);
  projectView.setAttribute("aria-busy", "true");
  const aboutMarkup = aboutPageMarkup();
  replaceProjectView(aboutMarkup, navigationDirection, true);
  projectView.setAttribute("aria-busy", "false");
  updatePageUrl(aboutMedia);
}

const dockSpinDirections = new WeakMap();
const dockClickEffects = new WeakMap();

function spinDockIcon(button) {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const icon = button.querySelector(".about-preview, img, svg.dock-logo");
  const currentStyle = getComputedStyle(icon);
  const start = { rotate: currentStyle.rotate, translate: currentStyle.translate, scale: currentStyle.scale };
  const state = dockClickEffects.get(button) || { count: 0, animation: null, spinning: false };
  if (state.spinning && state.animation?.playState === "running") return;
  state.count = state.animation?.playState === "running" ? state.count + 1 : 1;
  dockClickEffects.set(button, state);
  const direction = -(dockSpinDirections.get(button) || 1);
  dockSpinDirections.set(button, direction);
  icon.getAnimations().filter((animation) => animation.id === "dock-spin").forEach((animation) => animation.cancel());
  state.spinning = state.count >= 6;
  const spinDirection = Math.random() < .5 ? -1 : 1;
  const keyframes = state.spinning ? [
    { ...start, easing: "ease-in-out" },
    { rotate: "y 0deg", translate: "0 0", scale: "1 1", offset: .12, easing: "cubic-bezier(.25, .6, .3, 1)" },
    { rotate: `y ${spinDirection * 360}deg`, translate: "0 0", scale: "1 1" },
  ] : [
    { ...start, easing: "ease-in-out" },
    { translate: `${direction * 5}px -1px`, rotate: `${direction * 3}deg`, scale: "1 1", offset: .3, easing: "ease-in-out" },
    { translate: `${direction * -5}px -1px`, rotate: `${direction * -3}deg`, scale: "1 1", offset: .65, easing: "ease-in-out" },
    { translate: "0 0", rotate: "0deg", scale: "1 1" },
  ];
  const animationOptions = {
    duration: state.spinning ? 1500 : 660,
    easing: "linear",
  };
  const animation = icon.animate(keyframes, animationOptions);
  animation.id = "dock-spin";
  state.animation = animation;
  animation.finished.then(() => {
    if (state.animation !== animation) return;
    state.count = 0;
    state.spinning = false;
    state.animation = null;
  }).catch(() => {});
}

document.querySelector(".project-dock").addEventListener("click", (event) => {
  const aboutButton = event.target.closest(".about-link");
  if (aboutButton) {
    if (aboutLink.getAttribute("aria-pressed") === "true") {
      spinDockIcon(aboutButton);
    } else {
      if (finishActivePageTransition) return;
      renderAbout(projectNavigationDirection(aboutMedia, aboutButton));
    }
    return;
  }
  const button = event.target.closest("[data-project]");
  if (!button) return;
  const project = projects.find((item) => item.id === button.dataset.project);
  if (!project) return;
  if (project.id === activeProjectId && aboutLink.getAttribute("aria-pressed") !== "true") {
    spinDockIcon(button);
    return;
  }
  // Only changes to another project must wait for the page transition.
  if (finishActivePageTransition) return;
  const direction = projectNavigationDirection(project, button);
  renderProject(project, project.video ? -1 : 0, 0, true, direction);
});

function selectAdjacentProject(direction) {
  if (pageDrag || mediaDragActive || projectView.querySelector(".page-outgoing")) return false;
  if (aboutLink.getAttribute("aria-pressed") === "true") {
    const project = direction < 0 ? orderedProjects[orderedProjects.length - 1] : orderedProjects[0];
    renderProject(project, project.video ? -1 : 0, 0, true, direction);
    return true;
  }

  const currentIndex = orderedProjects.findIndex((project) => project.id === activeProjectId);
  if (direction < 0 && currentIndex === 0) {
    renderAbout(-1);
    return true;
  }
  if (direction > 0 && currentIndex === orderedProjects.length - 1) {
    renderAbout(1);
    return true;
  }
  const project = orderedProjects[currentIndex + direction];
  if (!project) return false;
  renderProject(project, project.video ? -1 : 0, 0, true, direction);
  return true;
}

previousProjectButton.addEventListener("click", () => selectAdjacentProject(-1));
nextProjectButton.addEventListener("click", () => selectAdjacentProject(1));

function navigateWithKeyboard(direction) {
  if (pageDrag || mediaDragActive) return;
  selectAdjacentProject(direction);
}

document.addEventListener("keydown", (event) => {
  if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
  if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
  if (event.target.closest("input, textarea, select, canvas") || event.target.isContentEditable) return;

  event.preventDefault();
  navigateWithKeyboard(event.key === "ArrowLeft" ? -1 : 1);
});

function updatePageDragPreview(drag) {
  const direction = drag.deltaX < 0 ? 1 : -1;
  if (drag.previewDirection !== direction) {
    drag.preview?.remove();
    const pages = [aboutMedia, ...orderedProjects];
    const currentIndex = aboutLink.getAttribute("aria-pressed") === "true"
      ? 0 : pages.findIndex((project) => project.id === activeProjectId);
    const target = pages[(currentIndex + direction + pages.length) % pages.length];
    const template = document.createElement("template");
    template.innerHTML = target === aboutMedia
      ? aboutPageMarkup() : projectPageMarkup(target, target.video ? -1 : 0);
    drag.preview = template.content.firstElementChild;
    drag.preview.classList.add("page-drag-preview");
    drag.preview.setAttribute("aria-hidden", "true");
    drag.preview.setAttribute("inert", "");
    drag.preview.querySelectorAll("video").forEach((video) => {
      video.removeAttribute("autoplay");
      video.pause();
    });
    projectView.append(drag.preview);
    drag.previewDirection = direction;
  }
  drag.preview.style.translate = `${direction * window.innerWidth + drag.deltaX}px 0`;
}

document.addEventListener("pointerdown", (event) => {
  if (event.pointerType !== "mouse" || event.button !== 0 || event.target.closest("button, a, .gallery-shell, .hero-frame, .toy-widget")) return;
  const bounds = projectView.getBoundingClientRect();
  if (event.clientY < bounds.top || event.clientY > bounds.bottom || event.target.closest(".topline, .project-dock")) return;
  if (projectView.querySelector(".page-outgoing")) return;

  const page = projectView.querySelector(":scope > .page-entering") ?? projectView.firstElementChild;
  if (!page || page.getAnimations().some((animation) => animation.playState === "running")) return;
  page.classList.remove("page-entering");
  pageDrag = { pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, deltaX: 0, moved: false, page };
  projectView.setPointerCapture(event.pointerId);
});

projectView.addEventListener("pointermove", (event) => {
  if (!pageDrag || event.pointerId !== pageDrag.pointerId) return;
  const deltaX = event.clientX - pageDrag.startX;
  const deltaY = event.clientY - pageDrag.startY;

  if (!pageDrag.moved && Math.abs(deltaY) > Math.abs(deltaX) + 8) {
    if (projectView.hasPointerCapture(event.pointerId)) projectView.releasePointerCapture(event.pointerId);
    pageDrag = null;
    return;
  }
  if (!pageDrag.moved && Math.abs(deltaX) < 7) return;

  pageDrag.moved = true;
  pageDrag.deltaX = deltaX;
  pageDrag.page.style.setProperty("--drag-offset", `${deltaX}px`);
  pageDrag.page.style.translate = `${deltaX}px 0`;
  updatePageDragPreview(pageDrag);
  projectView.classList.add("is-pointer-dragging");
  window.getSelection()?.removeAllRanges();
  event.preventDefault();
});

function finishPageDrag(event, cancelled = false) {
  if (!pageDrag || event.pointerId !== pageDrag.pointerId) return;
  const drag = pageDrag;
  pageDrag = null;
  projectView.classList.remove("is-pointer-dragging");
  if (projectView.hasPointerCapture(event.pointerId)) projectView.releasePointerCapture(event.pointerId);
  if (!drag.moved) return;

  if (!cancelled && Math.abs(drag.deltaX) >= 72) {
    pendingPagePreview = drag.preview;
    if (selectAdjacentProject(drag.deltaX < 0 ? 1 : -1)) return;
    pendingPagePreview = null;
  }

  drag.page.classList.add("page-returning");
  drag.page.style.translate = "0px 0px";
  if (drag.preview) {
    drag.preview.classList.add("page-returning");
    drag.preview.style.translate = `${drag.previewDirection * window.innerWidth}px 0`;
  }
  window.setTimeout(() => {
    drag.preview?.remove();
    drag.page.classList.remove("page-returning");
    drag.page.style.removeProperty("translate");
    drag.page.style.removeProperty("--drag-offset");
  }, 220);
}

projectView.addEventListener("pointerup", (event) => finishPageDrag(event));
projectView.addEventListener("pointercancel", (event) => finishPageDrag(event, true));
projectView.addEventListener("lostpointercapture", (event) => finishPageDrag(event, true));
window.addEventListener("blur", () => {
  if (pageDrag) finishPageDrag({ pointerId: pageDrag.pointerId }, true);
});

function syncMediaGallery(imageIndex, direction = null, automatic = false) {
  const gallery = projectView.querySelector(".gallery");
  if (!gallery) return;
  const selectedThumbnail = gallery.querySelector('.gallery-thumb[aria-pressed="true"]');
  const previousImageIndex = selectedThumbnail ? Number(selectedThumbnail.dataset.image) : null;
  gallery.querySelectorAll(".gallery-thumb").forEach((thumbnail) => {
    thumbnail.setAttribute("aria-pressed", String(Number(thumbnail.dataset.image) === imageIndex));
  });
  if (previousImageIndex === imageIndex) return;
  gallery.dispatchEvent(new CustomEvent("gallery-reveal", { detail: { imageIndex, previousImageIndex, direction, automatic } }));
}

function selectMediaImage(project, imageIndex, resetNavigation = true, preparedImage = null) {
  if (resetNavigation) { pendingHeroDirection = null; pendingHeroIndex = null; }
  const currentFrame = projectView.querySelector(".hero-frame");
  currentFrame.dispatchEvent(new Event("hero-dispose"));
  currentFrame.querySelector("video")?.pause();
  if (project.id === "about") activeAboutImageIndex = imageIndex;
  else activeImageIndex = imageIndex;
  const template = document.createElement("template");
  template.innerHTML = renderHeroMarkup(project, imageIndex);
  const newFrame = template.content.firstElementChild;
  const newImage = newFrame.querySelector("img.hero-image");
  if (preparedImage && newImage && preparedImage.src === newImage.src) {
    preparedImage.className = newImage.className;
    preparedImage.alt = newImage.alt;
    preparedImage.removeAttribute("style");
    preparedImage.removeAttribute("aria-hidden");
    newImage.replaceWith(preparedImage);
  }
  currentFrame.replaceWith(newFrame);
  enableHeroDrag(newFrame);
  syncMediaGallery(imageIndex);
}

projectView.addEventListener("click", (event) => {
  const mediaButton = event.target.closest("[data-media-direction]");
  if (mediaButton) {
    mediaButton.closest(".hero-frame").dispatchEvent(new CustomEvent("hero-navigate", {
      detail: { direction: Number(mediaButton.dataset.mediaDirection) },
    }));
    return;
  }
  const directionButton = event.target.closest("[data-gallery-direction]");
  if (directionButton) {
    const gallery = projectView.querySelector(".gallery");
    gallery.dispatchEvent(new CustomEvent("gallery-nudge", {
      detail: { direction: Number(directionButton.dataset.galleryDirection) },
    }));
    return;
  }

  const button = event.target.closest("[data-image]");
  if (!button) return;
  const project = aboutLink.getAttribute("aria-pressed") === "true" ? aboutMedia : projects.find((item) => item.id === activeProjectId);
  if (!project) return;
  const imageIndex = Number(button.dataset.image);
  const currentIndex = project.id === "about" ? activeAboutImageIndex : activeImageIndex;
  if (imageIndex === currentIndex) return;
  const gallery = button.closest(".gallery");
  const bounds = gallery.getBoundingClientRect();
  const center = (element) => { const rect = element.getBoundingClientRect(); return rect.left + rect.width / 2; };
  const viewportCenter = bounds.left + bounds.width / 2;
  const activeCenters = [...gallery.querySelectorAll('.gallery-thumb[aria-pressed="true"]')].map(center);
  const reference = activeCenters.reduce((nearest, value) => Math.abs(value - viewportCenter) < Math.abs(nearest - viewportCenter) ? value : nearest, activeCenters[0] ?? viewportCenter);
  projectView.querySelector(".hero-frame").dispatchEvent(new CustomEvent("hero-navigate", {
    detail: { direction: center(button) < reference ? -1 : 1, imageIndex },
  }));
});

function renderPageFromUrl() {
  const project = projectFromUrl();
  if (project) {
    const direction = projectNavigationDirection(project);
    renderProject(project, project.video ? -1 : 0, 0, true, direction);
  } else renderAbout(-1);
}
window.addEventListener("hashchange", renderPageFromUrl);
window.addEventListener("popstate", renderPageFromUrl);
document.querySelector(".wordmark").addEventListener("click", (event) => {
  event.preventDefault();
  if (finishActivePageTransition || pageDrag || mediaDragActive
    || aboutLink.getAttribute("aria-pressed") === "true") return;
  renderAbout(-1);
});

async function initializePortfolio() {
  const language = document.documentElement.lang.toLowerCase().split("-")[0] || "en";
  await Promise.all([...projects, aboutMedia].map(async (project) => {
    const folder = project === aboutMedia ? "aboutme" : project.folder.replace(/\/img$/, "");
    const response = await fetch(`Assets/${folder}/content.json`, { cache: "no-cache" });
    if (!response.ok) throw new Error(`Assets/${folder}/content.json: HTTP ${response.status}`);
    const translations = await response.json();
    const content = translations[language];
    if (project === aboutMedia) {
      if (!content || !["title1", "title2", "texte"].every(key => typeof content[key] === "string")) {
        throw new Error(`Contenu JSON invalide ou langue absente : ${folder}/${language}`);
      }
      Object.assign(project, content, { title: content.title1 });
      return;
    }
    if (!content || typeof content.title !== "string" || typeof content.context !== "string"
      || typeof content.pitch !== "string" || !Array.isArray(content.tags) || !Array.isArray(content.paragraphs)) {
      throw new Error(`Contenu JSON invalide ou langue absente : ${folder}/${language}`);
    }
    project.title = content.title;
    project.context = content.context;
    project.tags = content.tags;
    project.pitch = content.pitch;
    project.paragraphs = content.paragraphs;
    project.toys = content.toys || [];
    project.titleToy = content.titleToy;
    project.titleCube = content.titleCube;
  }));
  renderProjectRail();
  const initialProject = projectFromUrl();
  if (initialProject) renderProject(initialProject);
  else renderAbout();
}

initializePortfolio().catch((error) => console.error("Impossible de charger les contenus JSON", error));
