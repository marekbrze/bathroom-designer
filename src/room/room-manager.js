import { state } from '../core/state.js';
import { events } from '../core/events.js';
import { showModal } from '../ui/modal.js';

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export function createRoomManager(container) {
  const wrapper = document.createElement('div');
  wrapper.className = 'room-manager';
  container.appendChild(wrapper);

  function render() {
    const rooms = state.getRooms();
    const currentId = state.getCurrentRoomId();

    wrapper.innerHTML = '';

    const strip = document.createElement('div');
    strip.className = 'room-tabs';

    rooms.forEach(r => {
      const tab = document.createElement('div');
      tab.className = 'room-tab' + (r.id === currentId ? ' room-tab--active' : '');

      const nameSpan = document.createElement('span');
      nameSpan.className = 'room-tab__name';
      nameSpan.textContent = r.name;
      nameSpan.title = r.name;
      nameSpan.addEventListener('click', () => state.switchRoom(r.id));

      const renameBtn = document.createElement('button');
      renameBtn.className = 'room-tab__btn';
      renameBtn.textContent = '✏';
      renameBtn.title = 'Zmień nazwę';
      renameBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        handleRename(r);
      });

      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'room-tab__btn room-tab__btn--danger';
      deleteBtn.textContent = '×';
      deleteBtn.title = 'Usuń pomieszczenie';
      deleteBtn.disabled = rooms.length <= 1;
      deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        handleDelete(r);
      });

      tab.appendChild(nameSpan);
      tab.appendChild(renameBtn);
      tab.appendChild(deleteBtn);
      strip.appendChild(tab);
    });

    const addBtn = document.createElement('button');
    addBtn.className = 'room-tab__add btn btn--small';
    addBtn.textContent = '+ Pomieszczenie';
    addBtn.addEventListener('click', handleAdd);

    strip.appendChild(addBtn);
    wrapper.appendChild(strip);
  }

  function handleAdd() {
    showModal(
      'Nowe pomieszczenie',
      `<div class="form-group">
        <label>Nazwa pomieszczenia</label>
        <input type="text" id="new-room-name" value="Łazienka" style="width:100%">
      </div>`,
      (overlay) => {
        const name = overlay.querySelector('#new-room-name').value.trim() || 'Pomieszczenie';
        state.addRoom(name);
      }
    );
  }

  function handleRename(room) {
    showModal(
      'Zmień nazwę pomieszczenia',
      `<div class="form-group">
        <label>Nazwa pomieszczenia</label>
        <input type="text" id="rename-room-name" value="${escapeHtml(room.name)}" style="width:100%">
      </div>`,
      (overlay) => {
        const name = overlay.querySelector('#rename-room-name').value.trim();
        if (name) state.renameRoom(room.id, name);
      }
    );
  }

  function handleDelete(room) {
    if (state.getRooms().length <= 1) return;
    showModal(
      'Usuń pomieszczenie',
      `<p>Czy na pewno chcesz usunąć pomieszczenie <strong>${escapeHtml(room.name)}</strong>?<br>
        Wszystkie urządzenia i strefy płytek zostaną utracone.</p>`,
      () => {
        state.removeRoom(room.id);
      }
    );
  }

  events.on('state:rooms', render);

  render();
}
