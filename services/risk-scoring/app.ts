import express from "express";
import {
  validateAssessRiskPayload,
  type AssessRiskPayload,
} from "./schemas/assess-risk.schema";
import { requireAuth } from "./middleware/auth";
import { getItems } from "./lib/postgres";
import type { RiskCategories, Contexts } from "../../types/postgres.d.ts";

const app = express();

app.use(express.json());

app.get("/", (_req, res) => {
  res.json({ message: "hello world" });
});

app.post("/assess-risk", requireAuth, async (req, res) => {
  if (!validateAssessRiskPayload(req.body)) {
    res.status(400).json({ errors: validateAssessRiskPayload.errors });
    return;
  }

  const payload = req.body as AssessRiskPayload;
  const { org_id } = payload;

  let riskCategories: RiskCategories[];
  let contexts: Contexts[];
  try {
    [riskCategories, contexts] = await Promise.all([
      getItems<RiskCategories>("risk_categories", org_id),
      getItems<Contexts>("contexts", org_id),
    ]);
  } catch (err) {
    console.error("Failed to load risk categories/contexts for assess-risk", {
      org_id,
      err,
    });
    res.status(502).json({ error: "Failed to load reference data" });
    return;
  }

  const categoryNames = new Set(riskCategories.map((c) => c.name));
  const contextNames = new Set(contexts.map((c) => c.name));

  const issues: string[] = [];
  for (const risk of payload.risks) {
    if (!categoryNames.has(risk.risk_category)) {
      issues.push(`Unknown risk category: "${risk.risk_category}"`);
    }
    if (!contextNames.has(risk.context)) {
      issues.push(`Unknown context: "${risk.context}"`);
    }
  }

  if (issues.length > 0) {
    res.status(400).json({ message: `Invalid risk data: ${issues.join("; ")}` });
    return;
  }

  res.status(200).json({ received: true });
});

export default app;
