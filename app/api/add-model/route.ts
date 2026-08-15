import { NextResponse } from "next/server";
import { requireAuth } from "@/app/api/middleware/auth";
import { createModelWithRisks, CreateModelPayload } from "@/app/lib/postgres";

export async function POST(request: Request) {
  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) {
    return auth;
  }

  try {
    const modelPayload = (await request.json()) as CreateModelPayload;
    const model = await createModelWithRisks(
      modelPayload,
      auth.org_id,
      auth.user_id
    );
    console.log("Model created successfully", { model });
    return NextResponse.json({ modelId: model.id });
  } catch (error) {
    console.error("Failed to create model", { error });
    return NextResponse.json(
      { error: "Failed to create model" },
      { status: 500 }
    );
  }
}
