/* =========================================
   MyCareerTree Map Logic - High Performance V3
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

// Render Loop Variables
let isRenderScheduled = false;

/* ===========================
   1. PERFORMANCE CORE (The Smoothness Fix)
   =========================== */

function render() {
  // Uses translate3d to force GPU acceleration
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
   2. RESET & CONTROLS
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

// Toggle Buttons
if (toggleTitleBtn) {
  toggleTitleBtn.onclick = (e) => {
    e.stopPropagation();
    mapTitle.classList.toggle("collapsed");
  };
}

if (toggleLegendBtn) {
  toggleLegendBtn.onclick = (e) => {
    e.stopPropagation();
    mapLegend.classList.toggle("collapsed");
  };
}

/* ===========================
   3. MOUSE EVENTS (Desktop)
   =========================== */

wrapper.addEventListener("mousedown", (e) => {
  if (e.target.closest("button") || e.target.closest("a")) return;
  
  state.isPanning = true;
  state.startX = e.clientX - state.x;
  state.startY = e.clientY - state.y;
  wrapper.style.cursor = "grabbing";
});

window.addEventListener("mousemove", (e) => {
  if (!state.isPanning) return;
  
  e.preventDefault(); // Prevents text selection while dragging
  state.x = e.clientX - state.startX;
  state.y = e.clientY - state.startY;
  
  requestRender();
});

window.addEventListener("mouseup", () => {
  state.isPanning = false;
  wrapper.style.cursor = "grab";
});

/* ===========================
   4. TOUCH EVENTS (Mobile - Optimized)
   =========================== */
let lastPinchDist = null;

wrapper.addEventListener("touchstart", (e) => {
  if (e.target.closest("button") || e.target.closest("a")) return;

  // Pan Start
  if (e.touches.length === 1) {
    state.isPanning = true;
    state.startX = e.touches[0].clientX - state.x;
    state.startY = e.touches[0].clientY - state.y;
  }
  // Pinch Start
  else if (e.touches.length === 2) {
    state.isPanning = false;
    lastPinchDist = getDistance(e.touches);
  }
}, { passive: false }); // 'passive: false' allows us to stop scrolling

wrapper.addEventListener("touchmove", (e) => {
  // STOP THE BROWSER FROM SCROLLING THE PAGE
  if (state.isPanning || e.touches.length === 2) {
    e.preventDefault(); 
  }

  // Logic: Pan
  if (state.isPanning && e.touches.length === 1) {
    state.x = e.touches[0].clientX - state.startX;
    state.y = e.touches[0].clientY - state.startY;
    requestRender();
  }
  
  // Logic: Pinch Zoom
  if (e.touches.length === 2 && lastPinchDist) {
    const newDist = getDistance(e.touches);
    const diff = newDist - lastPinchDist;
    
    // Zoom Sensitivity (Lower = Smoother/Heavier)
    state.scale += diff * 0.0025;
    
    // Limits (0.5x to 3x)
    state.scale = Math.min(Math.max(state.scale, 0.5), 3);
    
    requestRender();
    lastPinchDist = newDist;
  }
}, { passive: false });

window.addEventListener("touchend", () => {
  state.isPanning = false;
  lastPinchDist = null;
});

// Helper Math
function getDistance(touches) {
  const dx = touches[0].clientX - touches[1].clientX;
  const dy = touches[0].clientY - touches[1].clientY;
  return Math.sqrt(dx * dx + dy * dy);
}

// Initial Draw
requestRender();
