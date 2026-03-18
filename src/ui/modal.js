export function showModal(title, bodyHtml, onConfirm, onCancel) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal">
      <div class="modal__title">${title}</div>
      <div class="modal__body">${bodyHtml}</div>
      <div class="modal__actions">
        <button class="btn modal-cancel">Anuluj</button>
        <button class="btn btn--primary modal-confirm">OK</button>
      </div>
    </div>
  `;

  overlay.querySelector('.modal-cancel').addEventListener('click', () => {
    overlay.remove();
    onCancel?.();
  });

  overlay.querySelector('.modal-confirm').addEventListener('click', () => {
    onConfirm?.(overlay);
    overlay.remove();
  });

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) { overlay.remove(); onCancel?.(); }
  });

  document.body.appendChild(overlay);
  return overlay;
}
