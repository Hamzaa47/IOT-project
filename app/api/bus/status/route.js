import { NextResponse } from 'next/server';
import { busStore } from '@/lib/store';

// Force dynamic since we read from global state (though in Next 13+ route handlers this is default if Request is used or explicit dynamic)
export const dynamic = 'force-dynamic';

export async function GET(request) {
    // Assuming single bus for now or we can take busId query param
    // Default to BUS-101
    const busId = 'BUS-101';

    const busData = busStore.getBus(busId);

    if (!busData) {
        return NextResponse.json(
            { error: 'Bus not found', status: "UNKNOWN", nextStop: "Unknown" },
            { status: 404 }
        );
    }

    return NextResponse.json({
        status: busData.status || "UNKNOWN",
        nextStop: busData.nextStop || "Unknown"
    });
}
