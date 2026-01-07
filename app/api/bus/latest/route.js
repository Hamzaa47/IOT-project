import { NextResponse } from 'next/server';
import { busStore } from '@/lib/store';
import { calculateETA } from '@/lib/etaUpdated';
import { getRouteAverages } from '@/lib/analyticsHelper';
import { routes, stops } from '@/lib/data';

// Force dynamic to prevent caching the response
export const dynamic = 'force-dynamic';

export async function GET() {
  const buses = busStore.getAllBuses();

  // Enhance bus data with deviation-based ETA
  const busesWithEta = await Promise.all(buses.map(async (bus) => {
    // Basic setup
    const routeId = 'route-1';
    const route = routes.find(r => r.id === routeId);
    const routeStops = stops.filter(s => s.routeId === routeId);

    let finalEtas = {};

    if (route && routeStops) {
      // 1. Get Physical ETAs to all future stops (based on current location & speed)
      // This gives "Minutes from NOW until Stop X"
      const physicalEtas = calculateETA(
        { lat: bus.lat, lon: bus.lon },
        route.path,
        routeStops,
        bus.speed
      );

      // 2. Get Historical Averages (Minutes from Trip Start)
      const historicalAverages = await getRouteAverages(routeId);

      // 3. Identify the "Next Stop" (Anchor point)
      // We pick the stop with the smallest positive physical ETA.
      const futureStopIds = Object.keys(physicalEtas).sort((a, b) => physicalEtas[a] - physicalEtas[b]);

      if (futureStopIds.length > 0) {
        const nextStopId = futureStopIds[0];
        const timeToNextStop = physicalEtas[nextStopId]; // T_phys
        const avgTimeAtNextStop = historicalAverages[nextStopId] || 0;

        // 4. Calculate ETAs for all subsequent stops using deviation logic
        // ETA_target = (Time to Next Stop) + (Avg_target - Avg_next)

        futureStopIds.forEach(targetStopId => {
          if (targetStopId === nextStopId) {
            finalEtas[targetStopId] = Math.round(timeToNextStop);
          } else {
            const avgTimeAtTarget = historicalAverages[targetStopId] || 0;
            // Difference in historical schedule between the two stops
            const historicalDiff = avgTimeAtTarget - avgTimeAtNextStop;

            // Avoid negative diffs (in case of bad average data)
            const validDiff = Math.max(0, historicalDiff);

            finalEtas[targetStopId] = Math.round(timeToNextStop + validDiff);
          }
        });
      }
    }

    return {
      ...bus,
      etas: finalEtas
    };
  }));

  return NextResponse.json({
    data: busesWithEta,
    timestamp: new Date().toISOString()
  });
}
