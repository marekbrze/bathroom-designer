import './style.css';
import { createShell } from './app/shell.js';
import { createProjectControls } from './ui/project-controls.js';
import { createRoomForm } from './room/room-form.js';
import { createRoomManager } from './room/room-manager.js';
import { createFixturePanel } from './fixtures/fixture-panel.js';
import { createFixtureProperties } from './fixtures/fixture-properties.js';
import { createCalculatorPanel } from './calculator/calculator-panel.js';
import { createTilesPanel } from './tiles/tiles-panel.js';
import { createFrontsPanel } from './tiles/fronts-panel.js';
import { createTabs } from './ui/tabs.js';
import { state } from './core/state.js';
import { events } from './core/events.js';
import { createRenderer } from './canvas2d/renderer.js';
import { createTopView } from './canvas2d/top-view.js';
import { drawFrontView } from './canvas2d/front-view.js';
import { drawSideView } from './canvas2d/side-view.js';

const { left, right } = createShell();

createProjectControls(left);
createRoomManager(left);
createRoomForm(left);
createFixturePanel(left);

// Right sidebar: tabs for properties and calculator
const rightTabs = createTabs([
  { id: 'properties', label: 'Właściwości' },
  { id: 'calculator', label: 'Kalkulator' },
  { id: 'tiles', label: 'Płytki' },
], (tabId) => {
  document.getElementById('right-tab-properties').style.display = tabId === 'properties' ? 'block' : 'none';
  document.getElementById('right-tab-calculator').style.display = tabId === 'calculator' ? 'block' : 'none';
  document.getElementById('right-tab-tiles').style.display = tabId === 'tiles' ? 'block' : 'none';
  state.update('ui.sidebarTab', tabId);
});
right.appendChild(rightTabs);

function switchRightTab(tabId) {
  document.getElementById('right-tab-properties').style.display = tabId === 'properties' ? 'block' : 'none';
  document.getElementById('right-tab-calculator').style.display = tabId === 'calculator' ? 'block' : 'none';
  document.getElementById('right-tab-tiles').style.display = tabId === 'tiles' ? 'block' : 'none';
  rightTabs.querySelectorAll('.tabs__tab').forEach(btn => {
    btn.classList.toggle('tabs__tab--active', btn.dataset.id === tabId);
  });
}

const propsContainer = document.createElement('div');
propsContainer.id = 'right-tab-properties';
right.appendChild(propsContainer);
createFixtureProperties(propsContainer);

const calcContainer = document.createElement('div');
calcContainer.id = 'right-tab-calculator';
calcContainer.style.display = 'none';
right.appendChild(calcContainer);
createCalculatorPanel(calcContainer);

const tilesContainer = document.createElement('div');
tilesContainer.id = 'right-tab-tiles';
tilesContainer.style.display = 'none';
right.appendChild(tilesContainer);
createTilesPanel(tilesContainer);
createFrontsPanel(tilesContainer);

// Canvas renderer
const canvas = document.getElementById('main-canvas');
const renderer = createRenderer(canvas);

// Create top view (default)
const topView = createTopView(renderer);
renderer.setDraw(topView.draw);

// Handle view switching
events.on('state:ui', (ui) => {
  if (ui.activeView === 'top') {
    renderer.setDraw(topView.draw);
    switchRightTab('properties');
  } else if (ui.activeView === 'front') {
    renderer.setDraw(drawFrontView);
    switchRightTab('properties');
  } else if (ui.activeView === 'side') {
    renderer.setDraw(drawSideView);
    switchRightTab('properties');
  } else if (ui.activeView === '3d') {
    // Lazy-load Three.js scene
    const container = document.getElementById('three-container');
    if (!container._threeInit) {
      container._threeInit = true;
      import('./three/scene.js').then(mod => {
        mod.initThreeScene(container);
      });
    }
    switchRightTab('properties');
  } else if (ui.activeView === 'tiles') {
    // Lazy-load Tiles view
    const container = document.getElementById('tiles-container');
    if (!container._tilesInit) {
      container._tilesInit = true;
      import('./tiles/tiles-view.js').then(mod => {
        mod.createTilesView(container);
      });
    }
    switchRightTab('tiles');
  }
});
