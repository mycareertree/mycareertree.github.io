const canvas = document.querySelector(".map-canvas");
const wrapper = document.querySelector(".map-wrapper");
const title = document.querySelector(".map-title");
const legend = document.querySelector(".map-legend");

let originX = 0;
let originY = 0;
let isPanning = false;
let startX, startY;

/* APPLY TRANSFORM (PAN ONLY) */
function updateTransform() {
  canvas.style.transform = `translate(${originX}px, ${originY}px)`;
}

/* RESET VIEW */
document.getElementById("reset-view").onclick = () => {
  originX = 0;
  originY = 0;
  updateTransform();
};

/* PAN (MOUSE + TOUCH) */
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

/* TOUCH PAN */
wrapper.addEventListener("touchstart", (e) => {
  if (e.touches.length === 1) {
    isPanning = true;
    startX = e.touches[0].clientX - originX;
    startY = e.touches[0].clientY - originY;
  }
});

wrapper.addEventListener("touchmove", (e) => {
  if (!isPanning) return;
  originX = e.touches[0].clientX - startX;
  originY = e.touches[0].clientY - startY;
  updateTransform();
});

window.addEventListener("touchend", () => {
  isPanning = false;
});

/* TOGGLE HEADER */
document.getElementById("toggle-map-title").onclick = () => {
  title.style.display = title.style.display === "none" ? "block" : "none";
};

/* TOGGLE LEGEND */
document.getElementById("toggle-legend").onclick = () => {
  legend.style.display = legend.style.display === "none" ? "block" : "block";
};

updateTransform();
