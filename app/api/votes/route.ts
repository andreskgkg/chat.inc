export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json(emptyVotes(), {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

export async function POST() {
  return Response.json(emptyVotes(), {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

function emptyVotes() {
  return {
    top: [],
    userVotes: [],
    votes: {},
  };
}
