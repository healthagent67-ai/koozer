(function () {
  'use strict';

  /* ---------- Mobile navigation ---------- */
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.getElementById('site-nav');
  if (toggle && nav) {
    var setNav = function (open) {
      toggle.setAttribute('aria-expanded', String(open));
      nav.classList.toggle('is-open', open);
    };
    toggle.addEventListener('click', function () {
      setNav(toggle.getAttribute('aria-expanded') !== 'true');
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') setNav(false);
    });
    window.matchMedia('(min-width: 921px)').addEventListener('change', function () { setNav(false); });
  }

  /* ---------- Scroll reveal ---------- */
  var revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && revealEls.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('is-visible'); });
  }

  /* ---------- Gallery lightbox ---------- */
  var box = document.getElementById('lightbox');
  var allTiles = Array.prototype.slice.call(document.querySelectorAll('.tile'));
  if (!box || !allTiles.length) return;

  var tiles = allTiles;
  var boxImg = box.querySelector('.lightbox__img');
  var boxCap = box.querySelector('.lightbox__cap');
  var current = 0;
  var opener = null;

  /* Optional category filters (projects page) */
  var filterBar = document.querySelector('.filters');
  var countEl = document.getElementById('filter-count');
  if (filterBar) {
    filterBar.addEventListener('click', function (e) {
      var btn = e.target.closest('.filter');
      if (!btn) return;
      var key = btn.dataset.filter;
      filterBar.querySelectorAll('.filter').forEach(function (b) {
        b.setAttribute('aria-pressed', String(b === btn));
      });
      var shown = 0;
      allTiles.forEach(function (t) {
        var match = key === 'all' || t.dataset.group === key;
        t.hidden = !match;
        if (match) shown++;
      });
      if (countEl) countEl.textContent = 'Showing ' + shown + ' photo' + (shown === 1 ? '' : 's');
    });
  }

  function show(i) {
    current = (i + tiles.length) % tiles.length;
    var tile = tiles[current];
    var img = tile.querySelector('img');
    boxImg.src = tile.dataset.full || img.currentSrc || img.src;
    boxImg.alt = img.alt;
    boxCap.innerHTML = '';
    var cat = document.createElement('b');
    cat.textContent = tile.dataset.cat;
    boxCap.appendChild(cat);
    boxCap.appendChild(document.createTextNode(tile.dataset.title));
  }

  function open(tile) {
    opener = document.activeElement;
    tiles = allTiles.filter(function (t) { return !t.hidden; });
    show(tiles.indexOf(tile));
    box.hidden = false;
    box.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    box.querySelector('.lightbox__close').focus();
  }

  function close() {
    box.classList.remove('is-open');
    box.hidden = true;
    document.body.style.overflow = '';
    if (opener) opener.focus();
  }

  allTiles.forEach(function (tile) {
    tile.addEventListener('click', function () { open(tile); });
  });
  box.querySelector('.lightbox__close').addEventListener('click', close);
  box.querySelector('.lightbox__prev').addEventListener('click', function () { show(current - 1); });
  box.querySelector('.lightbox__next').addEventListener('click', function () { show(current + 1); });
  box.addEventListener('click', function (e) { if (e.target === box) close(); });

  document.addEventListener('keydown', function (e) {
    if (!box.classList.contains('is-open')) return;
    if (e.key === 'Escape') close();
    else if (e.key === 'ArrowLeft') show(current - 1);
    else if (e.key === 'ArrowRight') show(current + 1);
    else if (e.key === 'Tab') {
      var f = box.querySelectorAll('button');
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
})();
