(function () {
  const data = Store.get();
  let currentRange = '1Y';
  let sortBy = 'value';
  let searchQuery = new URLSearchParams(window.location.search).get('q') || '';

  function filteredSortedHoldings() {
    const p = data.portfolio;
    let rows = p.holdings.filter((h) => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return h.ticker.toLowerCase().includes(q) || h.name.toLowerCase().includes(q);
    });
    rows = rows.slice().sort((a, b) => (sortBy === 'value' ? b.value - a.value : b.dayPct - a.dayPct));
    return rows;
  }

  function renderMain() {
    const p = data.portfolio;
    document.getElementById('page-main').innerHTML = `
      <div class="page-header-row">
        <div>
          <div class="page-eyebrow">Investment portfolio</div>
          <div class="page-title">Holdings &amp; performance</div>
        </div>
        <button class="btn btn-primary" id="import-btn">${icon('upload')}<span style="margin-left:4px;">Import snapshot</span></button>
      </div>

      <div class="grid-2" style="margin-bottom:20px; align-items:stretch;">
        <div class="card">
          <div class="section-header-row">
            <div>
              <div class="section-sub" style="margin-bottom:2px;">Portfolio value</div>
              <div class="page-title" style="font-size:30px;">${formatCurrency(p.value)}</div>
            </div>
            <div class="chip-group" id="range-toggle">
              ${['1M', '3M', '1Y', 'ALL'].map((r) => `<button class="chip ${r === currentRange ? 'active' : ''}" data-range="${r}">${r}</button>`).join('')}
            </div>
          </div>
          <div id="trend-sub" style="margin:8px 0 12px; font-size:13.5px;"></div>
          <div id="pf-chart"></div>
        </div>
        <div class="card">
          <div class="section-title">Allocation</div>
          <div style="display:flex; justify-content:center; margin:14px 0;" id="alloc-donut"></div>
          <div>
            ${p.allocation.map((a) => `
              <div class="legend-row">
                <span class="legend-label"><span class="legend-swatch" style="background:${a.color}"></span>${a.label}</span>
                <span class="legend-value">${a.pct}%</span>
              </div>`).join('')}
          </div>
        </div>
      </div>

      <div class="card">
        <div class="section-header-row">
          <div>
            <div class="section-title">Holdings &middot; ${p.holdings.length}</div>
          </div>
          <div style="display:flex; align-items:center; gap:14px;">
            <div class="topbar-search" style="width:200px;">
              ${icon('search')}
              <input type="text" id="holdings-search" placeholder="Filter holdings..." value="${searchQuery.replace(/"/g, '&quot;')}" />
            </div>
            <span style="font-size:12.5px; color:var(--text-faint);">Sort</span>
            <div class="chip-group" id="sort-toggle">
              <button class="chip ${sortBy === 'value' ? 'active' : ''}" data-sort="value">Value</button>
              <button class="chip ${sortBy === 'day' ? 'active' : ''}" data-sort="day">Day %</button>
            </div>
          </div>
        </div>
        <table class="table" style="margin-top:16px;">
          <thead>
            <tr>
              <th>ASSET</th><th class="num">PRICE</th><th class="num">VALUE</th><th class="num">DAY</th><th class="num">WEIGHT</th><th class="num">7D</th>
            </tr>
          </thead>
          <tbody id="holdings-body"></tbody>
        </table>
      </div>

      <div class="modal-overlay" id="import-modal">
        <div class="modal">
          <div class="modal-header">
            <div class="modal-title">Import snapshot</div>
            <button class="icon-btn" id="close-import">${icon('x')}</button>
          </div>
          <div class="upload-box">${icon('upload')}<div style="margin-top:8px;">Drop a CSV or spreadsheet export here<br>or click to browse</div></div>
          <p style="font-size:12.5px; color:var(--text-faint); margin-bottom:16px;">This is a simulated import for the prototype — it will add a sample new holding and refresh your portfolio totals.</p>
          <div class="modal-actions">
            <button class="btn" id="cancel-import">Cancel</button>
            <button class="btn btn-primary" id="simulate-import">Simulate import</button>
          </div>
        </div>
      </div>
    `;

    renderHoldingsBody();
    renderChart();
    const allocDonutEl = document.getElementById('alloc-donut');
    const allocDonut = renderDonutChart({
      segments: p.allocation.map((a) => ({ label: a.label, value: a.pct, tooltipValue: Math.round((a.pct / 100) * p.value), color: a.color })),
      centerLabel: 'Classes',
      centerValue: p.allocation.length,
      size: 170,
    });
    allocDonutEl.innerHTML = allocDonut.html;
    allocDonut.init(allocDonutEl);

    document.querySelectorAll('#range-toggle .chip').forEach((btn) => {
      btn.addEventListener('click', () => {
        currentRange = btn.dataset.range;
        document.querySelectorAll('#range-toggle .chip').forEach((b) => b.classList.toggle('active', b === btn));
        renderChart();
      });
    });
    document.querySelectorAll('#sort-toggle .chip').forEach((btn) => {
      btn.addEventListener('click', () => {
        sortBy = btn.dataset.sort === 'day' ? 'day' : 'value';
        document.querySelectorAll('#sort-toggle .chip').forEach((b) => b.classList.toggle('active', b === btn));
        renderHoldingsBody();
      });
    });
    document.getElementById('holdings-search').addEventListener('input', (e) => {
      searchQuery = e.target.value;
      renderHoldingsBody();
    });

    const modal = document.getElementById('import-modal');
    document.getElementById('import-btn').addEventListener('click', () => modal.classList.add('open'));
    document.getElementById('close-import').addEventListener('click', () => modal.classList.remove('open'));
    document.getElementById('cancel-import').addEventListener('click', () => modal.classList.remove('open'));
    document.getElementById('simulate-import').addEventListener('click', () => {
      Store.update((d) => {
        const exists = d.portfolio.holdings.find((h) => h.ticker === 'SCHD');
        if (!exists) {
          d.portfolio.holdings.push({ ticker: 'SCHD', name: 'Schwab US Dividend Equity', price: 28.40, value: 2150, dayPct: 0.4, weight: 2.8, trend: 'up' });
          d.portfolio.value += 2150;
        }
      });
      modal.classList.remove('open');
      window.location.reload();
    });
  }

  function renderHoldingsBody() {
    const rows = filteredSortedHoldings();
    document.getElementById('holdings-body').innerHTML = rows.map((h) => `
      <tr>
        <td>
          <div class="asset-cell">
            <div class="asset-icon">${h.ticker.slice(0, 2)}</div>
            <div>
              <div class="asset-name-main">${h.ticker}</div>
              <div class="asset-name-sub">${h.name}</div>
            </div>
          </div>
        </td>
        <td class="num">$${h.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
        <td class="num" style="font-weight:600;">${formatCurrency(h.value)}</td>
        <td class="num ${h.dayPct >= 0 ? 'pos' : 'neg'}">${formatSignedPct(h.dayPct)}</td>
        <td class="num">${h.weight}%</td>
        <td class="num">${renderSparkline({ values: sparklineValues(h), color: h.trend === 'up' ? '#10b981' : '#e0455a' })}</td>
      </tr>`).join('') || `<tr><td colspan="6" style="text-align:center; color:var(--text-faint); padding:24px 0;">No holdings match "${searchQuery}"</td></tr>`;
  }

  function sparklineValues(h) {
    const rand = mulberry32(h.ticker.charCodeAt(0) * 17 + h.ticker.length);
    const dir = h.trend === 'up' ? 1 : -1;
    let v = 100;
    const vals = [v];
    for (let i = 0; i < 6; i++) {
      v += dir * (2 + rand() * 3) + (rand() - 0.5) * 2;
      vals.push(v);
    }
    return vals;
  }

  function renderChart() {
    const series = sliceSeries(data.portfolio.history, currentRange);
    const first = series[0].value;
    const last = series[series.length - 1].value;
    const pct = (((last - first) / first) * 100).toFixed(1);
    const rangeLabel = { '1M': '1 month', '3M': '3 months', '1Y': '1 year', ALL: 'all time' }[currentRange];
    document.getElementById('trend-sub').innerHTML = `<span class="${pct >= 0 ? 'pos' : 'neg'}" style="font-weight:600;">${formatCurrency(data.portfolio.todayChange)} today</span> &nbsp; <span class="${pct >= 0 ? 'pos' : 'neg'}">${pct > 0 ? '+' : ''}${pct}%</span> ${rangeLabel}`;
    const chartEl = document.getElementById('pf-chart');
    const chart = renderLineChart({ series, color: '#10b981', height: 220 });
    chartEl.innerHTML = chart.html;
    chart.init(chartEl);
    const labels = pickXLabels(series);
    chartEl.insertAdjacentHTML('beforeend', `<div class="chart-x-labels">${labels.map((l) => `<span>${l}</span>`).join('')}</div>`);
  }

  renderShell('portfolio');
  renderMain();
})();
