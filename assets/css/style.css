/* =========================================
   MyCareerTree Map Logic - V8 (Fluid Trackpad & Tuned Pinch)
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
  isPanning: false
};

// Drag Logic (Mouse)
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
   3. DESKTOP MOUSE DRAG (PAN)
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
   4. SMART ZOOM & FLUID TRACKPAD
   =========================== */
wrapper.addEventListener("wheel", (e) => {
  e.preventDefault();

  // CASE 1: PINCH ZOOM (Ctrl + Trackpad)
  // Browser automatically sets e.ctrlKey for trackpad pinches
  if (e.ctrlKey) {
    // SENSITIVITY: Reduced by 30% (0.01 -> 0.007)
    applyCenteredZoom(e, -e.deltaY * 0.007);
    return;
  }

  // CASE 2: DETECT TRACKPAD VS MOUSE
  // We want to allow circular/diagonal roaming (Pan).
  // MOUSE: Usually only scrolls Vertical (deltaX is 0) and has large jumps.
  // TRACKPAD: Can scroll Horizontal (deltaX > 0) and has smooth streams.
  
  // LOGIC:
  // If there is ANY Horizontal scroll (deltaX != 0), it is definitely a Trackpad -> PAN.
  // If the Vertical scroll is small (< 50), it is likely a Trackpad -> PAN.
  // This allows fast diagonal movements (which have deltaX) to still PAN, fixing the "flash zoom".
  const isTrackpadMotion = Math.abs(e.deltaX) > 0 || Math.abs(e.deltaY) < 50;

  if (isTrackpadMotion) {
    // TRACKPAD ROAMING (Pan)
    state.x -= e.deltaX;
    state.y -= e.deltaY;
    requestRender();
  } else {
    // MOUSE WHEEL (Zoom)
    // Only triggers on pure vertical, large steps
    applyCenteredZoom(e, -e.deltaY * 0.001);
  }
}, { passive: false });

function applyCenteredZoom(e, zoomAmount) {
  const oldScale = state.scale;
  let newScale = oldScale + zoomAmount;

  // Limits
  newScale = Math.min(Math.max(newScale, 0.5), 3);

  // Calculate Mouse Position Relative to Map
  const mouseWorldX = (e.clientX - state.x) / oldScale;
  const mouseWorldY = (e.clientY - state.y) / oldScale;

  // Keep mouse pointer fixed on the same map spot
  state.x = e.clientX - (mouseWorldX * newScale);
  state.y = e.clientY - (mouseWorldY * newScale);
  
  state.scale = newScale;
  requestRender();
}

/* ===========================
   5. LINK HANDLING
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
   6. MOBILE TOUCH (Pan & Pinch)
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
    
    // Mobile Pinch Sensitivity (Unchanged)
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

// Initial Draw
requestRender();
