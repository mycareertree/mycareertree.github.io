const canvas = document.querySelector(".map-canvas");
const wrapper = document.querySelector(".map-wrapper");
const title = document.querySelector(".map-title");
const legend = document.querySelector(".map-legend");

let scale = 1;
let minScale = 0.5;
let maxScale = 2.5;

let originX = 0;
let originY = 0;

let isPanning = false;
let startX, startY;

/* APPLY TRANSFORM */
function updateTransform() {
  canvas.style.transform =
    `translate(${originX}px, ${originY}px) scale(${scale})`;
}

/* RESET VIEW */
function resetView() {
  scale = 1;
  originX = 0;
  originY = 0;
  updateTransform();
}

/* MOUSE WHEEL ZOOM */
wrapper.addEventListener("wheel", (e) => {
  e.preventDefault();
  const delta = e.deltaY > 0 ? -0.1 : 0.1;
  scale = Math.min(Math.max(scale + delta, minScale), maxScale);
  updateTransform();
}, { passive: false });

/* MOUSE PAN */
wrapper.addEventListener("mousedown", (e) => {
  isPanning = true;
  startX = e.clientX - originX;
  startY = e.clientY - originY;
});

window.addEventListener("mousemove", (e) => {
  if (!isPanning) return;
  originX = e.clientX - startX;
  originY = e.clientY - startY;
  updateTransform();
});

window.addEventListener("mouseup", () => {
  isPanning = false;
});

/* TOUCH SUPPORT */
let lastTouchDistance = null;

wrapper.addEventListener("touchstart", (e) => {
  if (e.touches.length === 1) {
    isPanning = true;
    startX = e.touches[0].clientX - originX;
    startY = e.touches[0].clientY - originY;
  }
  if (e.touches.length === 2) {
    lastTouchDistance = getTouchDistance(e.touches);
  }
}, { passive: false });

wrapper.addEventListener("touchmove", (e) => {
  e.preventDefault();
  if (e.touches.length === 1 && isPanning) {
    originX = e.touches[0].clientX - startX;
    originY = e.touches[0].clientY - startY;
    updateTransform();
  }
  if (e.touches.length === 2) {
    const currentDistance = getTouchDistance(e.touches);
    if (lastTouchDistance) {
      scale += (currentDistance - lastTouchDistance) * 0.005;
      scale = Math.min(Math.max(scale, minScale), maxScale);
      updateTransform();
    }
    lastTouchDistance = currentDistance;
  }
}, { passive: false });

window.addEventListener("touchend", () => {
  isPanning = false;
  lastTouchDistance = null;
});

/* BUTTON CONTROLS */
document.getElementById("zoom-in").onclick = () => {
  scale = Math.min(scale + 0.2, maxScale);
  updateTransform();
};

document.getElementById("zoom-out").onclick = () => {
  scale = Math.max(scale - 0.2, minScale);
  updateTransform();
};

document.getElementById("reset-view").onclick = resetView;

document.getElementById("toggle-title").onclick = () => {
  title.style.display = title.style.display === "none" ? "block" : "none";
};

document.getElementById("toggle-legend").onclick = () => {
  legend.style.display = legend.style.display === "none" ? "block" : "none";
};

/* HELPER */
function getTouchDistance(touches) {
  const dx = touches[0].clientX - touches[1].clientX;
  const dy = touches[0].clientY - touches[1].clientY;
  return Math.sqrt(dx * dx + dy * dy);
}

/* INITIAL */
updateTransform();
