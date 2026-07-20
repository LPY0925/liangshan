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
    _musicSaveTimer = setInterval(function () { saveMusicState(audio); }, 300);
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
      "@media (prefers-reduced-motion:reduce){.bg-music-btn[data-liangshan-control],.auto-scroll-btn[data-liangshan-control]{transition:none!important}.bg-music-btn[data-liangshan-control].is-playing .control-icon-pause,.auto-scroll-btn[data-liangshan-control].is-scrolling{animation:none!important}}"
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
      sync();
    }

    function step() {
      if (!running) return;
      var max = scrollMax();
      var current = window.scrollY || document.documentElement.scrollTop || 0;

      if (max <= 0 || current >= max - 1) {
        window.scrollTo(0, Math.max(0, max));
        stop();
        return;
      }

      window.scrollTo(0, Math.min(current + speed(), max));
      rafId = window.requestAnimationFrame(step);
    }

    function start() {
      if (running) return;
      running = true;
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
      var open = Boolean(sphere && sphere.classList.contains("is-open"));
      document.body.classList.toggle("liangshan-catalog-open", open);
      setInteractive(document.getElementById("bgMusicBtn"), open);
      setInteractive(document.getElementById("autoScrollBtn"), open);
    }

    update();

    if (sphere && window.MutationObserver) {
      observer = new MutationObserver(update);
      observer.observe(sphere, { attributes: true, attributeFilter: ["class"] });
    }

    window.addEventListener("beforeunload", function () {
      if (observer) observer.disconnect();
    });
  }

  function init() {
    if (!document.body) return;
    injectStyle();
    setupMusic();
    setupAutoScroll();
    setupCatalogVisibility();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }

  window.addEventListener("beforeunload", function () {
    if (stopAutoScroll) stopAutoScroll();
    // 保存当前播放位置，供下一页恢复
    var audio = document.getElementById("bgMusic");
    if (audio) {
      // 最后一次保存：把定时器停掉避免竞争
      stopSavingMusicState();
      saveMusicState(audio);
    }
  });
})();
