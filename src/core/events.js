const listeners = new Map();

export const events = {
  on(event, fn) {
    if (!listeners.has(event)) listeners.set(event, new Set());
    listeners.get(event).add(fn);
    return () => listeners.get(event)?.delete(fn);
  },

  off(event, fn) {
    listeners.get(event)?.delete(fn);
  },

  emit(event, data) {
    listeners.get(event)?.forEach(fn => fn(data));
  },
};
