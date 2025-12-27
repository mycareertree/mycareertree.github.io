const canvas = document.querySelector(".map-canvas");
const wrapper = document.querySelector(".map-wrapper");

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

/* MOUSE WHEEL ZOOM */
wrapper.addEventListener("wheel", (e) => {
  e.preventDefault();

  const delta = e.deltaY > 0 ? -0.1 : 0.1;
  scale += delta;

  scale = Math.min(Math.max(scale, minScale), maxScale);
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

/* TOUCH SUPPORT (MOBILE) */
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
      const delta = (currentDistance - lastTouchDistance) * 0.005;
      scale += delta;
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

/* HELPER */
function getTouchDistance(touches) {
  const dx = touches[0].clientX - touches[1].clientX;
  const dy = touches[0].clientY - touches[1].clientY;
  return Math.sqrt(dx * dx + dy * dy);
}

/* INITIAL RENDER */
updateTransform();
