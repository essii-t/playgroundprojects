// Reusable delete-confirmation modal. Lazily injects one overlay into the
// page and reconfigures it per call, so callers don't need their own markup.
const ConfirmDialog = (function () {
  let overlay = null;

  function ensureModal() {
    if (overlay) return overlay;
    overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = 'confirm-dialog-overlay';
    overlay.innerHTML = `
      <div class="modal">
        <div class="modal-header">
          <div class="modal-title" id="confirm-dialog-title">Are you sure?</div>
          <button class="icon-btn" id="confirm-dialog-close">${icon('x')}</button>
        </div>
        <p id="confirm-dialog-message" style="font-size:13.5px; color:var(--text-soft); line-height:1.5;"></p>
        <div class="modal-actions">
          <button class="btn" id="confirm-dialog-cancel">Cancel</button>
          <button class="btn btn-danger" id="confirm-dialog-confirm">Delete</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);

    overlay.querySelector('#confirm-dialog-close').addEventListener('click', close);
    overlay.querySelector('#confirm-dialog-cancel').addEventListener('click', close);

    return overlay;
  }

  function close() {
    if (overlay) overlay.classList.remove('open');
  }

  function open({ title = 'Are you sure?', message = '', confirmLabel = 'Delete', onConfirm }) {
    const el = ensureModal();
    el.querySelector('#confirm-dialog-title').textContent = title;
    el.querySelector('#confirm-dialog-message').textContent = message;
    const confirmBtn = el.querySelector('#confirm-dialog-confirm');
    confirmBtn.textContent = confirmLabel;

    const newConfirmBtn = confirmBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
    newConfirmBtn.addEventListener('click', () => {
      close();
      if (onConfirm) onConfirm();
    });

    el.classList.add('open');
  }

  return { open };
})();

function confirmAction(opts) {
  ConfirmDialog.open(opts);
}
