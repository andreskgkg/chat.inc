import { NextResponse } from "next/server";
import { addComment } from "@/lib/store";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  const { id } = await params;
  const body = (await request.json()) as {
    body?: string;
  };

  const commentBody = body.body?.trim() ?? "";

  if (!commentBody) {
    return NextResponse.json({ error: "Comment is required." }, { status: 400 });
  }

  if (commentBody.length > 500) {
    return NextResponse.json({ error: "Keep comments under 500 characters." }, { status: 400 });
  }

  const comment = await addComment(id, commentBody);

  if (!comment) {
    return NextResponse.json({ error: "Prediction not found." }, { status: 404 });
  }

  return NextResponse.json({ comment }, { status: 201 });
}
