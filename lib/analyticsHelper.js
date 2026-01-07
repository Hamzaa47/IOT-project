import { prisma } from '@/lib/prisma';
import { stops } from '@/lib/data';

export async function getRouteAverages(routeId = 'route-1') {
    try {
        const fifteenDaysAgo = new Date();
        fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);

        // Fetch all arrivals for the last 15 days
        const arrivals = await prisma.stopArrival.findMany({
            where: {
                timestamp: { gte: fifteenDaysAgo },
                routeId: routeId
            },
            orderBy: [
                { busId: 'asc' },
                { timestamp: 'asc' }
            ]
        });

        const routeStops = stops.filter(s => s.routeId === routeId);
        const firstStopId = routeStops[0]?.id;
        const lastStopId = routeStops[routeStops.length - 1]?.id;

        if (!firstStopId) return {};

        // Calculate simplified durations
        const stopDurations = {}; // stopId -> [minutesFromStart]
        routeStops.forEach(s => stopDurations[s.id] = []);

        const arrivalsByBus = arrivals.reduce((acc, curr) => {
            if (!acc[curr.busId]) acc[curr.busId] = [];
            acc[curr.busId].push(curr);
            return acc;
        }, {});

        Object.values(arrivalsByBus).forEach(busArrivals => {
            let tripStartTime = null;
            busArrivals.forEach(arrival => {
                if (arrival.stopId === firstStopId) {
                    tripStartTime = new Date(arrival.timestamp);
                    stopDurations[firstStopId].push(0);
                } else if (tripStartTime) {
                    const diff = (new Date(arrival.timestamp) - tripStartTime) / 60000;
                    if (diff > 0 && diff < 120 && stopDurations[arrival.stopId]) {
                        stopDurations[arrival.stopId].push(diff);
                    }
                }
            });
        });

        const avgDurations = {};
        routeStops.forEach(stop => {
            const durs = stopDurations[stop.id];
            avgDurations[stop.id] = (durs && durs.length)
                ? durs.reduce((a, b) => a + b, 0) / durs.length
                : 0;
        });

        // Scale to 90 mins (7:30 -> 9:00)
        // If data is empty, we fake a linear distribution based on stop index? 
        // Or just assume the "average" is 5 mins per stop if max is 0.
        // The existing logic used lastStop duration or 1.
        let totalSimulatedDuration = avgDurations[lastStopId] || 0;

        // Fallback if no data: Estimate based on index (assuming 90 mins total)
        if (totalSimulatedDuration === 0) {
            routeStops.forEach((stop, index) => {
                avgDurations[stop.id] = (index / (routeStops.length - 1)) * 90;
            });
            totalSimulatedDuration = 90;
        }

        const targetDuration = 90;
        const scaleFactor = targetDuration / (totalSimulatedDuration || 1);

        const scaledAverages = {};
        routeStops.forEach(stop => {
            scaledAverages[stop.id] = avgDurations[stop.id] * scaleFactor;
        });

        return scaledAverages;
    } catch (error) {
        console.error("Error calculating averages:", error);
        return {};
    }
}
