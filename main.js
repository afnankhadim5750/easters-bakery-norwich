/* Easters Bakery — interactions: mobile menu, scroll-spy, counters, lightbox, accordion, open-now badge, mailto form. */
(function () {
  'use strict';
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Year */
  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* Mobile menu — instant open/close, no transitions (see CSS note) */
  var toggle = document.querySelector('[data-menu-toggle]');
  var menu = document.querySelector('[data-mobile-menu]');
  var menuIcon = toggle ? toggle.querySelector('i') : null;
  function setMenu(open) {
    if (!toggle || !menu) return;
    menu.classList.toggle('open', open);
    menu.hidden = !open;
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    if (menuIcon) menuIcon.className = open ? 'bi bi-x-lg' : 'bi bi-list';
    document.body.style.overflow = open ? 'hidden' : '';
  }
  if (toggle && menu) {
    toggle.addEventListener('click', function () {
      setMenu(!menu.classList.contains('open'));
    });
    menu.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () { setMenu(false); });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && menu.classList.contains('open')) {
        setMenu(false);
        toggle.focus();
      }
    });
  }

  /* Scroll-spy via IntersectionObserver */
  var navLinks = Array.prototype.slice.call(document.querySelectorAll('.main-nav a'));
  var sections = navLinks
    .map(function (a) { return document.querySelector(a.getAttribute('href')); })
    .filter(Boolean);
  if ('IntersectionObserver' in window && sections.length) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var id = '#' + entry.target.id;
        navLinks.forEach(function (a) {
          a.classList.toggle('active', a.getAttribute('href') === id);
        });
      });
    }, { rootMargin: '-40% 0px -55% 0px' });
    sections.forEach(function (s) { spy.observe(s); });
  }

  /* Animated counters — verified numbers only */
  var counters = document.querySelectorAll('.count');
  function animateCount(el) {
    var target = parseFloat(el.getAttribute('data-count'));
    var decimals = parseInt(el.getAttribute('data-decimals') || '0', 10);
    var plain = el.getAttribute('data-plain') === 'true';
    if (reduceMotion || plain) { el.textContent = target.toFixed(decimals); return; }
    var start = null;
    var duration = 1200;
    function step(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / duration, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = (target * eased).toFixed(decimals);
      if (p < 1) requestAnimationFrame(step);
      else el.textContent = target.toFixed(decimals);
    }
    requestAnimationFrame(step);
  }
  if ('IntersectionObserver' in window && counters.length) {
    var cObs = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { animateCount(entry.target); obs.unobserve(entry.target); }
      });
    }, { threshold: 0.5 });
    counters.forEach(function (c) { cObs.observe(c); });
  }

  /* Lightbox */
  var items = Array.prototype.slice.call(document.querySelectorAll('.masonry-item'));
  var lightbox = document.getElementById('lightbox');
  var lbImg = document.getElementById('lb-img');
  var lbCap = document.getElementById('lb-cap');
  var current = 0;
  var lastFocus = null;
  function showLb(i) {
    current = (i + items.length) % items.length;
    var item = items[current];
    lbImg.src = item.getAttribute('data-full');
    lbImg.alt = item.getAttribute('data-alt') || '';
    lbCap.textContent = item.querySelector('.masonry-cap').textContent;
    lightbox.hidden = false;
    document.body.style.overflow = 'hidden';
    lightbox.querySelector('.lb-close').focus();
  }
  function hideLb() {
    lightbox.hidden = true;
    document.body.style.overflow = '';
    if (lastFocus) lastFocus.focus();
  }
  if (items.length && lightbox) {
    items.forEach(function (item, i) {
      item.addEventListener('click', function () { lastFocus = item; showLb(i); });
    });
    lightbox.querySelector('.lb-close').addEventListener('click', hideLb);
    lightbox.querySelector('.lb-prev').addEventListener('click', function () { showLb(current - 1); });
    lightbox.querySelector('.lb-next').addEventListener('click', function () { showLb(current + 1); });
    lightbox.addEventListener('click', function (e) { if (e.target === lightbox) hideLb(); });
    document.addEventListener('keydown', function (e) {
      if (lightbox.hidden) return;
      if (e.key === 'Escape') hideLb();
      if (e.key === 'ArrowLeft') showLb(current - 1);
      if (e.key === 'ArrowRight') showLb(current + 1);
    });
  }

  /* FAQ accordion */
  document.querySelectorAll('.acc-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var panel = document.getElementById(btn.getAttribute('aria-controls'));
      var open = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', String(!open));
      panel.hidden = open;
    });
  });

  /* Open-now badge — derived from the verified hours (Mon–Thu 7–16, Fri–Sat 7–15, Sun closed) */
  var badge = document.getElementById('open-badge');
  if (badge) {
    try {
      var now = new Date();
      var day = now.getDay(); // 0 = Sunday
      var mins = now.getHours() * 60 + now.getMinutes();
      var open = false, opensAt = '';
      if (day === 0) { open = false; opensAt = 'Closed today — back Monday at 7am'; }
      else if (day === 5 || day === 6) { open = mins >= 420 && mins < 900; opensAt = 'Open today 7am – 3pm'; }
      else { open = mins >= 420 && mins < 960; opensAt = 'Open today 7am – 4pm'; }
      badge.textContent = open ? 'Open now · ' + opensAt : opensAt;
    } catch (err) {
      badge.textContent = 'Open Mon–Sat from 7am';
    }
  }

  /* Order form — opens the visitor's email addressed to the bakery */
  var form = document.getElementById('order-form');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = document.getElementById('order-name').value.trim();
      var msg = document.getElementById('order-message').value.trim();
      var subject = encodeURIComponent('Order enquiry from ' + name + ' — Easters Bakery website');
      var body = encodeURIComponent('Hello Easters Bakery,\n\n' + msg + '\n\n— ' + name);
      window.location.href = 'mailto:hello@eastersbakery.com?subject=' + subject + '&body=' + body;
    });
  }
})();
