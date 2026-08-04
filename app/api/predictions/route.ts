import { NextResponse } from "next/server";
import { createPrediction, listPredictions } from "@/lib/store";

export const runtime = "nodejs";

export async function GET() {
  const predictions = await listPredictions();
  return NextResponse.json({ predictions });
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    text?: string;
  };

  const text = body.text?.trim() ?? "";

  if (!text) {
    return NextResponse.json({ error: "Prediction text is required." }, { status: 400 });
  }

  if (text.length > 280) {
    return NextResponse.json({ error: "Keep predictions under 280 characters." }, { status: 400 });
  }

  const prediction = await createPrediction(text);
  return NextResponse.json({ prediction }, { status: 201 });
}
