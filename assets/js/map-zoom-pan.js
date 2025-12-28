/* =========================================
   MyCareerTree Map Logic - V4 (Desktop Fix)
   ========================================= */

const canvas = document.querySelector(".map-canvas");
const wrapper = document.querySelector(".map-wrapper");

// UI Elements
const mapTitle = document.getElementById("mapTitle");
const mapLegend = document.getElementById("mapLegend");
const toggleTitleBtn = document.getElementById("toggleMapTitle");
const toggleLegendBtn = document.getElementById("toggleLegend");
const resetBtn = document.getElementById("resetView");

// State Variables
let state = {
  x: 0,
  y: 0,
  scale: 1,
  isPanning: false,
  startX: 0,
  startY: 0
};

// Track if we are actually dragging (to prevent link clicks)
let isDragging = false;
let startDragX = 0;
let startDragY = 0;

// Render Scheduler
let isRenderScheduled = false;

/* ===========================
   1. CORE RENDERER
   =========================== */
function render() {
  canvas.style.transform = `translate3d(${state.x}px, ${state.y}px, 0px) scale(${state.scale})`;
  isRenderScheduled = false;
}

function requestRender() {
  if (!isRenderScheduled) {
    requestAnimationFrame(render);
    isRenderScheduled = true;
  }
}

/* ===========================
   2. CONTROLS
   =========================== */
if (resetBtn) {
  resetBtn.onclick = (e) => {
    e.stopPropagation();
    state.x = 0;
    state.y = 0;
    state.scale = 1;
    requestRender();
  };
}

if (toggleTitleBtn) {
  toggleTitleBtn.onclick = (e) => {
    e.stopPropagation();
    if(mapTitle) mapTitle.classList.toggle("collapsed");
  };
}

if (toggleLegendBtn) {
  toggleLegendBtn.onclick = (e) => {
    e.stopPropagation();
    if(mapLegend) mapLegend.classList.toggle("collapsed");
  };
}

/* ===========================
   3. DESKTOP MOUSE EVENTS
   =========================== */
wrapper.addEventListener("mousedown", (e) => {
  // Only stop drag if clicking a BUTTON. 
  // We ALLOW dragging on links (<a>) now!
  if (e.target.closest("button")) return;
  
  state.isPanning = true;
  isDragging = false; // Reset drag check
  
  state.startX = e.clientX - state.x;
  state.startY = e.clientY - state.y;
  
  // Track click start pos to detect drag distance later
  startDragX = e.clientX;
  startDragY = e.clientY;
  
  wrapper.style.cursor = "grabbing";
});

window.addEventListener("mousemove", (e) => {
  if (!state.isPanning) return;
  e.preventDefault();
  
  // Check if user moved more than 5 pixels (threshold for "Drag")
  const moveDist = Math.hypot(e.clientX - startDragX, e.clientY - startDragY);
  if (moveDist > 5) {
    isDragging = true; // Mark as "Dragging" so we don't open links
  }

  state.x = e.clientX - state.startX;
  state.y = e.clientY - state.startY;
  
  requestRender();
});

window.addEventListener("mouseup", () => {
  state.isPanning = false;
  wrapper.style.cursor = "grab";
});

/* ===========================
   4. SMART LINK CLICKING
   =========================== */
// Intercept all clicks on the map links
const allLinks = document.querySelectorAll(".map-node");
allLinks.forEach(link => {
  link.addEventListener("click", (e) => {
    // If we were dragging, BLOCK the click (don't open link)
    if (isDragging) {
      e.preventDefault();
      e.stopPropagation();
    }
    // Otherwise, let the link work naturally
  });
  
  // Prevent default HTML5 drag behavior on links
  link.addEventListener("dragstart", (e) => {
    e.preventDefault();
  });
});

/* ===========================
   5. MOUSE WHEEL ZOOM (Desktop)
   =========================== */
wrapper.addEventListener("wheel", (e) => {
  e.preventDefault();

  const zoomIntensity = 0.001;
  const newScale = state.scale - (e.deltaY * zoomIntensity);

  // Apply Limits
  state.scale = Math.min(Math.max(newScale, 0.5), 3);
  requestRender();
}, { passive: false });

/* ===========================
   6. MOBILE TOUCH EVENTS
   =========================== */
let lastPinchDist = null;

wrapper.addEventListener("touchstart", (e) => {
  if (e.target.closest("button")) return;

  if (e.touches.length === 1) {
    state.isPanning = true;
    state.startX = e.touches[0].clientX - state.x;
    state.startY = e.touches[0].clientY - state.y;
  }
  else if (e.touches.length === 2) {
    state.isPanning = false;
    lastPinchDist = getDistance(e.touches);
  }
}, { passive: false });

wrapper.addEventListener("touchmove", (e) => {
  if (state.isPanning || e.touches.length === 2) e.preventDefault();

  // Pan
  if (state.isPanning && e.touches.length === 1) {
    state.x = e.touches[0].clientX - state.startX;
    state.y = e.touches[0].clientY - state.startY;
    requestRender();
  }
  
  // Zoom
  if (e.touches.length === 2 && lastPinchDist) {
    const newDist = getDistance(e.touches);
    const diff = newDist - lastPinchDist;
    state.scale += diff * 0.0025;
    state.scale = Math.min(Math.max(state.scale, 0.5), 3);
    requestRender();
    lastPinchDist = newDist;
  }
}, { passive: false });

window.addEventListener("touchend", () => {
  state.isPanning = false;
  lastPinchDist = null;
});

function getDistance(touches) {
  const dx = touches[0].clientX - touches[1].clientX;
  const dy = touches[0].clientY - touches[1].clientY;
  return Math.sqrt(dx * dx + dy * dy);
}

// Initial Draw
requestRender();
