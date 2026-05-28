export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json(
    { someoneTyping: false },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}

export async function POST() {
  return Response.json({ ok: true });
}
