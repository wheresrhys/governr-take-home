import type { Severity } from "@/app/lib/severity-styles";

export type ModelRiskPairing = {
  riskCategory: string;
  context: string;
  severity: Severity;
};

export type ModelOverviewRow = {
  id: number;
  name: string;
  riskCategories: string[];
  deployedContexts: string[];
  riskPairings: ModelRiskPairing[];
  aggregateRiskScore: number;
};

const SEVERITY_WEIGHT: Record<Severity, number> = {
  HIGH: 100,
  MODERATE: 10,
  LOW: 1,
};

function buildModel(
  id: number,
  name: string,
  riskPairings: ModelRiskPairing[],
): ModelOverviewRow {
  return {
    id,
    name,
    riskCategories: [...new Set(riskPairings.map((p) => p.riskCategory))],
    deployedContexts: [...new Set(riskPairings.map((p) => p.context))],
    riskPairings,
    aggregateRiskScore: riskPairings.reduce(
      (total, p) => total + SEVERITY_WEIGHT[p.severity],
      0,
    ),
  };
}

export const modelsOverviewMockData: ModelOverviewRow[] = [
  buildModel(1, "Fraud Detection Classifier", [
    { riskCategory: "Bias & Fairness", context: "Production", severity: "HIGH" },
    { riskCategory: "Data Privacy", context: "Production", severity: "MODERATE" },
    { riskCategory: "Data Privacy", context: "Staging", severity: "LOW" },
  ]),
  buildModel(2, "Customer Churn Predictor", [
    { riskCategory: "Explainability", context: "Production", severity: "MODERATE" },
    { riskCategory: "Explainability", context: "Staging", severity: "LOW" },
    { riskCategory: "Data Privacy", context: "Production", severity: "MODERATE" },
    { riskCategory: "Model Drift", context: "Production", severity: "MODERATE" },
  ]),
  buildModel(3, "Resume Screening Assistant", [
    { riskCategory: "Bias & Fairness", context: "Production", severity: "LOW" },
    { riskCategory: "Explainability", context: "Production", severity: "LOW" },
  ]),
  buildModel(4, "Credit Risk Scorer", [
    { riskCategory: "Bias & Fairness", context: "Production", severity: "HIGH" },
    { riskCategory: "Bias & Fairness", context: "Staging", severity: "MODERATE" },
    { riskCategory: "Data Privacy", context: "Production", severity: "HIGH" },
    { riskCategory: "Model Drift", context: "Production", severity: "MODERATE" },
  ]),
];
