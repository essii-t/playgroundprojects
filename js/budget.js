(function () {
  const data = Store.get();
  const monthKeys = Object.keys(data.budget.months).sort();
  let currentKey = data.budget.currentMonth;

  function monthLabel(key) {
    const [y, m] = key.split('-');
    const d = new Date(Number(y), Number(m) - 1, 1);
    return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }

  function shiftMonth(delta) {
    const idx = monthKeys.indexOf(currentKey);
    const next = idx + delta;
    if (next >= 0 && next < monthKeys.length) {
      currentKey = monthKeys[next];
      renderMain();
    }
  }

  function renderMain() {
    const month = data.budget.months[currentKey];
    const totalSpent = month.categories.reduce((s, c) => s + c.spent, 0);
    const pctUsed = Math.round((totalSpent / month.budgetTotal) * 100);
    const remaining = month.budgetTotal - totalSpent;
    const saved = month.income - totalSpent;
    const idx = monthKeys.indexOf(currentKey);

    document.getElementById('page-main').innerHTML = `
      <div class="page-header-row">
        <div>
          <div class="page-eyebrow">Monthly budget</div>
          <div class="page-title">Budget</div>
        </div>
        <div class="btn" style="display:flex; align-items:center; gap:14px; cursor:default;">
          <button class="icon-btn" id="prev-month" style="width:30px;height:30px;" ${idx === 0 ? 'disabled' : ''}>${icon('chevronLeft')}</button>
          <span style="font-weight:600;">${monthLabel(currentKey)}</span>
          <button class="icon-btn" id="next-month" style="width:30px;height:30px;" ${idx === monthKeys.length - 1 ? 'disabled' : ''}>${icon('chevronRight')}</button>
        </div>
      </div>

      <div class="hero-card" style="margin-bottom:20px; display:flex; justify-content:space-between; align-items:flex-end; flex-wrap:wrap; gap:20px;">
        <div>
          <div class="hero-label">SPENT THIS MONTH</div>
          <div class="hero-value">${formatCurrency(totalSpent)} <span style="font-size:20px; color:#9fb8ad;">of ${formatCurrency(month.budgetTotal)}</span></div>
          <div class="progress-track" style="width:320px; background:rgba(255,255,255,0.14); margin-bottom:8px;">
            <div class="progress-fill" style="width:${Math.min(100, pctUsed)}%; background:linear-gradient(90deg,#6C63FF,#3B82F6);"></div>
          </div>
          <div style="font-size:12.5px; color:#9fb8ad;">${pctUsed}% of budget used &middot; ${remaining >= 0 ? formatCurrency(remaining) + ' remaining' : formatCurrency(-remaining) + ' over'}</div>
        </div>
        <div style="display:flex; gap:40px;">
          <div>
            <div class="hero-footer-label" style="font-size:12.5px; color:#9fb8ad; margin-bottom:4px;">Income</div>
            <div style="font-size:22px; font-weight:600;">${formatCurrency(month.income)}</div>
          </div>
          <div>
            <div style="font-size:12.5px; color:#9fb8ad; margin-bottom:4px;">Saved</div>
            <div style="font-size:22px; font-weight:600; color:var(--mint);">${formatCurrency(saved)}</div>
          </div>
        </div>
      </div>

      <div class="grid-2">
        <div class="card">
          <div class="section-title">Categories</div>
          <div id="categories-list" style="margin-top:12px;"></div>
        </div>
        <div class="stack">
          <div class="card">
            <div class="section-title">Where it went</div>
            <div style="display:flex; justify-content:center; margin:14px 0;" id="spend-donut"></div>
            <div id="spend-legend" style="display:grid; grid-template-columns:1fr 1fr; gap:0 12px;"></div>
          </div>
          <div class="card">
            <div class="section-header-row">
              <div class="section-title">Recent expenses</div>
              <span style="font-size:12px; color:var(--text-faint); display:flex; align-items:center; gap:4px;">&#9733; Auto-categorized</span>
            </div>
            <div id="expenses-list" style="margin-top:10px;"></div>
          </div>
        </div>
      </div>
    `;

    renderCategories(month, totalSpent);
    renderSpendDonut(month, totalSpent);
    renderExpenses(month);

    document.getElementById('prev-month').addEventListener('click', () => shiftMonth(-1));
    document.getElementById('next-month').addEventListener('click', () => shiftMonth(1));
  }

  function renderCategories(month, totalSpent) {
    document.getElementById('categories-list').innerHTML = month.categories.map((c) => {
      const pct = (c.spent / c.budget) * 100;
      const over = c.spent > c.budget;
      const left = c.budget - c.spent;
      return `
      <div style="margin-bottom:16px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
          <span style="display:flex; align-items:center; gap:10px; font-weight:600;">
            <span class="icon-badge" style="background:color-mix(in srgb, ${c.color} 16%, white); color:${c.color};">${icon(c.icon, c.color)}</span>
            ${c.name}
          </span>
          <span style="font-size:13.5px;">${formatCurrency(c.spent)} <span style="color:var(--text-faint);">/ ${formatCurrency(c.budget)}</span></span>
        </div>
        <div class="progress-track">
          <div class="progress-fill" style="width:${Math.min(100, pct)}%; background:${over ? 'var(--red)' : c.color};"></div>
        </div>
        <div style="text-align:right; font-size:12px; margin-top:4px;" class="${over ? 'neg' : ''}">${over ? 'Over ' + formatCurrency(-left) : formatCurrency(left) + ' left'}</div>
      </div>`;
    }).join('');
  }

  function renderSpendDonut(month, totalSpent) {
    document.getElementById('spend-donut').innerHTML = renderDonutChart({
      segments: month.categories.map((c) => ({ value: c.spent, color: c.color })),
      centerLabel: 'Spent',
      centerValue: formatK(totalSpent),
      size: 170,
    });
    document.getElementById('spend-legend').innerHTML = month.categories.map((c) => `
      <div class="legend-row" style="padding:5px 0;">
        <span class="legend-label"><span class="legend-swatch" style="background:${c.color}"></span>${c.name}</span>
        <span class="legend-value">${Math.round((c.spent / totalSpent) * 100)}%</span>
      </div>`).join('');
  }

  function renderExpenses(month) {
    document.getElementById('expenses-list').innerHTML = month.transactions.map((t) => {
      const cat = month.categories.find((c) => c.key === t.category);
      return `
      <div style="display:flex; align-items:center; justify-content:space-between; padding:10px 0; border-bottom:1px solid var(--border);">
        <div style="display:flex; align-items:center; gap:12px;">
          <span class="icon-badge" style="background:color-mix(in srgb, ${cat.color} 16%, white); color:${cat.color}; width:32px; height:32px;">${icon(cat.icon, cat.color)}</span>
          <div>
            <div style="font-weight:600; font-size:13.5px;">${t.merchant}</div>
            <div style="font-size:12px; color:var(--text-faint);">${t.date} &middot; $${t.amount.toFixed(2)}</div>
          </div>
        </div>
        <select class="cat-select" data-tid="${t.id}" style="border:1px solid var(--border-strong); border-radius:8px; padding:5px 8px; font-size:12.5px; font-family:inherit; color:${cat.color}; background:color-mix(in srgb, ${cat.color} 10%, white);">
          ${month.categories.map((c) => `<option value="${c.key}" ${c.key === t.category ? 'selected' : ''}>${c.name}</option>`).join('')}
        </select>
      </div>`;
    }).join('');

    document.querySelectorAll('.cat-select').forEach((sel) => {
      sel.addEventListener('change', (e) => {
        const tid = e.target.dataset.tid;
        const newCat = e.target.value;
        Store.update((d) => {
          const m = d.budget.months[currentKey];
          const tx = m.transactions.find((t) => t.id === tid);
          const oldCat = m.categories.find((c) => c.key === tx.category);
          const newCatObj = m.categories.find((c) => c.key === newCat);
          oldCat.spent = Math.max(0, +(oldCat.spent - tx.amount).toFixed(2));
          newCatObj.spent = +(newCatObj.spent + tx.amount).toFixed(2);
          tx.category = newCat;
        });
        renderMain();
      });
    });
  }

  renderShell('budget');
  renderMain();
})();
