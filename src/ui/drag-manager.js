export function createDragManager() {
  let preview = null;

  return {
    startDrag(label, e) {
      preview = document.createElement('div');
      preview.className = 'drag-preview';
      preview.textContent = label;
      preview.style.left = e.clientX + 10 + 'px';
      preview.style.top = e.clientY + 10 + 'px';
      document.body.appendChild(preview);
    },

    moveDrag(e) {
      if (preview) {
        preview.style.left = e.clientX + 10 + 'px';
        preview.style.top = e.clientY + 10 + 'px';
      }
    },

    endDrag() {
      if (preview) {
        preview.remove();
        preview = null;
      }
    },
  };
}
