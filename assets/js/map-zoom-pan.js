/* =========================================
   MyCareerTree Map Logic - V9 (Auto-Center Fix)
   ========================================= */

const canvas = document.querySelector(".map-canvas");
const wrapper = document.querySelector(".map-wrapper");

// UI Elements
const mapTitle = document.getElementById("mapTitle");
const mapLegend = document.getElementById("mapLegend");
const toggleTitleBtn = document.getElementById("toggleMapTitle");
const toggleLegendBtn = document.getElementById("toggleLegend");
const resetBtn = document.getElementById("resetView");

// Constants
const CANVAS_WIDTH = 1600; // Must match CSS width

// State Variables
let state = {
  x: 0,
  y: 0,
  scale: 1,
  isPanning: false
};

// Drag Logic
let startX = 0, startY = 0;
let isDragging = false;
let startDragX = 0, startDragY = 0;

// Animation Frame
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
   2. AUTO-CENTER LOGIC (NEW)
   =========================== */
function centerMap() {
  if (!wrapper) return;
  
  const wrapperW = wrapper.offsetWidth;
  // Calculate the X to center the 1600px canvas in the current screen
  // Formula: (Screen Width - Canvas Width) / 2
  const centerX = (wrapperW - CANVAS_WIDTH) / 2;
  
  state.x = centerX;
  state.y = 50; // Start slightly down so the top node is clearly visible
  state.scale = 1;
  
  requestRender();
}

// Call immediately on load
centerMap();

/* ===========================
   3. CONTROLS
   =========================== */
if (resetBtn) {
  resetBtn.onclick = (e) => {
    e.stopPropagation();
    centerMap(); // Reset now centers the map instead of going to 0,0
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
   4. DESKTOP MOUSE DRAG (PAN)
   =========================== */
wrapper.addEventListener("mousedown", (e) => {
  if (e.target.closest("button")) return;
  
  state.isPanning = true;
  isDragging = false;
  
  startX = e.clientX - state.x;
  startY = e.clientY - state.y;
  
  startDragX = e.clientX;
  startDragY = e.clientY;
  
  wrapper.style.cursor = "grabbing";
});

window.addEventListener("mousemove", (e) => {
  if (!state.isPanning) return;
  e.preventDefault();
  
  const moveDist = Math.hypot(e.clientX - startDragX, e.clientY - startDragY);
  if (moveDist > 5) isDragging = true;

  state.x = e.clientX - startX;
  state.y = e.clientY - startY;
  
  requestRender();
});

window.addEventListener("mouseup", () => {
  state.isPanning = false;
  wrapper.style.cursor = "grab";
});

/* ===========================
   5. SMART ZOOM & FLUID TRACKPAD
   =========================== */
wrapper.addEventListener("wheel", (e) => {
  e.preventDefault();

  // CASE 1: PINCH ZOOM (Ctrl + Trackpad)
  if (e.ctrlKey) {
    applyCenteredZoom(e, -e.deltaY * 0.007);
    return;
  }

  // CASE 2: DETECT TRACKPAD VS MOUSE
  const isTrackpadMotion = Math.abs(e.deltaX) > 0 || Math.abs(e.deltaY) < 50;

  if (isTrackpadMotion) {
    // PAN
    state.x -= e.deltaX;
    state.y -= e.deltaY;
    requestRender();
  } else {
    // ZOOM
    applyCenteredZoom(e, -e.deltaY * 0.001);
  }
}, { passive: false });

function applyCenteredZoom(e, zoomAmount) {
  const oldScale = state.scale;
  let newScale = oldScale + zoomAmount;

  // Limits
  newScale = Math.min(Math.max(newScale, 0.5), 3);

  const mouseWorldX = (e.clientX - state.x) / oldScale;
  const mouseWorldY = (e.clientY - state.y) / oldScale;

  state.x = e.clientX - (mouseWorldX * newScale);
  state.y = e.clientY - (mouseWorldY * newScale);
  
  state.scale = newScale;
  requestRender();
}

/* ===========================
   6. LINK HANDLING
   =========================== */
document.querySelectorAll(".map-node").forEach(link => {
  link.addEventListener("click", (e) => {
    if (isDragging) {
      e.preventDefault();
      e.stopPropagation();
    }
  });
  link.addEventListener("dragstart", (e) => e.preventDefault());
});

/* ===========================
   7. MOBILE TOUCH (Pan & Pinch)
   =========================== */
let lastPinchDist = null;

wrapper.addEventListener("touchstart", (e) => {
  if (e.target.closest("button")) return;

  if (e.touches.length === 1) {
    state.isPanning = true;
    startX = e.touches[0].clientX - state.x;
    startY = e.touches[0].clientY - state.y;
  }
  else if (e.touches.length === 2) {
    state.isPanning = false;
    lastPinchDist = getDistance(e.touches);
  }
}, { passive: false });

wrapper.addEventListener("touchmove", (e) => {
  if (state.isPanning || e.touches.length === 2) e.preventDefault();

  // 1. Pan
  if (state.isPanning && e.touches.length === 1) {
    state.x = e.touches[0].clientX - startX;
    state.y = e.touches[0].clientY - startY;
    requestRender();
  }
  
  // 2. Pinch Zoom
  if (e.touches.length === 2 && lastPinchDist) {
    const newDist = getDistance(e.touches);
    const diff = newDist - lastPinchDist;
    const zoomAmount = diff * 0.0025;
    
    const centerX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
    const centerY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
    
    const oldScale = state.scale;
    let newScale = oldScale + zoomAmount;
    newScale = Math.min(Math.max(newScale, 0.5), 3);

    const worldX = (centerX - state.x) / oldScale;
    const worldY = (centerY - state.y) / oldScale;

    state.x = centerX - (worldX * newScale);
    state.y = centerY - (worldY * newScale);
    state.scale = newScale;

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
