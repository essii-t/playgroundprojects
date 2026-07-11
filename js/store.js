// Shared localStorage-backed data store for the Meridian prototype.
const STORAGE_KEY = 'meridian-data';

function mulberry32(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Generates a daily series of `days` points that trends from startValue to
// endValue with small mean-reverting noise, so it looks like a real (but
// gently smoothed) portfolio/net-worth history rather than a straight line.
function generateSeries(endValue, days, startValue, seed) {
  const rand = mulberry32(seed);
  let v = startValue;
  const values = [];
  for (let i = 0; i < days; i++) {
    const t = i / (days - 1);
    const target = startValue + (endValue - startValue) * t;
    const noise = (rand() - 0.5) * target * 0.01;
    v = v + (target - v) * 0.15 + noise;
    values.push(v);
  }
  values[values.length - 1] = endValue;
  const today = new Date('2026-07-08');
  return values.map((value, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (days - 1 - i));
    return { date: d.toISOString().slice(0, 10), value: Math.round(value) };
  });
}

function seedData() {
  const netWorthHistory = generateSeries(92480, 730, 58000, 42);
  const portfolioHistory = generateSeries(74280, 730, 44000, 77);

  return {
    netWorth: {
      total: 92480,
      changeAmount: 3280,
      changePct: 3.7,
      investable: 74280,
      cash: 18200,
      history: netWorthHistory,
    },
    allocation: [
      { label: 'Investments', value: 41300, color: 'var(--cat-groceries)' },
      { label: 'Retirement', value: 28600, color: 'var(--cat-shopping)' },
      { label: 'Cash & savings', value: 18200, color: 'var(--cat-utilities)' },
      { label: 'Crypto', value: 4380, color: 'var(--cat-transport)' },
    ],
    portfolio: {
      value: 74280,
      todayChange: 612,
      oneYearPct: 27.6,
      history: portfolioHistory,
      allocation: [
        { label: 'US Equity', pct: 61, color: 'var(--cat-groceries)' },
        { label: 'Retirement fund', pct: 13, color: 'var(--cat-shopping)' },
        { label: 'Intl Equity', pct: 11, color: 'var(--cat-utilities)' },
        { label: 'Bonds', pct: 9, color: 'var(--cat-transport)' },
        { label: 'Crypto', pct: 6, color: 'var(--cat-dining)' },
      ],
      holdings: [
        { ticker: 'VTI', name: 'Vanguard Total Stock Mkt', price: 265.11, value: 16540, dayPct: 0.6, weight: 22.3, trend: 'up' },
        { ticker: 'QQQ', name: 'Invesco QQQ Trust', price: 498.30, value: 9860, dayPct: 1.1, weight: 13.3, trend: 'up' },
        { ticker: 'VFFVX', name: 'Target Retirement 2055', price: 52.40, value: 9640, dayPct: 0.3, weight: 13.0, trend: 'up' },
        { ticker: 'VXUS', name: 'Vanguard Total Intl Stock', price: 64.85, value: 8120, dayPct: 0.3, weight: 10.9, trend: 'up' },
        { ticker: 'NVDA', name: 'NVIDIA Corp', price: 141.20, value: 7420, dayPct: 2.3, weight: 10.0, trend: 'up' },
        { ticker: 'BND', name: 'Vanguard Total Bond', price: 72.10, value: 6900, dayPct: -0.1, weight: 9.3, trend: 'down' },
        { ticker: 'MSFT', name: 'Microsoft Corp', price: 428.60, value: 6180, dayPct: 0.7, weight: 8.3, trend: 'up' },
        { ticker: 'AAPL', name: 'Apple Inc', price: 227.30, value: 5240, dayPct: -0.5, weight: 7.1, trend: 'down' },
        { ticker: 'BTC', name: 'Bitcoin', price: 68420.00, value: 3100, dayPct: 1.9, weight: 4.2, trend: 'up' },
        { ticker: 'ETH', name: 'Ethereum', price: 3280.00, value: 1280, dayPct: -0.9, weight: 1.7, trend: 'down' },
      ],
    },
    goals: [
      { id: 'g1', name: 'Emergency Fund', icon: 'shield', color: 'var(--cat-groceries)', current: 12400, target: 18000, targetDate: 'Dec 2026', status: 'on-track' },
      { id: 'g2', name: 'House Down Payment', icon: 'house', color: 'var(--cat-shopping)', current: 21500, target: 60000, targetDate: '2029', status: 'on-track' },
      { id: 'g3', name: 'Japan Trip 2026', icon: 'plane', color: 'var(--cat-transport)', current: 3200, target: 5000, targetDate: 'Oct 2026', status: 'behind' },
    ],
    budget: {
      months: {
        '2026-07': {
          income: 6200,
          budgetTotal: 4150,
          categories: [
            { key: 'housing', name: 'Housing', icon: 'house', color: 'var(--cat-housing)', spent: 1850, budget: 1850 },
            { key: 'groceries', name: 'Groceries', icon: 'cart', color: 'var(--cat-groceries)', spent: 520, budget: 550 },
            { key: 'dining', name: 'Dining', icon: 'utensils', color: 'var(--cat-dining)', spent: 410, budget: 350 },
            { key: 'shopping', name: 'Shopping', icon: 'bag', color: 'var(--cat-shopping)', spent: 380, budget: 400 },
            { key: 'utilities', name: 'Utilities', icon: 'zap', color: 'var(--cat-utilities)', spent: 240, budget: 260 },
            { key: 'transport', name: 'Transport', icon: 'car', color: 'var(--cat-transport)', spent: 190, budget: 220 },
            { key: 'entertainment', name: 'Entertainment', icon: 'film', color: 'var(--cat-entertainment)', spent: 160, budget: 150 },
            { key: 'health', name: 'Health', icon: 'heart', color: 'var(--cat-health)', spent: 130, budget: 200 },
            { key: 'other', name: 'Other', icon: 'dots', color: 'var(--cat-other)', spent: 120, budget: 170 },
          ],
          transactions: [
            { id: 't1', merchant: 'Whole Foods Market', date: 'Jul 6', amount: 86.24, category: 'groceries' },
            { id: 't2', merchant: 'Blue Bottle Coffee', date: 'Jul 6', amount: 12.50, category: 'dining' },
            { id: 't3', merchant: 'Amazon.com', date: 'Jul 5', amount: 54.99, category: 'shopping' },
            { id: 't4', merchant: 'Shell Gas Station', date: 'Jul 5', amount: 48.10, category: 'transport' },
            { id: 't5', merchant: 'Netflix', date: 'Jul 4', amount: 15.49, category: 'entertainment' },
            { id: 't6', merchant: 'PG&E Utility', date: 'Jul 3', amount: 94.30, category: 'utilities' },
          ],
        },
        '2026-06': {
          income: 6100,
          budgetTotal: 4100,
          categories: [
            { key: 'housing', name: 'Housing', icon: 'house', color: 'var(--cat-housing)', spent: 1850, budget: 1850 },
            { key: 'groceries', name: 'Groceries', icon: 'cart', color: 'var(--cat-groceries)', spent: 480, budget: 550 },
            { key: 'dining', name: 'Dining', icon: 'utensils', color: 'var(--cat-dining)', spent: 300, budget: 350 },
            { key: 'shopping', name: 'Shopping', icon: 'bag', color: 'var(--cat-shopping)', spent: 410, budget: 400 },
            { key: 'utilities', name: 'Utilities', icon: 'zap', color: 'var(--cat-utilities)', spent: 250, budget: 260 },
            { key: 'transport', name: 'Transport', icon: 'car', color: 'var(--cat-transport)', spent: 200, budget: 220 },
            { key: 'entertainment', name: 'Entertainment', icon: 'film', color: 'var(--cat-entertainment)', spent: 120, budget: 150 },
            { key: 'health', name: 'Health', icon: 'heart', color: 'var(--cat-health)', spent: 90, budget: 200 },
            { key: 'other', name: 'Other', icon: 'dots', color: 'var(--cat-other)', spent: 100, budget: 170 },
          ],
          transactions: [
            { id: 't7', merchant: 'Trader Joe\'s', date: 'Jun 29', amount: 64.10, category: 'groceries' },
            { id: 't8', merchant: 'Spotify', date: 'Jun 27', amount: 11.99, category: 'entertainment' },
          ],
        },
      },
      currentMonth: '2026-07',
    },
    insights: [
      { tag: 'optimize', icon: '💰', text: "You're holding $18,200 in cash — about 20% of assets. Moving $8,000 to a 4.3% HYSA could earn ~$344/yr more." },
      { tag: 'momentum', icon: '📈', text: 'NVDA is your top mover today at +2.34%. Your portfolio is up +27.6% over the past year.' },
      { tag: 'watch', icon: '📉', text: 'Dining is $60 over budget this month. Trimming it keeps you on pace to save $2,200.' },
    ],
    accounts: [
      { id: 'a1', institution: 'Chase', type: 'checking', name: 'Total Checking', last4: '4821', balance: 4200, status: 'connected', connectedDate: 'Mar 2025' },
      { id: 'a2', institution: 'Chase', type: 'savings', name: 'Chase Savings', last4: '7734', balance: 6000, status: 'connected', connectedDate: 'Mar 2025' },
      { id: 'a3', institution: 'Ally Bank', type: 'savings', name: 'Online Savings', last4: '2290', balance: 8000, status: 'connected', connectedDate: 'Jan 2025' },
      { id: 'a4', institution: 'Fidelity', type: 'investment', name: 'Brokerage Account', last4: '5567', balance: 45680, status: 'connected', connectedDate: 'Aug 2024' },
      { id: 'a5', institution: 'Fidelity', type: 'investment', name: '401(k)', last4: '9012', balance: 28600, status: 'connected', connectedDate: 'Aug 2024' },
      { id: 'a6', institution: 'American Express', type: 'credit', name: 'Gold Card', last4: '1006', balance: -1240, status: 'connected', connectedDate: 'Nov 2024' },
    ],
    settings: {
      profile: { name: 'Alex Rivera', email: 'alex.rivera@example.com', plan: 'Premium' },
      security: {
        mfaEnabled: true,
        sessions: [
          { device: 'MacBook Pro — Chrome', location: 'San Francisco, CA', lastActive: 'Active now' },
          { device: 'iPhone 15 — Meridian App', location: 'San Francisco, CA', lastActive: '2 hours ago' },
        ],
      },
      notifications: { goalMilestones: true, budgetAlerts: true, portfolioSummaries: false },
      personalization: { showGoalsOnDashboard: true, showInsightsOnDashboard: true },
    },
    notifications: [
      { id: 'n1', type: 'goal', text: 'You reached 69% of your Emergency Fund goal.', date: 'Jul 6', read: false },
      { id: 'n2', type: 'budget', text: 'Dining is $60 over budget this month.', date: 'Jul 6', read: false },
      { id: 'n3', type: 'account', text: 'Fidelity Brokerage Account successfully synced.', date: 'Jul 5', read: true },
      { id: 'n4', type: 'portfolio', text: 'Your portfolio is up +27.6% over the past year.', date: 'Jul 1', read: true },
    ],
  };
}

// Institutions offered in the "Connect account" flow (PRD: initial rollout
// focuses on the top five U.S. financial institutions).
const CONNECT_INSTITUTIONS = ['Chase', 'Bank of America', 'Wells Fargo', 'Fidelity', 'Vanguard'];

const Store = {
  _data: null,
  load() {
    if (this._data) return this._data;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      this._data = raw ? JSON.parse(raw) : seedData();
    } catch (e) {
      this._data = seedData();
    }
    if (!this._data) this._data = seedData();
    this._backfillShape(this._data);
    return this._data;
  },
  // Fills in fields added after a user's data was first seeded/saved, so
  // sessions started before this round of changes don't break.
  _backfillShape(data) {
    const fresh = seedData();
    let changed = false;
    ['accounts', 'settings', 'notifications'].forEach((key) => {
      if (!data[key]) {
        data[key] = fresh[key];
        changed = true;
      }
    });
    if (changed) this.save();
  },
  save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this._data));
  },
  get() {
    return this.load();
  },
  update(mutator) {
    const data = this.load();
    mutator(data);
    this.save();
    return data;
  },
  reset() {
    this._data = seedData();
    this.save();
    return this._data;
  },
};

function formatCurrency(n, decimals) {
  return '$' + Number(n).toLocaleString('en-US', {
    minimumFractionDigits: decimals || 0,
    maximumFractionDigits: decimals || 0,
  });
}

function formatK(n) {
  if (Math.abs(n) >= 1000) {
    return '$' + (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  }
  return formatCurrency(n);
}

function formatSignedPct(n) {
  const sign = n > 0 ? '+' : '';
  return sign + n.toFixed(1) + '%';
}
