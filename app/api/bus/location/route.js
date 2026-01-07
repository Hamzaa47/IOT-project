import { NextResponse } from 'next/server';
import { busStore } from '@/lib/store';
import { prisma } from '@/lib/prisma';
import { stops } from '@/lib/data';

function getDistanceFromLatLonInMeters(lat1, lon1, lat2, lon2) {
  var R = 6371; // Radius of the earth in km
  var dLat = deg2rad(lat2 - lat1);
  var dLon = deg2rad(lon2 - lon1);
  var a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  var d = R * c; // Distance in km
  return d * 1000; // Distance in meters
}

function deg2rad(deg) {
  return deg * (Math.PI / 180);
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { busId, lat, lon, speed, status, nextStop } = body;

    // Basic validation
    if (!busId || lat === undefined || lon === undefined || speed === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: busId, lat, lon, speed' },
        { status: 400 }
      );
    }

    const currentLat = parseFloat(lat);
    const currentLon = parseFloat(lon);

    // Update in-memory store for realtime UI
    const updatedBus = busStore.updateBusLocation(busId, currentLat, currentLon, parseFloat(speed), status, nextStop);

    // Check availability near stops
    // We filter stops for the relevant route (assuming route-1 for now or we can get it from busStore if we tracked routeId there)
    // For simplicity, checking all stops or stops on route-1
    const routeStops = stops.filter(s => s.routeId === 'route-1'); // Currently hardcoded to route-1 as per simulate-bus.js

    for (const stop of routeStops) {
      const distance = getDistanceFromLatLonInMeters(currentLat, currentLon, stop.lat, stop.lng);

      // If within 50 meters
      if (distance < 50) {
        // Check if we already recorded an arrival at this stop recently (e.g., within last 2 minutes) to prevent duplicates
        const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);

        const recentArrival = await prisma.stopArrival.findFirst({
          where: {
            busId: busId,
            stopId: stop.id,
            timestamp: {
              gte: twoMinutesAgo
            }
          }
        });

        if (!recentArrival) {
          console.log(`Bus ${busId} arrived at ${stop.name} (${stop.id})`);
          await prisma.stopArrival.create({
            data: {
              busId,
              routeId: stop.routeId,
              stopId: stop.id,
              timestamp: new Date()
            }
          });
        }
      }
    }

    return NextResponse.json({
      message: 'Location updated successfully',
      data: updatedBus
    });
  } catch (error) {
    console.error('Error updating location:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
