import { NextResponse } from "next/server";
import { votePrediction } from "@/lib/store";
import type { VoteValue } from "@/lib/types";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  const { id } = await params;
  const body = (await request.json()) as {
    voterId?: string;
    value?: VoteValue | 0;
  };

  const voterId = body.voterId?.trim() ?? "";
  const value = body.value;

  if (!voterId) {
    return NextResponse.json({ error: "Missing voter id." }, { status: 400 });
  }

  if (value !== 1 && value !== -1 && value !== 0) {
    return NextResponse.json({ error: "Invalid vote." }, { status: 400 });
  }

  const prediction = await votePrediction(id, voterId, value);

  if (!prediction) {
    return NextResponse.json({ error: "Prediction not found." }, { status: 404 });
  }

  return NextResponse.json({ prediction });
}
