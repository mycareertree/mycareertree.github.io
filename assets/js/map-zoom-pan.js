/* =========================================
   MyCareerTree Map Logic - V5 (Centered Zoom & Touchpad Fix)
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

// Animation Frame for Smoothness
let isRenderScheduled = false;

/* ===========================
   1. CORE RENDERER
   =========================== */
function render() {
  // Translate3d + Scale for GPU Acceleration
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
  
  // Detection for "Click vs Drag"
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
   4. SMART ZOOM (Centered on Mouse)
   =========================== */
wrapper.addEventListener("wheel", (e) => {
  e.preventDefault();

  // --- LOGIC: PAN vs ZOOM ---
  // If Ctrl key is pressed (Pinch on trackpad) -> ZOOM
  // If no Ctrl key -> Check device type roughly
  // For this version: Let's allow simple Wheel to Zoom centered, 
  // but if it's horizontal scrolling, we Pan.
  
  if (e.ctrlKey) {
    // PINCH ZOOM (Trackpad standard)
    applyCenteredZoom(e, -e.deltaY * 0.01);
  } else {
    // STANDARD SCROLL
    // If it's a Trackpad (usually sends small deltaX), let's PAN.
    // If it's a Mouse Wheel (usually large deltaY only), let's ZOOM.
    
    // Simple heuristic: If horizontal scroll exists, assume Trackpad Pan
    if (Math.abs(e.deltaX) > 0) {
      state.x -= e.deltaX;
      state.y -= e.deltaY;
      requestRender();
    } else {
      // Vertical only: Zoom (Standard Map Behavior)
      // Use smaller intensity for smoother mouse wheel
      applyCenteredZoom(e, -e.deltaY * 0.001); 
    }
  }
}, { passive: false });

function applyCenteredZoom(e, zoomAmount) {
  const oldScale = state.scale;
  let newScale = oldScale + zoomAmount;

  // Limits
  newScale = Math.min(Math.max(newScale, 0.5), 3);

  // Calculate Mouse Position Relative to Map (World Coordinates)
  // formula: world_x = (mouse_screen_x - map_translation_x) / map_scale
  const mouseWorldX = (e.clientX - state.x) / oldScale;
  const mouseWorldY = (e.clientY - state.y) / oldScale;

  // Calculate New Translation to keep Mouse Position fixed
  // formula: new_trans_x = mouse_screen_x - (mouse_world_x * new_scale)
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
let lastTouchX = 0, lastTouchY = 0;

wrapper.addEventListener("touchstart", (e) => {
  if (e.target.closest("button")) return;

  if (e.touches.length === 1) {
    // Single Finger Pan
    state.isPanning = true;
    startX = e.touches[0].clientX - state.x;
    startY = e.touches[0].clientY - state.y;
  }
  else if (e.touches.length === 2) {
    // Two Finger Pinch - Reset Pan to avoid jumping
    state.isPanning = false;
    lastPinchDist = getDistance(e.touches);
    
    // Calculate center of pinch for zooming
    lastTouchX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
    lastTouchY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
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
    
    // Use the center of the two fingers as the zoom origin
    const centerX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
    const centerY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
    
    // Reuse the centered zoom logic but adapting for Touch center
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
