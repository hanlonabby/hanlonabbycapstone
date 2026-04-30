const scrollScene = document.querySelector(".scroll-scene");
const timelineLayer = document.querySelector(".layer-timeline");
const appleLayer = document.querySelector(".layer-apple-lead");
const appleCard = document.querySelector(".scroll-statement-card");
const appleHeadline = document.querySelector(".scroll-statement-card h2");
const hypothesisScene = document.querySelector(".hypothesis-scene");
const hypothesisContent = document.querySelector(".hypothesis-content");
const hypothesisHeadline = document.querySelector(".hypothesis-content h2");

let appleWords = [];
let hypothesisWords = [];
let lastWordTime = performance.now();
let lastWordProgress = 0;
let smoothedWordProgress = 0;

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
const lerp = (start, end, t) => start + (end - start) * t;
const smoothstep = (edge0, edge1, x) => {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
};

const setLayerStyles = (layer, opacity, translateY, scale, blur, allowPointer) => {
  if (!layer) return;
  layer.style.opacity = opacity;
  layer.style.transform = `translateY(${translateY}px) scale(${scale})`;
  layer.style.filter = `blur(${blur}px)`;
  layer.style.pointerEvents = allowPointer ? "auto" : "none";
};

const splitAppleHeadline = () => {
  if (!appleHeadline || appleHeadline.dataset.split === "true") return;

  const words = appleHeadline.textContent.trim().split(/\s+/);
  appleHeadline.textContent = "";

  words.forEach((word, index) => {
    const span = document.createElement("span");
    span.className = "scroll-word";
    span.textContent = word;
    appleHeadline.appendChild(span);

    if (index < words.length - 1) {
      appleHeadline.appendChild(document.createTextNode(" "));
    }
  });

  appleHeadline.dataset.split = "true";
  appleWords = Array.from(appleHeadline.querySelectorAll(".scroll-word"));
};

const splitHypothesisHeadline = () => {
  if (!hypothesisHeadline || hypothesisHeadline.dataset.split === "true") return;

  const emphasisTerms = new Set([
    "storytelling",
    "digital",
    "integration",
    "unified",
    "cultural",
    "moment"
  ]);
  const lines = Array.from(hypothesisHeadline.querySelectorAll(".hypothesis-line"));

  lines.forEach((line) => {
    const words = line.textContent.trim().split(/\s+/);
    line.textContent = "";

    words.forEach((word, index) => {
      const span = document.createElement("span");
      const cleaned = word.toLowerCase().replace(/[^\w]/g, "");
      span.className = emphasisTerms.has(cleaned)
        ? "parallax-word emphasis"
        : "parallax-word";
      span.textContent = word;
      line.appendChild(span);

      if (index < words.length - 1) {
        line.appendChild(document.createTextNode(" "));
      }
    });
  });

  hypothesisHeadline.dataset.split = "true";
  hypothesisWords = Array.from(hypothesisHeadline.querySelectorAll(".parallax-word"));
};

const updateAppleWordColors = (progress) => {
  if (appleWords.length === 0) return;

  const base = { r: 29, g: 29, b: 31 };
  const target = { r: 225, g: 29, b: 46 };
  const wordCount = appleWords.length;
  const highlightSpan = 2;
  const cappedProgress = clamp(progress, 0, 0.999);
  const activeIndex = Math.floor(cappedProgress * wordCount);

  appleWords.forEach((word, index) => {
    const distance = Math.abs(index - activeIndex);
    const isActive = distance <= highlightSpan - 1;
    const color = isActive ? target : base;
    word.style.color = `rgb(${color.r}, ${color.g}, ${color.b})`;
  });
};

function updateScrollScene() {
  if (scrollScene) {
    const rect = scrollScene.getBoundingClientRect();
    const windowHeight = window.innerHeight;
    const totalScrollable = rect.height - windowHeight;
    const progress = clamp(-rect.top / totalScrollable, 0, 1);

    const timelineProgress = 1 - smoothstep(0.36, 0.55, progress);
    setLayerStyles(
      timelineLayer,
      timelineProgress,
      lerp(0, -35, 1 - timelineProgress),
      lerp(1, 0.985, 1 - timelineProgress),
      lerp(0, 10, 1 - timelineProgress),
      timelineProgress > 0.5
    );

    const appleReveal = smoothstep(0.54, 0.62, progress);
    const appleExit = 1 - smoothstep(0.965, 0.999, progress);
    const appleProgress = appleReveal * appleExit;
    setLayerStyles(
      appleLayer,
      appleProgress,
      lerp(45, 0, appleReveal),
      lerp(0.985, 1, appleReveal),
      lerp(4, 0, appleReveal),
      false
    );

    if (appleCard) {
      appleCard.style.transform = `translateY(${lerp(24, -10, appleProgress)}px)`;
    }

    const rawWordProgress = clamp((progress - 0.66) / 0.2, 0, 1);
    const now = performance.now();
    const deltaTime = Math.max(now - lastWordTime, 16);
    const velocity = Math.abs(rawWordProgress - lastWordProgress) / deltaTime;
    const smoothing = clamp(0.02 + velocity * 1.1, 0.02, 0.14);

    smoothedWordProgress += (rawWordProgress - smoothedWordProgress) * smoothing;
    updateAppleWordColors(smoothedWordProgress);

    lastWordTime = now;
    lastWordProgress = rawWordProgress;
  }

  if (hypothesisScene && hypothesisContent) {
    const rect = hypothesisScene.getBoundingClientRect();
    const windowHeight = window.innerHeight;
    const totalScrollable = rect.height - windowHeight;
    const progress = clamp(-rect.top / totalScrollable, 0, 1);
    const reveal = smoothstep(0.06, 0.9, progress);

    hypothesisContent.style.opacity = reveal;
    hypothesisContent.style.transform = `translateY(${lerp(40, 0, reveal)}px)`;
    hypothesisContent.style.filter = `blur(${lerp(8, 0, reveal)}px)`;

    if (hypothesisWords.length > 0) {
      hypothesisWords.forEach((word, index) => {
        const isEmphasis = word.classList.contains("emphasis");
        const depth = isEmphasis ? 22 : 14;
        const offset = ((index % 8) - 3.5) * depth;
        const scale = isEmphasis ? lerp(1.1, 1, reveal) : 1;
        word.style.transform = `translateY(${lerp(offset, 0, reveal)}px) scale(${scale})`;
      });
    }
  }
}

splitAppleHeadline();
splitHypothesisHeadline();
window.addEventListener("scroll", updateScrollScene);
window.addEventListener("load", () => {
  splitAppleHeadline();
  splitHypothesisHeadline();
  updateScrollScene();
});

const featureCards = Array.from(document.querySelectorAll(".feature-card"));
const featurePanels = Array.from(document.querySelectorAll(".feature-panel"));

const closeAllPanels = () => {
  featurePanels.forEach((panel) => {
    panel.classList.remove("is-open");
    panel.setAttribute("aria-hidden", "true");
  });
  document.body.classList.remove("modal-open");
};

const openPanel = (panelId) => {
  const panel = document.getElementById(panelId);
  if (!panel) return;
  closeAllPanels();
  panel.classList.add("is-open");
  panel.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
};

featureCards.forEach((card) => {
  card.addEventListener("click", () => {
    openPanel(card.dataset.panel);
  });
});

document.addEventListener("click", (event) => {
  const closeTrigger = event.target.closest("[data-close]");
  if (closeTrigger) {
    closeAllPanels();
    return;
  }

  const thumb = event.target.closest(".feature-thumb");
  if (!thumb) return;
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeAllPanels();
  }
});