import { readSharedMessages } from "@/lib/shared-chat";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const messages = await readSharedMessages();

    return Response.json(
      { messages },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (error) {
    console.warn("Shared messages unavailable", error);

    return Response.json(
      { messages: [] },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  }
}
