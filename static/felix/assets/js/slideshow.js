// =====================================================
// Felix Jagtenborg · slideshow
// Vanilla JS — crossfade + Ken Burns + preload.
// =====================================================
(function () {
  'use strict';

  // ----- Config -----
  var PHOTO_COUNT = 220;
  var PHOTO_PATH  = 'photos/photo-';
  var PHOTO_EXT   = '.jpg';
  var DEFAULT_INTERVAL_MS = 5000;
  var IDLE_MS = 2200; // hide UI after this long of mouse inactivity

  // ----- State -----
  var indices = [];               // current play order (0..N-1)
  for (var i = 0; i < PHOTO_COUNT; i++) indices.push(i);
  var pos = 0;                    // index in indices[]
  var intervalMs = DEFAULT_INTERVAL_MS;
  var playing = true;
  var shuffle = false;
  var timer = null;
  var progressRaf = null;
  var slideStartedAt = 0;
  var pausedRemaining = 0;        // when paused, ms still to go on current slide
  var activeLayer = 'a';          // 'a' or 'b'
  var kbAltToggle = false;        // alternate Ken Burns variants

  // ----- DOM -----
  var stage         = document.getElementById('stage');
  var slideA        = document.getElementById('slide-a');
  var slideB        = document.getElementById('slide-b');
  var imgA          = slideA.querySelector('img');
  var imgB          = slideB.querySelector('img');
  var loader        = document.getElementById('loader');
  var errorBox      = document.getElementById('error');
  var counterNow    = document.getElementById('counter-now');
  var counterTotal  = document.getElementById('counter-total');
  var progressBar   = document.getElementById('progress-bar');
  var btnPrev       = document.getElementById('btn-prev');
  var btnNext       = document.getElementById('btn-next');
  var btnPlay       = document.getElementById('btn-play');
  var btnShuffle    = document.getElementById('btn-shuffle');
  var btnFullscreen = document.getElementById('btn-fullscreen');
  var btnHelp       = document.getElementById('btn-help');
  var btnHelpClose  = document.getElementById('btn-help-close');
  var helpBox       = document.getElementById('help');
  var zonePrev      = document.getElementById('zone-prev');
  var zoneNext      = document.getElementById('zone-next');
  var speedSelect   = document.getElementById('speed-select');

  // ----- Helpers -----
  function pad(n) { return n < 10 ? '00' + n : n < 100 ? '0' + n : '' + n; }
  function urlFor(idx) { return PHOTO_PATH + pad(idx + 1) + PHOTO_EXT; }

  function shuffleIndices() {
    // Fisher-Yates, preserve current photo at position 0 so we don't jump.
    var current = indices[pos];
    var others = indices.filter(function (n) { return n !== current; });
    for (var k = others.length - 1; k > 0; k--) {
      var j = Math.floor(Math.random() * (k + 1));
      var tmp = others[k]; others[k] = others[j]; others[j] = tmp;
    }
    indices = [current].concat(others);
    pos = 0;
  }
  function unshuffleIndices() {
    var current = indices[pos];
    indices = [];
    for (var i = 0; i < PHOTO_COUNT; i++) indices.push(i);
    pos = current; // jump back to natural position of current photo
  }

  function preloadAround(centerPos) {
    // Preload current + 2 ahead + 1 behind
    var offsets = [0, 1, 2, -1];
    for (var i = 0; i < offsets.length; i++) {
      var p = (centerPos + offsets[i] + PHOTO_COUNT) % PHOTO_COUNT;
      var img = new Image();
      img.src = urlFor(indices[p]);
    }
  }

  // ----- Rendering a slide -----
  function showAt(newPos, dir) {
    var oldLayer = activeLayer === 'a' ? slideA : slideB;
    var newLayer = activeLayer === 'a' ? slideB : slideA;
    var newImg   = activeLayer === 'a' ? imgB   : imgA;

    var idx = indices[newPos];
    var src = urlFor(idx);

    // Set image; when loaded, swap active class to crossfade.
    var done = function () {
      newLayer.classList.remove('kb-alt');
      if (kbAltToggle) newLayer.classList.add('kb-alt');
      kbAltToggle = !kbAltToggle;

      newLayer.classList.add('is-active');
      oldLayer.classList.remove('is-active');
      activeLayer = (activeLayer === 'a') ? 'b' : 'a';

      pos = newPos;
      updateCounter();
      preloadAround(pos);
      resetSlideTimer();
    };

    if (newImg.src.indexOf(src) !== -1 && newImg.complete) {
      done();
      return;
    }

    newImg.onload = done;
    newImg.onerror = function () {
      // Skip broken image; advance to next.
      console.warn('Skip image:', src);
      pos = newPos;
      next();
    };
    newImg.src = src;
  }

  function updateCounter() {
    counterNow.textContent = pad(pos + 1);
  }

  // ----- Timer -----
  function resetSlideTimer() {
    clearTimeout(timer);
    cancelAnimationFrame(progressRaf);
    if (!playing) return;
    slideStartedAt = performance.now();
    var dur = intervalMs;
    timer = setTimeout(next, dur);
    tickProgress(dur);
  }
  function tickProgress(dur) {
    var startedAt = slideStartedAt;
    var loop = function () {
      var elapsed = performance.now() - startedAt;
      var pct = Math.min(100, (elapsed / dur) * 100);
      progressBar.style.width = pct + '%';
      if (elapsed < dur && playing) {
        progressRaf = requestAnimationFrame(loop);
      }
    };
    progressRaf = requestAnimationFrame(loop);
  }
  function pauseTimer() {
    clearTimeout(timer);
    cancelAnimationFrame(progressRaf);
    pausedRemaining = intervalMs - (performance.now() - slideStartedAt);
    if (pausedRemaining < 0) pausedRemaining = 0;
  }
  function resumeTimer() {
    if (pausedRemaining <= 0) { resetSlideTimer(); return; }
    slideStartedAt = performance.now() - (intervalMs - pausedRemaining);
    timer = setTimeout(next, pausedRemaining);
    tickProgress(intervalMs);
    pausedRemaining = 0;
  }

  // ----- Navigation -----
  function next() {
    var np = (pos + 1) % PHOTO_COUNT;
    showAt(np, 1);
  }
  function prev() {
    var np = (pos - 1 + PHOTO_COUNT) % PHOTO_COUNT;
    showAt(np, -1);
  }
  function goTo(absoluteIndex) {
    // Find position of absoluteIndex in indices[]
    var np = indices.indexOf(absoluteIndex);
    if (np < 0) np = 0;
    showAt(np, 1);
  }

  // ----- Play/pause -----
  function setPlaying(state) {
    playing = state;
    btnPlay.setAttribute('data-state', playing ? 'playing' : 'paused');
    btnPlay.setAttribute('aria-label', playing ? 'Pauze (spatie)' : 'Afspelen (spatie)');
    if (playing) {
      resumeTimer();
    } else {
      pauseTimer();
    }
  }
  function togglePlay() { setPlaying(!playing); }

  // ----- Shuffle -----
  function toggleShuffle() {
    shuffle = !shuffle;
    btnShuffle.setAttribute('data-state', shuffle ? 'on' : 'off');
    if (shuffle) shuffleIndices(); else unshuffleIndices();
    updateCounter();
    preloadAround(pos);
    resetSlideTimer();
  }

  // ----- Fullscreen -----
  function isFullscreen() {
    return !!(document.fullscreenElement || document.webkitFullscreenElement);
  }
  function toggleFullscreen() {
    if (isFullscreen()) {
      (document.exitFullscreen || document.webkitExitFullscreen).call(document);
    } else {
      var el = document.documentElement;
      (el.requestFullscreen || el.webkitRequestFullscreen).call(el);
    }
  }
  function onFullscreenChange() {
    stage.classList.toggle('is-fullscreen', isFullscreen());
  }

  // ----- Help -----
  function showHelp() {
    helpBox.hidden = false;
    if (playing) setPlaying(false);
  }
  function hideHelp() {
    helpBox.hidden = true;
  }

  // ----- Idle UI hide -----
  var idleTimer = null;
  function bumpActive() {
    stage.classList.remove('is-idle');
    clearTimeout(idleTimer);
    idleTimer = setTimeout(function () {
      stage.classList.add('is-idle');
    }, IDLE_MS);
  }

  // ----- Touch swipe -----
  var touchStartX = 0, touchStartY = 0;
  function onTouchStart(e) {
    if (e.touches.length !== 1) return;
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
  }
  function onTouchEnd(e) {
    if (!touchStartX) return;
    var t = e.changedTouches[0];
    var dx = t.clientX - touchStartX;
    var dy = t.clientY - touchStartY;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
      if (dx < 0) next(); else prev();
    }
    touchStartX = touchStartY = 0;
  }

  // ----- Keyboard -----
  function onKeydown(e) {
    if (e.target && /^(INPUT|SELECT|TEXTAREA)$/.test(e.target.tagName)) return;
    switch (e.key) {
      case 'ArrowRight': case 'PageDown': next(); break;
      case 'ArrowLeft':  case 'PageUp':   prev(); break;
      case ' ':          e.preventDefault(); togglePlay(); break;
      case 'f': case 'F': toggleFullscreen(); break;
      case 's': case 'S': toggleShuffle(); break;
      case 'Home':       goTo(0); break;
      case 'End':        goTo(PHOTO_COUNT - 1); break;
      case '1': setSpeed(3); break;
      case '2': setSpeed(5); break;
      case '3': setSpeed(7); break;
      case '4': setSpeed(10); break;
      case '5': setSpeed(15); break;
      case '?': case 'h': case 'H': showHelp(); break;
      case 'Escape':
        if (!helpBox.hidden) { hideHelp(); }
        else if (isFullscreen()) { toggleFullscreen(); }
        break;
    }
    bumpActive();
  }

  function setSpeed(seconds) {
    intervalMs = seconds * 1000;
    speedSelect.value = String(seconds);
    if (playing) resetSlideTimer();
  }

  // ----- Init -----
  function init() {
    counterTotal.textContent = String(PHOTO_COUNT);
    counterNow.textContent = '001';

    // Verify first image loads; otherwise show error.
    var test = new Image();
    test.onload = function () {
      loader.classList.add('is-hidden');
      // Start showing slide 1
      var firstImg = imgA;
      firstImg.onload = function () {
        slideA.classList.add('is-active');
        preloadAround(0);
        resetSlideTimer();
      };
      firstImg.src = urlFor(0);
    };
    test.onerror = function () {
      loader.classList.add('is-hidden');
      errorBox.hidden = false;
      document.getElementById('error-msg').textContent =
        'Kon de eerste foto niet laden (' + urlFor(0) + ').';
    };
    test.src = urlFor(0);

    // Wire up controls
    btnPrev.addEventListener('click', function () { prev(); bumpActive(); });
    btnNext.addEventListener('click', function () { next(); bumpActive(); });
    btnPlay.addEventListener('click', function () { togglePlay(); bumpActive(); });
    btnShuffle.addEventListener('click', function () { toggleShuffle(); bumpActive(); });
    btnFullscreen.addEventListener('click', function () { toggleFullscreen(); bumpActive(); });
    btnHelp.addEventListener('click', function () { showHelp(); bumpActive(); });
    btnHelpClose.addEventListener('click', hideHelp);
    helpBox.addEventListener('click', function (e) {
      if (e.target === helpBox) hideHelp();
    });

    speedSelect.addEventListener('change', function () {
      setSpeed(parseInt(speedSelect.value, 10));
      bumpActive();
    });

    zonePrev.addEventListener('click', function () { prev(); bumpActive(); });
    zoneNext.addEventListener('click', function () { next(); bumpActive(); });

    // Double-click toggles fullscreen
    stage.addEventListener('dblclick', function (e) {
      // Don't trigger when clicking a button
      if (e.target.closest('.btn') || e.target.closest('.help')) return;
      toggleFullscreen();
    });

    document.addEventListener('keydown', onKeydown);
    document.addEventListener('fullscreenchange', onFullscreenChange);
    document.addEventListener('webkitfullscreenchange', onFullscreenChange);

    // Mouse activity
    stage.addEventListener('mousemove', bumpActive);
    stage.addEventListener('touchstart', function (e) {
      bumpActive();
      onTouchStart(e);
    }, { passive: true });
    stage.addEventListener('touchend', onTouchEnd);

    // Pause when tab is hidden, resume when visible.
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) { pauseTimer(); }
      else if (playing) { resumeTimer(); }
    });

    bumpActive();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
