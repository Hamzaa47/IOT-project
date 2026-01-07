'use client';

import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect, useState } from 'react';
import L from 'leaflet';

// Fix for default marker icons in Leaflet with Next.js
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom icons for Buses
// Custom icons for Buses
const busIcon = (status, busId) => {
    let color = 'green';
    if (status === 'Stopped') color = 'red';
    if (status === 'In Traffic') color = 'orange';

    return new L.DivIcon({
        className: 'custom-bus-icon',
        html: `
      <div style="display: flex; flex-direction: column; align-items: center; width: 60px; transform: translateX(-20px);">
        <div style="background: white; padding: 2px 5px; border-radius: 4px; border: 1px solid #ccc; font-weight: bold; font-size: 10px; box-shadow: 0 1px 2px rgba(0,0,0,0.2); margin-bottom: 2px white-space: nowrap;">
          ${busId}
        </div>
        <div style="font-size: 24px; color: ${color}; filter: drop-shadow(0 0 1px black);">
          🚌
        </div>
      </div>
    `,
        iconSize: [20, 40],
        iconAnchor: [10, 40] // Anchor at the bottom center of the emoji roughly
    });
};

const stopIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-grey.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

export default function Map() {
    const [routes, setRoutes] = useState([]);
    const [stops, setStops] = useState([]);
    const [buses, setBuses] = useState([]);

    const [analytics, setAnalytics] = useState({});

    useEffect(() => {
        // Fetch Routes
        fetch('/api/routes')
            .then(res => res.json())
            .then(data => setRoutes(data.data));

        // Fetch Stops
        fetch('/api/stops')
            .then(res => res.json())
            .then(data => setStops(data.data));

        // Fetch Analytics
        const fetchAnalytics = async () => {
            try {
                const res = await fetch('/api/analytics');
                if (res.ok) {
                    const data = await res.json();
                    // Transform array to map: { stopId: averageTime }
                    const analyticsMap = data.data.reduce((acc, curr) => ({
                        ...acc,
                        [curr.stopId]: curr.averageArrivalTime
                    }), {});
                    setAnalytics(analyticsMap);
                }
            } catch (e) {
                console.error("Failed to fetch analytics", e);
            }
        };

        fetchAnalytics(); // Fetch once on load

        // Poll Buses
        const fetchBuses = async () => {
            try {
                const res = await fetch('/api/bus/latest');
                if (res.ok) {
                    const data = await res.json();
                    setBuses(data.data);
                }
            } catch (e) {
                console.error(e);
            }
        };

        fetchBuses();
        const interval = setInterval(fetchBuses, 2000);
        return () => clearInterval(interval);
    }, []);

    // Center map on the first route's start point (Faisalabad)
    const center = [31.3936, 73.1170];

    return (
        <MapContainer center={center} zoom={13} style={{ height: '600px', width: '100%', borderRadius: '10px' }}>
            <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />

            {/* Draw Routes */}
            {routes.map(route => (
                <Polyline key={route.id} positions={route.path} color={route.color} weight={5} opacity={0.7}>
                    <Popup>{route.name}</Popup>
                </Polyline>
            ))}

            {/* Draw Stops */}
            {stops.map(stop => {
                // Find any bus that has an ETA for this stop
                const busWithEta = buses.find(b => b.etas && b.etas[stop.id] !== undefined);
                const etaMinutes = busWithEta ? busWithEta.etas[stop.id] : null;

                return (
                    <Marker key={stop.id} position={[stop.lat, stop.lng]} icon={stopIcon}>
                        <Popup>
                            <strong>{stop.name}</strong><br />
                            Wait here for {stop.routeId === 'route-1' ? 'University Bus' : 'Bus'}

                            {etaMinutes !== null && (
                                <div style={{ marginTop: '5px', padding: '5px', background: '#e6fffa', border: '1px solid #38b2ac', borderRadius: '4px', color: '#234e52' }}>
                                    <strong>🟢 Live ETA: </strong>
                                    {etaMinutes === 0 ? 'Arriving Now' : `${etaMinutes} min`}
                                    <div style={{ fontSize: '0.8em', color: '#555' }}>Variable due to traffic</div>
                                </div>
                            )}

                            {!etaMinutes && analytics[stop.id] && (
                                <>
                                    <br />
                                    ⏱️ Avg. Arrival Time: {analytics[stop.id]}
                                </>
                            )}
                        </Popup>
                    </Marker>
                );
            })}

            {/* Draw Buses */}
            {buses.map(bus => (
                <Marker key={bus.busId} position={[bus.lat, bus.lon]} icon={busIcon(bus.status, bus.busId)}>
                    <Popup>
                        <strong>Bus: {bus.busId}</strong><br />
                        Status: {bus.status}<br />
                        Speed: {bus.speed} km/h
                    </Popup>
                </Marker>
            ))}
        </MapContainer>
    );
}
