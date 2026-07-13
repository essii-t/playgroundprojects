(function () {
  const data = Store.get();
  const goalIcons = ['shield', 'house', 'plane', 'car', 'heart', 'bag'];
  const palette = ['var(--cat-groceries)', 'var(--cat-shopping)', 'var(--cat-transport)', 'var(--cat-utilities)', 'var(--cat-dining)'];
  let selectedIcon = goalIcons[0];
  let contributingGoalId = null;
  let editingGoalId = null;

  function renderMain() {
    const goals = data.goals;
    const totalSaved = goals.reduce((s, g) => s + g.current, 0);
    const totalTarget = goals.reduce((s, g) => s + g.target, 0);

    document.getElementById('page-main').innerHTML = `
      <div class="page-header-row">
        <div>
          <div class="page-eyebrow">Planning</div>
          <div class="page-title">Savings goals</div>
        </div>
        <button class="btn btn-primary" id="new-goal-btn">${icon('plus')}<span style="margin-left:4px;">New goal</span></button>
      </div>

      <div class="hero-card" style="margin-bottom:20px; display:flex; flex-wrap:wrap;">
        <div>
          <div class="hero-label">Total saved toward goals</div>
          <div style="font-family:var(--font-serif); font-size:28px; margin-top:6px;">${formatCurrency(totalSaved)}</div>
        </div>
        <div style="border-left:1px solid rgba(255, 255, 255, 0.1); margin-left:30px; padding-left:30px;">
          <div class="hero-label">Combined target</div>
          <div style="font-family:var(--font-serif); font-size:28px; margin-top:6px;">${formatCurrency(totalTarget)}</div>
        </div>
        <div style="border-left:1px solid rgba(255, 255, 255, 0.1); margin-left:30px; padding-left:30px;">
          <div class="hero-label">Monthly contribution</div>
          <div style="font-family:var(--font-serif); font-size:28px; margin-top:6px; color:var(--mint);">$1,750</div>
        </div>
      </div>

      <div class="grid-3" id="goals-grid"></div>

      <div class="modal-overlay" id="new-goal-modal">
        <div class="modal">
          <div class="modal-header">
            <div class="modal-title">New goal</div>
            <button class="icon-btn" id="close-new-goal">${icon('x')}</button>
          </div>
          <form id="new-goal-form">
            <div class="form-field">
              <label>Goal name</label>
              <input type="text" id="goal-name" placeholder="e.g. New Car" required />
            </div>
            <div class="form-field">
              <label>Icon</label>
              <div class="icon-choices" id="icon-choices">
                ${goalIcons.map((ic) => `<button type="button" class="icon-choice ${ic === selectedIcon ? 'selected' : ''}" data-icon="${ic}">${icon(ic)}</button>`).join('')}
              </div>
            </div>
            <div class="form-field">
              <label>Target amount</label>
              <input type="number" id="goal-target" min="1" placeholder="5000" required />
            </div>
            <div class="form-field">
              <label>Starting amount (optional)</label>
              <input type="number" id="goal-current" min="0" placeholder="0" />
            </div>
            <div class="form-field">
              <label>Target date</label>
              <input type="text" id="goal-date" placeholder="e.g. Dec 2027" required />
            </div>
            <div style="display:flex; justify-content:space-between; align-items:center; gap:10px; margin-top:20px;">
              <button type="button" class="btn btn-danger-ghost" id="delete-goal-btn" style="visibility:hidden;">${icon('trash')}<span style="margin-left:4px;">Delete goal</span></button>
              <div style="display:flex; gap:10px;">
                <button type="button" class="btn" id="cancel-new-goal">Cancel</button>
                <button type="submit" class="btn btn-primary" id="goal-submit-btn">Create goal</button>
              </div>
            </div>
          </form>
        </div>
      </div>

      <div class="modal-overlay" id="contribute-modal">
        <div class="modal">
          <div class="modal-header">
            <div class="modal-title">Add contribution</div>
            <button class="icon-btn" id="close-contribute">${icon('x')}</button>
          </div>
          <div class="form-field">
            <label>Amount to add</label>
            <input type="number" id="contribute-amount" min="1" placeholder="500" />
          </div>
          <div class="modal-actions">
            <button class="btn" id="cancel-contribute">Cancel</button>
            <button class="btn btn-primary" id="confirm-contribute">Add</button>
          </div>
        </div>
      </div>
    `;

    renderGoalsGrid();
    wireModals();
  }

  function renderGoalsGrid() {
    document.getElementById('goals-grid').innerHTML = data.goals.map((g) => {
      const pct = Math.min(100, Math.round((g.current / g.target) * 100));
      const toGo = Math.max(0, g.target - g.current);
      return `
      <div class="card">
        <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:14px;">
          <div style="display:flex; gap:12px;">
            <span class="icon-badge" style="background:color-mix(in srgb, ${g.color} 16%, white); color:${g.color};">${icon(g.icon, g.color)}</span>
            <div>
              <div style="font-weight:700; margin-bottom:4px;">${g.name}</div>
              <div style="font-size:12.5px; color:var(--text-faint); margin-bottom:6px;">Target ${g.targetDate}</div>
              <span class="badge ${g.status === 'on-track' ? 'on-track' : 'behind'}">${g.status === 'on-track' ? 'On track' : 'Behind'}</span>
            </div>
          </div>
          <button class="icon-btn-sm" data-edit-goal="${g.id}" aria-label="Edit goal">${icon('edit')}</button>
        </div>
        <div style="font-family:var(--font-serif); font-size:26px; margin-bottom:10px;">${formatCurrency(g.current)} <span style="font-size:15px; font-family:var(--font-sans); color:var(--text-faint);">of ${formatCurrency(g.target)}</span></div>
        <div class="progress-track"><div class="progress-fill" style="width:${pct}%; background:${g.color};"></div></div>
        <div style="display:flex; justify-content:space-between; margin-top:8px; font-size:12.5px;">
          <span style="color:var(--accent-dark); font-weight:600;">${pct}% funded</span>
          <span style="color:var(--text-faint);">${formatCurrency(toGo)} to go</span>
        </div>
        <button class="btn btn-sm" style="width:100%; justify-content:center; margin-top:14px;" data-contribute="${g.id}">Add contribution</button>
      </div>`;
    }).join('');

    document.querySelectorAll('[data-contribute]').forEach((btn) => {
      btn.addEventListener('click', () => {
        contributingGoalId = btn.dataset.contribute;
        document.getElementById('contribute-modal').classList.add('open');
      });
    });

    document.querySelectorAll('[data-edit-goal]').forEach((btn) => {
      btn.addEventListener('click', () => openGoalModal(btn.dataset.editGoal));
    });
  }

  function openGoalModal(goalId) {
    editingGoalId = goalId || null;
    const modal = document.getElementById('new-goal-modal');
    const titleEl = modal.querySelector('.modal-title');
    const submitBtn = document.getElementById('goal-submit-btn');
    const deleteBtn = document.getElementById('delete-goal-btn');

    if (editingGoalId) {
      const g = data.goals.find((x) => x.id === editingGoalId);
      titleEl.textContent = 'Edit goal';
      submitBtn.textContent = 'Save changes';
      document.getElementById('goal-name').value = g.name;
      document.getElementById('goal-target').value = g.target;
      document.getElementById('goal-current').value = g.current;
      document.getElementById('goal-date').value = g.targetDate;
      selectedIcon = g.icon;
      deleteBtn.style.visibility = 'visible';
    } else {
      titleEl.textContent = 'New goal';
      submitBtn.textContent = 'Create goal';
      document.getElementById('goal-name').value = '';
      document.getElementById('goal-target').value = '';
      document.getElementById('goal-current').value = '';
      document.getElementById('goal-date').value = '';
      selectedIcon = goalIcons[0];
      deleteBtn.style.visibility = 'hidden';
    }
    document.querySelectorAll('#icon-choices .icon-choice').forEach((b) => b.classList.toggle('selected', b.dataset.icon === selectedIcon));
    modal.classList.add('open');
  }

  function wireModals() {
    const newGoalModal = document.getElementById('new-goal-modal');
    document.getElementById('new-goal-btn').addEventListener('click', () => openGoalModal(null));
    document.getElementById('close-new-goal').addEventListener('click', () => newGoalModal.classList.remove('open'));
    document.getElementById('cancel-new-goal').addEventListener('click', () => newGoalModal.classList.remove('open'));

    document.querySelectorAll('#icon-choices .icon-choice').forEach((btn) => {
      btn.addEventListener('click', () => {
        selectedIcon = btn.dataset.icon;
        document.querySelectorAll('#icon-choices .icon-choice').forEach((b) => b.classList.toggle('selected', b === btn));
      });
    });

    document.getElementById('new-goal-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('goal-name').value.trim();
      const target = Number(document.getElementById('goal-target').value);
      const current = Number(document.getElementById('goal-current').value) || 0;
      const targetDate = document.getElementById('goal-date').value.trim();
      if (!name || !target || !targetDate) return;

      if (editingGoalId) {
        Store.update((d) => {
          const g = d.goals.find((x) => x.id === editingGoalId);
          g.name = name;
          g.icon = selectedIcon;
          g.current = current;
          g.target = target;
          g.targetDate = targetDate;
          g.status = current / target >= 0.5 ? 'on-track' : 'behind';
        });
      } else {
        Store.update((d) => {
          d.goals.push({
            id: 'g' + Date.now(),
            name,
            icon: selectedIcon,
            color: palette[d.goals.length % palette.length],
            current,
            target,
            targetDate,
            status: current / target >= 0.5 ? 'on-track' : 'behind',
          });
        });
      }
      newGoalModal.classList.remove('open');
      renderMain();
    });

    document.getElementById('delete-goal-btn').addEventListener('click', () => {
      if (!editingGoalId) return;
      const g = data.goals.find((x) => x.id === editingGoalId);
      confirmAction({
        title: 'Delete goal?',
        message: `Delete "${g.name}"? This can't be undone.`,
        confirmLabel: 'Delete',
        onConfirm: () => {
          Store.update((d) => {
            d.goals = d.goals.filter((x) => x.id !== editingGoalId);
          });
          newGoalModal.classList.remove('open');
          renderMain();
        },
      });
    });

    const contribModal = document.getElementById('contribute-modal');
    document.getElementById('close-contribute').addEventListener('click', () => contribModal.classList.remove('open'));
    document.getElementById('cancel-contribute').addEventListener('click', () => contribModal.classList.remove('open'));
    document.getElementById('confirm-contribute').addEventListener('click', () => {
      const amount = Number(document.getElementById('contribute-amount').value);
      if (!amount || !contributingGoalId) { contribModal.classList.remove('open'); return; }
      Store.update((d) => {
        const g = d.goals.find((g) => g.id === contributingGoalId);
        g.current = Math.min(g.target, g.current + amount);
        g.status = g.current / g.target >= 0.55 ? 'on-track' : g.status;
      });
      contribModal.classList.remove('open');
      renderMain();
    });
  }

  renderShell('goals');
  renderMain();
})();
