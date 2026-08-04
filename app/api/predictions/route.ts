import { NextResponse } from "next/server";
import { createPrediction, listPredictions } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const predictions = await listPredictions();
    return NextResponse.json(
      { predictions },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("listPredictions failed", error);
    return NextResponse.json({ error: "Could not load predictions." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
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
  } catch (error) {
    console.error("createPrediction failed", error);
    return NextResponse.json({ error: "Could not create prediction." }, { status: 500 });
  }
}
