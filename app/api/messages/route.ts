export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json(
    { messages: [] },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
