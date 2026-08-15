import { describe, expect, it } from "vitest";
import { buildModelsOverview } from "../models-overview";
import type { ModelRiskFlatRow } from "../postgres";

describe("buildModelsOverview", () => {
  it("groups multiple risk rows under one model", () => {
    const rows: ModelRiskFlatRow[] = [
      {
        model_id: 1,
        model_name: "Fraud Detector",
        owner_name: "Priya Shah",
        risk_category_name: "Bias & Fairness",
        context_name: "Production",
        severity: "HIGH",
      },
      {
        model_id: 1,
        model_name: "Fraud Detector",
        owner_name: "Priya Shah",
        risk_category_name: "Data Privacy",
        context_name: "Staging",
        severity: "LOW",
      },
    ];

    const result = buildModelsOverview(rows);

    expect(result).toEqual([
      {
        id: 1,
        name: "Fraud Detector",
        ownerName: "Priya Shah",
        riskCategories: ["Bias & Fairness", "Data Privacy"],
        deployedContexts: ["Production", "Staging"],
        riskPairings: [
          { riskCategory: "Bias & Fairness", context: "Production", severity: "HIGH" },
          { riskCategory: "Data Privacy", context: "Staging", severity: "LOW" },
        ],
        aggregateRiskScore: 101,
      },
    ]);
  });

  it("dedupes riskCategories and deployedContexts across repeated pairings", () => {
    const rows: ModelRiskFlatRow[] = [
      {
        model_id: 1,
        model_name: "Model",
        owner_name: "Owner",
        risk_category_name: "Bias & Fairness",
        context_name: "Production",
        severity: "MODERATE",
      },
      {
        model_id: 1,
        model_name: "Model",
        owner_name: "Owner",
        risk_category_name: "Bias & Fairness",
        context_name: "Staging",
        severity: "LOW",
      },
    ];

    const result = buildModelsOverview(rows);

    expect(result[0].riskCategories).toEqual(["Bias & Fairness"]);
    expect(result[0].deployedContexts).toEqual(["Production", "Staging"]);
    expect(result[0].aggregateRiskScore).toBe(11);
  });

  it("returns a model with empty risk data and score 0 when it has no model_risks rows", () => {
    const rows: ModelRiskFlatRow[] = [
      {
        model_id: 1,
        model_name: "No Risks Model",
        owner_name: "Owner",
        risk_category_name: null,
        context_name: null,
        severity: null,
      },
    ];

    const result = buildModelsOverview(rows);

    expect(result).toEqual([
      {
        id: 1,
        name: "No Risks Model",
        ownerName: "Owner",
        riskCategories: [],
        deployedContexts: [],
        riskPairings: [],
        aggregateRiskScore: 0,
      },
    ]);
  });

  it("returns an empty array for no rows", () => {
    expect(buildModelsOverview([])).toEqual([]);
  });
});
