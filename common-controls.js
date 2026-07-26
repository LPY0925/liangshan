(function () {
  "use strict";

  if (window.__liangshanCommonControlsReady) return;
  window.__liangshanCommonControlsReady = true;

  var script = document.currentScript;
  var rootUrl = script && script.src ? new URL(".", script.src) : new URL("./", window.location.href);
  var musicUrl = new URL("jonasblakewood-nature-519884.mp3", rootUrl).href;
  var stopAutoScroll = null;
  var userPausedMusic = false;

  // ── 跨页面音乐连续播放：通过 sessionStorage 保存/恢复播放位置 ──
  var SESSION_KEY_TIME = "liangshan_music_ct";
  var SESSION_KEY_PLAYING = "liangshan_music_pl";
  var SESSION_KEY_USER_PAUSE = "liangshan_music_up";
  var SESSION_KEY_TS = "liangshan_music_ts";
  var _musicSaveTimer = null;
  var CATALOG_ITEMS = [
    { chapter: "开篇", label: "开篇", path: "shouye/dist/index.html", image: "开篇.webp" },
    { chapter: "壹", label: "壹 · 第一个坐标", path: "shouye/dist/index.html#chapter-1", image: "壹.webp" },
    { chapter: "贰", label: "贰 · 青山为凭", path: "sancengshijianbianhuan/index.html#chapter-2", image: "贰.webp" },
    { chapter: "叁", label: "叁 · 碧空为证", path: "sancengshijianbianhuan/index.html#chapter-3", image: "叁.webp" },
    { chapter: "肆", label: "肆 · 清流为鉴", path: "sancengshijianbianhuan/index.html#chapter-4", image: "肆.webp" },
    { chapter: "伍", label: "伍 · 一棵树值多少钱？", path: "shouye/dist/wu.html", image: "伍.webp" },
    { chapter: "陆", label: "陆 · 675+331，1006个绿色坐标", path: "chaojuanzhou/index.html", image: "陆.webp" }
  ];

  function saveMusicState(audio) {
    if (!audio || audio.readyState === 0) return;
    try {
      sessionStorage.setItem(SESSION_KEY_TIME, audio.currentTime);
      sessionStorage.setItem(SESSION_KEY_PLAYING, (!audio.paused && !audio.ended) ? "1" : "0");
      sessionStorage.setItem(SESSION_KEY_USER_PAUSE, userPausedMusic ? "1" : "0");
      sessionStorage.setItem(SESSION_KEY_TS, Date.now());
    } catch (e) { /* quota / cross-origin */ }
  }

  function restoreMusicState(audio) {
    function doRestore() {
      try {
        var savedTime = parseFloat(sessionStorage.getItem(SESSION_KEY_TIME));
        var wasPlaying = sessionStorage.getItem(SESSION_KEY_PLAYING) === "1";
        var pausedByUser = sessionStorage.getItem(SESSION_KEY_USER_PAUSE) === "1";
        var savedTs = parseInt(sessionStorage.getItem(SESSION_KEY_TS), 10);
        if (!isNaN(savedTime) && savedTime > 0 && isFinite(audio.duration) && savedTime < audio.duration - 0.05) {
          var elapsed = 0;
          if (wasPlaying && !isNaN(savedTs)) {
            elapsed = Math.max(0, (Date.now() - savedTs) / 1000);
          }
          var target = Math.min(savedTime + elapsed, audio.duration - 0.1);
          // fastSeek 在支持的浏览器上更快，降级到设置 currentTime
          if (audio.fastSeek) { audio.fastSeek(target); } else { audio.currentTime = target; }
        }
        if (pausedByUser) { userPausedMusic = true; }
      } catch (e) { /* ignore */ }
    }

    if (audio.readyState >= 1) {
      doRestore();
    } else {
      audio.addEventListener("loadedmetadata", function onMeta() {
        audio.removeEventListener("loadedmetadata", onMeta);
        doRestore();
      }, { once: true });
    }
  }

  function startSavingMusicState(audio) {
    if (_musicSaveTimer) clearInterval(_musicSaveTimer);
    _musicSaveTimer = setInterval(function () { saveMusicState(audio); }, 1000);
  }

  function stopSavingMusicState() {
    if (_musicSaveTimer) { clearInterval(_musicSaveTimer); _musicSaveTimer = null; }
  }

  var labels = {
    musicPlay: "\u64ad\u653e\u80cc\u666f\u97f3\u4e50",
    musicPause: "\u6682\u505c\u80cc\u666f\u97f3\u4e50",
    musicTitle: "\u80cc\u666f\u97f3\u4e50",
    scrollPlay: "\u5f00\u59cb\u81ea\u52a8\u6eda\u52a8",
    scrollPause: "\u6682\u505c\u81ea\u52a8\u6eda\u52a8",
    scrollTitle: "\u81ea\u52a8\u6eda\u52a8"
  };

  function injectStyle() {
    if (document.getElementById("liangshan-common-controls-style")) return;

    var style = document.createElement("style");
    style.id = "liangshan-common-controls-style";
    style.textContent = [
      ".bg-music-btn[data-liangshan-control],.auto-scroll-btn[data-liangshan-control]{",
      "position:fixed!important;right:18px!important;z-index:2147483000!important;",
      "width:44px!important;height:44px!important;min-width:44px!important;min-height:44px!important;",
      "display:flex!important;align-items:center!important;justify-content:center!important;",
      "padding:0!important;border-radius:50%!important;border:1.5px solid rgba(179,149,88,.38)!important;",
      "background:linear-gradient(145deg,rgba(248,243,234,.96),rgba(235,225,210,.94))!important;",
      "color:#5d7649!important;box-shadow:0 3px 16px rgba(31,42,32,.14),0 0 0 1px rgba(255,255,255,.24) inset!important;",
      "backdrop-filter:blur(12px)!important;-webkit-backdrop-filter:blur(12px)!important;",
      "font-size:0!important;line-height:1!important;letter-spacing:0!important;cursor:pointer!important;",
      "opacity:0!important;visibility:hidden!important;pointer-events:none!important;user-select:none!important;transform:translateY(-6px)!important;",
      "transition:background .28s ease,border-color .28s ease,box-shadow .28s ease,transform .28s cubic-bezier(.4,0,.2,1)!important;",
      "}",
      ".bg-music-btn[data-liangshan-control]{top:18px!important;}",
      ".auto-scroll-btn[data-liangshan-control]{top:72px!important;}",
      "body.liangshan-catalog-open .bg-music-btn[data-liangshan-control],body.liangshan-catalog-open .auto-scroll-btn[data-liangshan-control]{",
      "opacity:1!important;visibility:visible!important;pointer-events:auto!important;transform:none!important;",
      "}",
      ".bg-music-btn[data-liangshan-control]:hover,.auto-scroll-btn[data-liangshan-control]:hover{",
      "border-color:rgba(179,149,88,.62)!important;box-shadow:0 6px 24px rgba(31,42,32,.20),0 0 0 1px rgba(255,255,255,.30) inset!important;transform:scale(1.04)!important;",
      "}",
      ".bg-music-btn[data-liangshan-control]:focus-visible,.auto-scroll-btn[data-liangshan-control]:focus-visible{outline:2px solid rgba(93,118,73,.72)!important;outline-offset:3px!important;}",
      ".bg-music-btn[data-liangshan-control].is-playing,.auto-scroll-btn[data-liangshan-control].is-scrolling,",
      ".auto-scroll-btn[data-liangshan-control].is-playing,.auto-scroll-btn[data-liangshan-control].is-active{",
      "background:rgba(93,118,73,.92)!important;color:#f8f3ea!important;border-color:rgba(93,118,73,.72)!important;",
      "}",
      ".bg-music-btn[data-liangshan-control] svg,.auto-scroll-btn[data-liangshan-control] svg{",
      "display:block!important;width:19px!important;height:19px!important;flex:0 0 19px!important;stroke:currentColor!important;fill:none!important;pointer-events:none!important;",
      "}",
      ".bg-music-btn[data-liangshan-control] .control-icon-pause,.auto-scroll-btn[data-liangshan-control] .control-icon-pause{display:none!important;}",
      ".bg-music-btn[data-liangshan-control].is-playing .control-icon-play,.auto-scroll-btn[data-liangshan-control].is-scrolling .control-icon-play{display:none!important;}",
      ".bg-music-btn[data-liangshan-control].is-playing .control-icon-pause,.auto-scroll-btn[data-liangshan-control].is-scrolling .control-icon-pause{display:block!important;}",
      ".bg-music-btn[data-liangshan-control].is-playing .control-icon-pause{animation:liangshan-music-spin 4s linear infinite!important;transform-origin:center!important;transform-box:fill-box!important;}",
      ".auto-scroll-btn[data-liangshan-control].is-scrolling{animation:liangshan-control-pulse 1.8s ease-in-out infinite!important;}",
      "@keyframes liangshan-music-spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}",
      "@keyframes liangshan-control-pulse{0%,100%{box-shadow:0 3px 16px rgba(31,42,32,.14),0 0 0 1px rgba(255,255,255,.24) inset}50%{box-shadow:0 3px 22px rgba(93,118,73,.30),0 0 0 1px rgba(255,255,255,.30) inset}}",
      "@media (max-width:480px){.bg-music-btn[data-liangshan-control],.auto-scroll-btn[data-liangshan-control]{right:12px!important;width:42px!important;height:42px!important;min-width:42px!important;min-height:42px!important}.bg-music-btn[data-liangshan-control]{top:14px!important}.auto-scroll-btn[data-liangshan-control]{top:64px!important}}",
      "@media (prefers-reduced-motion:reduce){.bg-music-btn[data-liangshan-control],.auto-scroll-btn[data-liangshan-control]{transition:none!important}.bg-music-btn[data-liangshan-control].is-playing .control-icon-pause,.auto-scroll-btn[data-liangshan-control].is-scrolling{animation:none!important}}",
      /* 公共遮罩样式：transitionOverlay / chapterTransitionMask / returnTransitionMask 统一 */
      "#transitionOverlay.is-visible,#chapterTransitionMask.is-active,#returnTransitionMask.is-active{visibility:visible!important}",
      "#transitionOverlay,#chapterTransitionMask,#returnTransitionMask{display:grid!important;grid-template-columns:1fr 1fr!important;inset:0!important;overflow:hidden!important;pointer-events:none!important;position:fixed!important;visibility:hidden!important;z-index:9999!important}",
      "#transitionOverlay>span,#transitionOverlay>div,#chapterTransitionMask>div,#returnTransitionMask>div{display:block!important;block-size:100vh!important;block-size:100dvh!important;min-inline-size:0!important;overflow:hidden!important;position:relative!important;transform:translate3d(0,0,0)!important;transition:transform 860ms cubic-bezier(0.76,0,0.24,1)!important;will-change:transform!important}",
      "#transitionOverlay>span::before,#transitionOverlay>span::after,#chapterTransitionMask>div::before,#chapterTransitionMask>div::after,#returnTransitionMask>div::before,#returnTransitionMask>div::after{content:\"\"!important;inset:0!important;pointer-events:none!important;position:absolute!important}",
      "#transitionOverlay>span::before,#chapterTransitionMask>div::before,#returnTransitionMask>div::before{background-image:url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 240 240'%3E%3Cfilter id='n'%3E%3CfeTurbulence baseFrequency='0.86' numOctaves='3' stitchTiles='stitch' type='fractalNoise'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.74'/%3E%3C/svg%3E\")!important;mix-blend-mode:soft-light!important;opacity:0.12!important}",
      "#transitionOverlay>span::after,#chapterTransitionMask>div::after,#returnTransitionMask>div::after{background:linear-gradient(to bottom,rgba(255,250,235,0.22),transparent 30%,transparent 74%,rgba(104,68,32,0.14)),radial-gradient(ellipse at center,transparent 34%,rgba(126,89,48,0.18) 100%)!important}",
      /* 左面板：绿，从底部上来 */
      "#transitionOverlay .transition-overlay__pane--left,#chapterTransitionMask .chapter-transition-panel--left,#returnTransitionMask .return-transition-panel--left{background:linear-gradient(145deg,#d8ead1 0%,#b7d9aa 58%,#8fbf89 100%)!important;box-shadow:inset -1px 0 rgba(246,255,238,0.26)!important;transform:translate3d(0,104%,0)!important}",
      /* 右面板：蓝，从顶部下来 */
      "#transitionOverlay .transition-overlay__pane--right,#chapterTransitionMask .chapter-transition-panel--right,#returnTransitionMask .return-transition-panel--right{background:linear-gradient(215deg,#d7ebf4 0%,#aecfe2 54%,#85b3cf 100%)!important;box-shadow:inset 1px 0 rgba(240,250,255,0.24)!important;transform:translate3d(0,-104%,0)!important}",
      "#transitionOverlay.is-visible .transition-overlay__pane--left,#chapterTransitionMask.is-active .chapter-transition-panel--left,#returnTransitionMask.is-active .return-transition-panel--left,",
      "#transitionOverlay.is-visible .transition-overlay__pane--right,#chapterTransitionMask.is-active .chapter-transition-panel--right,#returnTransitionMask.is-active .return-transition-panel--right{transform:translate3d(0,0,0)!important}",
      "#transitionOverlay.is-revealing .transition-overlay__pane--left,#chapterTransitionMask.is-revealing .chapter-transition-panel--left,#returnTransitionMask.is-revealing .return-transition-panel--left{transform:translate3d(0,-104%,0)!important}",
      "#transitionOverlay.is-revealing .transition-overlay__pane--right,#chapterTransitionMask.is-revealing .chapter-transition-panel--right,#returnTransitionMask.is-revealing .return-transition-panel--right{transform:translate3d(0,104%,0)!important}",
      /* 边界跳转链接（scroll-boundary-link / .scroll-boundary-link--next / previous） */
      ".scroll-boundary-link{position:fixed!important;left:50%!important;z-index:120!important;display:flex!important;flex-direction:column!important;align-items:center!important;gap:10px!important;color:rgba(77,93,72,0.62)!important;font-family:\"Noto Serif SC\",\"Source Han Serif SC\",\"思源宋体\",serif!important;font-size:14px!important;letter-spacing:4px!important;text-decoration:none!important;opacity:0!important;pointer-events:none!important;transform:translate(-50%,14px)!important;transition:opacity 0.36s ease,transform 0.36s ease!important}",
      ".scroll-boundary-link.is-visible{opacity:1!important;pointer-events:auto!important;transform:translate(-50%,0)!important}",
      ".scroll-boundary-link--next,.scroll-boundary-link--next{bottom:22px!important}",
      ".scroll-boundary-link--previous,.scroll-boundary-link--prev{top:22px!important;transform:translate(-50%,-14px)!important}",
      ".scroll-boundary-link--previous.is-visible,.scroll-boundary-link--prev.is-visible{transform:translate(-50%,0)!important}",
      ".scroll-boundary-link .edge-arrow{inline-size:1.125rem!important;block-size:1.125rem!important;border-inline-end:2px solid rgba(93,118,73,0.38)!important;border-block-end:2px solid rgba(93,118,73,0.38)!important;transform:rotate(45deg)!important}",
      ".scroll-boundary-link--previous .edge-arrow,.scroll-boundary-link--prev .edge-arrow{transform:rotate(225deg)!important}",
      "@media (prefers-reduced-motion:reduce){#transitionOverlay>span,#chapterTransitionMask>div,#returnTransitionMask>div,.scroll-boundary-link{transition-duration:180ms!important}}"
    ].join("");
    document.head.appendChild(style);
  }

  function icon(kind) {
    if (kind === "musicPlay") {
      return '<svg class="control-icon-play" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>';
    }
    if (kind === "musicPause") {
      return '<svg class="control-icon-pause" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/><path d="M4 5h3v8H4z"/><path d="M10 5h3v8h-3z"/></svg>';
    }
    if (kind === "scrollPlay") {
      return '<svg class="control-icon-play" viewBox="0 0 24 24" aria-hidden="true"><polygon points="8 5 19 12 8 19 8 5"/></svg>';
    }
    return '<svg class="control-icon-pause" viewBox="0 0 24 24" aria-hidden="true"><rect x="7" y="5" width="3.5" height="14" rx="1"/><rect x="13.5" y="5" width="3.5" height="14" rx="1"/></svg>';
  }

  function cleanButton(id, className) {
    var existing = document.getElementById(id);
    var button = document.createElement("button");

    if (existing) {
      Array.prototype.slice.call(existing.attributes).forEach(function (attr) {
        if (attr.name !== "id" && attr.name !== "class" && attr.name !== "style") {
          button.setAttribute(attr.name, attr.value);
        }
      });
      existing.replaceWith(button);
    }

    button.id = id;
    button.className = className;
    button.type = "button";
    button.setAttribute("data-liangshan-control", "");
    button.setAttribute("aria-live", "polite");
    document.body.appendChild(button);
    return button;
  }

  function ensureAudio() {
    var audio = document.getElementById("bgMusic");
    if (!audio) {
      audio = document.createElement("audio");
      audio.id = "bgMusic";
      audio.loop = true;
      audio.preload = "auto";
      audio.src = musicUrl;
      document.body.appendChild(audio);
    }

    // 如果页面 HTML 只有 <source> 没有 src 属性，补上 src（统一指向同一个 mp3）
    if (!audio.src) {
      audio.src = musicUrl;
    }

    audio.loop = true;
    audio.preload = "auto";
    audio.autoplay = true;
    audio.setAttribute("autoplay", "");
    audio.setAttribute("playsinline", "");
    audio.volume = 0.35;
    audio.muted = false;

    // 强制触发加载：HTML 中 preload="none" 会让浏览器跳过预加载，仅改属性不够
    if (audio.readyState === 0) {
      audio.load();
    }
    return audio;
  }

  function setupMusic() {
    var audio = ensureAudio();

    // 🔑 从上一页面恢复播放位置（跨页面连续播放的核心）
    restoreMusicState(audio);
    startSavingMusicState(audio);

    var button = cleanButton("bgMusicBtn", "bg-music-btn");
    button.innerHTML = icon("musicPlay") + icon("musicPause");
    button.title = labels.musicTitle;

    function sync() {
      var playing = !audio.paused && !audio.ended;
      button.classList.toggle("is-playing", playing);
      button.setAttribute("aria-label", playing ? labels.musicPause : labels.musicPlay);
      button.title = labels.musicTitle;
    }

    function playFromPageEntry() {
      if (userPausedMusic || !audio.paused) return Promise.resolve();
      audio.muted = false;
      return audio.play().then(sync).catch(function () {
        sync();
      });
    }

    button.addEventListener("click", function (event) {
      event.preventDefault();
      event.stopPropagation();
      if (audio.paused) {
        userPausedMusic = false;
        playFromPageEntry();
      } else {
        userPausedMusic = true;
        audio.pause();
        sync();
      }
    });

    audio.addEventListener("play", sync);
    audio.addEventListener("pause", sync);
    audio.addEventListener("ended", sync);

    var events = ["pointerdown", "click", "touchstart", "keydown", "wheel", "scroll"];
    function retryAfterInteraction() {
      playFromPageEntry();
    }
    events.forEach(function (eventName) {
      document.addEventListener(eventName, retryAfterInteraction, {
        capture: true,
        passive: true
      });
    });

    sync();
    playFromPageEntry();
    window.addEventListener("pageshow", playFromPageEntry);
    window.addEventListener("load", playFromPageEntry);
  }

  function scrollMax() {
    var doc = document.documentElement;
    var body = document.body;
    return Math.max(
      doc.scrollHeight,
      doc.offsetHeight,
      body ? body.scrollHeight : 0,
      body ? body.offsetHeight : 0
    ) - window.innerHeight;
  }

  function setupAutoScroll() {
    var button = cleanButton("autoScrollBtn", "auto-scroll-btn");
    var rafId = 0;
    var running = false;
    var lastTime = 0;
    var maxScroll = 0;
    var maxScrollUpdatedAt = 0;

    button.innerHTML = icon("scrollPlay") + icon("scrollPause");
    button.title = labels.scrollTitle;

    function speed() {
      if (window.innerWidth < 480) return 0.85;
      if (window.innerWidth < 768) return 1.15;
      return 1.65;
    }

    function sync() {
      button.classList.toggle("is-scrolling", running);
      button.classList.toggle("is-playing", running);
      button.classList.toggle("is-active", running);
      button.setAttribute("aria-label", running ? labels.scrollPause : labels.scrollPlay);
      button.title = labels.scrollTitle;
    }

    function stop() {
      if (!running && !rafId) {
        sync();
        return;
      }
      running = false;
      if (rafId) {
        window.cancelAnimationFrame(rafId);
        rafId = 0;
      }
      lastTime = 0;
      sync();
    }

    function step(now) {
      if (!running) return;
      if (!maxScroll || now - maxScrollUpdatedAt > 500) {
        maxScroll = scrollMax();
        maxScrollUpdatedAt = now;
      }
      var max = maxScroll;
      var current = window.scrollY || document.documentElement.scrollTop || 0;
      var delta = lastTime ? Math.min(32, now - lastTime) : 16.7;
      lastTime = now;

      if (max <= 0 || current >= max - 1) {
        window.scrollTo(0, Math.max(0, max));
        stop();
        return;
      }

      window.scrollTo(0, Math.min(current + speed() * (delta / 16.7), max));
      rafId = window.requestAnimationFrame(step);
    }

    function start() {
      if (running) return;
      running = true;
      maxScroll = scrollMax();
      maxScrollUpdatedAt = performance.now();
      lastTime = 0;
      sync();
      rafId = window.requestAnimationFrame(step);
    }

    button.addEventListener("click", function (event) {
      event.preventDefault();
      event.stopPropagation();
      running ? stop() : start();
    });

    ["wheel", "touchstart", "touchmove"].forEach(function (eventName) {
      document.addEventListener(eventName, stop, { passive: true });
    });

    document.addEventListener("keydown", function (event) {
      if (["ArrowDown", "ArrowUp", "PageDown", "PageUp", "Home", "End", " "].indexOf(event.key) !== -1) {
        stop();
      }
    }, { passive: true });

    stopAutoScroll = stop;
    window.autoScrollToggle = function () { running ? stop() : start(); };
    window.autoScrollStop = stop;
    window.autoScrollStart = start;
    sync();
  }

  function setupCatalogVisibility() {
    var sphere = document.querySelector(".catalog-sphere");
    var observer = null;

    function setInteractive(element, open) {
      if (!element) return;
      element.setAttribute("aria-hidden", open ? "false" : "true");
      element.tabIndex = open ? 0 : -1;
    }

    function update() {
      var open = !sphere || sphere.classList.contains("is-open");
      document.body.classList.toggle("liangshan-catalog-open", open);
      setInteractive(document.getElementById("bgMusicBtn"), open);
      setInteractive(document.getElementById("autoScrollBtn"), open);
    }

    update();

    if (sphere && window.MutationObserver) {
      observer = new MutationObserver(update);
      observer.observe(sphere, { attributes: true, attributeFilter: ["class"] });
    }

  }

  // ── 公共：页面切换遮罩触发 ──
  var TRANSITION_IDS = ["transitionOverlay", "chapterTransitionMask", "returnTransitionMask"];
  var _transitionNavigating = false;

  function findTransitionMask() {
    for (var i = 0; i < TRANSITION_IDS.length; i++) {
      var el = document.getElementById(TRANSITION_IDS[i]);
      if (el) return el;
    }
    return null;
  }

  function getActiveClass(mask) {
    if (!mask) return "is-visible";
    return mask.id === "transitionOverlay" ? "is-visible" : "is-active";
  }

  function triggerPageTransition(targetHref, extraDelay) {
    if (_transitionNavigating || !targetHref) return;
    var mask = findTransitionMask();
    if (!mask) {
      window.location.href = targetHref;
      return;
    }
    _transitionNavigating = true;
    var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var delay = (reduced ? 180 : 920) + (extraDelay || 0);
    mask.classList.remove("is-revealing");
    mask.classList.add(getActiveClass(mask));
    window.setTimeout(function () {
      window.location.href = targetHref;
    }, delay);
  }

  function scrollToAnchor(hash) {
    if (!hash) return;
    // 优先使用页面自定义的滚动逻辑（含 hash="#" 即开篇回顶）
    if (typeof window.__catalogScrollTo === "function" && window.__catalogScrollTo(hash.length > 1 ? hash.substring(1) : "")) return;
    if (typeof scrollToAnchorCustom === "function" && scrollToAnchorCustom(hash)) return;
    if (hash.length < 2) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    var el = document.getElementById(hash.substring(1));
    if (!el) return;
    var top = el.getBoundingClientRect().top + (window.pageYOffset || 0) - 60;
    window.scrollTo({ top: top, behavior: "smooth" });
  }

  function catalogHref(path) {
    var target = new URL(path, rootUrl);
    var current = new URL(window.location.href);
    if (target.pathname === current.pathname) {
      return target.hash || "#";
    }
    return target.href;
  }

  function hydrateCatalogSphere(sphere) {
    if (!sphere || sphere.querySelector(".cs-toggle")) return;

    var toggle = document.createElement("button");
    toggle.className = "cs-toggle";
    toggle.type = "button";
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "打开目录");
    toggle.innerHTML = [
      '<span class="cs-icon" aria-hidden="true">',
      '<span class="cs-bar"></span>',
      '<span class="cs-bar"></span>',
      '<span class="cs-bar"></span>',
      "</span>"
    ].join("");

    var panel = document.createElement("div");
    panel.className = "cs-panel";
    panel.setAttribute("aria-hidden", "true");

    CATALOG_ITEMS.forEach(function (entry) {
      var item = document.createElement("a");
      var image = document.createElement("img");
      var label = document.createElement("span");

      item.className = "cs-item";
      item.href = catalogHref(entry.path);
      item.setAttribute("data-chapter", entry.chapter);

      image.className = "cs-thumb";
      image.src = new URL("images/导航缩略图/" + entry.image, rootUrl).href;
      image.alt = "";
      image.width = 512;
      image.height = 320;
      image.loading = "lazy";
      image.decoding = "async";
      image.setAttribute("fetchpriority", "low");

      label.className = "cs-label";
      label.textContent = entry.label;

      item.appendChild(image);
      item.appendChild(label);
      panel.appendChild(item);
    });

    sphere.appendChild(toggle);
    sphere.appendChild(panel);
  }

  // ── 公共：目录球交互（消除每页 ~80 行重复） ──
  function setupCatalogSphere() {
    var sphere = document.querySelector(".catalog-sphere");
    if (!sphere) return;
    hydrateCatalogSphere(sphere);
    var toggle = sphere.querySelector(".cs-toggle");
    var panel = sphere.querySelector(".cs-panel");
    var backdrop = document.querySelector(".cs-backdrop");
    var items = Array.prototype.slice.call(sphere.querySelectorAll(".cs-item"));
    var isOpen = false;

    var currentChapters = (sphere.getAttribute("data-current") || "").split(",").map(function (s) { return s.trim(); });
    items.forEach(function (item) {
      if (currentChapters.indexOf(item.getAttribute("data-chapter")) !== -1) {
        item.classList.add("is-current");
        item.setAttribute("aria-current", "page");
      }
    });

    function open() {
      if (isOpen) return;
      isOpen = true;
      sphere.classList.add("is-open");
      if (toggle) toggle.setAttribute("aria-expanded", "true");
      if (panel) panel.setAttribute("aria-hidden", "false");
    }
    function close() {
      if (!isOpen) return;
      isOpen = false;
      sphere.classList.remove("is-open");
      if (toggle) toggle.setAttribute("aria-expanded", "false");
      if (panel) panel.setAttribute("aria-hidden", "true");
    }

    if (toggle) {
      toggle.addEventListener("click", function (e) {
        e.stopPropagation();
        isOpen ? close() : open();
      });
    }
    if (backdrop) {
      backdrop.addEventListener("click", function () { close(); });
    }
    document.addEventListener("click", function (e) {
      if (isOpen && sphere && !sphere.contains(e.target)) close();
    });

    items.forEach(function (item) {
      item.addEventListener("click", function (e) {
        var href = item.getAttribute("href") || "";
        if (href.indexOf("#") === 0) {
          e.preventDefault();
          close();
          window.setTimeout(function () { scrollToAnchor(href); }, 350);
        } else {
          e.preventDefault();
          close();
          window.setTimeout(function () { triggerPageTransition(href, 0); }, 320);
        }
      });
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && isOpen) {
        close();
        if (toggle) toggle.focus();
      }
    });
  }

  // ── 公共：通用内容超链接遮罩（带 data-page-transition 的 a 标签） ──
  function setupTransitionLinks() {
    document.addEventListener("click", function (e) {
      var link = e.target.closest ? e.target.closest("a[data-page-transition], a.home-return, #first-batch-base-link") : null;
      if (!link) return;
      var href = link.getAttribute("href");
      if (!href || href.indexOf("#") === 0) return;
      e.preventDefault();
      triggerPageTransition(href, 0);
    });
  }

  // 暴露到 window，方便页面特殊逻辑复用
  window.liangshanTransition = {
    trigger: triggerPageTransition,
    findMask: findTransitionMask,
    scrollToAnchor: scrollToAnchor
  };

  function init() {
    if (!document.body) return;
    injectStyle();
    setupMusic();
    setupAutoScroll();
    setupCatalogSphere();
    setupCatalogVisibility();
    setupTransitionLinks();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }

  window.addEventListener("pagehide", function () {
    if (stopAutoScroll) stopAutoScroll();
    var audio = document.getElementById("bgMusic");
    if (audio) {
      stopSavingMusicState();
      saveMusicState(audio);
    }
  });
})();
