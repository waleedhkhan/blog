// Home "music" section: fetch recently played from the PHP proxy and render.
// DOM is built with createElement/textContent (no innerHTML) so track names
// coming from Spotify can never inject markup.
(function () {
  'use strict';

  var ENDPOINT = '/api/spotify.php?limit=6';
  var timer = null;

  function el(tag, className, attrs) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (attrs) Object.keys(attrs).forEach(function (k) { node.setAttribute(k, attrs[k]); });
    return node;
  }

  function trackItem(track, index) {
    var li = el('li');
    var a = el('a', 'group flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800', {
      href: track.url || '#', target: '_blank', rel: 'noopener noreferrer', 'data-track-index': index
    });

    var artContainer = el('div', 'album-art-container' + (index === 0 ? ' float' : ''));
    var visualizer = el('div', 'album-visualizer');
    for (var i = 0; i < 4; i++) visualizer.appendChild(el('span'));
    artContainer.appendChild(visualizer);

    var img = el('img', 'album-art h-12 w-12 rounded-md transition-all' + (index === 0 ? ' pulse' : ''), {
      src: track.image || '', alt: (track.name || '') + ' album art', loading: 'lazy',
      'data-artist': track.artist || '', 'data-track': track.name || ''
    });
    artContainer.appendChild(img);
    artContainer.appendChild(el('div', 'album-reflection'));
    artContainer.appendChild(el('div', 'album-glow'));

    var meta = el('div', 'flex-1 overflow-hidden');
    var name = el('p', 'truncate text-sm font-medium text-gray-900 dark:text-gray-300 track-name' + (index === 0 ? ' shimmer' : ''));
    name.textContent = track.name || '';
    var artist = el('p', 'truncate text-xs text-gray-700 dark:text-gray-500 track-artist');
    artist.textContent = track.artist || '';
    meta.appendChild(name);
    meta.appendChild(artist);

    a.appendChild(artContainer);
    a.appendChild(meta);
    li.appendChild(a);
    return li;
  }

  function render(tracks) {
    var container = document.getElementById('tracks-container');
    if (!container) return;
    container.replaceChildren();

    if (!tracks || !tracks.length) {
      var p = el('p', 'text-sm text-gray-700 dark:text-gray-500');
      p.textContent = 'No recently played tracks available';
      container.appendChild(p);
      return;
    }

    var ul = el('ul', 'grid grid-cols-2 gap-4');
    tracks.forEach(function (t, i) { ul.appendChild(trackItem(t, i)); });
    container.appendChild(ul);
    applyTilt();
  }

  // Subtle 3D tilt + visualizer response on hover (the original's signature effect).
  function applyTilt() {
    document.querySelectorAll('.album-art').forEach(function (art) {
      var container = art.parentElement;
      container.addEventListener('mousemove', function (e) {
        var r = container.getBoundingClientRect();
        var x = e.clientX - r.left, y = e.clientY - r.top;
        var tiltX = ((y / r.height) * 30 - 15).toFixed(2);
        var tiltY = (-(x / r.width) * 30 + 15).toFixed(2);
        art.style.transform = 'perspective(500px) rotateX(' + tiltX + 'deg) rotateY(' + tiltY + 'deg) scale(1.1)';
        container.querySelectorAll('.album-visualizer span').forEach(function (bar, i) {
          bar.style.height = Math.max(3, 5 + Math.sin((x / r.width) * Math.PI + i) * 8) + 'px';
        });
      });
      container.addEventListener('mouseleave', function () {
        art.style.transform = '';
        container.querySelectorAll('.album-visualizer span').forEach(function (bar) { bar.style.height = '5px'; });
      });
    });
  }

  async function refresh() {
    try {
      var res = await fetch(ENDPOINT);
      if (!res.ok) return;
      render(await res.json());
    } catch (e) { /* fail silently */ }
  }

  function start() {
    refresh();
    if (timer) clearInterval(timer);
    timer = setInterval(refresh, 60000);
  }

  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'visible') start();
    else if (timer) { clearInterval(timer); timer = null; }
  });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
