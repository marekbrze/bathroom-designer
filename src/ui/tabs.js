export function createTabs(items, onChange) {
  const container = document.createElement('div');
  container.className = 'tabs';

  items.forEach((item, i) => {
    const btn = document.createElement('button');
    btn.className = 'tabs__tab' + (i === 0 ? ' tabs__tab--active' : '');
    btn.textContent = item.label;
    btn.dataset.id = item.id;
    btn.addEventListener('click', () => {
      container.querySelectorAll('.tabs__tab').forEach(b => b.classList.remove('tabs__tab--active'));
      btn.classList.add('tabs__tab--active');
      onChange(item.id);
    });
    container.appendChild(btn);
  });

  return container;
}
