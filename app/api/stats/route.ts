import { getChatStats } from "@/lib/shared-stats";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const stats = await getChatStats();

    return Response.json(stats, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.warn("Stats unavailable", error);

    return Response.json(fallbackStats(), {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { active?: boolean; clientId?: string };
    const stats = await getChatStats(body.clientId, Boolean(body.active));

    return Response.json(stats, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.warn("Stats update unavailable", error);

    return Response.json(fallbackStats(), {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  }
}

function fallbackStats() {
  return {
    peopleConnected: 1,
    messagesSent: 0,
    daysRunning: 1,
  };
}
