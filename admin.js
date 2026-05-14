(function () {
  'use strict';

  var panel = document.getElementById('adminPanel');
  if (!panel) return;

  var apiBase = '';
  var base = window.SIGNAL_I18N || {};
  var lang = 'ru';
  var password = '';
  var savedContent = {};

  var fields = [
    ['hero.badge', 'Верхний бейдж', false],
    ['hero.title1', 'Hero: строка 1', false],
    ['hero.title2', 'Hero: зелёная строка', false],
    ['hero.sub', 'Hero: главный текст', true],
    ['hero.b1', 'Hero: пункт 1 / цена', false],
    ['hero.b2', 'Hero: пункт 2', false],
    ['hero.b3', 'Hero: пункт 3', false],
    ['hero.b4', 'Hero: пункт 4', false],
    ['hero.b5', 'Hero: пункт 5', false],
    ['hero.network', 'Hero: объяснение под списком', true],
    ['hero.cta1', 'Hero: главная кнопка', false],
    ['hero.cta2', 'Hero: вторая кнопка', false],
    ['proof.eyebrow', 'График: бейдж', false],
    ['proof.title1', 'График: заголовок с ценой', false],
    ['proof.title2', 'График: зелёная строка', false],
    ['proof.text', 'График: описание', true],
    ['proof.todayLabel', 'График: дата', false],
    ['proof.currentPrice', 'График: текущая цена', false],
    ['proof.stageValue', 'График: этап', false],
    ['proof.nextValue', 'График: следующие условия', false],
    ['proof.chartLabel', 'График: подпись', false],
    ['proof.chartSub', 'График: подзаголовок', false],
    ['proof.note', 'График: дисклеймер', true],
    ['proof.cta', 'График: кнопка', false],
    ['why.title1', 'Почему Signal: заголовок 1', false],
    ['why.title2', 'Почему Signal: заголовок 2', false],
    ['why.lede', 'Почему Signal: текст', true],
    ['signal.title1', 'Signal: заголовок 1', false],
    ['signal.title2', 'Signal: заголовок 2', false],
    ['signal.lede', 'Signal: описание 1', true],
    ['signal.lede2', 'Signal: описание 2', true],
    ['how.title1', 'SGX: заголовок 1', false],
    ['how.title2', 'SGX: заголовок 2', false],
    ['how.lede', 'SGX: простое объяснение', true],
    ['sgx.title1', 'Экосистема: заголовок 1', false],
    ['sgx.title2', 'Экосистема: заголовок 2', false],
    ['sgx.lede', 'Экосистема: описание', true],
    ['sgx.c1b', 'Карточка SGX: цена', true],
    ['sgx.c5b', 'Карточка SGX: следующие этапы', true],
    ['license.title1', 'Лицензия: заголовок 1', false],
    ['license.title2', 'Лицензия: заголовок 2', false],
    ['license.lede', 'Лицензия: описание', true],
    ['cta.title1', 'Финал: заголовок 1', false],
    ['cta.title2', 'Финал: заголовок 2', false],
    ['cta.sub', 'Финал: текст', true],
    ['cta.b1', 'Финал: главная кнопка', false],
    ['cta.b2', 'Финал: вторая кнопка', false],
    ['footer.status', 'Footer: статус', false],
    ['footer.fine', 'Footer: дисклеймер', true]
  ];

  var login = document.getElementById('adminLogin');
  var editor = document.getElementById('adminEditor');
  var form = document.getElementById('adminForm');
  var status = document.getElementById('adminStatus');
  var loginStatus = document.getElementById('adminLoginStatus');
  var passInput = document.getElementById('adminPassword');

  function isAdminHash() {
    return (location.hash || '').indexOf('admin') !== -1;
  }

  function showAdmin(open) {
    panel.hidden = !open;
    document.body.classList.toggle('admin-open', open);
    if (open) {
      setTimeout(function () { if (passInput && !password) passInput.focus(); }, 60);
    }
  }

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function currentDict() {
    return Object.assign({}, base[lang] || {}, (savedContent[lang] || {}));
  }

  function render() {
    var dict = currentDict();
    form.innerHTML = fields.map(function (f) {
      var key = f[0], label = f[1], multiline = f[2];
      var value = escapeHtml(dict[key] || '');
      var input = multiline
        ? '<textarea data-key="' + key + '">' + value + '</textarea>'
        : '<input data-key="' + key + '" value="' + value + '" />';
      return '<div class="admin__field' + (multiline ? ' admin__field--wide' : '') + '"><label>' + label + '</label>' + input + '</div>';
    }).join('');
  }

  function setStatus(text, isError) {
    status.textContent = text || '';
    status.style.color = isError ? '#ff8b8b' : 'var(--accent)';
  }

  function loadConfig() {
    return fetch(apiBase + '/api/config')
      .then(function (res) { return res.json(); })
      .then(function (data) {
        savedContent = data.content || {};
        render();
        return savedContent;
      });
  }

  function collectActiveLang() {
    savedContent[lang] = savedContent[lang] || {};
    form.querySelectorAll('[data-key]').forEach(function (el) {
      savedContent[lang][el.getAttribute('data-key')] = el.value;
    });
  }

  function saveConfig() {
    collectActiveLang();
    setStatus('Сохраняю изменения...', false);
    fetch(apiBase + '/api/admin/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: password, content: savedContent })
    })
      .then(function (res) {
        return res.json().then(function (data) {
          if (!res.ok || !data.ok) throw new Error(data.error || 'Ошибка сохранения');
          return data;
        });
      })
      .then(function (data) {
        savedContent = data.content || savedContent;
        if (window.SIGNAL_MERGE_CONTENT) window.SIGNAL_MERGE_CONTENT(savedContent);
        setStatus('Сохранено. Посетители теперь увидят обновлённую версию.', false);
        render();
      })
      .catch(function (err) {
        setStatus(err.message || 'Не удалось сохранить', true);
      });
  }

  document.querySelectorAll('[data-admin-lang]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      collectActiveLang();
      lang = btn.getAttribute('data-admin-lang');
      document.querySelectorAll('[data-admin-lang]').forEach(function (b) {
        b.classList.toggle('is-active', b === btn);
      });
      render();
      setStatus('', false);
    });
  });

  document.getElementById('adminLoginBtn').addEventListener('click', function () {
    password = passInput.value;
    loginStatus.textContent = 'Проверяю пароль...';
    fetch(apiBase + '/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: password })
    })
      .then(function (res) { return res.json(); })
      .then(function (data) {
        if (!data.ok) {
          password = '';
          loginStatus.textContent = 'Неверный пароль.';
          return;
        }
        login.hidden = true;
        editor.hidden = false;
        loginStatus.textContent = '';
        loadConfig().then(function () {
          setStatus('Админка открыта. Можно менять тексты и значения.', false);
        });
      })
      .catch(function () {
        password = '';
        loginStatus.textContent = 'Сервер админки пока недоступен.';
      });
  });

  passInput.addEventListener('keydown', function (event) {
    if (event.key === 'Enter') document.getElementById('adminLoginBtn').click();
  });

  document.getElementById('saveAdmin').addEventListener('click', saveConfig);
  document.getElementById('reloadAdmin').addEventListener('click', function () {
    loadConfig().then(function () { setStatus('Данные обновлены с сервера.', false); });
  });

  window.addEventListener('hashchange', function () {
    showAdmin(isAdminHash());
  });

  window.addEventListener('signal:content-ready', function (event) {
    base = event.detail.i18n || base;
    if (!editor.hidden) render();
  });

  showAdmin(isAdminHash());
  render();
})();
