/* =========================================
   MyCareerTree Map Logic - V7 (Trackpad Perfection)
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

// Drag Logic
let startX = 0, startY = 0;
let isDragging = false;
let startDragX = 0, startDragY = 0;

// Trackpad vs Mouse Logic
let isTrackpadMode = false;
let trackpadTimer = null;

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
   4. SMART ZOOM & TRACKPAD LOGIC
   =========================== */
wrapper.addEventListener("wheel", (e) => {
  e.preventDefault();

  // --- LOGIC A: PINCH ZOOM (Two fingers spreading) ---
  // Browsers trigger e.ctrlKey during trackpad pinches
  if (e.ctrlKey) {
    // SENSITIVITY FIX: Reduced multiplier from 0.01 to 0.004
    // This prevents "flash zooms" from slight finger scrambles
    applyCenteredZoom(e, -e.deltaY * 0.004);
    return;
  }

  // --- LOGIC B: ROAMING vs MOUSE WHEEL ---
  
  // 1. Detect if this is likely a trackpad
  // - Horizontal scroll present? -> Definitely Trackpad
  // - Small delta (< 40)? -> Definitely Trackpad start (Mice usually jump > 50)
  const isLikelyTrackpad = Math.abs(e.deltaX) > 0 || Math.abs(e.deltaY) < 40;

  // 2. "Trackpad Lock" Mechanism
  // If we detect trackpad-like movement, LOCK this mode for 200ms.
  // This ensures that even if you flick fast (high delta), it stays as Panning.
  if (isLikelyTrackpad) {
    isTrackpadMode = true;
    clearTimeout(trackpadTimer);
    trackpadTimer = setTimeout(() => {
      isTrackpadMode = false;
    }, 200);
  }

  if (isTrackpadMode) {
    // MODE: ROAM / PAN (Like Click & Drag)
    state.x -= e.deltaX;
    state.y -= e.deltaY;
    requestRender();
  } else {
    // MODE: MOUSE WHEEL ZOOM
    // Only happens if the very first movement was a large vertical jump
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
    const zoomAmount = diff * 0.0025;
    
    // Zoom centered
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
