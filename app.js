(function () {
  'use strict';
  var html = document.documentElement;
  var i18n = window.SIGNAL_I18N || {};
  var currentLang = 'ru';
  var lastPrice = '5.05'; 

  // Функция вставки цены во все спаны
  function updateGlobalPrices(price) {
    if (!price) return;
    lastPrice = price;
    document.querySelectorAll('.sgx-price').forEach(function (el) {
      el.textContent = price;
    });
  }

  function applyLang(lang) {
    if (!i18n[lang]) lang = 'ru';
    currentLang = lang;
    html.setAttribute('data-lang', lang);
    var dict = i18n[lang];

    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      var key = el.getAttribute('data-i18n');
      if (dict[key] != null) {
        // Если внутри элемента ЕСТЬ спан для цены, нам нужно его сохранить!
        if (el.querySelector('.sgx-price')) {
            // Заменяем текст, но оставляем структуру спана
            var text = dict[key];
            // Ищем в тексте старую цену и меняем на спан с актуальной ценой
            el.innerHTML = text.replace(/\$5[.,]05/g, '$<span class="sgx-price">' + lastPrice + '</span>');
        } else {
            el.textContent = dict[key];
        }
      }
    });
    
    updateGlobalPrices(lastPrice); // Повторный запуск для надежности
  }

  window.SIGNAL_MERGE_CONTENT = function (content) {
    if (content.global_price) lastPrice = content.global_price;
    Object.keys(content).forEach(function (k) {
      if (k !== 'global_price') i18n[k] = Object.assign({}, i18n[k] || {}, content[k] || {});
    });
    applyLang(currentLang);
  };

  function boot() {
    fetch('/api/config')
      .then(function (res) { return res.json(); })
      .then(function (data) {
        window.SIGNAL_MERGE_CONTENT(data.content || {});
      });
  }

  // Слушатели кнопок языков
  document.querySelectorAll('[data-lang-set]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      applyLang(btn.getAttribute('data-lang-set'));
    });
  });

  boot();

  // Инициализация анимаций появления
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-revealed');
        }
      });
    });
    document.querySelectorAll('.card, .hero__copy, .section__head').forEach(function (el) {
      el.classList.add('reveal');
      io.observe(el);
    });
  }
})();
