// Global behaviour for every page. Plain MPA — runs on each load.
(function () {
  'use strict';

  // --- Theme toggle ---------------------------------------------------
  function setupThemeToggle() {
    var toggle = document.getElementById('theme-toggle');
    if (!toggle) return;
    toggle.addEventListener('click', function () {
      var isDark = document.documentElement.classList.toggle('dark');
      try { localStorage.setItem('theme', isDark ? 'dark' : 'light'); } catch (e) {}
    });
  }

  // --- Live clock in the footer --------------------------------------
  function tickClock() {
    var el = document.getElementById('live-time');
    if (!el) return;
    el.textContent = new Date().toLocaleTimeString('en-US', {
      hour: '2-digit', minute: '2-digit', hour12: true
    });
  }

  // --- Visited bookmarks (persisted, mirrors original behaviour) ------
  function setupVisitedBookmarks() {
    var visited;
    try { visited = new Set(JSON.parse(localStorage.getItem('visitedBookmarks') || '[]')); }
    catch (e) { visited = new Set(); }

    document.querySelectorAll('a[data-url]').forEach(function (a) {
      var url = a.getAttribute('data-url');
      if (url && visited.has(url)) a.classList.add('visited');
      a.addEventListener('click', function () {
        if (!url) return;
        visited.add(url);
        try { localStorage.setItem('visitedBookmarks', JSON.stringify([].concat(Array.from(visited)))); } catch (e) {}
        a.classList.add('visited');
      });
    });
  }

  function init() {
    setupThemeToggle();
    setupVisitedBookmarks();
    tickClock();
    setInterval(tickClock, 1000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
