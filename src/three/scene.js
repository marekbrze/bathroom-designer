import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { state } from '../core/state.js';
import { events } from '../core/events.js';
import { createRoomMesh } from './room-mesh.js';
import { createFixtureMesh } from './fixture-meshes.js';

let renderer, scene, camera, controls;
let roomGroup, fixturesGroup;
let initialized = false;

export function initThreeScene(container) {
  if (initialized) return;
  initialized = true;

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xf0f0f0);

  camera = new THREE.PerspectiveCamera(50, container.clientWidth / container.clientHeight, 0.1, 1000);
  camera.position.set(3, 4, 3);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.shadowMap.enabled = true;
  container.appendChild(renderer.domElement);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.target.set(1, 0.5, 1);

  // Lights
  const ambient = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambient);
  const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
  dirLight.position.set(5, 8, 5);
  dirLight.castShadow = true;
  scene.add(dirLight);

  // Room group
  roomGroup = new THREE.Group();
  scene.add(roomGroup);

  // Fixtures group
  fixturesGroup = new THREE.Group();
  scene.add(fixturesGroup);

  updateScene();

  events.on('state:room', updateScene);
  events.on('state:fixtures', updateScene);

  window.addEventListener('resize', () => {
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
  });

  animate();
}

function updateScene() {
  const room = state.getRoom();
  const fixtures = state.getFixtures();
  const selectedId = state.getUI().selectedFixtureId;

  // Update room
  roomGroup.clear();
  const roomMeshes = createRoomMesh(room);
  roomMeshes.forEach(m => roomGroup.add(m));

  // Update camera target
  const cx = (room.width / 100) / 2;
  const cz = (room.depth / 100) / 2;
  controls.target.set(cx, (room.height / 100) / 3, cz);

  // Update fixtures
  fixturesGroup.clear();
  fixtures.forEach(f => {
    const mesh = createFixtureMesh(f, f.id === selectedId);
    fixturesGroup.add(mesh);
  });
}

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}
