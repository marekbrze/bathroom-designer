export function createPanel(title, content) {
  const panel = document.createElement('div');
  panel.className = 'panel';
  panel.innerHTML = `
    <div class="panel__header">${title}</div>
    <div class="panel__body">${content}</div>
  `;
  panel.querySelector('.panel__header').addEventListener('click', () => {
    panel.classList.toggle('panel--collapsed');
  });
  return panel;
}
