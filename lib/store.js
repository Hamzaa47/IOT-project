// lib/store.js

// Using a global variable to persist data across hot reloads in development
// Note: This will still reset on full server restarts or serverless cold starts.
global.busData = global.busData || {};

export const busStore = {
  updateBusLocation: (busId, lat, lon, speed, externalStatus, nextStop) => {
    let status = externalStatus || 'Stopped';
    if (!externalStatus) {
      if (speed >= 20) {
        status = 'Moving';
      } else if (speed > 0) {
        status = 'In Traffic';
      }
    }

    const timestamp = new Date().toISOString();

    global.busData[busId] = {
      busId,
      lat,
      lon,
      speed,
      status,
      nextStop: nextStop || null,
      lastUpdated: timestamp,
    };

    return global.busData[busId];
  },

  getAllBuses: () => {
    return Object.values(global.busData);
  },

  getBus: (busId) => {
    return global.busData[busId];
  }
};
