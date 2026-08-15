import { NextResponse } from "next/server";
import { requireAuth } from "@/app/api/middleware/auth";
import type { AssessRiskPayload } from "../../../services/risk-scoring/schemas/assess-risk.schema";

const RISK_SCORING_SERVICE_URL =
  process.env.RISK_SCORING_SERVICE_URL || "http://localhost:4000";

export async function POST(request: Request) {
  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) {
    return auth;
  }

  const body = (await request.json()) as Omit<AssessRiskPayload, "org_id">;
  const payload: AssessRiskPayload = { ...body, org_id: auth.org_id };

  let response: Response;
  try {
    response = await fetch(`${RISK_SCORING_SERVICE_URL}/assess-risk`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": "internal-service-call",
      },
      body: JSON.stringify(payload),
    });
  } catch (error) {
    console.error("Failed to reach risk-scoring service", { error });
    return NextResponse.json(
      { error: "Failed to reach risk-scoring service" },
      { status: 502 }
    );
  }

  const responseBody = await response.json();
  return NextResponse.json(responseBody, { status: response.status });
}
