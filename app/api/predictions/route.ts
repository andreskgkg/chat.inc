import { NextResponse } from "next/server";
import { checkAdminPassword, createPrediction, listPredictions } from "@/lib/store";

export const runtime = "nodejs";

export async function GET() {
  const predictions = await listPredictions();
  return NextResponse.json({ predictions });
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    text?: string;
    password?: string;
  };

  const text = body.text?.trim() ?? "";
  const password = body.password ?? "";

  if (!text) {
    return NextResponse.json({ error: "Prediction text is required." }, { status: 400 });
  }

  if (text.length > 280) {
    return NextResponse.json({ error: "Keep predictions under 280 characters." }, { status: 400 });
  }

  if (!checkAdminPassword(password)) {
    return NextResponse.json({ error: "Wrong password." }, { status: 401 });
  }

  const prediction = await createPrediction(text);
  return NextResponse.json({ prediction }, { status: 201 });
}
