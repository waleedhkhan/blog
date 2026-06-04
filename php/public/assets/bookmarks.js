// Bookmarks page: category + search filtering. Ported from the original inline script.
(function () {
  'use strict';

  var activeCategory = 'all';
  var ACTIVE = 'category-chip bg-gray-800 text-white dark:bg-white dark:text-gray-900 px-3 py-1.5 text-xs border border-gray-200 dark:border-gray-700 hover:bg-gray-700 dark:hover:bg-gray-200 transition-colors';
  var INACTIVE = 'category-chip bg-gray-100 text-gray-800 dark:bg-neutral-800 dark:text-gray-200 px-3 py-1.5 text-xs border border-gray-200 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-neutral-700 transition-colors';

  function filter() {
    var search = document.getElementById('search-input');
    var term = search ? search.value.toLowerCase() : '';
    var cards = document.querySelectorAll('.bookmark-card');
    var visible = 0;

    cards.forEach(function (card) {
      var cats = (card.dataset.categories || '').toLowerCase().split(' ');
      var url = (card.dataset.url || '').toLowerCase();
      var title = (card.querySelector('a')?.textContent || '').toLowerCase();
      var desc = (card.querySelector('p')?.textContent || '').toLowerCase();

      var matchesCat = activeCategory === 'all' || cats.indexOf(activeCategory) !== -1;
      var matchesSearch = !term || title.includes(term) || desc.includes(term) || url.includes(term);

      if (matchesCat && matchesSearch) {
        card.style.display = '';
        visible++;
      } else {
        card.style.display = 'none';
      }
    });

    renumber();
    var noResults = document.getElementById('no-results');
    if (noResults) noResults.classList.toggle('hidden', visible > 0);
  }

  function renumber() {
    var visible = Array.from(document.querySelectorAll('.bookmark-card')).filter(function (c) {
      return c.style.display !== 'none';
    });
    var total = visible.length;
    visible.forEach(function (card, i) {
      var num = card.querySelector('.tabular-nums');
      if (num) num.textContent = String(total - i);
    });
  }

  function setupChips() {
    document.querySelectorAll('.category-chip').forEach(function (chip) {
      chip.addEventListener('click', function () {
        activeCategory = chip.dataset.category || 'all';
        document.querySelectorAll('.category-chip').forEach(function (c) { c.className = INACTIVE; });
        chip.className = ACTIVE;
        filter();
      });
    });
  }

  function init() {
    setupChips();
    var search = document.getElementById('search-input');
    if (search) search.addEventListener('input', filter);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
