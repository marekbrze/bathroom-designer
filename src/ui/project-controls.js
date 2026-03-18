import { state } from '../core/state.js';
import { events } from '../core/events.js';

export function createProjectControls(container) {
  const panel = document.createElement('div');
  panel.className = 'panel';
  panel.innerHTML = `
    <div class="panel__header">Projekt</div>
    <div class="panel__body">
      <div class="project-controls" style="display:flex;gap:4px;flex-wrap:wrap;">
        <button class="btn btn--small" id="btn-new-project" title="Nowy projekt">Nowy</button>
        <button class="btn btn--small" id="btn-export" title="Eksportuj do pliku JSON">Eksportuj</button>
        <button class="btn btn--small" id="btn-import" title="Importuj z pliku JSON">Importuj</button>
      </div>
      <input type="file" id="import-file-input" accept=".json" style="display:none;">
    </div>
  `;
  container.appendChild(panel);

  const btnNew = panel.querySelector('#btn-new-project');
  const btnExport = panel.querySelector('#btn-export');
  const btnImport = panel.querySelector('#btn-import');
  const fileInput = panel.querySelector('#import-file-input');

  btnNew.addEventListener('click', () => {
    if (confirm('Czy na pewno chcesz utworzyć nowy projekt?\nWszystkie niezapisane zmiany zostaną utracone.')) {
      state.reset();
    }
  });

  btnExport.addEventListener('click', () => {
    const json = state.exportToJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10);
    const filename = `bathroom-${dateStr}.json`;
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });

  btnImport.addEventListener('click', () => {
    fileInput.click();
  });

  fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (confirm('Czy na pewno chcesz zaimportować ten projekt?\nObecny projekt zostanie nadpisany.')) {
        const success = state.importFromJSON(ev.target.result);
        if (!success) {
          alert('Nie udało się zaimportować pliku. Sprawdź czy plik jest poprawnym plikiem JSON.');
        }
      }
    };
    reader.readAsText(file);
    fileInput.value = '';
  });

  panel.querySelector('.panel__header').addEventListener('click', () => {
    panel.classList.toggle('panel--collapsed');
  });
}
