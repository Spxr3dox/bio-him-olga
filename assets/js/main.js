/* ============================================================
   Ольга Журавель — репетитор з хімії та біології
   Скрипти: шапка, мобільне меню, поява блоків, фон «зв'язків»
   ============================================================ */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- 1. Стан закріпленої шапки ---------- */
  var header = document.querySelector('.site-header');
  var onScroll = function () {
    header.classList.toggle('is-scrolled', window.scrollY > 10);
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---------- 2. Мобільне меню ---------- */
  var burger = document.getElementById('burger');
  var nav = document.getElementById('nav');

  var closeNav = function () {
    nav.classList.remove('is-open');
    burger.setAttribute('aria-expanded', 'false');
    burger.setAttribute('aria-label', 'Відкрити меню');
  };

  burger.addEventListener('click', function () {
    var open = nav.classList.toggle('is-open');
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Закрити меню' : 'Відкрити меню');
  });

  nav.addEventListener('click', function (e) {
    if (e.target.closest('a')) closeNav();
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeNav();
  });

  document.addEventListener('click', function (e) {
    if (!nav.contains(e.target) && !burger.contains(e.target)) closeNav();
  });

  window.addEventListener('resize', function () {
    if (window.innerWidth > 820) closeNav();
  });

  /* ---------- 3. Поява блоків при прокручуванні ---------- */
  var revealItems = document.querySelectorAll('[data-reveal]');

  if ('IntersectionObserver' in window && !reduceMotion) {
    document.body.classList.add('reveal-ready');

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry, i) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        var delay = Math.min(i * 90, 360);
        setTimeout(function () { el.classList.add('is-visible'); }, delay);
        io.unobserve(el);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });

    revealItems.forEach(function (el) { io.observe(el); });
  }

  /* ---------- 4. Підсвічування активного пункту меню ---------- */
  var sections = document.querySelectorAll('main section[id]');
  var navLinks = document.querySelectorAll('.nav a');

  if ('IntersectionObserver' in window && navLinks.length) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        navLinks.forEach(function (a) {
          a.classList.toggle('is-active', a.getAttribute('href') === '#' + entry.target.id);
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });

    sections.forEach(function (s) { spy.observe(s); });
  }

  /* ---------- 5. Поточний рік у підвалі ---------- */
  var year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();

  /* ---------- 6. Телефон на комп'ютері ----------
     На мобільному tel: одразу відкриває набір номера (вимога ТЗ).
     На комп'ютері система показує вікно «чим відкрити посилання», тому там
     клік копіює номер і показує підказку. Розмітка tel: лишається на всіх номерах. */
  var PHONE_TEXT = '0 (68) 077 26 07';
  var toast = document.getElementById('toast');
  var toastText = document.getElementById('toastText');
  var toastTimer = null;

  var showToast = function (html) {
    if (!toast) return;
    toastText.innerHTML = html;
    toast.classList.add('is-shown');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toast.classList.remove('is-shown'); }, 3400);
  };

  var copyText = function (text, done) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () { done(true); }, function () { done(fallbackCopy(text)); });
    } else {
      done(fallbackCopy(text));
    }
  };

  function fallbackCopy(text) {
    try {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.cssText = 'position:fixed;top:-1000px;opacity:0';
      document.body.appendChild(ta);
      ta.select();
      var ok = document.execCommand('copy');
      document.body.removeChild(ta);
      return ok;
    } catch (err) {
      return false;
    }
  }

  var isPointerDevice = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  if (isPointerDevice && toast) {
    document.querySelectorAll('a[href^="tel:"]').forEach(function (link) {
      link.addEventListener('click', function (e) {
        e.preventDefault();
        var number = link.getAttribute('href').replace('tel:', '');
        copyText(number, function (ok) {
          showToast(ok
            ? 'Номер скопійовано: <b>' + PHONE_TEXT + '</b>'
            : 'Телефонуйте: <b>' + PHONE_TEXT + '</b>');
        });
      });
    });
  }

  /* ---------- 7. Фон: молекулярні зв'язки ---------- */
  var canvases = document.querySelectorAll('[data-bonds]');

  canvases.forEach(function (canvas) {
    var ctx = canvas.getContext('2d');
    if (!ctx) return;

    // на світлому тлі потрібні темніші лінії, на темній картці — яскраві
    var onDark = canvas.getAttribute('data-bonds') === 'dark';
    var COLORS = onDark
      ? ['46,196,182', '16,185,129', '0,180,216']
      : ['13,148,136', '2,132,199', '5,150,105'];
    var LINE_ALPHA = onDark ? 0.30 : 0.26;
    var NODE_ALPHA = onDark ? 0.75 : 0.50;
    var nodes = [];
    var w = 0, h = 0, dpr = 1, raf = null, visible = true;

    var build = function () {
      var rect = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = Math.max(rect.width, 1);
      h = Math.max(rect.height, 1);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      var count = Math.round(Math.min(Math.max((w * h) / 22000, 26), 78));
      nodes = [];
      for (var i = 0; i < count; i++) {
        nodes.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.26,
          vy: (Math.random() - 0.5) * 0.26,
          r: 1.1 + Math.random() * 2.1,
          c: COLORS[i % COLORS.length]
        });
      }
    };

    var draw = function () {
      ctx.clearRect(0, 0, w, h);
      var linkDist = w < 640 ? 108 : 148;

      for (var i = 0; i < nodes.length; i++) {
        var a = nodes[i];
        for (var j = i + 1; j < nodes.length; j++) {
          var b = nodes[j];
          var dx = a.x - b.x, dy = a.y - b.y;
          var dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < linkDist) {
            ctx.strokeStyle = 'rgba(' + a.c + ',' + (LINE_ALPHA * (1 - dist / linkDist)).toFixed(3) + ')';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      for (var k = 0; k < nodes.length; k++) {
        var n = nodes[k];
        ctx.fillStyle = 'rgba(' + n.c + ',' + NODE_ALPHA + ')';
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    var step = function () {
      for (var i = 0; i < nodes.length; i++) {
        var n = nodes[i];
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < -20) n.x = w + 20;
        if (n.x > w + 20) n.x = -20;
        if (n.y < -20) n.y = h + 20;
        if (n.y > h + 20) n.y = -20;
      }
      draw();
      raf = requestAnimationFrame(step);
    };

    var start = function () {
      if (raf === null && visible && !document.hidden) raf = requestAnimationFrame(step);
    };
    var stop = function () {
      if (raf !== null) { cancelAnimationFrame(raf); raf = null; }
    };

    build();
    draw();

    if (!reduceMotion) {
      if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (entries) {
          visible = entries[0].isIntersecting;
          visible ? start() : stop();
        }, { threshold: 0 }).observe(canvas);
      } else {
        start();
      }

      document.addEventListener('visibilitychange', function () {
        document.hidden ? stop() : start();
      });
    }

    var resizeTimer;
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        build();
        draw();
      }, 200);
    });
  });
})();
