const stage = document.querySelector(".scroll-stage");
const container = document.getElementById("comparison");
const beforeImage = container?.querySelector(".image-before");
const sliderDivider = document.getElementById("sliderDivider");
const titleOverlay = document.getElementById("titleOverlay");
const scrollHint = document.getElementById("scrollHint");
const sunCycleStage = document.getElementById("sunCycleStage");
const root = document.documentElement;
const body = document.body;

if (stage && container && beforeImage && sliderDivider && titleOverlay && scrollHint) {
  let ticking = false;

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function getViewportHeight() {
    return window.visualViewport?.height || window.innerHeight || 1;
  }

  function updateSlider(visibleBeforePct) {
    const position = clamp(visibleBeforePct, 0, 100);
    const featherPct = 8;
    const fadeStart = clamp(position - featherPct, 0, 100);
    const fadeEnd = clamp(position + featherPct, 0, 100);
    let beforeMask = `linear-gradient(to right, black 0%, black ${fadeStart}%, transparent ${fadeEnd}%, transparent 100%)`;

    if (position <= 0) {
      beforeMask = "linear-gradient(to right, transparent 0%, transparent 100%)";
    }

    if (position >= 100) {
      beforeMask = "linear-gradient(to right, black 0%, black 100%)";
    }

    beforeImage.style.maskImage = beforeMask;
    beforeImage.style.webkitMaskImage = beforeMask;
    sliderDivider.style.left = `${position}%`;

    const dividerFade = position > 0 && position < 100 ? 1 : 0;
    sliderDivider.style.opacity = dividerFade.toFixed(3);
  }

  function updateTitle(progress) {
    const titleProgress = clamp(progress / 0.5, 0, 1);
    const lift = (1 - titleProgress) * 18;
    const blur = (1 - titleProgress) * 8;
    const scale = 0.94 + titleProgress * 0.06;

    titleOverlay.style.opacity = titleProgress.toFixed(3);
    titleOverlay.style.filter = `blur(${blur.toFixed(2)}px)`;
    titleOverlay.style.transform = `translate(-50%, calc(-50% + ${lift.toFixed(2)}px)) scale(${scale.toFixed(3)})`;
  }

  function updateScene() {
    const viewportHeight = getViewportHeight();
    const maxScroll = Math.max(1, stage.offsetHeight - viewportHeight);
    const exitScroll = Math.min(viewportHeight, maxScroll * 0.45);
    const revealScroll = Math.max(1, maxScroll - exitScroll);
    const currentScroll = clamp(window.scrollY, 0, maxScroll);
    const revealProgress = clamp(currentScroll / revealScroll, 0, 1);
    const exitProgress = clamp((currentScroll - revealScroll) / exitScroll, 0, 1);
    const visibleBeforePct = 100 - revealProgress * 100;
    const homeExitY = exitProgress * viewportHeight;
    const sunEntryY = (exitProgress - 1) * viewportHeight;

    updateSlider(visibleBeforePct);
    updateTitle(revealProgress);
    container.style.setProperty("--home-exit-y", `${homeExitY.toFixed(2)}px`);
    container.style.setProperty("--home-exit-opacity", exitProgress >= 0.995 ? "0" : "1");
    root.style.setProperty("--sun-entry-y", `${sunEntryY.toFixed(2)}px`);
    root.style.setProperty("--sun-entry-opacity", exitProgress > 0.001 ? "1" : "0");
    body.classList.toggle("home-intro-hidden", exitProgress >= 0.995);
    body.classList.toggle("sun-cycle-ready", exitProgress >= 0.995);
    body.classList.toggle("sun-cycle-entering", exitProgress > 0.001 && exitProgress < 0.995);
    scrollHint.classList.toggle("hidden", currentScroll / revealScroll > 0.02);

    if (sunCycleStage) {
      sunCycleStage.toggleAttribute("data-entered", exitProgress >= 0.995);
    }
  }

  function requestSceneUpdate() {
    if (ticking) return;

    ticking = true;
    requestAnimationFrame(() => {
      updateScene();
      ticking = false;
    });
  }

  window.addEventListener("scroll", requestSceneUpdate, { passive: true });
  window.addEventListener("resize", requestSceneUpdate);
  window.addEventListener("load", updateScene);

  updateScene();
}

const chapterTransitionMask = document.getElementById("chapterTransitionMask");
const timeTransitionLink = document.getElementById("time-transition-link");
const chapterScrollTrigger = document.getElementById("chapterScrollTrigger");

if (chapterTransitionMask && timeTransitionLink) {
  const BOTTOM_TRIGGER_DELTA = 220;
  const TRANSITION_DELAY = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 180 : 920;
  const BOTTOM_EPSILON = 4;
  const HOME_RETURN_HASH = "home-before-time-transition";
  const FIRST_BATCH_HASH = "first-batch-base-link";
  const CHAPTER_ONE_HASH = "chapter-1";
  const TRIGGER_ZONE_RATIO = 0.45;
  const DOWN_KEYS = new Set(["ArrowDown", "PageDown", " ", "End"]);
  let bottomScrollIntent = 0;
  let transitionStarted = false;
  let returnAnchorPositioned = false;
  let lastTouchY = null;

  function getPageViewportHeight() {
    return window.visualViewport?.height || window.innerHeight || 1;
  }

  function getBottomDistance() {
    const scrollHeight = Math.max(
      document.body.scrollHeight,
      document.documentElement.scrollHeight
    );
    return scrollHeight - window.scrollY - getPageViewportHeight();
  }

  function isViewportAtBottom() {
    return getBottomDistance() <= BOTTOM_EPSILON;
  }

  function resetBottomIntent() {
    bottomScrollIntent = 0;
  }

  function clampValue(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function getHashId() {
    try {
      return decodeURIComponent(window.location.hash.replace(/^#/, ""));
    } catch {
      return window.location.hash.replace(/^#/, "");
    }
  }

  let firstBatchPositioned = false;

  function getChapterOneTop() {
    if (!sunCycleStage) return null;

    return Math.max(0, sunCycleStage.offsetTop);
  }

  window.scrollToHomeChapterOne = function (options = {}) {
    const targetTop = getChapterOneTop();
    if (targetTop === null) return false;

    window.scrollTo({
      top: targetTop,
      behavior: options.behavior || "auto"
    });
    resetBottomIntent();
    return true;
  };

  function positionToChapterOne() {
    if (getHashId() !== CHAPTER_ONE_HASH) return;

    window.scrollToHomeChapterOne({ behavior: "auto" });
  }

  function positionToFirstBatchLink() {
    if (getHashId() !== FIRST_BATCH_HASH) {
      firstBatchPositioned = true;
      return;
    }

    if (!sunCycleStage) {
      firstBatchPositioned = true;
      return;
    }

    const viewportHeight = getPageViewportHeight();
    const INTRO_MASK_SCROLL_VIEWPORTS = 1.15;
    const introMaskScroll = viewportHeight * INTRO_MASK_SCROLL_VIEWPORTS;
    const stageTop = sunCycleStage.offsetTop;
    const stageHeight = sunCycleStage.offsetHeight;
    const maxScroll = Math.max(1, stageHeight - viewportHeight - introMaskScroll);
    const targetProgress = 0.91;
    const targetScrollY = Math.max(0, stageTop + introMaskScroll + targetProgress * maxScroll);

    window.scrollTo({ top: targetScrollY, behavior: "auto" });
    resetBottomIntent();
    firstBatchPositioned = true;
  }

  function positionBeforeChapterTransition() {
    if (getHashId() !== HOME_RETURN_HASH || !chapterScrollTrigger) {
      returnAnchorPositioned = true;
      return;
    }

    const viewportHeight = getPageViewportHeight();
    const triggerTop = chapterScrollTrigger.getBoundingClientRect().top + window.scrollY;
    const targetTop = Math.max(0, triggerTop - viewportHeight * 0.82);

    window.scrollTo({ top: targetTop, behavior: "auto" });
    resetBottomIntent();
    returnAnchorPositioned = true;
  }

  function getTriggerZoneProgress() {
    if (!chapterScrollTrigger) return 0;

    const rect = chapterScrollTrigger.getBoundingClientRect();
    const viewportHeight = getPageViewportHeight();
    const triggerDistance = Math.max(1, viewportHeight * TRIGGER_ZONE_RATIO);

    return clampValue(
      (viewportHeight - rect.top) / triggerDistance,
      0,
      1
    );
  }

  function shouldIgnoreChapterTransition(event) {
    const target = event?.target;
    const isChartExpanded = body.classList.contains("chart-expanded");
    const isInsideFullscreenChart =
      typeof target?.closest === "function" &&
      target.closest(".scroll-graph-anchor.is-fullscreen, .chart-story-back-scroll");

    return isChartExpanded || Boolean(isInsideFullscreenChart);
  }

  function startChapterTransition() {
    if (transitionStarted) return;

    transitionStarted = true;
    resetBottomIntent();
    chapterTransitionMask.classList.add("is-active");

    window.setTimeout(() => {
      timeTransitionLink.click();
    }, TRANSITION_DELAY);
  }

  function checkChapterScrollTrigger(event) {
    if (transitionStarted || shouldIgnoreChapterTransition(event)) return;
    if ((getHashId() === HOME_RETURN_HASH && !returnAnchorPositioned) || (getHashId() === FIRST_BATCH_HASH && !firstBatchPositioned)) return;

    if (getTriggerZoneProgress() >= 1) {
      startChapterTransition();
    }
  }

  function normalizeWheelDelta(event) {
    const linePx = 16;
    const pagePx = getPageViewportHeight() * 0.9;

    if (event.deltaMode === 1) return event.deltaY * linePx;
    if (event.deltaMode === 2) return event.deltaY * pagePx;
    return event.deltaY;
  }

  function registerBottomScrollIntent(deltaY, event) {
    if (transitionStarted || shouldIgnoreChapterTransition(event)) return;

    if (deltaY <= 0 || !isViewportAtBottom()) {
      resetBottomIntent();
      return;
    }

    event?.preventDefault?.();
    bottomScrollIntent += Math.min(deltaY, 140);

    if (bottomScrollIntent >= BOTTOM_TRIGGER_DELTA) {
      startChapterTransition();
    }
  }

  window.addEventListener(
    "wheel",
    (event) => {
      registerBottomScrollIntent(normalizeWheelDelta(event), event);
    },
    { passive: false }
  );

  window.addEventListener(
    "touchstart",
    (event) => {
      lastTouchY = event.touches?.[0]?.clientY ?? null;
    },
    { passive: true }
  );

  window.addEventListener(
    "touchmove",
    (event) => {
      const currentY = event.touches?.[0]?.clientY ?? null;

      if (currentY === null || lastTouchY === null) {
        lastTouchY = currentY;
        return;
      }

      const deltaY = lastTouchY - currentY;
      lastTouchY = currentY;
      registerBottomScrollIntent(deltaY, event);
    },
    { passive: false }
  );

  window.addEventListener("keydown", (event) => {
    const target = event.target;
    const isEditable =
      target?.isContentEditable ||
      ["INPUT", "TEXTAREA", "SELECT"].includes(target?.tagName || "");

    if (isEditable || !DOWN_KEYS.has(event.key) || !isViewportAtBottom()) return;

    event.preventDefault();
    startChapterTransition();
  });

  window.addEventListener(
    "scroll",
    (event) => {
      if (!isViewportAtBottom()) resetBottomIntent();
      checkChapterScrollTrigger(event);
    },
    { passive: true }
  );

  window.addEventListener("resize", resetBottomIntent);
  window.addEventListener("load", () => {
    positionToChapterOne();
    positionBeforeChapterTransition();
    positionToFirstBatchLink();
    window.setTimeout(positionToChapterOne, 120);
    window.setTimeout(positionBeforeChapterTransition, 120);
    window.setTimeout(positionToFirstBatchLink, 120);
    window.setTimeout(positionToChapterOne, 480);
    window.setTimeout(positionBeforeChapterTransition, 480);
    window.setTimeout(positionToFirstBatchLink, 480);
  });
}
