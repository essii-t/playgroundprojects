(function () {
  Auth.redirectIfLoggedIn();

  document.getElementById('login-root').innerHTML = `
    <div class="login-page">
      <div>
        <div class="login-brand">
          <span class="mark">${icon('logo')}</span>
          Meridian
        </div>
        <div class="card login-card">
          <div class="page-eyebrow">Welcome back</div>
          <div class="page-title">Sign in to Meridian</div>
          <div class="login-error" id="login-error">Enter an email and password to continue.</div>
          <form id="login-form">
            <div class="form-field">
              <label>Email</label>
              <input type="email" id="login-email" placeholder="you@example.com" autocomplete="email" />
            </div>
            <div class="form-field">
              <label>Password</label>
              <input type="password" id="login-password" placeholder="••••••••" autocomplete="current-password" />
            </div>
            <button type="submit" class="btn btn-primary" style="width:100%; justify-content:center;">Sign in</button>
          </form>
          <div class="login-caption">This is a prototype — any email and password will work.</div>
        </div>
      </div>
    </div>
  `;

  document.getElementById('login-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value.trim();
    const errorEl = document.getElementById('login-error');
    if (!email || !password) {
      errorEl.classList.add('show');
      return;
    }
    errorEl.classList.remove('show');
    Auth.login(email);
    window.location.href = 'index.html';
  });
})();
