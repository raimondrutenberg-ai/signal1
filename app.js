(function () {
  'use strict';
  var i18n = window.SIGNAL_I18N || {};
  var currentLang = 'ru';
  var lastPrice = '5.05'; 

  function updateGlobalPrices(price) {
    if (!price) return;
    lastPrice = price;
    document.querySelectorAll('.sgx-price').forEach(function (el) {
      el.textContent = price;
    });
  }

  function applyLang(lang) {
    currentLang = lang;
    document.documentElement.setAttribute('data-lang', lang);
    var dict = i18n[lang] || {};

    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      var key = el.getAttribute('data-i18n');
      if (dict[key]) {
        // Если внутри есть место для цены, сохраняем его
        if (el.querySelector('.sgx-price')) {
          el.innerHTML = dict[key].replace(/\$5[.,]05/g, '$<span class="sgx-price">' + lastPrice + '</span>');
        } else {
          el.textContent = dict[key];
        }
      }
    });
    updateGlobalPrices(lastPrice);
  }

  window.SIGNAL_MERGE_CONTENT = function (content) {
    if (content.global_price) lastPrice = content.global_price;
    Object.keys(content).forEach(function (k) {
      if (k !== 'global_price') i18n[k] = Object.assign({}, i18n[k] || {}, content[k] || {});
    });
    applyLang(currentLang);
  };

  function boot() {
    fetch('/api/config').then(r => r.json()).then(d => window.SIGNAL_MERGE_CONTENT(d.content || {}));
  }
  
  document.querySelectorAll('[data-lang-set]').forEach(b => {
    b.addEventListener('click', () => applyLang(b.getAttribute('data-lang-set')));
  });

  boot();
})();
