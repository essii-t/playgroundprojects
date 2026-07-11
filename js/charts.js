// Dependency-free SVG chart helpers.

function renderLineChart({ series, width = 1000, height = 260, color = '#10b981', formatY = formatK, xLabels }) {
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

  const svg = `
  <svg viewBox="0 0 ${width} ${height}" width="100%" height="${height}" preserveAspectRatio="none" style="overflow:visible; display:block;">
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
  </svg>`;
  return svg;
}

function renderDonutChart({ segments, size = 180, thickness = 22, centerLabel, centerValue }) {
  const total = segments.reduce((s, seg) => s + seg.value, 0) || 1;
  const r = (size - thickness) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;
  let offset = 0;
  let circles = '';
  segments.forEach((seg) => {
    const frac = seg.value / total;
    const dash = frac * circumference;
    const gap = circumference - dash;
    circles += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${seg.color}" stroke-width="${thickness}"
      stroke-dasharray="${dash} ${gap}" stroke-dashoffset="${-offset}" transform="rotate(-90 ${cx} ${cy})" stroke-linecap="butt" />`;
    offset += dash;
  });
  const centerText = centerLabel
    ? `<text x="${cx}" y="${cy - 6}" text-anchor="middle" font-size="11.5" fill="var(--text-faint)">${centerLabel}</text>
       <text x="${cx}" y="${cy + 14}" text-anchor="middle" font-size="18" font-family="Georgia, serif" fill="var(--text)">${centerValue}</text>`
    : '';
  return `<svg viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="rgba(20,20,15,0.06)" stroke-width="${thickness}" />
    ${circles}
    ${centerText}
  </svg>`;
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
