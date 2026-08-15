"use client";

import { useState } from "react";
import Link from "next/link";
import type { Severity } from "@/app/lib/severity-styles";
import { SEVERITY_OPTIONS } from "@/app/add-model-options";

type Option = { value: string; label: string };

type RiskRow = {
  id: number;
  riskCategoryId: string;
  contextId: string;
  severity: Severity;
};

const fieldClassName =
  "block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500";

function Select({
  id,
  name,
  value,
  onChange,
  options,
}: {
  id: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  options: Option[];
}) {
  return (
    <select
      id={id}
      name={name}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className={fieldClassName}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

let nextRiskRowId = 1;

export function AddModelForm({
  orgId,
  riskCategoryOptions,
  contextOptions,
}: {
  orgId: number;
  riskCategoryOptions: Option[];
  contextOptions: Option[];
}) {
  const [modelName, setModelName] = useState("");
  const [riskRows, setRiskRows] = useState<RiskRow[]>([]);

  function createRiskRow(): RiskRow {
    return {
      id: nextRiskRowId++,
      riskCategoryId: riskCategoryOptions[0].value,
      contextId: contextOptions[0].value,
      severity: SEVERITY_OPTIONS[0].value,
    };
  }

  function addRiskRow() {
    setRiskRows((prev) => [...prev, createRiskRow()]);
  }

  function updateRiskRow(id: number, changes: Partial<RiskRow>) {
    setRiskRows((prev) =>
      prev.map((row) => (row.id === id ? { ...row, ...changes } : row)),
    );
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const model = {
      orgId,
      name: modelName,
      risks: riskRows.map((row) => ({
        riskCategoryId: Number(row.riskCategoryId),
        contextId: Number(row.contextId),
        severity: row.severity,
      })),
    };

    console.log(model);
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-8 py-12">
      <h1 className="mb-6 text-2xl font-semibold tracking-tight text-zinc-900">
        Add model
      </h1>
      <form onSubmit={handleSubmit} className="space-y-8">
        <div>
          <label
            htmlFor="model-name"
            className="mb-1 block text-sm font-medium text-zinc-700"
          >
            Model name
          </label>
          <input
            type="text"
            id="model-name"
            name="model-name"
            value={modelName}
            onChange={(event) => setModelName(event.target.value)}
            required
            className={fieldClassName}
          />
        </div>

        <div>
          <h2 className="mb-3 text-sm font-medium text-zinc-700">Risks</h2>

          {riskRows.length > 0 && (
            <div className="mb-3 grid grid-cols-3 gap-3 border-b border-zinc-200 pb-2 text-xs font-medium uppercase tracking-wide text-zinc-500">
              <span>Risk category</span>
              <span>Deployment context</span>
              <span>Severity</span>
            </div>
          )}

          <div className="space-y-3">
            {riskRows.map((row) => (
              <div key={row.id} className="grid grid-cols-3 items-center gap-3">
                <Select
                  id={`risk-category-${row.id}`}
                  name={`risk-category-${row.id}`}
                  value={row.riskCategoryId}
                  onChange={(value) =>
                    updateRiskRow(row.id, { riskCategoryId: value })
                  }
                  options={riskCategoryOptions}
                />

                <Select
                  id={`deployment-context-${row.id}`}
                  name={`deployment-context-${row.id}`}
                  value={row.contextId}
                  onChange={(value) =>
                    updateRiskRow(row.id, { contextId: value })
                  }
                  options={contextOptions}
                />

                <Select
                  id={`risk-severity-${row.id}`}
                  name={`risk-severity-${row.id}`}
                  value={row.severity}
                  onChange={(value) =>
                    updateRiskRow(row.id, { severity: value as Severity })
                  }
                  options={SEVERITY_OPTIONS}
                />
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={addRiskRow}
            className="mt-3 inline-flex items-center rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
          >
            Add risk
          </button>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-zinc-200 pt-6">
          <Link
            href="/"
            className="text-sm font-medium text-zinc-600 hover:text-zinc-900"
          >
            Cancel
          </Link>
          <button
            type="submit"
            className="inline-flex items-center rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700"
          >
            Submit
          </button>
        </div>
      </form>
    </main>
  );
}
