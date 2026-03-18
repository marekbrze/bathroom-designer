import * as THREE from 'three';

const FIXTURE_COLOR = 0x90caf9;
const SELECTED_COLOR = 0xffcc80;
const WALL_MOUNTED_COLOR = 0xa5d6a7;

export function createFixtureMesh(fixture, isSelected) {
  const isRotated = fixture.rotation === 90 || fixture.rotation === 270;
  const w = (isRotated ? fixture.depth : fixture.width) / 100;
  const d = (isRotated ? fixture.width : fixture.depth) / 100;
  const h = fixture.height / 100;

  const geo = new THREE.BoxGeometry(w, h, d);
  const color = isSelected ? SELECTED_COLOR : (fixture.wallMounted ? WALL_MOUNTED_COLOR : FIXTURE_COLOR);
  const mat = new THREE.MeshStandardMaterial({ color });

  const mesh = new THREE.Mesh(geo, mat);
  mesh.castShadow = true;

  const px = fixture.x / 100 + w / 2;
  const py = fixture.z / 100 + h / 2;
  const pz = fixture.y / 100 + d / 2;
  mesh.position.set(px, py, pz);

  return mesh;
}
