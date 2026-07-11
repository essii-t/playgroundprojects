(function () {
  const data = Store.get();
  let currentRange = '1Y';

  function renderMain() {
    const nw = data.netWorth;
    const goals = data.goals;
    const month = data.budget.months[data.budget.currentMonth];
    const totalSpent = month.categories.reduce((s, c) => s + c.spent, 0);
    const personalization = data.settings.personalization;

    document.getElementById('page-main').innerHTML = `
      <div class="page-header-row">
        <div>
          <div class="page-eyebrow">Good evening, Alex</div>
          <div class="page-title">Your financial overview</div>
        </div>
      </div>

      <div class="hero-card" style="margin-bottom:20px;">
        <div class="hero-label">TOTAL NET WORTH <span class="hero-tag">USD</span></div>
        <div class="hero-value">${formatCurrency(nw.total)}</div>
        <div class="hero-delta">
          <span>&#8593; ${formatCurrency(nw.changeAmount)}</span>
          <span class="sub">this month &middot; +${nw.changePct}%</span>
        </div>
        <div class="hero-footer">
          <div>
            <div class="stat-label">Investable assets</div>
            <div class="stat-value">${formatCurrency(nw.investable)}</div>
          </div>
          <div>
            <div class="stat-label">Cash &amp; savings</div>
            <div class="stat-value">${formatCurrency(nw.cash)}</div>
          </div>
        </div>
      </div>

      <div class="card" style="margin-bottom:20px;">
        <div class="section-header-row">
          <div>
            <div class="section-title">Net worth trend</div>
            <div class="section-sub" id="trend-sub"></div>
          </div>
          <div class="chip-group" id="range-toggle">
            ${['3M', '6M', '1Y', 'ALL'].map((r) => `<button class="chip ${r === currentRange ? 'active' : ''}" data-range="${r}">${r}</button>`).join('')}
          </div>
        </div>
        <div id="nw-chart"></div>
      </div>

      <div class="card" style="margin-bottom:20px;">
        <div class="section-title">Asset allocation</div>
        <div class="section-sub">Across all accounts</div>
        <div style="display:flex; gap:32px; align-items:center; flex-wrap:wrap;">
          <div id="alloc-donut"></div>
          <div style="flex:1; min-width:220px;">
            ${data.allocation.map((a) => `
              <div class="legend-row">
                <span class="legend-label"><span class="legend-swatch" style="background:${a.color}"></span>${a.label}</span>
                <span><span class="legend-value">${formatCurrency(a.value)}</span><span class="legend-pct">${Math.round((a.value / nw.total) * 100)}%</span></span>
              </div>`).join('')}
          </div>
        </div>
      </div>

      ${personalization.showGoalsOnDashboard ? `
      <div class="card" style="margin-bottom:20px;">
        <div class="section-header-row">
          <div>
            <div class="section-title">Savings goals</div>
            <div class="section-sub">${goals.filter((g) => g.status === 'on-track').length} of ${goals.length} on track</div>
          </div>
          <a class="btn btn-sm" href="goals.html">View all</a>
        </div>
        ${goals.map((g) => `
          <div style="margin-top:14px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
              <span style="display:flex; align-items:center; gap:10px; font-weight:600;">
                <span class="icon-badge" style="background:color-mix(in srgb, ${g.color} 18%, white);">${icon(g.icon, g.color)}</span>
                ${g.name}
              </span>
              <span style="font-size:13.5px; color:var(--text-soft);">${formatCurrency(g.current)} / ${formatCurrency(g.target)}</span>
            </div>
            <div class="progress-track"><div class="progress-fill" style="width:${Math.min(100, (g.current / g.target) * 100)}%; background:${g.color};"></div></div>
          </div>`).join('')}
      </div>` : ''}

      <div class="card" style="margin-bottom:20px;">
        <div class="section-header-row">
          <div>
            <div class="section-title">This month's spending</div>
            <div class="section-sub">July 2026 &middot; ${formatCurrency(totalSpent)} of ${formatCurrency(month.budgetTotal)} budget</div>
          </div>
          <a class="btn btn-sm" href="budget.html">Manage budget</a>
        </div>
        <div style="display:flex; height:10px; border-radius:999px; overflow:hidden; margin:14px 0 18px;">
          ${month.categories.map((c) => `<div style="width:${(c.spent / totalSpent) * 100}%; background:${c.color};"></div>`).join('')}
        </div>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px 40px;">
          ${month.categories.map((c) => `
            <div style="display:flex; justify-content:space-between; font-size:14px;">
              <span style="display:flex; align-items:center; gap:8px;"><span class="legend-swatch" style="background:${c.color}"></span>${c.name}</span>
              <span style="font-weight:600;">${formatCurrency(c.spent)}</span>
            </div>`).join('')}
        </div>
      </div>

      ${personalization.showInsightsOnDashboard ? `
      <div class="section-title" style="margin-bottom:12px;">Insights for you</div>
      <div class="stack">
        ${data.insights.map((ins) => `
          <div class="insight-card ${ins.tag}">
            <div class="insight-tag">${ins.icon} ${ins.tag.toUpperCase()}</div>
            <div class="insight-text">${ins.text}</div>
          </div>`).join('')}
      </div>` : ''}
    `;

    renderChart();
    document.getElementById('alloc-donut').innerHTML = renderDonutChart({
      segments: data.allocation.map((a) => ({ value: a.value, color: a.color })),
      centerLabel: 'Total',
      centerValue: formatK(nw.total),
    });

    document.querySelectorAll('#range-toggle .chip').forEach((btn) => {
      btn.addEventListener('click', () => {
        currentRange = btn.dataset.range;
        document.querySelectorAll('#range-toggle .chip').forEach((b) => b.classList.toggle('active', b === btn));
        renderChart();
      });
    });
  }

  function renderChart() {
    const series = sliceSeries(data.netWorth.history, currentRange);
    const first = series[0].value;
    const last = series[series.length - 1].value;
    const pct = (((last - first) / first) * 100).toFixed(1);
    const rangeLabel = { '3M': '3 months', '6M': '6 months', '1Y': '1 year', ALL: 'all time' }[currentRange];
    document.getElementById('trend-sub').innerHTML = `<strong>${pct > 0 ? '+' : ''}${pct}%</strong> over ${rangeLabel}`;
    document.getElementById('nw-chart').innerHTML = renderLineChart({ series, color: '#10b981' });
    const labels = pickXLabels(series);
    document.getElementById('nw-chart').insertAdjacentHTML('beforeend', `<div class="chart-x-labels">${labels.map((l) => `<span>${l}</span>`).join('')}</div>`);
  }

  renderShell('dashboard');
  renderMain();
})();
