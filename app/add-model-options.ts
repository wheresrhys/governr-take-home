import type { Severity } from "@/app/lib/severity-styles";

export const SEVERITY_OPTIONS: { value: Severity; label: string }[] = [
  { value: "LOW", label: "Low" },
  { value: "MODERATE", label: "Moderate" },
  { value: "HIGH", label: "High" },
];
