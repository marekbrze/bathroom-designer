import { WALL_IDS } from '../core/constants.js';

export function deriveWalls(room) {
  const { width, depth, height } = room;
  return [
    { id: 'north', label: 'Północ', width: width, height, x: 0, y: 0, axis: 'x' },
    { id: 'east', label: 'Wschód', width: depth, height, x: width, y: 0, axis: 'y' },
    { id: 'south', label: 'Południe', width: width, height, x: 0, y: depth, axis: 'x' },
    { id: 'west', label: 'Zachód', width: depth, height, x: 0, y: 0, axis: 'y' },
  ];
}

export function getWallArea(wall) {
  return (wall.width * wall.height) / 10000; // cm² → m²
}

export function getFloorArea(room) {
  return (room.width * room.depth) / 10000;
}

export function getTotalWallArea(room) {
  return deriveWalls(room).reduce((sum, w) => sum + getWallArea(w), 0);
}
