# TrackMate - Real-Time Bus Tracking System

TrackMate is a simple, real-time bus tracking system built with Next.js. It allows GPS devices (simulated or real ESP32s) to send location data to a server, which then displays the buses on a live dashboard.

## Features
- **Real-time Tracking**: Receives GPS updates via HTTP POST.
- **Live Map Interface**: Visualizes buses, routes, and stops using Leaflet (OpenStreetMap).
- **Route Management**: Displays defined bus routes and stops.
- **Automatic Status**: Determines if a bus is "Stopped", "In Traffic", or "Moving" based on speed.
- **Live Dashboard**: Frontend updates automatically every few seconds.
- **In-Memory Storage**: Simple data handling without complex databases.

## Prerequisites
- Node.js installed (v18 or higher recommended).
- A Vercel account for deployment.

## Project Structure
- `app/api/routes/route.js`: Returns available bus routes.
- `app/api/stops/route.js`: Returns bus stops.
- `components/Map.js`: The interactive map component.
- `lib/data.js`: Contains static route and stop definitions.
- `app/page.js`: The frontend dashboard (now with Map).

## Getting Started (Local Development)

1.  **Install Dependencies**
    ```bash
    npm install
    ```

2.  **Run the Server**
    ```bash
    npm run dev
    ```
    The server will start at `http://localhost:3000`.

3.  **Open the Dashboard**
    Visit `http://localhost:3000` in your browser. You should see the dashboard (likely empty initially).

4.  **Simulate a Bus**
    Open a new terminal window and run the simulation script to send fake GPS data:
    ```bash
    node simulate-bus.js
    ```
    You should see the dashboard update with the bus location and status!

## Testing with Postman (Manual)

If you want to manually test the API:

1.  Open Postman.
2.  create a new **POST** request to `http://localhost:3000/api/bus/location`.
3.  Go to the **Body** tab, select **raw**, and choose **JSON**.
4.  Paste this JSON:
    ```json
    {
      "busId": "TEST-BUS-1",
      "lat": 12.9716,
      "lon": 77.5946,
      "speed": 25
    }
    ```
5.  Click **Send**.
6.  You should get a "Location updated successfully" response, and the bus should appear on your dashboard.

## Deployment on Vercel

1.  Push this code to a GitHub repository.
2.  Go to [Vercel](https://vercel.com) and "Add New > Project".
3.  Import your repository.
4.  Click **Deploy**.
5.  Once deployed, you will get a URL (e.g., `https://trackmate.vercel.app`).
6.  **Important**: You must update your ESP32 code or simulation script to point to this new URL (e.g., `https://trackmate.vercel.app/api/bus/location`).

**Note**: Since this project uses in-memory storage, the bus data will be cleared whenever the server restarts or redeploys. This is expected behavior for this simple version.
