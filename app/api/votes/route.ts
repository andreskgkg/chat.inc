import { readVotes, toggleVote } from "@/lib/shared-votes";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const votes = await readVotes(url.searchParams.get("clientId") || "");

    return Response.json(votes, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.warn("Votes unavailable", error);

    return Response.json(emptyVotes(), {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      clientId?: string;
      messageId?: string;
    };
    const votes = await toggleVote(body.messageId || "", body.clientId || "");

    return Response.json(votes, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.warn("Vote update unavailable", error);

    return Response.json(emptyVotes(), {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  }
}

function emptyVotes() {
  return {
    top: [],
    userVotes: [],
    votes: {},
  };
}
