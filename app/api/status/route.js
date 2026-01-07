// app/api/status/route.js
export async function GET() {
  return Response.json({ server: "TrackMate backend running" });
}
