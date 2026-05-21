import { isSomeoneElseTyping, setSharedTypingStatus } from "@/lib/shared-typing";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const clientId = url.searchParams.get("clientId") || "";
    const someoneTyping = await isSomeoneElseTyping(clientId);

    return Response.json(
      { someoneTyping },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (error) {
    console.error("Failed to load typing status", error);

    return Response.json({ someoneTyping: false }, { status: 200 });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { active?: boolean; clientId?: string };

    await setSharedTypingStatus(body.clientId || "", Boolean(body.active));

    return Response.json({ ok: true });
  } catch (error) {
    console.error("Failed to update typing status", error);

    return Response.json({ ok: false }, { status: 200 });
  }
}
