'use client';

import dynamic from 'next/dynamic';

const Map = dynamic(() => import('@/components/Map'), {
    ssr: false,
    loading: () => <p>Loading Map...</p>
});

export default function Home() {
    return (
        <div className="container">
            <h1>TrackMate Live Map</h1>
            <p style={{ textAlign: 'center' }}>Real-time Bus Tracking System</p>

            <div style={{ marginTop: '20px', height: '600px' }}>
                <Map />
            </div>

            <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '0.9rem', color: '#666' }}>
                <p>🔴 Stopped | 🟠 In Traffic | 🟢 Moving</p>
                <p>Lines represent bus routes. Markers represent stops.</p>
            </div>
        </div>
    );
}
