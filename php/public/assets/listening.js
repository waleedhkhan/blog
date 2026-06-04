// /listening dashboard: time-range pills + Spotify stats, rendered safely.
(function () {
  'use strict';

  var range = 'short_term';
  var content = function () { return document.getElementById('listening-content'); };

  function el(tag, className, text) {
    var n = document.createElement(tag);
    if (className) n.className = className;
    if (text != null) n.textContent = text;
    return n;
  }

  function img(src, alt) {
    var i = document.createElement('img');
    i.src = src || '';
    i.alt = alt || '';
    i.loading = 'lazy';
    return i;
  }

  function link(href) {
    var a = el('a');
    a.href = href || '#';
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    return a;
  }

  function fmtDuration(ms) {
    var m = Math.floor(ms / 60000), s = Math.floor((ms % 60000) / 1000);
    return m + ':' + String(s).padStart(2, '0');
  }

  function fmtTime(dateStr) {
    var diff = Date.now() - new Date(dateStr).getTime();
    var mins = Math.floor(diff / 60000), hrs = Math.floor(diff / 3600000), days = Math.floor(diff / 86400000);
    if (mins < 60) return mins + 'm ago';
    if (hrs < 24) return hrs + 'h ago';
    return days + 'd ago';
  }

  function section(title) {
    var s = el('section', 'section');
    s.appendChild(el('h2', 'section-title', title));
    return s;
  }

  function infoBlock(name, artist) {
    var info = el('div', 'info');
    info.appendChild(el('span', 'name', name));
    info.appendChild(el('span', 'artist', artist));
    return info;
  }

  function render(data) {
    var root = content();
    if (!root) return;
    root.replaceChildren();

    if (!data || (!data.topTracks.length && !data.topArtists.length && !data.recentTracks.length)) {
      root.appendChild(el('p', 'text-gray-500 dark:text-gray-400', 'No listening data available.'));
      return;
    }

    if (data.topTracks.length) {
      var s = section('Top Tracks');
      var tracks = el('div', 'tracks');
      data.topTracks.slice(0, 10).forEach(function (t, i) {
        var a = link(t.url); a.className = 'track';
        a.appendChild(el('span', 'num', String(i + 1)));
        a.appendChild(img(t.image, t.name));
        a.appendChild(infoBlock(t.name, t.artist));
        a.appendChild(el('span', 'duration', fmtDuration(t.duration)));
        tracks.appendChild(a);
      });
      s.appendChild(tracks); root.appendChild(s);
    }

    if (data.topArtists.length) {
      var sa = section('Top Artists');
      var artists = el('div', 'artists');
      data.topArtists.slice(0, 6).forEach(function (artist) {
        var a = link(artist.url); a.className = 'artist-card';
        a.appendChild(img(artist.image, artist.name));
        a.appendChild(el('span', 'name', artist.name));
        artists.appendChild(a);
      });
      sa.appendChild(artists); root.appendChild(sa);
    }

    if (data.recentTracks.length) {
      var sr = section('Recent');
      var recent = el('div', 'recent');
      data.recentTracks.slice(0, 10).forEach(function (t) {
        var a = link(t.url); a.className = 'recent-track';
        a.appendChild(img(t.image, t.name));
        a.appendChild(infoBlock(t.name, t.artist));
        a.appendChild(el('span', 'time', t.playedAt ? fmtTime(t.playedAt) : ''));
        recent.appendChild(a);
      });
      sr.appendChild(recent); root.appendChild(sr);
    }
  }

  async function load() {
    var root = content();
    if (root) root.replaceChildren(function () { var d = el('div', 'loading'); d.appendChild(el('div', 'spinner')); return d; }());
    try {
      var res = await fetch('/api/spotify-stats.php?time_range=' + range);
      if (!res.ok) throw new Error('failed');
      render(await res.json());
    } catch (e) {
      if (root) {
        root.replaceChildren();
        var err = el('div', 'error');
        err.appendChild(el('p', null, 'Failed to load data'));
        root.appendChild(err);
      }
    }
  }

  function init() {
    document.querySelectorAll('.pill').forEach(function (pill) {
      pill.addEventListener('click', function () {
        range = pill.dataset.range || 'short_term';
        document.querySelectorAll('.pill').forEach(function (p) { p.classList.remove('active'); });
        pill.classList.add('active');
        load();
      });
    });
    load();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
