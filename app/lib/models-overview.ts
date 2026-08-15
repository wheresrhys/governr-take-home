import type { Severity } from "@/app/lib/severity-styles";
import type { ModelRiskFlatRow } from "@/app/lib/postgres";

export type ModelRiskPairing = {
  riskCategory: string;
  context: string;
  severity: Severity;
};

export type ModelOverviewRow = {
  id: number;
  name: string;
  ownerName: string;
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

export function buildModelsOverview(rows: ModelRiskFlatRow[]): ModelOverviewRow[] {
  const byModel = new Map<
    number,
    { name: string; ownerName: string; riskPairings: ModelRiskPairing[] }
  >();

  for (const row of rows) {
    let entry = byModel.get(row.model_id);
    if (!entry) {
      entry = { name: row.model_name, ownerName: row.owner_name, riskPairings: [] };
      byModel.set(row.model_id, entry);
    }
    if (row.risk_category_name && row.context_name && row.severity) {
      entry.riskPairings.push({
        riskCategory: row.risk_category_name,
        context: row.context_name,
        severity: row.severity as Severity,
      });
    }
  }

  return [...byModel.entries()].map(([id, { name, ownerName, riskPairings }]) => ({
    id,
    name,
    ownerName,
    riskCategories: [...new Set(riskPairings.map((p) => p.riskCategory))],
    deployedContexts: [...new Set(riskPairings.map((p) => p.context))],
    riskPairings,
    aggregateRiskScore: riskPairings.reduce(
      (total, p) => total + SEVERITY_WEIGHT[p.severity],
      0
    ),
  }));
}
