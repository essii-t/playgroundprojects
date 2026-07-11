(function () {
  const data = Store.get();
  const TABS = [
    { key: 'profile', label: 'Profile', icon: 'user' },
    { key: 'security', label: 'Security', icon: 'lock' },
    { key: 'notifications', label: 'Notifications', icon: 'bell' },
    { key: 'personalization', label: 'Personalization', icon: 'sliders' },
  ];
  let activeTab = 'profile';

  function renderMain() {
    document.getElementById('page-main').innerHTML = `
      <div class="page-header-row">
        <div>
          <div class="page-eyebrow">Account</div>
          <div class="page-title">Settings</div>
        </div>
      </div>
      <div style="display:flex; gap:20px; align-items:flex-start;">
        <div class="card" style="width:230px; flex-shrink:0; padding:12px;">
          ${TABS.map((t) => `
            <button type="button" class="settings-tab-btn ${t.key === activeTab ? 'active' : ''}" data-tab="${t.key}">
              ${icon(t.icon)}<span>${t.label}</span>
            </button>`).join('')}
        </div>
        <div class="card" style="flex:1; min-width:0;" id="settings-content"></div>
      </div>
    `;

    document.querySelectorAll('.settings-tab-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        activeTab = btn.dataset.tab;
        document.querySelectorAll('.settings-tab-btn').forEach((b) => b.classList.toggle('active', b === btn));
        renderTabContent();
      });
    });

    renderTabContent();
  }

  function renderTabContent() {
    const el = document.getElementById('settings-content');
    if (activeTab === 'profile') el.innerHTML = profileTab();
    if (activeTab === 'security') el.innerHTML = securityTab();
    if (activeTab === 'notifications') el.innerHTML = notificationsTab();
    if (activeTab === 'personalization') el.innerHTML = personalizationTab();
    wireTabEvents();
  }

  function profileTab() {
    const p = data.settings.profile;
    return `
      <div class="section-title" style="margin-bottom:16px;">Profile</div>
      <div class="form-field">
        <label>Full name</label>
        <input type="text" id="profile-name" value="${p.name}" />
      </div>
      <div class="form-field">
        <label>Email</label>
        <input type="email" id="profile-email" value="${p.email}" />
      </div>
      <div class="form-field">
        <label>Plan</label>
        <input type="text" value="${p.plan}" disabled style="color:var(--text-faint);" />
      </div>
      <button class="btn btn-primary" id="save-profile">Save changes</button>
    `;
  }

  function securityTab() {
    const s = data.settings.security;
    return `
      <div class="section-title" style="margin-bottom:4px;">Security</div>
      <div class="settings-row">
        <div>
          <div class="settings-row-label">Multi-factor authentication</div>
          <div class="settings-row-sub">Require a verification code in addition to your password.</div>
        </div>
        <label class="switch"><input type="checkbox" id="mfa-toggle" ${s.mfaEnabled ? 'checked' : ''}/><span class="slider"></span></label>
      </div>
      <div style="margin-top:20px;">
        <div class="section-sub" style="margin-bottom:8px;">Active sessions</div>
        <div id="sessions-list"></div>
      </div>
    `;
  }

  function renderSessions() {
    const list = document.getElementById('sessions-list');
    if (!list) return;
    const s = data.settings.security;
    list.innerHTML = s.sessions.length
      ? s.sessions.map((sess, i) => `
        <div class="settings-row">
          <div>
            <div class="settings-row-label">${sess.device}</div>
            <div class="settings-row-sub">${sess.location} &middot; ${sess.lastActive}</div>
          </div>
          <button class="btn btn-sm" data-session-index="${i}">Log out</button>
        </div>`).join('')
      : '<div class="section-sub">No other active sessions.</div>';

    document.querySelectorAll('[data-session-index]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const idx = Number(btn.dataset.sessionIndex);
        Store.update((d) => d.settings.security.sessions.splice(idx, 1));
        renderSessions();
      });
    });
  }

  function notificationsTab() {
    const n = data.settings.notifications;
    return `
      <div class="section-title" style="margin-bottom:4px;">Notifications</div>
      <div class="settings-row">
        <div>
          <div class="settings-row-label">Goal milestones</div>
          <div class="settings-row-sub">Get notified when a savings goal hits a milestone.</div>
        </div>
        <label class="switch"><input type="checkbox" data-notif-key="goalMilestones" ${n.goalMilestones ? 'checked' : ''}/><span class="slider"></span></label>
      </div>
      <div class="settings-row">
        <div>
          <div class="settings-row-label">Budget alerts</div>
          <div class="settings-row-sub">Get notified when a category goes over budget.</div>
        </div>
        <label class="switch"><input type="checkbox" data-notif-key="budgetAlerts" ${n.budgetAlerts ? 'checked' : ''}/><span class="slider"></span></label>
      </div>
      <div class="settings-row">
        <div>
          <div class="settings-row-label">Portfolio summaries</div>
          <div class="settings-row-sub">Get a weekly summary of your portfolio performance.</div>
        </div>
        <label class="switch"><input type="checkbox" data-notif-key="portfolioSummaries" ${n.portfolioSummaries ? 'checked' : ''}/><span class="slider"></span></label>
      </div>
    `;
  }

  function personalizationTab() {
    const p = data.settings.personalization;
    return `
      <div class="section-title" style="margin-bottom:4px;">Personalization</div>
      <div class="settings-row">
        <div>
          <div class="settings-row-label">Show Savings goals on Dashboard</div>
          <div class="settings-row-sub">Displays your goals progress on the dashboard overview.</div>
        </div>
        <label class="switch"><input type="checkbox" data-personalization-key="showGoalsOnDashboard" ${p.showGoalsOnDashboard ? 'checked' : ''}/><span class="slider"></span></label>
      </div>
      <div class="settings-row">
        <div>
          <div class="settings-row-label">Show Insights on Dashboard</div>
          <div class="settings-row-sub">Displays personalized insight cards on the dashboard overview.</div>
        </div>
        <label class="switch"><input type="checkbox" data-personalization-key="showInsightsOnDashboard" ${p.showInsightsOnDashboard ? 'checked' : ''}/><span class="slider"></span></label>
      </div>
      <p style="font-size:12.5px; color:var(--text-faint); margin-top:14px;">Changes apply the next time you open the Dashboard.</p>
    `;
  }

  function wireTabEvents() {
    if (activeTab === 'profile') {
      document.getElementById('save-profile').addEventListener('click', () => {
        const name = document.getElementById('profile-name').value.trim();
        const email = document.getElementById('profile-email').value.trim();
        Store.update((d) => {
          d.settings.profile.name = name || d.settings.profile.name;
          d.settings.profile.email = email || d.settings.profile.email;
        });
        const btn = document.getElementById('save-profile');
        btn.textContent = 'Saved!';
        setTimeout(() => (btn.textContent = 'Save changes'), 1500);
      });
    }
    if (activeTab === 'security') {
      renderSessions();
      document.getElementById('mfa-toggle').addEventListener('change', (e) => {
        Store.update((d) => (d.settings.security.mfaEnabled = e.target.checked));
      });
    }
    if (activeTab === 'notifications') {
      document.querySelectorAll('[data-notif-key]').forEach((input) => {
        input.addEventListener('change', (e) => {
          Store.update((d) => (d.settings.notifications[e.target.dataset.notifKey] = e.target.checked));
        });
      });
    }
    if (activeTab === 'personalization') {
      document.querySelectorAll('[data-personalization-key]').forEach((input) => {
        input.addEventListener('change', (e) => {
          Store.update((d) => (d.settings.personalization[e.target.dataset.personalizationKey] = e.target.checked));
        });
      });
    }
  }

  renderShell(null);
  renderMain();
})();
