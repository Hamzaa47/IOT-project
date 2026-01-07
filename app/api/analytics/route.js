import { NextResponse } from 'next/server';
import { getRouteAverages } from '@/lib/analyticsHelper';
import { stops } from '@/lib/data';

export async function GET() {
    try {
        const routeId = 'route-1';
        const scaledAverages = await getRouteAverages(routeId);

        // Base Start Time: 7:30 AM
        const baseTime = new Date();
        baseTime.setHours(7, 30, 0, 0);

        const routeStops = stops.filter(s => s.routeId === routeId);

        const results = routeStops.map(stop => {
            const minutesFromStart = scaledAverages[stop.id] || 0;
            const projectedTime = new Date(baseTime.getTime() + minutesFromStart * 60000);

            // Format HH:MM AM/PM
            let hours = projectedTime.getHours();
            const minutes = projectedTime.getMinutes();
            const period = hours >= 12 ? 'PM' : 'AM';
            hours = hours % 12 || 12;
            const displayMinutes = minutes.toString().padStart(2, '0');

            return {
                stopId: stop.id,
                stopName: stop.name,
                averageArrivalTime: `${hours}:${displayMinutes} ${period}`
            };
        });

        return NextResponse.json({ data: results });

    } catch (error) {
        console.error('Error fetching analytics:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
