import type { Severity } from "@/app/lib/severity-styles";

function labeledOptions<T extends string>(values: T[]) {
  return values.map((value) => ({ value, label: value }));
}

export const RISK_CATEGORY_OPTIONS = labeledOptions([
  "Bias & Fairness",
  "Data Privacy",
  "Explainability",
  "Model Drift",
]);

export const DEPLOYMENT_CONTEXT_OPTIONS = labeledOptions([
  "Production",
  "Staging",
]);

export const SEVERITY_OPTIONS: { value: Severity; label: string }[] = [
  { value: "LOW", label: "Low" },
  { value: "MODERATE", label: "Moderate" },
  { value: "HIGH", label: "High" },
];
