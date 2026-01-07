// Node.js 18+ has built-in fetch.
// If running in an environment without fetch (older Node), you might need: npm install node-fetch
// const fetch = require('node-fetch');

const BUS_ID = 'BUS-101';
const API_URL = 'http://localhost:3000/api/bus/location';

// STOPS Data (Embed directly to avoid import issues)
const STOPS = [
    { name: "Toll Tax Chowk", lat: 31.3936455523383, lng: 73.11705875174114 },
    { name: "Nadeem Cafe", lat: 31.396754173875678, lng: 73.11287695853164 },
    { name: "Muhammadabad", lat: 31.399711, lng: 73.108984 },
    { name: "Hameed Palace", lat: 31.400475842836155, lng: 73.10388278507594 },
    { name: "Babar Chowk", lat: 31.39774230310697, lng: 73.1005186033225 },
    { name: "Tempo Store", lat: 31.396536340683024, lng: 73.09931963531132 },
    { name: "Pahari Ground", lat: 31.39595, lng: 73.09855 },
    { name: "McDonalds", lat: 31.40295549942208, lng: 73.10557959695352 },
    { name: "Peoples Colony", lat: 31.409375, lng: 73.109948 },
    { name: "Kohinoor Plaza", lat: 31.413118, lng: 73.112971 },
    { name: "Madina Town", lat: 31.422742, lng: 73.118461 },
    { name: "Allied Bank", lat: 31.42678, lng: 73.122585 },
    { name: "Kashmir Pull", lat: 31.44114045923111, lng: 73.13430076210444 },
    { name: "University Campus", lat: 31.46058, lng: 73.146684 },
];

const ROUTE_PATH = [
    [31.3936455523383, 73.11705875174114], // Toll Tax Chowk
    [31.396754173875678, 73.11287695853164], // Nadeem Cafe
    [31.399711, 73.108984], // Muhammadabad
    [31.402263, 73.105672], // Gates
    [31.40223902858446, 73.1052331668794],
    [31.40068767840941, 73.1036002333223], // Hameed Palace
    [31.39774230310697, 73.1005186033225], // Babar Chowk
    [31.396536340683024, 73.09931963531132], // Tempo Store
    [31.394591, 73.097946], // Pahari Ground
    [31.394812, 73.097774], // Pahari Ground
    [31.39595, 73.09855], // Pahari Ground
    [31.396932, 73.099239],
    [31.40295549942208, 73.10557959695352], // McDonalds
    [31.406582, 73.109428],
    [31.406804309149447, 73.10951141347729],
    [31.407759, 73.109112],
    [31.408621, 73.109362],
    [31.412671, 73.113302],
    [31.41367581200269, 73.11242167734602],
    [31.415089, 73.110536],
    [31.422742, 73.118461], // Madina Town
    [31.426768, 73.122597], // Allied Bank
    [31.427120, 73.122940],
    [31.427255, 73.116677], // Route point
    [31.42723018638874, 73.11651226675531],
    [31.42746802222164, 73.1162474788715],
    [31.43960446547338, 73.13243646475108],
    [31.43977537054277, 73.13254514525843],
    [31.4407917038378, 73.13392176507303],
    [31.44075534147604, 73.1339260270581],
    [31.44114045923111, 73.13430076210444], // Kashmir Pull
    [31.441313131103662, 73.13430660068619],
    [31.446580898030856, 73.12732802295236],
    [31.446668127105507, 73.12710648920385],
    [31.451505325914898, 73.12098970039398],
    // Route point
    [31.454873414056678, 73.12293161971836],

    [31.454943, 73.123157],
    [31.455298416408255, 73.12470025727795],
    [31.455314402909437, 73.12503758552386],
    [31.458165048216976, 73.135693402735], // Route point
    [31.46058, 73.146684], // University
];

function getDistanceFromLatLonInMeters(lat1, lon1, lat2, lon2) {
    var R = 6371;
    var dLat = deg2rad(lat2 - lat1);
    var dLon = deg2rad(lon2 - lon1);
    var a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    var d = R * c;
    return d * 1000;
}

function deg2rad(deg) {
    return deg * (Math.PI / 180);
}

function interpolate(p1, p2, t) {
    return p1 + (p2 - p1) * t;
}

let currentIndex = 0;
let progress = 0;
let isStopped = false;
let stopTimer = 0;
const STOP_DURATION_MS = 5000;

function getClosestStop(lat, lon) {
    let minMsg = Infinity;
    let closestIndex = -1;

    for (let i = 0; i < STOPS.length; i++) {
        const dist = getDistanceFromLatLonInMeters(lat, lon, STOPS[i].lat, STOPS[i].lng);
        if (dist < minMsg) {
            minMsg = dist;
            closestIndex = i;
        }
    }

    if (closestIndex === -1) return "Unknown";
    return STOPS[closestIndex].name;
}

async function updateLocation() {
    if (isStopped) {
        if (Date.now() - stopTimer > STOP_DURATION_MS) {
            isStopped = false;
            console.log("Resuming movement...");
        } else {
            // Still stopped
            const start = ROUTE_PATH[currentIndex];
            const lat = start[0];
            const lon = start[1];
            const nextStopName = getClosestStop(lat, lon);

            await sendData({
                busId: BUS_ID,
                lat,
                lon,
                speed: 0,
                status: "STOPPED",
                nextStop: nextStopName
            });
            return;
        }
    }

    // Move
    const start = ROUTE_PATH[currentIndex];
    const end = ROUTE_PATH[(currentIndex + 1) % ROUTE_PATH.length];

    const lat = interpolate(start[0], end[0], progress);
    const lon = interpolate(start[1], end[1], progress);

    // Check if near any stop (if not already stopped)
    // Only stop if we are "close enough" and we haven't just left it? 
    // Simplified: If distance < 30m, stop. 
    // To prevent immediate re-stopping, we could check if we just stopped there, but with 5s stop and moving 5% per tick, we might clear it.
    // 5% of path segment might be large or small.
    // Let's assume 30m is good.

    if (!isStopped) {
        for (let stop of STOPS) {
            const dist = getDistanceFromLatLonInMeters(lat, lon, stop.lat, stop.lng);
            if (dist < 30) {
                // We are at a stop.
                // But wait, if we are passing through, we should stop only once.
                // The simulation moves in steps.
                // We'll set isStopped = true.
                // We need to ensure we don't get stuck in a loop of stopping?
                // The `progress` doesn't increment while stopped.
                // AFTER resuming, we increment progress.
                // But next tick we might still be < 30m.
                // We need a "hasStoppedAtCurrentIndex" flag or similar? 
                // Or just push the bus a bit forward after stopping?
                // Or just ignore this stop if we recently stopped?

                // Let's just trust that after 5 seconds, we resume.
                // But when we resume, we are at the SAME location.
                // So next tick, `isStopped` is false, we check distance, it is < 30, we stop AGAIN.
                // FIX: When resuming, force progress forward slightly OR mark this stop as visited for this segment?
                // Simple fix: Only stop if we are close to the END of the segment? No, stops are points.

                // Better: `lastStopId` tracker.

                if (global.lastStopName !== stop.name) {
                    console.log(`Stopping at ${stop.name}`);
                    isStopped = true;
                    stopTimer = Date.now();
                    global.lastStopName = stop.name; // Remember we stopped here

                    await sendData({
                        busId: BUS_ID,
                        lat: stop.lat,
                        lon: stop.lng,
                        speed: 0,
                        status: "STOPPED",
                        nextStop: stop.name
                    });
                    return;
                }
            }
        }
    }

    const speed = (progress > 0.4 && progress < 0.6) ? 25 : 45;
    const nextStopName = getClosestStop(lat, lon); // Approximate

    await sendData({
        busId: BUS_ID,
        lat,
        lon,
        speed,
        status: "MOVING",
        nextStop: nextStopName
    });

    progress += 0.05;
    if (progress >= 1) {
        progress = 0;
        currentIndex = (currentIndex + 1) % ROUTE_PATH.length;
        // Reset last stop name when we change segment? 
        // Not necessarily, stops might be at segment boundaries.
        // But if we move far enough, we are good.
    }
}

async function sendData(data) {
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (response.ok) {
            const result = await response.json();
            // console.log(`Updated`);
        }
    } catch (error) {
        console.error('Connection Error:', error.message);
    }
}

global.lastStopName = "";

console.log('Starting Bus Simulation for ' + BUS_ID);
setInterval(updateLocation, 2000);
