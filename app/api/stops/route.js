import { NextResponse } from 'next/server';
import { stops } from '@/lib/data';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const routeId = searchParams.get('routeId');

    let filteredStops = stops;

    if (routeId) {
        filteredStops = stops.filter(stop => stop.routeId === routeId);
    }

    return NextResponse.json({
        data: filteredStops
    });
}
