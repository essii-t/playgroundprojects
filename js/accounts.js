(function () {
  const data = Store.get();
  let selectedInstitution = CONNECT_INSTITUTIONS[0];
  let editingAccountId = null;

  const TYPE_META = {
    checking: { icon: 'wallet', color: 'var(--cat-utilities)', label: 'Checking' },
    savings: { icon: 'wallet', color: 'var(--cat-groceries)', label: 'Savings' },
    investment: { icon: 'pie', color: 'var(--cat-shopping)', label: 'Investment' },
    credit: { icon: 'card', color: 'var(--cat-dining)', label: 'Credit card' },
  };

  function groupByInstitution(accounts) {
    const groups = {};
    accounts.forEach((a) => {
      if (!groups[a.institution]) groups[a.institution] = [];
      groups[a.institution].push(a);
    });
    return groups;
  }

  // Applies `sign * balance` to the net-worth buckets an account of this
  // type contributes to. sign=1 to add (create/edit-increase), sign=-1 to
  // remove (delete/edit-decrease). Credit accounts are liabilities excluded
  // from net worth already, so they're a no-op here.
  function applyNetWorthDelta(d, type, amount) {
    if (amount === 0) return;
    if (type === 'checking' || type === 'savings') {
      d.netWorth.cash += amount;
      d.netWorth.total += amount;
      const cashSeg = d.allocation.find((a) => a.label === 'Cash & savings');
      if (cashSeg) cashSeg.value = Math.max(0, cashSeg.value + amount);
    } else if (type === 'investment') {
      d.netWorth.investable += amount;
      d.netWorth.total += amount;
    }
  }

  function renderMain() {
    const accounts = data.accounts;
    const totalCash = accounts.filter((a) => a.type === 'checking' || a.type === 'savings').reduce((s, a) => s + a.balance, 0);
    const totalInvestments = accounts.filter((a) => a.type === 'investment').reduce((s, a) => s + a.balance, 0);
    const totalCredit = accounts.filter((a) => a.type === 'credit').reduce((s, a) => s + a.balance, 0);
    const groups = groupByInstitution(accounts);

    document.getElementById('page-main').innerHTML = `
      <div class="page-header-row">
        <div>
          <div class="page-eyebrow">Linked accounts</div>
          <div class="page-title">Accounts</div>
        </div>
        <button class="btn btn-primary" id="connect-btn">${icon('plus')}<span style="margin-left:4px;">Connect account</span></button>
      </div>

      <div class="hero-card" style="margin-bottom:20px; display:flex; flex-wrap:wrap;">
        <div>
          <div class="hero-label">Cash &amp; savings</div>
          <div style="font-family:var(--font-serif); font-size:28px; margin-top:6px;">${formatCurrency(totalCash)}</div>
        </div>
        <div style="border-left:1px solid rgba(255, 255, 255, 0.1); margin-left:30px; padding-left:30px;">
          <div class="hero-label">Investments</div>
          <div style="font-family:var(--font-serif); font-size:28px; margin-top:6px;">${formatCurrency(totalInvestments)}</div>
        </div>
        <div style="border-left:1px solid rgba(255, 255, 255, 0.1); margin-left:30px; padding-left:30px;">
          <div class="hero-label">Credit balance</div>
          <div style="font-family:var(--font-serif); font-size:28px; margin-top:6px; color:#ff8f8f;">${formatCurrency(totalCredit)}</div>
        </div>
      </div>

      <div class="stack" id="institution-groups"></div>

      <div class="modal-overlay" id="connect-modal">
        <div class="modal">
          <div class="modal-header">
            <div class="modal-title">Connect account</div>
            <button class="icon-btn" id="close-connect">${icon('x')}</button>
          </div>
          <p style="font-size:12.5px; color:var(--text-faint); margin-bottom:14px;">Choose an institution to simulate connecting a new account. This prototype adds a sample savings account with a realistic balance — no real bank credentials are used.</p>
          <div class="form-field">
            <label>Institution</label>
            <div class="icon-choices" id="institution-choices" style="flex-direction:column; align-items:stretch;">
              ${CONNECT_INSTITUTIONS.map((inst) => `
                <button type="button" class="institution-choice ${inst === selectedInstitution ? 'selected' : ''}" data-institution="${inst}">
                  <span>${inst}</span>
                  ${icon('check')}
                </button>`).join('')}
            </div>
          </div>
          <div class="modal-actions">
            <button class="btn" id="cancel-connect">Cancel</button>
            <button class="btn btn-primary" id="simulate-connect">Connect</button>
          </div>
        </div>
      </div>

      <div class="modal-overlay" id="edit-account-modal">
        <div class="modal">
          <div class="modal-header">
            <div class="modal-title">Edit account</div>
            <button class="icon-btn" id="close-edit-account">${icon('x')}</button>
          </div>
          <form id="edit-account-form">
            <div class="form-field">
              <label>Account name</label>
              <input type="text" id="account-name" required />
            </div>
            <div class="form-field">
              <label>Balance</label>
              <input type="number" id="account-balance" step="0.01" required />
            </div>
            <div style="display:flex; justify-content:space-between; align-items:center; gap:10px; margin-top:20px;">
              <button type="button" class="btn btn-danger-ghost" id="delete-account-btn">${icon('trash')}<span style="margin-left:4px;">Delete account</span></button>
              <div style="display:flex; gap:10px;">
                <button type="button" class="btn" id="cancel-edit-account">Cancel</button>
                <button type="submit" class="btn btn-primary">Save changes</button>
              </div>
            </div>
          </form>
        </div>
      </div>
    `;

    renderGroups(groups);
    wireModal();
  }

  function renderGroups(groups) {
    document.getElementById('institution-groups').innerHTML = Object.keys(groups).map((inst) => `
      <div class="card">
        <div class="section-title" style="margin-bottom:14px;">${inst}</div>
        ${groups[inst].map((a) => {
          const meta = TYPE_META[a.type];
          const isLiability = a.type === 'credit';
          return `
          <div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; row-gap:10px; padding:12px 0; border-bottom:1px solid var(--border);">
            <div style="display:flex; align-items:center; gap:14px;">
              <span class="icon-badge" style="background:color-mix(in srgb, ${meta.color} 16%, white); color:${meta.color};">${icon(meta.icon, meta.color)}</span>
              <div>
                <div style="font-weight:600; font-size:14px;">${a.name}</div>
                <div style="font-size:12.5px; color:var(--text-faint);">${meta.label} &middot; &bull;&bull;&bull;&bull;${a.last4}</div>
              </div>
            </div>
            <div style="display:flex; align-items:center; gap:12px; margin-left:auto;">
              <span class="badge on-track">${icon('check')} Connected</span>
              <span style="font-weight:700; font-size:15px; ${isLiability ? 'color:var(--red);' : ''}">${isLiability ? '-' : ''}${formatCurrency(Math.abs(a.balance))}</span>
              <button class="icon-btn-sm" data-edit-account="${a.id}" aria-label="Edit account">${icon('edit')}</button>
            </div>
          </div>`;
        }).join('')}
      </div>`).join('');

    document.querySelectorAll('[data-edit-account]').forEach((btn) => {
      btn.addEventListener('click', () => openEditAccountModal(btn.dataset.editAccount));
    });
  }

  function openEditAccountModal(accountId) {
    editingAccountId = accountId;
    const a = data.accounts.find((x) => x.id === accountId);
    if (!a) return;
    document.getElementById('account-name').value = a.name;
    document.getElementById('account-balance').value = a.balance;
    document.getElementById('edit-account-modal').classList.add('open');
  }

  function wireModal() {
    const modal = document.getElementById('connect-modal');
    document.getElementById('connect-btn').addEventListener('click', () => modal.classList.add('open'));
    document.getElementById('close-connect').addEventListener('click', () => modal.classList.remove('open'));
    document.getElementById('cancel-connect').addEventListener('click', () => modal.classList.remove('open'));

    document.querySelectorAll('.institution-choice').forEach((btn) => {
      btn.addEventListener('click', () => {
        selectedInstitution = btn.dataset.institution;
        document.querySelectorAll('.institution-choice').forEach((b) => b.classList.toggle('selected', b === btn));
      });
    });

    document.getElementById('simulate-connect').addEventListener('click', () => {
      const rand = mulberry32(Date.now() % 100000);
      const balance = Math.round((2000 + rand() * 6000) / 10) * 10;
      Store.update((d) => {
        const id = 'a' + Date.now();
        d.accounts.push({
          id,
          institution: selectedInstitution,
          type: 'savings',
          name: selectedInstitution + ' Savings',
          last4: String(1000 + Math.floor(rand() * 9000)),
          balance,
          status: 'connected',
          connectedDate: 'Just now',
        });
        d.netWorth.cash += balance;
        d.netWorth.total += balance;
        const cashSeg = d.allocation.find((a) => a.label === 'Cash & savings');
        if (cashSeg) cashSeg.value += balance;
        d.notifications.unshift({
          id: 'n' + Date.now(),
          type: 'account',
          text: `${selectedInstitution} Savings successfully connected.`,
          date: 'Just now',
          read: false,
        });
      });
      modal.classList.remove('open');
      window.location.reload();
    });

    const editModal = document.getElementById('edit-account-modal');
    document.getElementById('close-edit-account').addEventListener('click', () => editModal.classList.remove('open'));
    document.getElementById('cancel-edit-account').addEventListener('click', () => editModal.classList.remove('open'));

    document.getElementById('edit-account-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('account-name').value.trim();
      const balance = Number(document.getElementById('account-balance').value);
      if (!name || Number.isNaN(balance) || !editingAccountId) return;
      Store.update((d) => {
        const a = d.accounts.find((x) => x.id === editingAccountId);
        if (!a) return;
        const delta = balance - a.balance;
        a.name = name;
        a.balance = balance;
        applyNetWorthDelta(d, a.type, delta);
      });
      editModal.classList.remove('open');
      renderMain();
    });

    document.getElementById('delete-account-btn').addEventListener('click', () => {
      if (!editingAccountId) return;
      const a = data.accounts.find((x) => x.id === editingAccountId);
      if (!a) return;
      confirmAction({
        title: 'Delete account?',
        message: `Delete "${a.name}"? This can't be undone.`,
        confirmLabel: 'Delete',
        onConfirm: () => {
          Store.update((d) => {
            const acct = d.accounts.find((x) => x.id === editingAccountId);
            if (acct) applyNetWorthDelta(d, acct.type, -acct.balance);
            d.accounts = d.accounts.filter((x) => x.id !== editingAccountId);
          });
          editModal.classList.remove('open');
          renderMain();
        },
      });
    });
  }

  renderShell('accounts');
  renderMain();
})();
