const canvas = document.querySelector(".map-canvas");
const wrapper = document.querySelector(".map-wrapper");

const mapTitle = document.getElementById("mapTitle");
const mapLegend = document.getElementById("mapLegend");

const toggleTitleBtn = document.getElementById("toggleMapTitle");
const toggleLegendBtn = document.getElementById("toggleLegend");

const resetBtn = document.getElementById("resetView");

let originX = 0;
let originY = 0;
let scale = 1;

let isPanning = false;
let startX, startY;

/* ===== DEVICE DETECTION ===== */
const isTouchDevice =
  "ontouchstart" in window || navigator.maxTouchPoints > 0;

/* ===== APPLY TRANSFORM ===== */
function updateTransform() {
  canvas.style.transform =
    `translate(${originX}px, ${originY}px) scale(${scale})`;
}

/* ===== RESET VIEW ===== */
resetBtn.onclick = () => {
  originX = 0;
  originY = 0;
  scale = 1;
  updateTransform();
};

/* ===== PAN (ALL DEVICES) ===== */
wrapper.addEventListener("mousedown", (e) => {
  isPanning = true;
  startX = e.clientX - originX;
  startY = e.clientY - originY;
});

wrapper.addEventListener("mousemove", (e) => {
  if (!isPanning) return;
  originX = e.clientX - startX;
  originY = e.clientY - startY;
  updateTransform();
});

window.addEventListener("mouseup", () => {
  isPanning = false;
});

/* ===== TOUCH PAN + PINCH ZOOM (MOBILE ONLY) ===== */
let lastDistance = null;

wrapper.addEventListener("touchstart", (e) => {
  if (e.touches.length === 1) {
    isPanning = true;
    startX = e.touches[0].clientX - originX;
    startY = e.touches[0].clientY - originY;
  }
  if (e.touches.length === 2) {
    lastDistance = getDistance(e.touches);
  }
});

wrapper.addEventListener("touchmove", (e) => {
  if (e.touches.length === 1 && isPanning) {
    originX = e.touches[0].clientX - startX;
    originY = e.touches[0].clientY - startY;
    updateTransform();
  }

  if (isTouchDevice && e.touches.length === 2) {
    const newDistance = getDistance(e.touches);
    if (lastDistance) {
      scale += (newDistance - lastDistance) * 0.003;
      scale = Math.min(Math.max(scale, 0.6), 2);
      updateTransform();
    }
    lastDistance = newDistance;
  }
});

window.addEventListener("touchend", () => {
  isPanning = false;
  lastDistance = null;
});

/* ===== TOGGLES ===== */
toggleTitleBtn.onclick = () => {
  mapTitle.classList.toggle("collapsed");
};

toggleLegendBtn.onclick = () => {
  mapLegend.classList.toggle("collapsed");
};

/* ===== HELPER ===== */
function getDistance(touches) {
  const dx = touches[0].clientX - touches[1].clientX;
  const dy = touches[0].clientY - touches[1].clientY;
  return Math.sqrt(dx * dx + dy * dy);
}

updateTransform();
