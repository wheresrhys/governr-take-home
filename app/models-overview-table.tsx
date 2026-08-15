"use client";

import { useState } from "react";
import { scoreColor, severityColor } from "@/app/lib/severity-styles";
import type { ModelOverviewRow } from "@/app/models-overview-mock-data";

type Props = {
  models: ModelOverviewRow[];
};

function Badge({
  label,
  badgeClassName,
}: {
  label: string;
  badgeClassName: string;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${badgeClassName}`}
    >
      {label}
    </span>
  );
}

export function ModelsOverviewTable({ models }: Props) {
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());

  function toggleExpanded(id: number) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  return (
    <table className="min-w-full divide-y divide-zinc-200 border border-zinc-200">
      <thead className="bg-zinc-50">
        <tr>
          <th
            scope="col"
            className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-zinc-500"
          >
            Model name
          </th>
          <th
            scope="col"
            className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-zinc-500"
          >
            Risk categories
          </th>
          <th
            scope="col"
            className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-zinc-500"
          >
            Deployed contexts
          </th>
          <th
            scope="col"
            className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-zinc-500"
          >
            Aggregate risk score
          </th>
          <th scope="col" className="px-4 py-3">
            <span className="sr-only">Actions</span>
          </th>
        </tr>
      </thead>
      <tbody className="divide-y divide-zinc-200 bg-white">
        {models.flatMap((model) => {
          const isExpanded = expandedIds.has(model.id);
          const scoreStyle = scoreColor(model.aggregateRiskScore);

          const summaryRow = (
            <tr key={model.id}>
              <td className="px-4 py-3 text-sm font-medium text-zinc-900">
                {model.name}
              </td>
              <td className="px-4 py-3 text-sm text-zinc-700">
                {model.riskCategories.join(", ")}
              </td>
              <td className="px-4 py-3 text-sm text-zinc-700">
                {model.deployedContexts.join(", ")}
              </td>
              <td className="px-4 py-3">
                <Badge
                  label={String(model.aggregateRiskScore)}
                  badgeClassName={scoreStyle.badgeClassName}
                />
              </td>
              <td className="px-4 py-3 text-right">
                <button
                  type="button"
                  onClick={() => toggleExpanded(model.id)}
                  aria-expanded={isExpanded}
                  className="inline-flex items-center gap-1 text-xs font-medium text-zinc-600 hover:text-zinc-900"
                >
                  <span
                    className={`inline-block transition-transform ${
                      isExpanded ? "rotate-90" : ""
                    }`}
                  >
                    &#9656;
                  </span>
                  {isExpanded ? "Collapse" : "Expand"}
                </button>
              </td>
            </tr>
          );

          if (!isExpanded) {
            return [summaryRow];
          }

          const childRows = model.riskPairings.map((pairing) => {
            const severityStyle = severityColor(pairing.severity);
            return (
              <tr
                key={`${model.id}-${pairing.riskCategory}-${pairing.context}`}
                className="bg-zinc-50/60"
              >
                <td className="border-l-2 border-zinc-300 py-2 pl-10 pr-4 text-sm text-zinc-500">
                  &#8627;
                </td>
                <td className="py-2 pl-4 pr-4 text-sm text-zinc-700">
                  {pairing.riskCategory}
                </td>
                <td className="py-2 pl-4 pr-4 text-sm text-zinc-700">
                  {pairing.context}
                </td>
                <td className="py-2 pl-4 pr-4">
                  <Badge
                    label={severityStyle.label}
                    badgeClassName={severityStyle.badgeClassName}
                  />
                </td>
                <td className="py-2 pl-4 pr-4" />
              </tr>
            );
          });

          return [summaryRow, ...childRows];
        })}
      </tbody>
    </table>
  );
}
