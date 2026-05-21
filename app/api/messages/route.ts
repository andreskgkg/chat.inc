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
    console.error("Failed to load shared messages", error);

    return Response.json(
      { error: "could not load the shared chat." },
      { status: 500 },
    );
  }
}
