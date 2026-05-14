(function () {
  'use strict';
  var password = '';
  var savedContent = {};
  var lang = 'ru';

  function render() {
    var dict = savedContent[lang] || {};
    var html = `
      <div class="admin__field admin__field--wide" style="border: 1px solid var(--accent); padding: 15px; border-radius: 10px;">
        <label>💰 ГЛОБАЛЬНАЯ ЦЕНА SGX</label>
        <input type="text" id="global_price_input" value="${savedContent.global_price || '5.05'}" style="font-size: 20px; color: var(--accent);" />
      </div>
    `;
    // Тут можно добавить другие поля из вашего списка fields...
    document.getElementById('adminForm').innerHTML = html;
  }

  document.getElementById('adminLoginBtn').addEventListener('click', function () {
    password = document.getElementById('adminPassword').value;
    fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: password })
    }).then(r => r.json()).then(data => {
      if (data.ok) {
        document.getElementById('adminLogin').hidden = true;
        document.getElementById('adminEditor').hidden = false;
        fetch('/api/config').then(r => r.json()).then(d => {
          savedContent = d.content || {};
          render();
        });
      }
    });
  });

  document.getElementById('saveAdmin').addEventListener('click', function () {
    savedContent.global_price = document.getElementById('global_price_input').value;
    fetch('/api/admin/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: password, content: savedContent })
    }).then(() => alert('Сохранено!'));
  });
})();
