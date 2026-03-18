import { state } from '../core/state.js';
import { WALL_IDS, SURFACE_FLOOR } from '../core/constants.js';

export function getAllSurfaces(room) {
  return [
    { id: SURFACE_FLOOR, label: 'Podłoga', area: (room.width * room.depth) / 10000 },
    { id: 'north', label: 'Ściana Północ', area: (room.width * room.height) / 10000 },
    { id: 'east', label: 'Ściana Wschód', area: (room.depth * room.height) / 10000 },
    { id: 'south', label: 'Ściana Południe', area: (room.width * room.height) / 10000 },
    { id: 'west', label: 'Ściana Zachód', area: (room.depth * room.height) / 10000 },
  ];
}

export function getAssignment(surfaceId) {
  return state.get().surfaceAssignments[surfaceId] || null;
}
