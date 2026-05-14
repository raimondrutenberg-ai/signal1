/* SIGNAL — page controller */

(function () {
  'use strict';

  var html = document.documentElement;
  var i18n = window.SIGNAL_I18N || {};
  var apiBase = '';
  var currentLang = 'ru';

  window.SIGNAL_API_BASE = apiBase;

  function mergeContent(content) {
    content = content || {};
    Object.keys(content).forEach(function (lang) {
      i18n[lang] = Object.assign({}, i18n[lang] || {}, content[lang] || {});
    });
  }

  function notifyContentReady() {
    window.dispatchEvent(new CustomEvent('signal:content-ready', {
      detail: { i18n: i18n, lang: currentLang }
    }));
  }

  /* ---------- year ---------- */
  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- language ----------
     Current mockup is Russian-only. Other languages can be added later. */
  function getLangFromUrl() {
    var m = (location.hash || '').match(/lang=(en|ru|es)/);
    return m ? m[1] : null;
  }
  function setUrlLang(lang) {
    var rest = (location.hash || '').replace(/(^|&|#)lang=(en|ru|es)/, '').replace(/^#/, '');
    var hash = 'lang=' + lang + (rest ? '&' + rest.replace(/^&/, '') : '');
    history.replaceState(null, '', '#' + hash);
  }

  function applyLang(lang) {
    if (!i18n[lang]) lang = 'ru';
    currentLang = lang;
    html.setAttribute('lang', lang);
    html.setAttribute('data-lang', lang);
    var dict = i18n[lang];

    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      var key = el.getAttribute('data-i18n');
      if (dict[key] != null) {
        // preserve badge dot for badge spans
        if (el.classList.contains('badge')) {
          var dot = el.querySelector('.badge__dot');
          el.textContent = '';
          if (dot) el.appendChild(dot);
          el.appendChild(document.createTextNode(' ' + dict[key]));
        } else {
          el.textContent = dict[key];
        }
      }
    });

    document.querySelectorAll('.lang__btn').forEach(function (b) {
      var active = b.getAttribute('data-lang-set') === lang;
      b.classList.toggle('is-active', active);
      b.setAttribute('aria-pressed', active ? 'true' : 'false');
    });

    // update page title for accessibility
    var titles = {
      ru: 'SIGNAL — ранний доступ к SGX',
      en: 'SIGNAL — early access to SGX',
      es: 'SIGNAL — acceso temprano a SGX'
    };
    document.title = titles[lang] || titles.ru;
  }

  window.SIGNAL_APPLY_LANG = applyLang;
  window.SIGNAL_MERGE_CONTENT = function (content) {
    mergeContent(content);
    applyLang(currentLang);
    notifyContentReady();
  };

  document.querySelectorAll('[data-lang-set]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var lang = btn.getAttribute('data-lang-set');
      setUrlLang(lang);
      applyLang(lang);
    });
  });

  function boot() {
    applyLang(getLangFromUrl() || 'ru');
    fetch(apiBase + '/api/config')
      .then(function (res) { return res.ok ? res.json() : { content: {} }; })
      .then(function (data) {
        mergeContent(data.content || {});
        applyLang(getLangFromUrl() || currentLang);
        notifyContentReady();
      })
      .catch(function () {
        notifyContentReady();
      });
  }

  boot();

  /* ---------- mobile menu ---------- */
  var burger = document.querySelector('.nav__burger');
  var menu = document.getElementById('mobileMenu');
  function setMenu(open) {
    if (!burger || !menu) return;
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (open) {
      menu.hidden = false;
      requestAnimationFrame(function () { menu.classList.add('is-open'); });
    } else {
      menu.classList.remove('is-open');
      menu.hidden = true;
    }
  }
  if (burger && menu) {
    burger.addEventListener('click', function () {
      setMenu(burger.getAttribute('aria-expanded') !== 'true');
    });
    menu.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () { setMenu(false); });
    });
  }

  /* ---------- smooth anchor scroll with sticky-nav offset ---------- */
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var href = a.getAttribute('href');
      if (!href || href === '#' || href.length < 2) return;
      var target = document.querySelector(href);
      if (!target) return;
      e.preventDefault();
      var navH = document.querySelector('.nav');
      var offset = (navH ? navH.offsetHeight : 0) + 8;
      var top = target.getBoundingClientRect().top + window.pageYOffset - offset;
      window.scrollTo({ top: top, behavior: 'smooth' });
    });
  });

  /* ---------- reveal on scroll ---------- */
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-revealed');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    document.querySelectorAll('.card, .flow__node, .stat, .cta-card, .hero__copy, .hero__device, .section__head')
      .forEach(function (el) {
        el.classList.add('reveal');
        io.observe(el);
      });
  }

  /* ---------- nav scroll style ---------- */
  var nav = document.getElementById('nav');
  function onScroll() {
    if (!nav) return;
    if (window.scrollY > 8) nav.classList.add('is-scrolled');
    else nav.classList.remove('is-scrolled');
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
})();
