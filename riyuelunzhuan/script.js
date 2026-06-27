const canvas = document.getElementById("webgl-canvas");
const ctx = canvas.getContext("2d", { alpha: false });
const scriptUrl = document.currentScript?.src || document.baseURI;
const resolveAssetUrl = (path) => new URL(path, scriptUrl).href;
const embeddedStage = canvas.closest(".sun-cycle-stage");
const sunIntroMask = document.getElementById("sunIntroMask");
const sunMaskCursorGlow = document.getElementById("sunMaskCursorGlow");
const sunMaskCursorDot = document.getElementById("sunMaskCursorDot");
const scrollGraph = document.querySelector(".scroll-graph");
const graphPath = scrollGraph?.querySelector(".path");
const graphCompleteLine = scrollGraph?.querySelector(".complete-line");
const graphFocalPoint = scrollGraph?.querySelector(".focal-point");
const graphPovScale = scrollGraph?.querySelector(".pov-scale");
const graphPovPan = scrollGraph?.querySelector(".pov-pan");
const graphDots = scrollGraph
  ? Array.from(scrollGraph.querySelectorAll(".dots circle"))
  : [];
const storyCards = Array.from(document.querySelectorAll(".story-card"));
const chartAnchor = document.querySelector(".scroll-graph-anchor");
const chartTooltip = chartAnchor?.querySelector(".chart-tooltip");
const chartExpandButton = chartAnchor?.querySelector(".chart-expand-button");
const chartFlipButton = chartAnchor?.querySelector(".chart-flip-button");
const chartFront = chartAnchor?.querySelector(".chart-front");
const chartStoryBack = chartAnchor?.querySelector(".chart-story-back");
const chartStoryCollection = chartAnchor?.querySelector(".chart-story-collection");
const chartHotspots = scrollGraph
  ? Array.from(scrollGraph.querySelectorAll(".hotspot"))
  : [];
const scrollLinkCue = document.querySelector(".scroll-link-cue");

if (!ctx) {
  canvas.style.background = "#06080f";
  throw new Error("Canvas 2D not supported");
}

let W = 0;
let H = 0;
let DPR = 1;
let horizonY = 0;
let oceanH = 0;
let maxScroll = 1;
let tgt = 0;
let smooth = 0;
let velocity = 0;
let resizeRAF = 0;
let introMaskScroll = 0;
let graphPathLength = 0;
let chartTooltipPinned = false;
let chartExpanded = false;
let chartFlipped = false;
let chartTransition = null;
let maskMouseX = 0;
let maskMouseY = 0;
let maskGlowX = 0;
let maskGlowY = 0;

const SUN_CENTER_PROGRESS = 0.29;
const DAY_NIGHT_ROTATIONS = 6 + SUN_CENTER_PROGRESS;
const FINAL_SUN_HOLD_START = 0.94;
const SCROLL_DAY_ACCELERATION = 1.7;
const CHART_EXPAND_PROGRESS = 0.985;
const CHART_TRANSITION_DURATION = 520;
const INTRO_MASK_SCROLL_VIEWPORTS = 1.15;
const scrollEase = 0.1;
const CLOUD_X_OFFSET = -0.12;
const SUN_RADIUS_SCALE = 0.055;
const FINAL_STORY_HOLD_LOCAL = 0.88;
const STORY_CARD_MOBILE_BREAKPOINT = 980;
const GRAPH_REVEAL_STEP = 1.6;

const clamp01 = (value) => Math.max(0, Math.min(1, value));
const lerp = (a, b, t) => a + (b - a) * t;
const smootherstep = (t) => t * t * t * (t * (t * 6 - 15) + 10);
const lerpRGB = (a, b, t) => [
  lerp(a[0], b[0], t),
  lerp(a[1], b[1], t),
  lerp(a[2], b[2], t)
];
const rgb = (c, a = 1) =>
  `rgba(${c[0] | 0}, ${c[1] | 0}, ${c[2] | 0}, ${a})`;

const getEmbeddedStageStart = () => (embeddedStage ? embeddedStage.offsetTop : 0);

const getIntroMaskProgress = () => {
  if (!embeddedStage || !sunIntroMask || introMaskScroll <= 0) return 1;

  return clamp01((window.scrollY - getEmbeddedStageStart()) / introMaskScroll);
};

const updateSunIntroMask = () => {
  if (!embeddedStage || !sunIntroMask) return;

  const progress = getIntroMaskProgress();
  const opacity = 1 - smootherstep(progress);
  const stageStart = getEmbeddedStageStart();
  const viewportH = H || window.innerHeight || 1;
  const active =
    window.scrollY >= stageStart - viewportH &&
    window.scrollY <= stageStart + introMaskScroll &&
    opacity > 0.01;

  document.documentElement.style.setProperty("--sun-mask-opacity", opacity.toFixed(3));
  document.documentElement.style.setProperty(
    "--sun-mask-content-y",
    `${((1 - progress) * 18).toFixed(2)}px`
  );
  document.body.classList.toggle("sun-mask-active", active);
  sunIntroMask.setAttribute("aria-hidden", progress >= 0.995 ? "true" : "false");

  if (!active) {
    document.body.classList.remove("sun-mask-cursor-active");
  }
};

const setupSunMaskCursor = () => {
  if (!sunIntroMask || !sunMaskCursorGlow || !sunMaskCursorDot) return;

  document.addEventListener("mousemove", (event) => {
    maskMouseX = event.clientX;
    maskMouseY = event.clientY;
    sunMaskCursorDot.style.left = `${maskMouseX}px`;
    sunMaskCursorDot.style.top = `${maskMouseY}px`;

    if (document.body.classList.contains("sun-mask-active")) {
      document.body.classList.add("sun-mask-cursor-active");
    }
  });

  document.addEventListener("mouseleave", () => {
    document.body.classList.remove("sun-mask-cursor-active");
  });
};

const updateSunMaskCursor = () => {
  if (!sunMaskCursorGlow || !document.body.classList.contains("sun-mask-cursor-active")) {
    return;
  }

  maskGlowX += (maskMouseX - maskGlowX) * 0.06;
  maskGlowY += (maskMouseY - maskGlowY) * 0.06;
  sunMaskCursorGlow.style.left = `${maskGlowX}px`;
  sunMaskCursorGlow.style.top = `${maskGlowY}px`;
};

const hideChartTooltip = () => {
  if (!chartTooltip) return;

  chartTooltip.hidden = true;
  chartTooltipPinned = false;
};

const populateChartStoryBack = () => {
  if (!chartStoryCollection || !storyCards.length || chartStoryCollection.children.length) return;

  const story = storyCards
    .map((card) => card.querySelector("p")?.textContent?.trim() || "")
    .filter(Boolean)
    .join("");

  if (!story) return;

  const entry = document.createElement("article");
  entry.className = "chart-story-text";

  const paragraph = document.createElement("p");
  paragraph.textContent = story;
  entry.appendChild(paragraph);

  chartStoryCollection.appendChild(entry);
};

const updateChartFlipAvailability = () => {
  if (!chartFlipButton) return;

  const canFlip = chartExpanded;

  chartFlipButton.tabIndex = canFlip ? 0 : -1;

  if (!canFlip && document.activeElement === chartFlipButton) {
    chartFlipButton.blur();
  }
};

const setChartFlipped = (flipped) => {
  if (!chartAnchor || !chartFlipButton) return;

  chartFlipped = flipped && chartExpanded;
  chartAnchor.classList.toggle("is-flipped", chartFlipped);
  chartFlipButton.setAttribute("aria-pressed", chartFlipped ? "true" : "false");

  const label = chartFlipped ? "翻回图表" : "翻转查看文案合集";
  chartFlipButton.setAttribute("aria-label", label);
  chartFlipButton.setAttribute("title", label);
  chartFront?.setAttribute("aria-hidden", chartFlipped ? "true" : "false");
  chartStoryBack?.setAttribute("aria-hidden", chartFlipped ? "false" : "true");

  if (chartFlipped) hideChartTooltip();
};

const updateChartExpandAvailability = (scrollProgress) => {
  if (!chartAnchor || !chartExpandButton) return;

  const canExpand = chartExpanded || clamp01(scrollProgress) >= CHART_EXPAND_PROGRESS;

  chartAnchor.classList.toggle("can-expand", canExpand);
  chartExpandButton.tabIndex = canExpand ? 0 : -1;

  if (!canExpand && document.activeElement === chartExpandButton) {
    chartExpandButton.blur();
  }

  updateChartFlipAvailability();
  updateScrollLinkCue(scrollProgress);
};

const updateScrollLinkCue = (scrollProgress) => {
  if (!scrollLinkCue) return;

  const visible = !chartExpanded && clamp01(scrollProgress) >= CHART_EXPAND_PROGRESS;

  scrollLinkCue.classList.toggle("is-visible", visible);
  scrollLinkCue.setAttribute("aria-hidden", visible ? "false" : "true");
};

const applyChartFullscreenState = (expanded) => {
  if (!chartAnchor || !chartExpandButton) return;

  chartExpanded = expanded;
  chartAnchor.classList.toggle("is-fullscreen", expanded);
  document.body.classList.toggle("chart-expanded", expanded);
  chartExpandButton.setAttribute("aria-expanded", expanded ? "true" : "false");

  const label = expanded ? "退出全页面图表" : "放大图表到全页面";
  chartExpandButton.setAttribute("aria-label", label);
  chartExpandButton.setAttribute("title", label);

  if (!expanded) setChartFlipped(false);
  updateChartFlipAvailability();
  updateChartExpandAvailability(getStoryScrollProgress());
};

const finishChartFullscreenState = (expanded) => {
  if (expanded) {
    chartExpandButton?.focus({ preventScroll: true });
  } else if (chartAnchor) {
    chartAnchor.scrollLeft = 0;
    chartAnchor.scrollTop = 0;
  }
};

const animateChartLayoutChange = (fromRect, prefersReducedMotion) => {
  if (!chartAnchor || prefersReducedMotion) {
    return Promise.resolve();
  }

  const toRect = chartAnchor.getBoundingClientRect();
  const scaleX = fromRect.width / Math.max(1, toRect.width);
  const scaleY = fromRect.height / Math.max(1, toRect.height);
  const deltaX = fromRect.left - toRect.left;
  const deltaY = fromRect.top - toRect.top;

  if (!Number.isFinite(scaleX) || !Number.isFinite(scaleY)) {
    return Promise.resolve();
  }

  if (Math.abs(deltaX) < 0.5 && Math.abs(deltaY) < 0.5 && Math.abs(scaleX - 1) < 0.002 && Math.abs(scaleY - 1) < 0.002) {
    return Promise.resolve();
  }

  const invertedTransform = `translate(${deltaX}px, ${deltaY}px) scale(${scaleX}, ${scaleY})`;

  chartAnchor.style.transition = "none";
  chartAnchor.style.transformOrigin = "top left";
  chartAnchor.style.transform = invertedTransform;
  chartAnchor.getBoundingClientRect();

  return new Promise((resolve) => {
    let settled = false;

    const cleanup = () => {
      if (settled) return;

      settled = true;
      chartAnchor.removeEventListener("transitionend", onTransitionEnd);
      chartAnchor.style.transition = "";
      chartAnchor.style.transform = "";
      chartAnchor.style.transformOrigin = "";
      resolve();
    };

    const onTransitionEnd = (event) => {
      if (event.target === chartAnchor && event.propertyName === "transform") {
        cleanup();
      }
    };

    chartAnchor.addEventListener("transitionend", onTransitionEnd);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        chartAnchor.style.transition = `transform ${CHART_TRANSITION_DURATION}ms cubic-bezier(0.22, 1, 0.36, 1)`;
        chartAnchor.style.transform = "translate(0, 0) scale(1, 1)";
        window.setTimeout(cleanup, CHART_TRANSITION_DURATION + 120);
      });
    });
  });
};

const setChartFullscreen = (expanded) => {
  if (!chartAnchor || !chartExpandButton || chartTransition) return;
  if (chartExpanded === expanded) return;

  velocity = 0;
  hideChartTooltip();

  const progress = clamp01(getStoryScrollProgress());
  tgt = progress;
  smooth = progress;
  updateScrollGraph(progress);

  const prefersReducedMotion =
    window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;
  const canUseViewTransition =
    typeof document.startViewTransition === "function" && !prefersReducedMotion;

  const currentRect = chartAnchor.getBoundingClientRect();
  const fromRect = {
    height: currentRect.height,
    left: currentRect.left,
    top: currentRect.top,
    width: currentRect.width
  };

  if (!canUseViewTransition) {
    applyChartFullscreenState(expanded);
    chartTransition = animateChartLayoutChange(fromRect, prefersReducedMotion);
    chartTransition.then(() => {
      chartTransition = null;
      finishChartFullscreenState(expanded);
    });
    return;
  }

  chartTransition = document.startViewTransition(() => {
    applyChartFullscreenState(expanded);
  });

  chartTransition.finished
    .catch(() => {})
    .then(() => {
      chartTransition = null;
      finishChartFullscreenState(expanded);
    });
};

const setupChartExpand = () => {
  if (!chartExpandButton) return;

  chartExpandButton.tabIndex = -1;
  chartExpandButton.addEventListener("click", (event) => {
    event.stopPropagation();
    setChartFullscreen(!chartExpanded);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && chartExpanded) {
      setChartFullscreen(false);
    }
  });

  updateChartExpandAvailability(getStoryScrollProgress());
};

const setupChartFlip = () => {
  if (!chartFlipButton) return;

  populateChartStoryBack();
  chartFlipButton.tabIndex = -1;
  chartFlipButton.addEventListener("click", (event) => {
    event.stopPropagation();
    if (!chartExpanded) return;
    setChartFlipped(!chartFlipped);
  });

  updateChartFlipAvailability();
};

const showChartTooltip = (hotspot, clientX, clientY, pin = false) => {
  if (!chartAnchor || !chartTooltip || !hotspot) return;

  const yearEl = chartTooltip.querySelector(".tooltip-year");
  const valueEl = chartTooltip.querySelector(".tooltip-value");
  const noteEl = chartTooltip.querySelector(".tooltip-note");
  const sourceEl = chartTooltip.querySelector(".tooltip-source");
  const note = hotspot.dataset.note || "";
  const source = hotspot.dataset.source || "";

  yearEl.textContent = hotspot.dataset.year;
  valueEl.textContent = hotspot.dataset.value;
  noteEl.textContent = note;
  noteEl.hidden = !note;
  sourceEl.textContent = source ? `来源：${source}` : "";
  sourceEl.hidden = !source;
  chartTooltip.hidden = false;
  chartTooltipPinned = pin || chartTooltipPinned;

  const anchorRect = chartAnchor.getBoundingClientRect();
  const tooltipRect = chartTooltip.getBoundingClientRect();
  const pad = 8;
  let x = clientX - anchorRect.left + 12;
  let y = clientY - anchorRect.top - tooltipRect.height - 12;

  if (y < pad) y = clientY - anchorRect.top + 12;

  x = Math.max(pad, Math.min(anchorRect.width - tooltipRect.width - pad, x));
  y = Math.max(pad, Math.min(anchorRect.height - tooltipRect.height - pad, y));

  chartTooltip.style.left = `${x}px`;
  chartTooltip.style.top = `${y}px`;
};

const setupChartHotspots = () => {
  if (!chartAnchor || !chartTooltip || !chartHotspots.length) return;

  chartHotspots.forEach((hotspot) => {
    hotspot.addEventListener("mouseenter", (event) => {
      chartTooltipPinned = false;
      showChartTooltip(hotspot, event.clientX, event.clientY);
    });

    hotspot.addEventListener("mousemove", (event) => {
      if (!chartTooltipPinned) showChartTooltip(hotspot, event.clientX, event.clientY);
    });

    hotspot.addEventListener("mouseleave", () => {
      if (!chartTooltipPinned) hideChartTooltip();
    });

    hotspot.addEventListener("focus", () => {
      const rect = hotspot.getBoundingClientRect();
      showChartTooltip(hotspot, rect.left + rect.width / 2, rect.top + rect.height / 2, true);
    });

    hotspot.addEventListener("click", (event) => {
      event.stopPropagation();
      showChartTooltip(hotspot, event.clientX, event.clientY, true);
    });

    hotspot.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;

      event.preventDefault();
      const rect = hotspot.getBoundingClientRect();
      showChartTooltip(hotspot, rect.left + rect.width / 2, rect.top + rect.height / 2, true);
    });
  });

  chartAnchor.addEventListener("mouseleave", () => {
    if (!chartTooltipPinned) hideChartTooltip();
  });

  document.addEventListener("pointerdown", (event) => {
    if (!chartAnchor.contains(event.target)) hideChartTooltip();
  });
};

const getGraphRevealedPath = (measurePath, endLength) => {
  const focus = measurePath.getPointAtLength(endLength);
  const segmentLength = Math.max(0, endLength);

  if (segmentLength <= 0.01) {
    return `M${focus.x.toFixed(3)} ${focus.y.toFixed(3)}`;
  }

  const steps = Math.max(2, Math.ceil(segmentLength / GRAPH_REVEAL_STEP));
  const points = [];

  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    const point = measurePath.getPointAtLength(lerp(0, endLength, t));
    points.push(`${i === 0 ? "M" : "L"}${point.x.toFixed(3)} ${point.y.toFixed(3)}`);
  }

  return points.join("");
};

const setupScrollGraph = () => {
  if (!scrollGraph || !graphPath || !graphFocalPoint || !graphPovScale || !graphPovPan) {
    return;
  }

  const graphMeasurePath = graphCompleteLine || graphPath;
  graphPathLength = graphMeasurePath.getTotalLength();
  graphPath.style.strokeDasharray = "none";
  graphPath.style.strokeDashoffset = "0";

  updateScrollGraph(0);
};

const getStoryScrollProgress = () => {
  const start = embeddedStage ? embeddedStage.offsetTop + introMaskScroll : 0;
  const progress = maxScroll > 0 ? (window.scrollY - start) / maxScroll : 0;

  return embeddedStage ? clamp01(progress) : progress;
};

const updateStoryCards = (scrollProgress) => {
  if (!storyCards.length) return;

  const p = clamp01(scrollProgress);
  const viewportH = H || window.innerHeight || 1;
  const chartBottom =
    parseFloat(
      getComputedStyle(document.documentElement).getPropertyValue("--chart-bottom")
    ) || 48;
  const mobileLayout =
    (typeof window.matchMedia === "function" &&
      window.matchMedia(`(max-width: ${STORY_CARD_MOBILE_BREAKPOINT}px)`).matches) ||
    window.innerWidth <= STORY_CARD_MOBILE_BREAKPOINT;
  const finalIndex = storyCards.length - 1;

  storyCards.forEach((card, index) => {
    const isFirstCard = index === 0;
    const isFinalCard = index === finalIndex;
    const fallbackStart = 0.03 + index * 0.12;
    const start = Number.parseFloat(card.dataset.start || fallbackStart);
    const rawEnd = Number.parseFloat(card.dataset.end || fallbackStart + 0.14);
    const end = Math.min(1, Math.max(start + 0.01, rawEnd));
    const local = clamp01((p - start) / (end - start));
    const active = isFinalCard ? p >= start : p >= start && p <= end;
    let targetY;
    let enterY;

    const chartRect = chartAnchor?.getBoundingClientRect();
    const cardHeight = card.offsetHeight || card.getBoundingClientRect().height || 300;

    if (mobileLayout) {
      enterY = viewportH * 1.08;
      if (isFinalCard) {
        targetY = chartRect
          ? Math.max(16, chartRect.top - cardHeight - 16)
          : viewportH * 0.48;
      } else {
        targetY = -viewportH * 0.68;
      }
    } else {
      if (isFinalCard) {
        enterY = chartBottom + cardHeight;
        targetY = 0;
      } else {
        enterY = isFirstCard ? 0 : chartBottom + cardHeight;
        targetY = chartBottom - viewportH;
      }
    }

    const motionLocal = isFinalCard
      ? clamp01(local / FINAL_STORY_HOLD_LOCAL)
      : local;
    const y = lerp(enterY, targetY, smootherstep(motionLocal));
    const fadeIn = isFirstCard || isFinalCard ? 1 : smootherstep(clamp01(local / 0.14));

    let fadeOut;
    if (isFinalCard || mobileLayout) {
      fadeOut = isFinalCard ? 1 : 1 - smootherstep(clamp01((local - 0.82) / 0.18));
    } else {
      const yTop = chartBottom + cardHeight - viewportH;
      fadeOut = 1 - smootherstep(clamp01((yTop - y) / cardHeight));
    }

    const opacity = active ? fadeIn * fadeOut : 0;

    card.style.setProperty("--story-scroll-y", `${y.toFixed(2)}px`);
    card.style.setProperty("--story-opacity", opacity.toFixed(3));

    card.classList.toggle("is-active", active && opacity > 0.01);
    card.setAttribute("aria-hidden", active ? "false" : "true");
  });
};

const updateScrollGraph = (scrollProgress) => {
  if (!graphPathLength || !scrollGraph || !graphPath || !graphFocalPoint || !graphPovScale || !graphPovPan) {
    return;
  }

  const p = clamp01(scrollProgress);
  const graphMeasurePath = graphCompleteLine || graphPath;
  const focusLength = graphPathLength * p;
  const focus = graphMeasurePath.getPointAtLength(focusLength);
  const scaleT = smootherstep(p);

  scrollGraph.style.opacity = "1";
  graphPath.setAttribute("d", getGraphRevealedPath(graphMeasurePath, focusLength));
  if (graphCompleteLine) {
    graphCompleteLine.style.opacity = "0";
  }
  graphFocalPoint.setAttribute("cx", focus.x.toFixed(3));
  graphFocalPoint.setAttribute("cy", focus.y.toFixed(3));
  graphPovPan.setAttribute("transform", `translate(${-focus.x.toFixed(3)} ${-focus.y.toFixed(3)})`);
  graphPovScale.setAttribute(
    "transform",
    `translate(${lerp(87.111, focus.x, scaleT).toFixed(3)} ${lerp(50, focus.y, scaleT).toFixed(3)}) scale(${lerp(2, 1, scaleT).toFixed(3)})`
  );

  graphDots.forEach((dot, index) => {
    const dotStart = 0.12 + index * 0.075;
    const dotT = smootherstep(clamp01((p - dotStart) / 0.07));
    dot.setAttribute("r", (1.5 * dotT).toFixed(3));
  });
};

const getDayNightProgress = (scrollProgress) => {
  const s = clamp01(scrollProgress);
  const activeScroll = clamp01(s / FINAL_SUN_HOLD_START);
  const accelerated =
    (activeScroll + SCROLL_DAY_ACCELERATION * activeScroll * activeScroll) /
    (1 + SCROLL_DAY_ACCELERATION);
  const rotations = accelerated * DAY_NIGHT_ROTATIONS;

  if (s >= FINAL_SUN_HOLD_START) return SUN_CENTER_PROGRESS;

  return rotations - Math.floor(rotations);
};

const KEYS = [
  {
    t: 0.0,
    skyTop: [9, 13, 32],
    skyHor: [46, 56, 96],
    sun: [228, 234, 255],
    glow: [138, 162, 216],
    wFar: [30, 44, 78],
    wNear: [7, 17, 34],
    foam: [198, 210, 236],
    glit: 0.5,
    star: 0.82
  },
  {
    t: 0.08,
    skyTop: [24, 44, 92],
    skyHor: [148, 118, 124],
    sun: [248, 232, 205],
    glow: [255, 158, 100],
    wFar: [82, 88, 118],
    wNear: [14, 36, 64],
    foam: [228, 224, 226],
    glit: 0.58,
    star: 0.55
  },
  {
    t: 0.16,
    skyTop: [56, 96, 164],
    skyHor: [255, 186, 126],
    sun: [255, 238, 204],
    glow: [255, 184, 112],
    wFar: [156, 150, 150],
    wNear: [24, 66, 92],
    foam: [255, 244, 234],
    glit: 0.72,
    star: 0.14
  },
  {
    t: 0.3,
    skyTop: [70, 146, 214],
    skyHor: [190, 224, 238],
    sun: [255, 255, 248],
    glow: [255, 252, 232],
    wFar: [116, 188, 198],
    wNear: [18, 92, 116],
    foam: [255, 255, 255],
    glit: 0.48,
    star: 0
  },
  {
    t: 0.5,
    skyTop: [56, 142, 214],
    skyHor: [176, 216, 230],
    sun: [255, 255, 248],
    glow: [255, 252, 232],
    wFar: [96, 178, 188],
    wNear: [16, 96, 120],
    foam: [255, 255, 255],
    glit: 0.45,
    star: 0
  },
  {
    t: 0.64,
    skyTop: [78, 116, 184],
    skyHor: [255, 214, 146],
    sun: [255, 236, 194],
    glow: [255, 180, 96],
    wFar: [190, 170, 130],
    wNear: [30, 82, 104],
    foam: [255, 244, 228],
    glit: 0.9,
    star: 0.04
  },
  {
    t: 0.74,
    skyTop: [70, 62, 130],
    skyHor: [255, 142, 84],
    sun: [255, 206, 148],
    glow: [255, 112, 70],
    wFar: [184, 112, 100],
    wNear: [30, 42, 72],
    foam: [255, 222, 200],
    glit: 0.95,
    star: 0.28
  },
  {
    t: 0.84,
    skyTop: [28, 32, 72],
    skyHor: [116, 82, 104],
    sun: [236, 232, 236],
    glow: [154, 144, 196],
    wFar: [68, 62, 92],
    wNear: [14, 24, 50],
    foam: [210, 210, 228],
    glit: 0.66,
    star: 0.72
  },
  {
    t: 0.92,
    skyTop: [8, 12, 30],
    skyHor: [36, 48, 86],
    sun: [228, 234, 255],
    glow: [140, 164, 216],
    wFar: [28, 42, 76],
    wNear: [6, 16, 32],
    foam: [196, 208, 234],
    glit: 0.55,
    star: 0.88
  },
  {
    t: 1.0,
    skyTop: [9, 13, 32],
    skyHor: [46, 56, 96],
    sun: [228, 234, 255],
    glow: [138, 162, 216],
    wFar: [30, 44, 78],
    wNear: [7, 17, 34],
    foam: [198, 210, 236],
    glit: 0.5,
    star: 0.82
  }
];

const getPalette = (t) => {
  let i = 0;
  while (i < KEYS.length - 1 && t > KEYS[i + 1].t) i++;

  const a = KEYS[i];
  const b = KEYS[Math.min(i + 1, KEYS.length - 1)];
  const span = b.t - a.t || 1;
  const k = smootherstep(clamp01((t - a.t) / span));

  return {
    skyTop: lerpRGB(a.skyTop, b.skyTop, k),
    skyHor: lerpRGB(a.skyHor, b.skyHor, k),
    sun: lerpRGB(a.sun, b.sun, k),
    glow: lerpRGB(a.glow, b.glow, k),
    wFar: lerpRGB(a.wFar, b.wFar, k),
    wNear: lerpRGB(a.wNear, b.wNear, k),
    foam: lerpRGB(a.foam, b.foam, k),
    glit: lerp(a.glit, b.glit, k),
    star: lerp(a.star, b.star, k)
  };
};

const stars = Array.from({ length: 140 }, () => ({
  x: Math.random(),
  y: Math.random() * 0.4,
  r: Math.random() * 1.2 + 0.3,
  tw: Math.random() * Math.PI * 2
}));

const cloudImageSources = [
  resolveAssetUrl("../images/yunduoyi.png"),
  resolveAssetUrl("../images/yunduoer.png"),
  resolveAssetUrl("../images/yunduosan.png"),
  resolveAssetUrl("../images/yunduosi.png")
];

const cloudImages = cloudImageSources.map((src) => {
  const img = new Image();
  img.decoding = "async";
  img.src = src;
  return img;
});

const clouds = Array.from({ length: 6 }, (_, i) => ({
  imageIndex: i % cloudImages.length,
  x: i / 5 + Math.random() * 0.08,
  y: 0.05 + Math.random() * 0.18,
  w: 0.28 + Math.random() * 0.2,
  speed: 0.000012 + Math.random() * 0.000018,
  opacity: 0.35 + Math.random() * 0.18,
  mirror: i % 2 === 1
}));

const getSunPosition = (dayProgress) => {
  const sunProgress = clamp01(dayProgress / 0.58);
  const sunAngle = sunProgress * Math.PI;
  const arcX = Math.cos(sunAngle) * -0.75;
  const arcY = Math.sin(sunAngle) * 0.38 - 0.08;

  return {
    x: W * 0.5 + arcX * W * 0.44,
    y: horizonY - arcY * horizonY * 1.55,
    visible: arcY > -0.075
  };
};

const resize = () => {
  resizeRAF = 0;

  const vp = window.visualViewport ?? {
    width: window.innerWidth,
    height: window.innerHeight
  };

  W = Math.round(vp.width);
  H = Math.round(vp.height);

  if (!W || !H) return;

  DPR = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.max(1, Math.round(W * DPR));
  canvas.height = Math.max(1, Math.round(H * DPR));
  canvas.style.width = `${W}px`;
  canvas.style.height = `${H}px`;
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

  horizonY = H * 0.42;
  oceanH = H - horizonY;
  introMaskScroll = embeddedStage && sunIntroMask ? H * INTRO_MASK_SCROLL_VIEWPORTS : 0;
  maxScroll = embeddedStage
    ? Math.max(1, embeddedStage.offsetHeight - H - introMaskScroll)
    : Math.max(1, document.documentElement.scrollHeight - H);
  tgt = getStoryScrollProgress();
  updateSunIntroMask();
};

const requestResize = () => {
  if (!resizeRAF) resizeRAF = requestAnimationFrame(resize);
};

resize();
setupScrollGraph();
setupChartHotspots();
setupChartExpand();
setupChartFlip();
setupSunMaskCursor();
updateStoryCards(0);
window.setInterval(() => updateStoryCards(getStoryScrollProgress()), 160);

window.addEventListener("resize", requestResize, { passive: true });

if (window.visualViewport) {
  window.visualViewport.addEventListener("resize", requestResize, {
    passive: true
  });
}

window.addEventListener(
  "scroll",
  () => {
    tgt = getStoryScrollProgress();
    updateSunIntroMask();
    updateStoryCards(getStoryScrollProgress());
    updateChartExpandAvailability(getStoryScrollProgress());
    if (chartTooltip && !chartTooltip.hidden) hideChartTooltip();
  },
  { passive: true }
);

window.addEventListener(
  "wheel",
  (e) => {
    if (embeddedStage) {
      if (chartExpanded) {
        e.preventDefault();
        velocity = 0;
      }

      return;
    }

    e.preventDefault();

    if (chartExpanded) {
      velocity = 0;
      return;
    }

    const linePx = 16;
    const pagePx = window.innerHeight * 0.9;
    const delta =
      e.deltaMode === 1
        ? e.deltaY * linePx
        : e.deltaMode === 2
        ? e.deltaY * pagePx
        : e.deltaY;

    velocity += delta;
    velocity = Math.max(-520, Math.min(520, velocity));
  },
  { passive: false }
);

const drawStars = (P, T) => {
  if (P.star <= 0.01) return;

  for (const s of stars) {
    const tw = 0.5 + 0.5 * Math.sin(T * 2 + s.tw);
    ctx.fillStyle = rgb([255, 255, 255], P.star * tw * 0.9);
    ctx.beginPath();
    ctx.arc(s.x * W, s.y * horizonY, s.r, 0, Math.PI * 2);
    ctx.fill();
  }
};

const drawClouds = (P, T) => {
  for (const c of clouds) {
    const img = cloudImages[c.imageIndex];
    if (!img.complete || !img.naturalWidth || !img.naturalHeight) continue;

    c.x += c.speed;
    if (c.x > 1.3) c.x = -0.3;

    const cx = (c.x + CLOUD_X_OFFSET) * W;
    const cw = c.w * W;
    const ch = cw * (img.naturalHeight / img.naturalWidth);
    const cy = c.y * horizonY + Math.sin(T * 0.35 + c.imageIndex) * 3;
    const nightDim = lerp(1, 0.42, P.star);

    ctx.save();
    ctx.globalAlpha = c.opacity * nightDim;

    if (c.mirror) {
      ctx.translate(cx + cw, cy);
      ctx.scale(-1, 1);
      ctx.drawImage(img, 0, 0, cw, ch);
    } else {
      ctx.drawImage(img, cx, cy, cw, ch);
    }

    ctx.restore();
  }
};

const drawSun = (P, sun) => {
  if (sun.visible) {
    const glowR = Math.min(W, H) * 0.5;
    const g = ctx.createRadialGradient(sun.x, sun.y, 0, sun.x, sun.y, glowR);
    g.addColorStop(0, rgb(P.glow, 0.55));
    g.addColorStop(0.25, rgb(P.glow, 0.22));
    g.addColorStop(1, rgb(P.glow, 0));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, horizonY + oceanH * 0.4);

    const sunR = Math.min(W, H) * SUN_RADIUS_SCALE;
    const sd = ctx.createRadialGradient(sun.x, sun.y, 0, sun.x, sun.y, sunR);
    sd.addColorStop(0, rgb(P.sun, 1));
    sd.addColorStop(0.7, rgb(P.sun, 0.95));
    sd.addColorStop(1, rgb(P.sun, 0.2));
    ctx.fillStyle = sd;
    ctx.beginPath();
    ctx.arc(sun.x, sun.y, sunR, 0, Math.PI * 2);
    ctx.fill();
  }
};

const drawSky = (P, sun, T) => {
  const sky = ctx.createLinearGradient(0, 0, 0, horizonY + oceanH * 0.1);
  sky.addColorStop(0, rgb(P.skyTop));
  sky.addColorStop(0.7, rgb(lerpRGB(P.skyTop, P.skyHor, 0.55)));
  sky.addColorStop(1, rgb(P.skyHor));
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, horizonY + 2);

  drawStars(P, T);
  drawClouds(P, T);
  drawSun(P, sun);

  const haze = ctx.createLinearGradient(0, horizonY - 40, 0, horizonY + 40);
  haze.addColorStop(0, rgb(P.skyHor, 0));
  haze.addColorStop(0.5, rgb(P.skyHor, 0.45));
  haze.addColorStop(1, rgb(P.wFar, 0));
  ctx.fillStyle = haze;
  ctx.fillRect(0, horizonY - 40, W, 80);
};

const drawOcean = (P, sun, T) => {
  const waveCount = 26;

  for (let i = 0; i < waveCount; i++) {
    const depth = i / (waveCount - 1);
    const yTop = horizonY + Math.pow(depth, 1.9) * oceanH;
    const amp = lerp(0.6, 30, depth);
    const wlen = lerp(46, 340, depth);
    const speed = lerp(0.25, 0.9, depth);
    const phase = T * speed + i * 0.9;
    const col = lerpRGB(P.wFar, P.wNear, depth);

    ctx.beginPath();
    ctx.moveTo(0, H);
    ctx.lineTo(0, yTop + Math.sin(phase) * amp);

    for (let x = 0; x <= W; x += 6) {
      const y =
        yTop +
        Math.sin(x / wlen + phase) * amp +
        Math.sin(x / (wlen * 0.4) + phase * 1.6) * amp * 0.3;
      ctx.lineTo(x, y);
    }

    ctx.lineTo(W, H);
    ctx.closePath();
    ctx.fillStyle = rgb(col);
    ctx.fill();

    ctx.lineWidth = lerp(0.6, 2.2, depth);
    ctx.beginPath();

    let started = false;
    for (let x = 0; x <= W; x += 6) {
      const y =
        yTop +
        Math.sin(x / wlen + phase) * amp +
        Math.sin(x / (wlen * 0.4) + phase * 1.6) * amp * 0.3;
      if (started) ctx.lineTo(x, y);
      else {
        ctx.moveTo(x, y);
        started = true;
      }
    }

    ctx.strokeStyle = rgb(lerpRGB(col, P.sun, 0.55), lerp(0.05, 0.3, depth));
    ctx.stroke();

    if (depth > 0.62) {
      const foamA = (depth - 0.62) / 0.38;
      for (let x = 0; x <= W; x += 9) {
        const y =
          yTop +
          Math.sin(x / wlen + phase) * amp +
          Math.sin(x / (wlen * 0.4) + phase * 1.6) * amp * 0.3;
        const crest = Math.sin(x / wlen + phase);

        if (crest > 0.55 && Math.random() > 0.45) {
          ctx.fillStyle = rgb(P.foam, foamA * (0.18 + Math.random() * 0.35));
          ctx.fillRect(
            x + (Math.random() - 0.5) * 6,
            y - Math.random() * 3,
            1.5 + Math.random() * 3,
            1.5 + Math.random() * 2
          );
        }
      }
    }
  }

  if (sun.visible) {
    for (let i = 0; i < 220; i++) {
      const dy = Math.random();
      const y = horizonY + Math.pow(dy, 1.5) * oceanH;
      const spread = lerp(6, W * 0.3, dy);
      const x = sun.x + (Math.random() - 0.5) * 2 * spread;
      const distFade = 1 - Math.min(1, Math.abs(x - sun.x) / (spread + 1));
      const flick = 0.25 + Math.random() * 0.75;
      const a = distFade * distFade * flick * P.glit * (1 - dy * 0.25);

      if (a < 0.02) continue;

      ctx.fillStyle = rgb(P.sun, a * 0.85);
      ctx.fillRect(x, y, 1 + Math.random() * (2 + dy * 4), 1 + dy);
    }
  }

};

const drawVignette = () => {
  const vig = ctx.createRadialGradient(
    W / 2,
    H * 0.55,
    H * 0.25,
    W / 2,
    H * 0.55,
    H * 0.9
  );
  vig.addColorStop(0, "rgba(0, 0, 0, 0)");
  vig.addColorStop(1, "rgba(0, 0, 8, 0.34)");
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, W, H);
};

let T = 0;
let lastNow = performance.now();

const frame = (now) => {
  requestAnimationFrame(frame);

  const dt = Math.min((now - lastNow) * 0.001, 0.033);
  lastNow = now;
  const introMaskComplete = !embeddedStage || !sunIntroMask || getIntroMaskProgress() >= 0.995;
  if (introMaskComplete) {
    T += dt;
  } else {
    T = 0;
  }

  velocity *= Math.pow(0.86, dt * 60);
  if (Math.abs(velocity) < 0.02) velocity = 0;

  if (velocity !== 0) {
    window.scrollBy({
      top: velocity * scrollEase,
      behavior: "auto"
    });
  }

  smooth += (tgt - smooth) * (1 - Math.exp(-dt * 8));
  updateSunIntroMask();
  updateSunMaskCursor();

  const dayProgress = getDayNightProgress(smooth);
  const P = getPalette(dayProgress);
  const sun = getSunPosition(dayProgress);

  drawSky(P, sun, T);
  drawOcean(P, sun, T);
  drawVignette();
  updateScrollGraph(smooth);
  updateStoryCards(getStoryScrollProgress());
  updateChartExpandAvailability(getStoryScrollProgress());
};

requestAnimationFrame(frame);
