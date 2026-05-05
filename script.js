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

const easeInOutCubic = (t) => {
  return t < 0.5
    ? 4 * t * t * t
    : 1 - Math.pow(-2 * t + 2, 3) / 2;
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
    const totalScrollable = rect.height - windowHeight || 1;
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
    const totalScrollable = rect.height - windowHeight || 1;
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

/* CASE STUDY MODALS */

const caseOpenButtons = Array.from(document.querySelectorAll("[data-case-open]"));
const caseModals = Array.from(document.querySelectorAll(".case-modal"));
const caseCards = Array.from(document.querySelectorAll(".case-card"));

const closeCaseModals = () => {
  caseModals.forEach((modal) => {
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
  });

  document.body.classList.remove("modal-open");
};

const openCaseModal = (modalId) => {
  const modal = document.getElementById(modalId);
  if (!modal) return;

  closeCaseModals();
  modal.classList.add("is-open");
  modal.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
};

caseOpenButtons.forEach((button) => {
  button.addEventListener("click", () => {
    openCaseModal(button.dataset.caseOpen);
  });
});

document.addEventListener("click", (event) => {
  if (event.target.closest("[data-case-close]")) {
    closeCaseModals();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeCaseModals();
  }
});

/* APPLE BRAND CARD STACK */

const updateCaseStack = () => {
  if (caseCards.length === 0) return;

  const baseTop = 120;

  caseCards.forEach((card) => {
    const rect = card.getBoundingClientRect();
    const delta = rect.top - baseTop;
    const normalized = clamp(delta / 200, -1, 1);

    if (normalized >= 0) {
      const incoming = 1 - normalized;
      const translateY = lerp(18, 0, incoming);
      const scale = lerp(0.99, 1, incoming);

      card.style.transform = `translateY(${translateY}px) scale(${scale})`;
      card.style.opacity = 1;
      card.style.pointerEvents = incoming > 0.6 ? "auto" : "none";
    } else {
      const outgoing = clamp(-normalized, 0, 1);
      const translateY = lerp(0, -18, outgoing);
      const scale = lerp(1, 0.99, outgoing);

      card.style.transform = `translateY(${translateY}px) scale(${scale})`;
      card.style.opacity = 1;
      card.style.pointerEvents = outgoing < 0.4 ? "auto" : "none";
    }
  });
};

updateCaseStack();
window.addEventListener("scroll", updateCaseStack);
window.addEventListener("resize", updateCaseStack);

/* PRE-SHOW BLUE SCROLL SECTION */

const preshowSection = document.querySelector(".preshow-scroll");
const preshowLogo = document.querySelector(".preshow-scroll__logo");
const preshowText = document.querySelector(".preshow-scroll__text");
const preshowVideoReveal = document.querySelector(".preshow-video-reveal");

function updatePreshowScroll() {
  if (!preshowSection || !preshowLogo || !preshowText || !preshowVideoReveal) return;

  const rect = preshowSection.getBoundingClientRect();
  const scrollableDistance = preshowSection.offsetHeight - window.innerHeight || 1;
  const rawProgress = clamp(-rect.top / scrollableDistance, 0, 1);

  const logoProgress = easeInOutCubic(clamp((rawProgress - 0.2) / 0.34, 0, 1));
  const textRevealProgress = easeInOutCubic(clamp((rawProgress - 0.14) / 0.28, 0, 1));
  const textExitProgress = easeInOutCubic(clamp((rawProgress - 0.5) / 0.22, 0, 1));
  const videoRevealProgress = easeInOutCubic(clamp((rawProgress - 0.52) / 0.25, 0, 1));
  const videoExitProgress = easeInOutCubic(clamp((rawProgress - 0.84) / 0.16, 0, 1));

const logoOpacity = 1 - logoProgress;

preshowLogo.style.opacity = `${logoOpacity}`;
preshowLogo.style.filter = `blur(${logoProgress * 7}px)`;
  preshowLogo.style.transform = `
    translateX(-50%)
    translateY(${-logoProgress * 70}px)
    scale(${1 - logoProgress * 0.08})
  `;

  const textOpacity = textRevealProgress * (1 - textExitProgress);
  const textY = 120 - textRevealProgress * 120 - textExitProgress * 80;
  const textScale = 0.97 + textRevealProgress * 0.03 - textExitProgress * 0.03;
  const textBlur = (1 - textRevealProgress) * 12 + textExitProgress * 8;

  preshowText.style.opacity = `${textOpacity}`;
  preshowText.style.filter = `blur(${textBlur}px)`;
  preshowText.style.transform = `
    translateY(${textY}px)
    scale(${textScale})
  `;

  const videoOpacity = videoRevealProgress * (1 - videoExitProgress);
  const videoY = 120 - videoRevealProgress * 120 - videoExitProgress * 90;
  const videoScale = 0.9 + videoRevealProgress * 0.1 - videoExitProgress * 0.04;

  preshowVideoReveal.style.opacity = `${videoOpacity}`;
  preshowVideoReveal.style.filter = `blur(${(1 - videoRevealProgress) * 10 + videoExitProgress * 8}px)`;
  preshowVideoReveal.style.transform = `
    translate(-50%, -50%)
    translateY(${videoY}px)
    scale(${videoScale})
  `;

  preshowVideoReveal.style.pointerEvents = videoOpacity > 0.6 ? "auto" : "none";
}

window.addEventListener("scroll", updatePreshowScroll);
window.addEventListener("resize", updatePreshowScroll);
window.addEventListener("load", updatePreshowScroll);
updatePreshowScroll();

/* EDITORIAL ROLLOUT CARDS */
/* EDITORIAL ROLLOUT CARDS + DYNAMIC HEADLINE */

const scrollCards = document.querySelectorAll(".scroll-card");
const dynamicWord = document.querySelector(".dynamic-word");

let currentDynamicWord = "";

const updateDynamicHeadline = (card) => {
  if (!dynamicWord || !card) return;

  const newWord = card.dataset.word;
  const newColor = card.dataset.color;

  if (!newWord || newWord === currentDynamicWord) return;

  currentDynamicWord = newWord;
  dynamicWord.classList.add("is-changing");

  setTimeout(() => {
    dynamicWord.textContent = newWord;
    dynamicWord.style.color = newColor || "#e11d2e";
    dynamicWord.classList.remove("is-changing");
  }, 160);
};

const rolloutObserver = new IntersectionObserver(
  (entries) => {
    const visibleCards = entries
      .filter((entry) => entry.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

    entries.forEach((entry) => {
      entry.target.classList.toggle("is-visible", entry.isIntersecting);
    });

    if (visibleCards.length > 0) {
      updateDynamicHeadline(visibleCards[0].target);
    }
  },
  {
    threshold: [0.2, 0.35, 0.5, 0.65],
    rootMargin: "-15% 0px -30% 0px",
  }
);

scrollCards.forEach((card) => rolloutObserver.observe(card));

if (scrollCards.length > 0) {
  updateDynamicHeadline(scrollCards[0]);
}
/* PLAYLIST CAROUSEL */

const playlistCarousels = document.querySelectorAll(".playlist-carousel");
playlistCarousels.forEach((carousel) => {
  const carouselSections = carousel.querySelectorAll(".carousel-section");
  const carouselDots = carousel.querySelectorAll(".carousel-dot");
  const totalSlides = carouselDots.length;
  let currentSlide = 0;
  let autoplayTimer;

  const updateCarousel = (index) => {
    currentSlide = index % totalSlides;
    
    carouselSections.forEach((section, i) => {
      section.classList.toggle("active", i === currentSlide);
    });
    
    carouselDots.forEach((dot, i) => {
      dot.classList.toggle("active", i === currentSlide);
    });
  };

  const nextSlide = () => {
    updateCarousel(currentSlide + 1);
  };

  const startAutoplay = () => {
    autoplayTimer = setInterval(nextSlide, 3000);
  };

  const resetAutoplay = () => {
    clearInterval(autoplayTimer);
    startAutoplay();
  };

  // Dot click handlers
  carouselDots.forEach((dot, index) => {
    dot.addEventListener("click", () => {
      updateCarousel(index);
      resetAutoplay();
    });
  });

  // Pause autoplay on hover
  carousel.addEventListener("mouseenter", () => {
    clearInterval(autoplayTimer);
  });

  carousel.addEventListener("mouseleave", () => {
    startAutoplay();
  });

  // Initialize with first section active
  if (carouselSections.length > 0) {
    carouselSections[0].classList.add("active");
    if (carouselDots.length > 0) {
      carouselDots[0].classList.add("active");
    }
  }

  startAutoplay();
});

// Card Slider Navigation (for internal slide toggles within a single card)
const cardSliders = document.querySelectorAll(".card-slider");
cardSliders.forEach((slider) => {
  const slides = slider.querySelectorAll(".card-slide");
  const prevBtn = slider.querySelector(".card-slide-prev");
  const nextBtn = slider.querySelector(".card-slide-next");
  let currentSlide = 0;

  const updateSlide = (index) => {
    currentSlide = index % slides.length;
    slides.forEach((slide, i) => {
      slide.classList.toggle("active", i === currentSlide);
    });
  };

  if (prevBtn) {
    prevBtn.addEventListener("click", () => {
      updateSlide(currentSlide - 1 + slides.length);
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener("click", () => {
      updateSlide(currentSlide + 1);
    });
  }
});
data-color