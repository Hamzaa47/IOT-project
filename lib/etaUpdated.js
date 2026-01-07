
function getDistanceFromLatLonInMeters(lat1, lon1, lat2, lon2) {
    if ((lat1 == lat2) && (lon1 == lon2)) {
        return 0;
    }
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in km
    return d * 1000;
}

function deg2rad(deg) {
    return deg * (Math.PI / 180);
}

// Find the closest point index on the path to the current location
function findClosestPointIndex(path, lat, lon) {
    let minDistance = Infinity;
    let closestIndex = 0;

    for (let i = 0; i < path.length; i++) {
        const dist = getDistanceFromLatLonInMeters(lat, lon, path[i][0], path[i][1]);
        if (dist < minDistance) {
            minDistance = dist;
            closestIndex = i;
        }
    }
    return closestIndex;
}

/**
 * Calculate ETA for all stops on the route
 * @param {Object} busLocation - { lat, lon }
 * @param {Array} routePath - [[lat, lon], ...]
 * @param {Array} stops -Array of stop objects
 * @param {Number} speedKmh - Current speed in km/h
 * @returns {Object} Map of stopId -> ETA (in minutes)
 */
export function calculateETA(busLocation, routePath, stops, speedKmh) {
    if (!routePath || routePath.length === 0 || !stops) return {};

    // 1. Find where the bus is on the route
    const currentPathIndex = findClosestPointIndex(routePath, busLocation.lat, busLocation.lon);

    // Default speed if stopped (prevent infinity)
    // Use 30 km/h as average city bus speed if current speed is 0 or very low
    const effectiveSpeed = (speedKmh && speedKmh > 5) ? speedKmh : 30;
    const speedMetersPerMin = (effectiveSpeed * 1000) / 60;

    const etas = {};
    let distanceSoFar = 0;

    // 2. Map stops to their closest point index on the route path for ordering
    // This is crucial because stops array might not be strictly ordered by path, 
    // though in our data it usually is. We trust the path order.
    const stopIndices = stops.map(stop => {
        return {
            id: stop.id,
            index: findClosestPointIndex(routePath, stop.lat, stop.lng)
        };
    });

    // 3. Iterate through the path starting from the bus's current position
    for (let i = currentPathIndex; i < routePath.length - 1; i++) {
        const p1 = routePath[i];
        const p2 = routePath[i + 1];
        const segmentDist = getDistanceFromLatLonInMeters(p1[0], p1[1], p2[0], p2[1]);

        distanceSoFar += segmentDist;

        // Check if we passed any stops in this segment (or at the current point)
        // We look for stops whose closest path index is <= the next point (i+1)
        // and haven't been calculated yet.
        // A simpler approach for low-res paths: check if any stop maps to index i+1

        // Find stops that are at or passed by this new point
        // We only care about stops AHEAD of us (index > currentPathIndex)
        const stopsAtThisPoint = stopIndices.filter(s => s.index === i + 1);

        stopsAtThisPoint.forEach(s => {
            if (!etas[s.id]) {
                const timeMinutes = distanceSoFar / speedMetersPerMin;
                etas[s.id] = Math.round(timeMinutes);
            }
        });
    }

    return etas;
}
