/** Public tile and thumbnail assets (Google Cloud Storage). */
const ASSET_BASE = "https://storage.googleapis.com/shroud_images";

const IMAGES = [
  {
    id: "full-2002",
    title: "Full-Length Restoration (2002)",
    description: "Complete Shroud during the 2002 restoration. 7,683 x 29,362 px.",
    dzi: `${ASSET_BASE}/tiles/shroud-full-2002.dzi`,
    thumb: `${ASSET_BASE}/images/shroud-full-2002.jpg`,
  },
  {
    id: "enrie-hires",
    title: "Giuseppe Enrie (1931)",
    description: "High-resolution photograph by Giuseppe Enrie. 2,388 x 3,000 px.",
    dzi: `${ASSET_BASE}/tiles/shroud-enrie-hires.dzi`,
    thumb: `${ASSET_BASE}/images/shroud-enrie-hires.jpg`,
  },
  {
    id: "face-hires",
    title: "Face Detail (2002 Photo)",
    description: "High-resolution face detail from 2002 photography. 7,293 x 7,227 px.",
    dzi: `${ASSET_BASE}/tiles/shroud-face-hires.dzi`,
    thumb: `${ASSET_BASE}/images/shroud-face-hires.jpg`,
  },
  {
    id: "neg-pos-hires",
    title: "Negative & Positive (Hi-Res)",
    description: "Side-by-side negative and positive comparison. 8,000 x 8,017 px.",
    dzi: `${ASSET_BASE}/tiles/shroud-neg-pos-hires.dzi`,
    thumb: `${ASSET_BASE}/images/shroud-neg-pos-hires.jpg`,
  },
  {
    id: "pia-1898",
    title: "Secondo Pia (1898)",
    description: "Historic first photograph by Secondo Pia. 2,461 x 3,286 px.",
    dzi: `${ASSET_BASE}/tiles/shroud-pia-1898.dzi`,
    thumb: `${ASSET_BASE}/images/shroud-pia-1898.jpg`,
  },
  {
    id: "negatives",
    title: "Full-Length Negatives",
    description: "Negative image showing the full length. 2,370 x 2,321 px.",
    dzi: `${ASSET_BASE}/tiles/shroud-negatives.dzi`,
    thumb: `${ASSET_BASE}/images/shroud-negatives.jpg`,
  },
  {
    id: "face-comparison",
    title: "Face Before/After 2002",
    description: "Face comparison before and after the 2002 restoration. 3,916 x 2,584 px.",
    dzi: `${ASSET_BASE}/tiles/shroud-face-comparison.dzi`,
    thumb: `${ASSET_BASE}/images/shroud-face-comparison.jpg`,
  },
  {
    id: "full-bw",
    title: "Full-Length B&W",
    description: "Black and white full-length image. 613 x 2,325 px.",
    dzi: `${ASSET_BASE}/tiles/shroud-full-bw.dzi`,
    thumb: `${ASSET_BASE}/images/shroud-full-bw.jpg`,
  },
];

const MOBILE_BREAKPOINT = 768;

let viewer = null;
let currentImageId = null;
let rotation = 0;
let zoomDisplayRafId = null;
let wasMobileViewport = null;

/** Privacy-friendly analytics (GoatCounter). */
function trackGoat(path, title) {
  if (typeof window.goatcounter !== "undefined" && window.goatcounter.count) {
    window.goatcounter.count({ path, title: title || path });
  }
}

function initSidebarForViewport() {
  const sidebar = document.getElementById("sidebar");
  const mobile = window.innerWidth <= MOBILE_BREAKPOINT;
  if (mobile) {
    sidebar.classList.add("closed");
    sidebar.classList.remove("open");
  } else {
    sidebar.classList.remove("closed");
    sidebar.classList.add("open");
  }
  wasMobileViewport = mobile;
}

function syncSidebarOnResize() {
  const mobile = window.innerWidth <= MOBILE_BREAKPOINT;
  if (mobile === wasMobileViewport) return;
  const sidebar = document.getElementById("sidebar");
  if (mobile) {
    sidebar.classList.add("closed");
    sidebar.classList.remove("open");
  } else {
    sidebar.classList.remove("closed");
    sidebar.classList.add("open");
  }
  wasMobileViewport = mobile;
  if (viewer) {
    requestAnimationFrame(() => viewer.forceResize());
  }
}

function debounce(fn, ms) {
  let t;
  return function () {
    clearTimeout(t);
    t = setTimeout(fn, ms);
  };
}

function initViewer() {
  viewer = OpenSeadragon({
    id: "osd-viewer",
    prefixUrl: "https://cdn.jsdelivr.net/npm/openseadragon@5.0.1/build/openseadragon/images/",
    tileSources: IMAGES[0].dzi,
    animationTime: 0.4,
    blendTime: 0,
    minZoomLevel: 0.3,
    maxZoomLevel: 40,
    visibilityRatio: 0.5,
    constrainDuringPan: false,
    showNavigator: true,
    navigatorId: "minimap",
    navigatorAutoResize: true,
    showZoomControl: false,
    showHomeControl: false,
    showFullPageControl: false,
    showRotationControl: false,
    gestureSettingsMouse: { scrollToZoom: true, clickToZoom: true, dblClickToZoom: true },
    gestureSettingsTouch: { pinchToZoom: true, flickEnabled: true },
    crossOriginPolicy: "Anonymous",
    timeout: 60000,
  });

  currentImageId = IMAGES[0].id;

  viewer.addHandler("open", () => {
    document.getElementById("loading-overlay").classList.add("hidden");
    applyFilters();
  });

  const throttledZoomDisplay = () => {
    if (!zoomDisplayRafId) {
      zoomDisplayRafId = requestAnimationFrame(() => {
        zoomDisplayRafId = null;
        updateZoomDisplay();
      });
    }
  };
  viewer.addHandler("zoom", throttledZoomDisplay);
  viewer.addHandler("animation", throttledZoomDisplay);

  viewer.addHandler("tile-load-failed", (event) => {
    console.warn("Tile load failed:", event);
  });
}

function updateZoomDisplay() {
  if (!viewer) return;
  const zoom = viewer.viewport.getZoom(true);
  document.getElementById("zoom-level").textContent = zoom.toFixed(2) + "x";
}

function loadImage(imageId) {
  const img = IMAGES.find((i) => i.id === imageId);
  if (!img || img.id === currentImageId) return;

  currentImageId = img.id;
  rotation = 0;
  document.getElementById("image-title").textContent = img.title;
  document.getElementById("loading-overlay").classList.remove("hidden");

  document.querySelectorAll(".gallery-item").forEach((el) => {
    el.classList.toggle("active", el.dataset.id === imageId);
  });

  viewer.open(img.dzi);
  trackGoat("/event/image/" + imageId, "Image: " + img.title);
}

function buildGallery() {
  const gallery = document.getElementById("image-gallery");
  gallery.innerHTML = "";

  IMAGES.forEach((img) => {
    const item = document.createElement("div");
    item.className = "gallery-item" + (img.id === IMAGES[0].id ? " active" : "");
    item.dataset.id = img.id;
    item.title = img.description;
    item.innerHTML = `
      <img src="${img.thumb}" alt="${img.title}" loading="lazy">
      <span class="gallery-label">${img.title}</span>
    `;
    item.addEventListener("click", () => loadImage(img.id));
    gallery.appendChild(item);
  });
}

function applyFilters() {
  if (!viewer) return;
  const canvas = viewer.canvas;
  if (!canvas) return;

  const brightness = +document.getElementById("filter-brightness").value;
  const contrast = +document.getElementById("filter-contrast").value;
  const saturate = +document.getElementById("filter-saturate").value;
  const invert = document.getElementById("filter-invert").checked;
  const grayscale = document.getElementById("filter-grayscale").checked;

  const isDefault =
    brightness === 100 && contrast === 100 && saturate === 100 && !invert && !grayscale;

  if (isDefault) {
    canvas.style.filter = "";
    return;
  }

  const parts = [];
  if (brightness !== 100) parts.push(`brightness(${brightness}%)`);
  if (contrast !== 100) parts.push(`contrast(${contrast}%)`);
  if (saturate !== 100) parts.push(`saturate(${saturate}%)`);
  if (invert) parts.push("invert(100%)");
  if (grayscale) parts.push("grayscale(100%)");

  canvas.style.filter = parts.join(" ");
}

function resetFilters() {
  document.getElementById("filter-brightness").value = 100;
  document.getElementById("filter-contrast").value = 100;
  document.getElementById("filter-saturate").value = 100;
  document.getElementById("filter-invert").checked = false;
  document.getElementById("filter-grayscale").checked = false;

  document.getElementById("val-brightness").textContent = "100%";
  document.getElementById("val-contrast").textContent = "100%";
  document.getElementById("val-saturate").textContent = "100%";

  applyFilters();
}

function setupFilterListeners() {
  const rangeFilters = ["brightness", "contrast", "saturate"];
  rangeFilters.forEach((name) => {
    const input = document.getElementById(`filter-${name}`);
    const display = document.getElementById(`val-${name}`);
    input.addEventListener("input", () => {
      display.textContent = input.value + "%";
      applyFilters();
    });
    input.addEventListener("change", () => {
      trackGoat("/event/filter/" + name, "Filter: " + name);
    });
  });

  document.getElementById("filter-invert").addEventListener("change", () => {
    applyFilters();
    trackGoat("/event/filter/invert", "Filter: invert");
  });
  document.getElementById("filter-grayscale").addEventListener("change", () => {
    applyFilters();
    trackGoat("/event/filter/grayscale", "Filter: grayscale");
  });
  document.getElementById("btn-reset-filters").addEventListener("click", () => {
    resetFilters();
    trackGoat("/event/filter/reset", "Filter: reset");
  });
}

function setupNavControls() {
  document.getElementById("btn-zoom-in").addEventListener("click", () => {
    if (viewer) viewer.viewport.zoomBy(1.5);
  });
  document.getElementById("btn-zoom-out").addEventListener("click", () => {
    if (viewer) viewer.viewport.zoomBy(0.667);
  });
  document.getElementById("btn-home").addEventListener("click", () => {
    if (viewer) {
      rotation = 0;
      viewer.viewport.setRotation(0);
      viewer.viewport.goHome();
    }
  });
  document.getElementById("btn-rotate-left").addEventListener("click", () => {
    rotation = ((rotation - 90) % 360 + 360) % 360;
    if (viewer) viewer.viewport.setRotation(rotation);
  });
  document.getElementById("btn-rotate-right").addEventListener("click", () => {
    rotation = (rotation + 90) % 360;
    if (viewer) viewer.viewport.setRotation(rotation);
  });
}

function setupSidebar() {
  document.getElementById("btn-sidebar-toggle").addEventListener("click", () => {
    const sidebar = document.getElementById("sidebar");
    sidebar.classList.toggle("closed");
    sidebar.classList.toggle("open");
    if (viewer) {
      requestAnimationFrame(() => viewer.forceResize());
    }
  });
}

function setupFullscreen() {
  const container = document.getElementById("viewer-container");

  document.getElementById("btn-fullscreen").addEventListener("click", () => {
    if (!document.fullscreenElement) {
      container.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen();
    }
  });

  document.addEventListener("fullscreenchange", () => {
    setTimeout(() => {
      if (viewer) viewer.viewport.goHome(true);
    }, 100);
  });
}

function setupKeyboard() {
  document.addEventListener("keydown", (e) => {
    if (e.target.tagName === "INPUT") return;

    switch (e.key) {
      case "f":
        document.getElementById("btn-fullscreen").click();
        break;
      case "r":
        document.getElementById("btn-rotate-right").click();
        break;
      case "R":
        document.getElementById("btn-rotate-left").click();
        break;
      case "h":
        document.getElementById("btn-home").click();
        break;
      case "n":
        document.getElementById("filter-invert").click();
        break;
      case "s":
        document.getElementById("btn-sidebar-toggle").click();
        break;
      case "=":
      case "+":
        document.getElementById("btn-zoom-in").click();
        break;
      case "-":
        document.getElementById("btn-zoom-out").click();
        break;
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  initSidebarForViewport();
  buildGallery();
  initViewer();
  setupFilterListeners();
  setupNavControls();
  setupSidebar();
  setupFullscreen();
  setupKeyboard();
  window.addEventListener("resize", debounce(syncSidebarOnResize, 150));
});
