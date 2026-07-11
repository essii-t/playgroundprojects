const NAV_ITEMS = [
  { key: 'dashboard', label: 'Dashboard', icon: 'grid', href: 'index.html' },
  { key: 'portfolio', label: 'Portfolio', icon: 'pie', href: 'portfolio.html' },
  { key: 'budget', label: 'Budget', icon: 'card', href: 'budget.html' },
  { key: 'goals', label: 'Goals', icon: 'target', href: 'goals.html' },
  { key: 'accounts', label: 'Accounts', icon: 'wallet', href: 'accounts.html' },
];

function timeAgoLabel(dateStr) {
  return dateStr;
}

function renderShell(activeKey) {
  const topbar = document.getElementById('shell-topbar');
  const sidebar = document.getElementById('shell-sidebar');
  const bottomtabs = document.getElementById('shell-bottomtabs');
  const data = Store.get();
  const unreadCount = data.notifications.filter((n) => !n.read).length;

  if (topbar) {
    topbar.innerHTML = `
      <div class="topbar-logo">
        <span class="mark">${icon('logo')}</span>
        Meridian
      </div>
      <div class="topbar-right">
        <label class="topbar-search">
          ${icon('search')}
          <input type="text" id="global-search" placeholder="Search holdings, goals..." />
        </label>

        <div class="dropdown-wrap">
          <button class="icon-btn" id="bell-btn" aria-label="Notifications">${icon('bell')}${unreadCount ? '<span class="dot"></span>' : ''}</button>
          <div class="dropdown-panel notif-panel" id="notif-panel">
            <div class="notif-header">
              <span>Notifications</span>
              <button class="link-btn" id="mark-read-btn">Mark all read</button>
            </div>
            <div id="notif-list"></div>
          </div>
        </div>

        <div class="dropdown-wrap">
          <button class="avatar-block" id="avatar-btn">
            <div class="avatar">AR</div>
            <div class="avatar-name">
              <div class="name">Alex Rivera</div>
              <div class="plan">Premium</div>
            </div>
          </button>
          <div class="dropdown-panel avatar-panel" id="avatar-panel">
            <a class="dropdown-item" href="settings.html">${icon('gear')} Settings</a>
            <a class="dropdown-item" href="#" id="help-item">${icon('help')} Help &amp; support</a>
            <a class="dropdown-item" href="#" id="logout-item">${icon('logout')} Log out</a>
          </div>
        </div>
      </div>`;
  }

  if (sidebar) {
    sidebar.innerHTML = `
      <div>
        <div class="sidebar-menu-label">MENU</div>
        ${NAV_ITEMS.map((item) => `
          <a class="sidebar-link ${item.key === activeKey ? 'active' : ''}" href="${item.href}">
            ${icon(item.icon)}
            <span>${item.label}</span>
            <span class="indicator"></span>
          </a>`).join('')}
      </div>
      <div class="sidebar-security">
        ${icon('shield')}
        <div>
          <div class="label">Bank-grade security</div>
          <div class="sub">256-bit encryption &middot; MFA &middot; Read-only</div>
        </div>
      </div>`;
  }

  if (bottomtabs) {
    bottomtabs.innerHTML = NAV_ITEMS.map((item) => `
      <a class="bottom-tab ${item.key === activeKey ? 'active' : ''}" href="${item.href}">
        ${icon(item.icon)}
        <span>${item.label}</span>
      </a>`).join('');
  }

  wireSearch();
  wireNotifications(data);
  wireAvatarMenu();
}

function wireSearch() {
  const search = document.getElementById('global-search');
  if (search) {
    search.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && search.value.trim()) {
        window.location.href = 'portfolio.html?q=' + encodeURIComponent(search.value.trim());
      }
    });
  }
}

const NOTIF_ICON = { goal: 'target', budget: 'card', account: 'wallet', portfolio: 'pie' };

function renderNotifList() {
  const data = Store.get();
  const list = document.getElementById('notif-list');
  if (!list) return;
  list.innerHTML = data.notifications.length
    ? data.notifications.map((n) => `
      <div class="notif-item ${n.read ? '' : 'unread'}">
        <span class="icon-badge notif-icon">${icon(NOTIF_ICON[n.type] || 'bell')}</span>
        <div>
          <div class="notif-text">${n.text}</div>
          <div class="notif-date">${n.date}</div>
        </div>
      </div>`).join('')
    : '<div class="notif-empty">You\'re all caught up.</div>';
}

function wireNotifications() {
  const bellBtn = document.getElementById('bell-btn');
  const panel = document.getElementById('notif-panel');
  if (!bellBtn) return;
  renderNotifList();

  bellBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    closeAllDropdowns(panel);
    panel.classList.toggle('open');
  });

  document.getElementById('mark-read-btn').addEventListener('click', (e) => {
    e.stopPropagation();
    Store.update((d) => d.notifications.forEach((n) => (n.read = true)));
    bellBtn.querySelector('.dot')?.remove();
    renderNotifList();
  });

  document.addEventListener('click', () => panel.classList.remove('open'));
  panel.addEventListener('click', (e) => e.stopPropagation());
}

function wireAvatarMenu() {
  const avatarBtn = document.getElementById('avatar-btn');
  const panel = document.getElementById('avatar-panel');
  if (!avatarBtn) return;

  avatarBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    closeAllDropdowns(panel);
    panel.classList.toggle('open');
  });

  document.getElementById('help-item').addEventListener('click', (e) => {
    e.preventDefault();
    alert('Help & support is not part of this prototype.');
  });
  document.getElementById('logout-item').addEventListener('click', (e) => {
    e.preventDefault();
    Auth.logout();
  });

  document.addEventListener('click', () => panel.classList.remove('open'));
  panel.addEventListener('click', (e) => e.stopPropagation());
}

function closeAllDropdowns(except) {
  document.querySelectorAll('.dropdown-panel.open').forEach((p) => {
    if (p !== except) p.classList.remove('open');
  });
}

function pageShellHTML() {
  return `
    <div class="topbar" id="shell-topbar"></div>
    <div class="app-shell">
      <div class="sidebar" id="shell-sidebar"></div>
      <div class="main" id="page-main"></div>
    </div>
    <div class="bottom-tabs" id="shell-bottomtabs"></div>
  `;
}
