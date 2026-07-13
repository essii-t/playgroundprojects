// Dependency-free SVG chart helpers.

function defaultFormatX(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// Returns { html, init }. Call `container.innerHTML = html`, then
// `init(container)` to wire up the hover tooltip (needs the element to
// already be in the DOM so getBoundingClientRect works).
function renderLineChart({ series, width = 1000, height = 260, color = '#10b981', formatY = formatK, formatX = defaultFormatX, formatTooltipY = formatCurrency, tooltipTheme = 'light' }) {
  const values = series.map((p) => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const pad = (max - min) * 0.12 || max * 0.05 || 1;
  const yMin = min - pad;
  const yMax = max + pad;
  const padLeft = 56;
  const padBottom = 28;
  const padTop = 10;
  const innerW = width - padLeft - 10;
  const innerH = height - padBottom - padTop;

  const x = (i) => padLeft + (i / (series.length - 1)) * innerW;
  const y = (v) => padTop + innerH - ((v - yMin) / (yMax - yMin)) * innerH;

  const linePoints = series.map((p, i) => `${x(i)},${y(p.value)}`).join(' ');
  const areaPoints = `${padLeft},${padTop + innerH} ${linePoints} ${x(series.length - 1)},${padTop + innerH}`;

  const gradId = 'grad-' + Math.random().toString(36).slice(2, 9);
  const uid = 'lc-' + Math.random().toString(36).slice(2, 9);
  const gridCount = 4;
  let gridLines = '';
  let yLabels = '';
  for (let i = 0; i <= gridCount; i++) {
    const v = yMin + ((yMax - yMin) * i) / gridCount;
    const gy = y(v);
    gridLines += `<line x1="${padLeft}" y1="${gy}" x2="${width - 10}" y2="${gy}" stroke="rgba(20,20,15,0.07)" stroke-width="1"/>`;
    yLabels += `<text x="${padLeft - 10}" y="${gy + 4}" font-size="11.5" fill="var(--text-faint)" text-anchor="end">${formatY(v)}</text>`;
  }

  const lastX = x(series.length - 1);
  const lastY = y(series[series.length - 1].value);

  const html = `
  <div class="chart-wrap">
    <svg id="${uid}" viewBox="0 0 ${width} ${height}" width="100%" height="${height}" preserveAspectRatio="none" style="overflow:visible; display:block;">
      <defs>
        <linearGradient id="${gradId}" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${color}" stop-opacity="0.28"/>
          <stop offset="100%" stop-color="${color}" stop-opacity="0"/>
        </linearGradient>
      </defs>
      ${gridLines}
      ${yLabels}
      <polygon points="${areaPoints}" fill="url(#${gradId})" />
      <polyline points="${linePoints}" fill="none" stroke="${color}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round" />
      <circle cx="${lastX}" cy="${lastY}" r="4.5" fill="${color}" stroke="#fff" stroke-width="2" />
      <line class="chart-hover-line" x1="0" y1="${padTop}" x2="0" y2="${padTop + innerH}" stroke="${color}" stroke-width="1" stroke-dasharray="3 3" opacity="0"/>
      <circle class="chart-hover-dot" cx="0" cy="0" r="5" fill="${color}" stroke="#fff" stroke-width="2" opacity="0"/>
      <rect class="chart-hover-rect" x="${padLeft}" y="0" width="${innerW}" height="${height}" fill="transparent"/>
    </svg>
    <div class="chart-tooltip theme-${tooltipTheme}" style="opacity:0;">
      <div class="tt-date"></div>
      <div class="tt-value"></div>
    </div>
  </div>`;

  function init(container) {
    const svgEl = container.querySelector(`#${uid}`);
    const wrap = container.querySelector('.chart-wrap');
    if (!svgEl || !wrap) return;
    const hoverRect = svgEl.querySelector('.chart-hover-rect');
    const hoverLine = svgEl.querySelector('.chart-hover-line');
    const hoverDot = svgEl.querySelector('.chart-hover-dot');
    const tooltip = wrap.querySelector('.chart-tooltip');

    function indexFromEvent(evt) {
      const rect = svgEl.getBoundingClientRect();
      const relX = ((evt.clientX - rect.left) / rect.width) * width;
      const idx = Math.round(((relX - padLeft) / innerW) * (series.length - 1));
      return Math.max(0, Math.min(series.length - 1, idx));
    }

    function showAt(idx) {
      const p = series[idx];
      const px = x(idx);
      const py = y(p.value);

      hoverLine.setAttribute('x1', px);
      hoverLine.setAttribute('x2', px);
      hoverLine.setAttribute('opacity', '1');
      hoverDot.setAttribute('cx', px);
      hoverDot.setAttribute('cy', py);
      hoverDot.setAttribute('opacity', '1');

      tooltip.querySelector('.tt-date').textContent = formatX(p.date);
      tooltip.querySelector('.tt-value').textContent = formatTooltipY(p.value);
      tooltip.style.opacity = '1';

      const svgRect = svgEl.getBoundingClientRect();
      const pxPixel = (px / width) * svgRect.width;
      const pyPixel = (py / height) * svgRect.height;
      const tooltipW = tooltip.offsetWidth || 120;
      let left = pxPixel + 14;
      if (left + tooltipW > svgRect.width) left = pxPixel - tooltipW - 14;
      tooltip.style.left = left + 'px';
      tooltip.style.top = Math.max(0, pyPixel - 46) + 'px';
    }

    function hide() {
      hoverLine.setAttribute('opacity', '0');
      hoverDot.setAttribute('opacity', '0');
      tooltip.style.opacity = '0';
    }

    hoverRect.addEventListener('pointermove', (evt) => showAt(indexFromEvent(evt)));
    hoverRect.addEventListener('pointerleave', hide);
  }

  return { html, init };
}

// Returns { html, init }, same pattern as renderLineChart. Each segment may
// optionally set `tooltipValue` (used for the hover tooltip) separately from
// `value` (used for the arc's proportion) — needed when a chart's arcs are
// sized by percentage but the tooltip should show a derived dollar amount.
function renderDonutChart({ segments, size = 180, thickness = 22, centerLabel, centerValue, tooltipTheme = 'light', formatTooltipValue = formatCurrency }) {
  const total = segments.reduce((s, seg) => s + seg.value, 0) || 1;
  const r = (size - thickness) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;
  const uid = 'dc-' + Math.random().toString(36).slice(2, 9);
  let offset = 0;
  let circles = '';
  segments.forEach((seg, i) => {
    const frac = seg.value / total;
    const dash = frac * circumference;
    const gap = circumference - dash;
    circles += `<circle class="donut-segment" data-index="${i}" cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${seg.color}" stroke-width="${thickness}"
      stroke-dasharray="${dash} ${gap}" stroke-dashoffset="${-offset}" transform="rotate(-90 ${cx} ${cy})" stroke-linecap="butt" style="cursor:pointer;" />`;
    offset += dash;
  });
  const centerText = centerLabel
    ? `<text x="${cx}" y="${cy - 6}" text-anchor="middle" font-size="11.5" fill="var(--text-faint)">${centerLabel}</text>
       <text x="${cx}" y="${cy + 14}" text-anchor="middle" font-size="18" font-family="Georgia, serif" fill="var(--text)">${centerValue}</text>`
    : '';

  const html = `
  <div class="chart-wrap" style="display:inline-block;">
    <svg id="${uid}" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="rgba(20,20,15,0.06)" stroke-width="${thickness}" />
      ${circles}
      ${centerText}
    </svg>
    <div class="chart-tooltip theme-${tooltipTheme}" style="opacity:0;">
      <div class="tt-date"></div>
      <div class="tt-value"></div>
    </div>
  </div>`;

  function init(container) {
    const svgEl = container.querySelector(`#${uid}`);
    const wrap = container.querySelector('.chart-wrap');
    if (!svgEl || !wrap) return;
    const tooltip = wrap.querySelector('.chart-tooltip');

    // Follows the cursor like a normal tooltip (small fixed offset), but the
    // offset direction always points away from the donut's center — so the
    // tooltip lands just past the cursor on the ring's outer side, never
    // over the chart, instead of a fixed down-right offset that could
    // overlap the ring depending on where you're hovering.
    function positionFromEvent(evt) {
      const svgRect = svgEl.getBoundingClientRect();
      const centerX = svgRect.left + svgRect.width / 2;
      const centerY = svgRect.top + svgRect.height / 2;
      const dx = evt.clientX - centerX;
      const dy = evt.clientY - centerY;
      const len = Math.hypot(dx, dy) || 1;
      const dirX = dx / len;
      const dirY = dy / len;

      const OFFSET = 16;
      const wrapRect = wrap.getBoundingClientRect();
      const mouseX = evt.clientX - wrapRect.left;
      const mouseY = evt.clientY - wrapRect.top;
      const anchorX = mouseX + dirX * OFFSET;
      const anchorY = mouseY + dirY * OFFSET;

      const tooltipW = tooltip.offsetWidth || 120;
      const tooltipH = tooltip.offsetHeight || 40;
      let left = dirX >= 0 ? anchorX + 4 : anchorX - tooltipW - 4;
      let top = dirY < 0 ? anchorY - tooltipH - 4 : anchorY + 4;
      if (Math.abs(dirX) < 0.35) left = anchorX - tooltipW / 2;
      if (Math.abs(dirY) < 0.35) top = anchorY - tooltipH / 2;
      tooltip.style.left = left + 'px';
      tooltip.style.top = top + 'px';
    }

    svgEl.querySelectorAll('.donut-segment').forEach((circleEl) => {
      const idx = Number(circleEl.dataset.index);
      const seg = segments[idx];
      circleEl.addEventListener('pointerenter', (evt) => {
        tooltip.querySelector('.tt-date').textContent = seg.label || '';
        tooltip.querySelector('.tt-value').textContent = formatTooltipValue(seg.tooltipValue !== undefined ? seg.tooltipValue : seg.value);
        tooltip.style.opacity = '1';
        positionFromEvent(evt);
      });
      circleEl.addEventListener('pointermove', positionFromEvent);
      circleEl.addEventListener('pointerleave', () => { tooltip.style.opacity = '0'; });
    });
  }

  return { html, init };
}

function renderSparkline({ values, width = 60, height = 24, color }) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const x = (i) => (i / (values.length - 1)) * width;
  const y = (v) => height - ((v - min) / range) * height;
  const points = values.map((v, i) => `${x(i)},${y(v)}`).join(' ');
  return `<svg viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
    <polyline points="${points}" fill="none" stroke="${color}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`;
}

function rangeToDays(range) {
  return { '1M': 30, '3M': 90, '6M': 180, '1Y': 365, ALL: 730 }[range] || 365;
}

function sliceSeries(history, range) {
  const days = rangeToDays(range);
  return history.slice(-days);
}

function pickXLabels(series, count = 6) {
  const step = Math.max(1, Math.floor(series.length / (count - 1)));
  const picks = [];
  for (let i = 0; i < series.length; i += step) picks.push(series[i]);
  if (picks[picks.length - 1] !== series[series.length - 1]) picks.push(series[series.length - 1]);
  return picks.map((p) => {
    const d = new Date(p.date);
    return d.toLocaleDateString('en-US', { month: 'short' });
  });
}
