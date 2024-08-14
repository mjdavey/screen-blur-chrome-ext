let mode = "off";
let isDrawing = false;
let startX, startY;
let blurredElements = new Set();
let selectionBox = null;
let highlightedElements = new Set();

const blurrableElements = new Set([
  "P",
  "IMG",
  "VIDEO",
  "IFRAME",
  "CANVAS",
  "SVG",
  "FIGURE",
  "PICTURE",
  "AUDIO",
  "H1",
  "H2",
  "H3",
  "H4",
  "H5",
  "H6",
  "BLOCKQUOTE",
  "PRE",
  "CODE",
  "TABLE",
  "UL",
  "OL",
  "LI",
  "A",
  "SPAN",
  "STRONG",
  "EM",
  "B",
  "I",
  "U",
  "SMALL",
  "BUTTON",
]);

// Add a style for blurred elements
const style = document.createElement("style");
style.textContent = `
    .blurred-element {
        pointer-events: none !important;
    }
    .blurred-element:hover {
        cursor: default !important;
    }
`;
document.head.appendChild(style);

function createSelectionBox() {
  const box = document.createElement("div");
  box.style.position = "fixed";
  box.style.border = "2px dashed #007bff";
  box.style.backgroundColor = "rgba(0, 123, 255, 0.1)";
  box.style.pointerEvents = "none";
  box.style.zIndex = "9999";
  return box;
}

function updateSelectionBox(x, y, width, height) {
  selectionBox.style.left = `${x}px`;
  selectionBox.style.top = `${y}px`;
  selectionBox.style.width = `${width}px`;
  selectionBox.style.height = `${height}px`;
}

function startDrawing(e) {
  if (mode !== "edit") return;
  isDrawing = true;
  startX = e.clientX;
  startY = e.clientY;
  selectionBox = createSelectionBox();
  document.body.appendChild(selectionBox);
}

function draw(e) {
  if (!isDrawing) return;
  const width = Math.abs(e.clientX - startX);
  const height = Math.abs(e.clientY - startY);
  const x = Math.min(startX, e.clientX);
  const y = Math.min(startY, e.clientY);
  updateSelectionBox(x, y, width, height);
  highlightElementsInSelection(x, y, x + width, y + height);
}

function stopDrawing(e) {
  if (!isDrawing) return;
  isDrawing = false;
  selectionBox.remove();
  const elements = getElementsInSelection(startX, startY, e.clientX, e.clientY);
  console.log(`Blurring ${elements.length} elements`);
  elements.forEach(blurElement);
  clearHighlightedElements();
}

function getElementsInSelection(x1, y1, x2, y2) {
  const left = Math.min(x1, x2);
  const top = Math.min(y1, y2);
  const right = Math.max(x1, x2);
  const bottom = Math.max(y1, y2);

  const elements = [];
  const allElements = document.body.getElementsByTagName("*");

  for (let el of allElements) {
    if (blurrableElements.has(el.tagName)) {
      const rect = el.getBoundingClientRect();
      if (
        rect.left < right &&
        rect.right > left &&
        rect.top < bottom &&
        rect.bottom > top
      ) {
        elements.push(el);
      }
    }
  }

  console.log(`Found ${elements.length} elements in selection`);
  return elements;
}

function highlightElementsInSelection(x1, y1, x2, y2) {
  clearHighlightedElements();
  const elements = getElementsInSelection(x1, y1, x2, y2);
  elements.forEach((el) => {
    el.dataset.originalOutline = el.style.outline;
    el.style.outline = "2px solid #007bff";
    highlightedElements.add(el);
  });
}

function clearHighlightedElements() {
  highlightedElements.forEach((el) => {
    el.style.outline = el.dataset.originalOutline || "";
    delete el.dataset.originalOutline;
  });
  highlightedElements.clear();
}

function blurElement(element) {
  if (!blurredElements.has(element)) {
    element.dataset.originalFilter = element.style.filter;
    element.style.filter = "blur(5px)";
    element.classList.add("blurred-element");
    blurredElements.add(element);
    console.log(`Blurred element: ${element.tagName}`);
  }
}

function unblurElement(element) {
  if (blurredElements.has(element)) {
    element.style.filter = element.dataset.originalFilter || "";
    delete element.dataset.originalFilter;
    element.classList.remove("blurred-element");
    blurredElements.delete(element);
    console.log(`Unblurred element: ${element.tagName}`);
  }
}

function toggleBlur(e) {
  if (mode !== "edit") return;
  const element = e.target;
  if (blurrableElements.has(element.tagName)) {
    if (blurredElements.has(element)) {
      unblurElement(element);
    } else {
      blurElement(element);
    }
  }
}

function updateCursor() {
  document.body.style.cursor = mode === "edit" ? "crosshair" : "default";
}

function disableTextSelection() {
  document.body.style.userSelect = mode === "edit" ? "none" : "";
}

function setMode(newMode) {
  mode = newMode;
  updateCursor();
  disableTextSelection();
  if (mode === "off") {
    blurredElements.forEach(unblurElement);
    blurredElements.clear();
  } else {
    blurredElements.forEach((element) => {
      element.style.filter = "blur(5px)";
      element.classList.add("blurred-element");
    });
  }
  console.log(`Mode set to: ${mode}`);
}

document.addEventListener("mousedown", startDrawing);
document.addEventListener("mousemove", draw);
document.addEventListener("mouseup", stopDrawing);
document.addEventListener("click", toggleBlur);

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "setMode") {
    setMode(request.mode);
  }
});

console.log("Content script loaded");
