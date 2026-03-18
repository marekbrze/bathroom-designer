import * as THREE from 'three';

const WALL_COLOR = 0xe8e8e8;
const FLOOR_COLOR = 0xd4c4a8;
const WALL_OPACITY = 0.6;

export function createRoomMesh(room) {
  const w = room.width / 100;
  const d = room.depth / 100;
  const h = room.height / 100;
  const meshes = [];

  // Floor
  const floorGeo = new THREE.PlaneGeometry(w, d);
  const floorMat = new THREE.MeshStandardMaterial({ color: FLOOR_COLOR, side: THREE.DoubleSide });
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(w / 2, 0, d / 2);
  floor.receiveShadow = true;
  meshes.push(floor);

  const wallMat = new THREE.MeshStandardMaterial({
    color: WALL_COLOR,
    transparent: true,
    opacity: WALL_OPACITY,
    side: THREE.DoubleSide,
  });

  // North wall (y=0, faces +z)
  const northGeo = new THREE.PlaneGeometry(w, h);
  const north = new THREE.Mesh(northGeo, wallMat);
  north.position.set(w / 2, h / 2, 0);
  meshes.push(north);

  // South wall
  const south = new THREE.Mesh(northGeo, wallMat);
  south.position.set(w / 2, h / 2, d);
  meshes.push(south);

  // West wall
  const sideGeo = new THREE.PlaneGeometry(d, h);
  const west = new THREE.Mesh(sideGeo, wallMat);
  west.rotation.y = Math.PI / 2;
  west.position.set(0, h / 2, d / 2);
  meshes.push(west);

  // East wall
  const east = new THREE.Mesh(sideGeo, wallMat);
  east.rotation.y = Math.PI / 2;
  east.position.set(w, h / 2, d / 2);
  meshes.push(east);

  return meshes;
}
