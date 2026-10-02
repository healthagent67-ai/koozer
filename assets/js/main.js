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

  /* ---------- Estimate / contact form ----------
     Set data-endpoint on the <form> to a form-handling service URL (Formspree,
     Netlify Forms, Web3Forms, etc.) and submissions are posted there.
     With no endpoint, the form falls back to opening the visitor's email app
     with the request pre-filled, so nothing is silently lost. */
  var form = document.querySelector('[data-estimate-form]');
  if (form) {
    var status = form.querySelector('.form-status');
    var submitBtn = form.querySelector('button[type="submit"]');
    var say = function (msg, isError) {
      status.textContent = msg;
      status.hidden = false;
      status.classList.toggle('form-status--error', !!isError);
      status.focus();
    };
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }
      var data = new FormData(form);
      if (data.get('website')) { say('Thank you. Your request has been sent.'); form.reset(); return; } // honeypot
      var endpoint = form.getAttribute('data-endpoint');
      var phone = form.getAttribute('data-phone') || '843-881-2212';

      if (endpoint) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Sending…';
        fetch(endpoint, { method: 'POST', body: data, headers: { Accept: 'application/json' } })
          .then(function (r) {
            if (!r.ok) throw new Error('bad response');
            say('Thank you. Your request has been sent, and we will be in touch soon.');
            form.reset();
          })
          .catch(function () {
            say('Sorry, your request could not be sent. Please call us at ' + phone + ' or email ' + form.getAttribute('data-email') + '.', true);
          })
          .finally(function () {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Send request';
          });
        return;
      }

      var lines = [
        'Name: ' + data.get('name'),
        'Phone: ' + data.get('phone'),
        'Email: ' + data.get('email'),
        'Project type: ' + data.get('project'),
        'Property location: ' + (data.get('location') || 'Not provided')
      ];
      if (data.get('property')) lines.push('Property type: ' + data.get('property'));
      if (data.get('timeline')) lines.push('Timeline: ' + data.get('timeline'));
      lines.push('', data.get('message'));
      var mail = 'mailto:' + form.getAttribute('data-email') +
        '?cc=' + encodeURIComponent(form.getAttribute('data-cc') || '') +
        '&subject=' + encodeURIComponent('Free estimate request: ' + data.get('project')) +
        '&body=' + encodeURIComponent(lines.join('\n'));
      window.location.href = mail;
      say('Your email app should open with your request ready to send. If it does not, email ' + form.getAttribute('data-email') + ' or call ' + phone + '.');
    });
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
