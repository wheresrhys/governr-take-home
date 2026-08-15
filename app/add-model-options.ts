import type { Severity } from "@/app/lib/severity-styles";

export const RISK_CATEGORY_OPTIONS = [
  "Bias & Fairness",
  "Data Privacy",
  "Explainability",
  "Model Drift",
];

export const DEPLOYMENT_CONTEXT_OPTIONS = ["Production", "Staging"];

export const SEVERITY_OPTIONS: { value: Severity; label: string }[] = [
  { value: "LOW", label: "Low" },
  { value: "MODERATE", label: "Moderate" },
  { value: "HIGH", label: "High" },
];
