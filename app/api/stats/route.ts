export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json(fallbackStats(), {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

export async function POST() {
  return Response.json(fallbackStats(), {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

function fallbackStats() {
  return {
    peopleConnected: 1,
    messagesSent: 0,
    daysRunning: 1,
  };
}
