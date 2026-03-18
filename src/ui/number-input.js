export function createNumberInput(label, value, unit, min, max, onChange) {
  const group = document.createElement('div');
  group.className = 'form-group';
  group.innerHTML = `
    <label>${label}${unit ? ` (${unit})` : ''}</label>
    <input type="number" value="${value}" min="${min}" max="${max}">
  `;
  const input = group.querySelector('input');
  input.addEventListener('input', () => {
    const v = parseFloat(input.value);
    if (!isNaN(v) && v >= min && v <= max) onChange(v);
  });
  return { el: group, input };
}
