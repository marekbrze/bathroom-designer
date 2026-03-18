import './style.css';
import { createShell } from './app/shell.js';
import { createRoomForm } from './room/room-form.js';
import { createRenderer } from './canvas2d/renderer.js';
import { createTopView } from './canvas2d/top-view.js';
import { drawFrontView } from './canvas2d/front-view.js';
import { drawSideView } from './canvas2d/side-view.js';
import { createFixturePanel } from './fixtures/fixture-panel.js';
import { createFixtureProperties } from './fixtures/fixture-properties.js';
import { createCalculatorPanel } from './calculator/calculator-panel.js';
import { createTabs } from './ui/tabs.js';
import { state } from './core/state.js';
import { events } from './core/events.js';

// Build layout
const { left, right } = createShell();

// Left sidebar: room form + fixture catalog
createRoomForm(left);
createFixturePanel(left);

// Right sidebar: tabs for properties and calculator
const rightTabs = createTabs([
  { id: 'properties', label: 'Właściwości' },
  { id: 'calculator', label: 'Kalkulator' },
], (tabId) => {
  document.getElementById('right-tab-properties').style.display = tabId === 'properties' ? 'block' : 'none';
  document.getElementById('right-tab-calculator').style.display = tabId === 'calculator' ? 'block' : 'none';
});
right.appendChild(rightTabs);

const propsContainer = document.createElement('div');
propsContainer.id = 'right-tab-properties';
right.appendChild(propsContainer);
createFixtureProperties(propsContainer);

const calcContainer = document.createElement('div');
calcContainer.id = 'right-tab-calculator';
calcContainer.style.display = 'none';
right.appendChild(calcContainer);
createCalculatorPanel(calcContainer);

// Canvas renderer
const canvas = document.getElementById('main-canvas');
const renderer = createRenderer(canvas);

// Create top view (default)
const topView = createTopView(renderer);

// Handle view switching
events.on('state:ui', (ui) => {
  if (ui.activeView === 'top') {
    renderer.setDraw(topView.draw);
  } else if (ui.activeView === 'front') {
    renderer.setDraw(drawFrontView);
  } else if (ui.activeView === 'side') {
    renderer.setDraw(drawSideView);
  } else if (ui.activeView === '3d') {
    // Lazy-load Three.js scene
    const container = document.getElementById('three-container');
    if (!container._threeInit) {
      container._threeInit = true;
      import('./three/scene.js').then(mod => {
        mod.initThreeScene(container);
      });
    }
  }
});

// Keyboard shortcut help
window.addEventListener('keydown', (e) => {
  if (e.key === '?' && !e.target.matches('input, textarea, select')) {
    alert(
      'Skróty klawiszowe:\n' +
      'R — obróć zaznaczony element\n' +
      'Delete — usuń zaznaczony element\n' +
      'Alt + klik — przesuwanie widoku\n' +
      'Scroll — zoom\n' +
      '? — ta pomoc'
    );
  }
});
