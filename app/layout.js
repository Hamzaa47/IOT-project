import './globals.css';

export const metadata = {
    title: 'TrackMate',
    description: 'Real-time Bus Tracking System',
};

export default function RootLayout({ children }) {
    return (
        <html lang="en">
            <body>{children}</body>
        </html>
    );
}
