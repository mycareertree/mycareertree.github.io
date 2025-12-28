/* =========================================
   MyCareerTree Map Logic - Optimized V2
   ========================================= */

const canvas = document.querySelector(".map-canvas");
const wrapper = document.querySelector(".map-wrapper");

// UI Elements (Headers & Buttons)
const mapTitleCard = document.getElementById("mapTitle");
const mapLegendCard = document.getElementById("mapLegend");
const toggleTitleBtn = document.getElementById("toggleMapTitle");
const toggleLegendBtn = document.getElementById("toggleLegend");
const resetBtn = document.getElementById("resetView");

// State Variables
let originX = 0;
let originY = 0;
let scale = 1;

let isPanning = false;
let startX = 0, startY = 0;

// Update the Visual Transform
function updateTransform() {
  // Use translate3d for hardware acceleration (smoother)
  canvas.style.transform = `translate3d(${originX}px, ${originY}px, 0px) scale(${scale})`;
}

/* ===========================
   1. BUTTON CONTROLS
   =========================== */

// Reset View Logic
if (resetBtn) {
  resetBtn.onclick = (e) => {
    e.stopPropagation(); // Stop click from affecting map
    originX = 0;
    originY = 0;
    scale = 1;
    updateTransform();
  };
}

// Toggle Header (Collapse/Expand)
if (toggleTitleBtn && mapTitleCard) {
  toggleTitleBtn.onclick = (e) => {
    e.stopPropagation();
    mapTitleCard.classList.toggle("collapsed");
  };
}

// Toggle Legend (Collapse/Expand)
if (toggleLegendBtn && mapLegendCard) {
  toggleLegendBtn.onclick = (e) => {
    e.stopPropagation();
    mapLegendCard.classList.toggle("collapsed");
  };
}

/* ===========================
   2. DESKTOP PANNING (Mouse)
   =========================== */
wrapper.addEventListener("mousedown", (e) => {
  // Ignore drag if clicking a button or link
  if (e.target.closest("button") || e.target.closest("a")) return;
  
  isPanning = true;
  startX = e.clientX - originX;
  startY = e.clientY - originY;
  wrapper.style.cursor = "grabbing";
});

window.addEventListener("mousemove", (e) => {
  if (!isPanning) return;
  e.preventDefault();
  originX = e.clientX - startX;
  originY = e.clientY - startY;
  updateTransform();
});

window.addEventListener("mouseup", () => {
  isPanning = false;
  wrapper.style.cursor = "grab";
});

/* ===========================
   3. MOBILE TOUCH (Pan & Zoom)
   =========================== */
let lastDistance = null;

wrapper.addEventListener("touchstart", (e) => {
  if (e.target.closest("button") || e.target.closest("a")) return;

  // Case A: One Finger -> Pan
  if (e.touches.length === 1) {
    isPanning = true;
    startX = e.touches[0].clientX - originX;
    startY = e.touches[0].clientY - originY;
  } 
  // Case B: Two Fingers -> Start Pinch
  else if (e.touches.length === 2) {
    isPanning = false; // Stop panning to focus on zoom
    lastDistance = getDistance(e.touches);
  }
}, { passive: false });

wrapper.addEventListener("touchmove", (e) => {
  // Prevent default scroll behavior while interacting with map
  if (isPanning || e.touches.length === 2) {
    e.preventDefault(); 
  }

  // Logic A: Panning
  if (isPanning && e.touches.length === 1) {
    originX = e.touches[0].clientX - startX;
    originY = e.touches[0].clientY - startY;
    updateTransform();
  }
  
  // Logic B: Pinch Zooming
  if (e.touches.length === 2) {
    const newDistance = getDistance(e.touches);
    if (lastDistance) {
      const diff = newDistance - lastDistance;
      
      // SENSITIVITY FIX: 
      // 0.0015 is much lower than before. 
      // This makes the zoom feel "heavy" and controlled, not jumpy.
      const zoomSpeed = 0.0015; 
      
      scale += diff * zoomSpeed;
      
      // Strict Limits (0.5x to 3x zoom)
      scale = Math.min(Math.max(scale, 0.5), 3);
      
      updateTransform();
    }
    lastDistance = newDistance;
  }
}, { passive: false });

window.addEventListener("touchend", () => {
  isPanning = false;
  lastDistance = null;
});

// Helper: Calculate distance between two fingers
function getDistance(touches) {
  const dx = touches[0].clientX - touches[1].clientX;
  const dy = touches[0].clientY - touches[1].clientY;
  return Math.sqrt(dx * dx + dy * dy);
}

// Initial Render
updateTransform();
