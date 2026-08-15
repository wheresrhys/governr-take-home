import { NextResponse } from "next/server";
import { createModelWithRisks, CreateModelPayload } from "@/app/lib/postgres";

export async function POST(request: Request) {
  try {
    const { orgId, userId, ...modelPayload } = (await request.json()) as CreateModelPayload & {
      orgId: number;
      userId: number;
    };
    const model = await createModelWithRisks(modelPayload, orgId, userId);
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
