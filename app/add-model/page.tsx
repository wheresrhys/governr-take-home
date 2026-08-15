import { getItems } from "@/app/lib/postgres";
import type { RiskCategories, Contexts } from "@/types/postgres.d.ts";
import { AddModelForm } from "@/app/add-model/add-model-form";

const ORG_ID = 1; // hardcoded until auth/org-selection exists for server-rendered pages

async function getRiskDropdownOptions() {
  const [riskCategories, contexts] = await Promise.all([
    getItems<RiskCategories>("risk_categories", ORG_ID),
    getItems<Contexts>("contexts", ORG_ID),
  ]);

  return {
    riskCategoryOptions: riskCategories.map((category) => ({
      value: String(category.id),
      label: category.name,
    })),
    contextOptions: contexts.map((context) => ({
      value: String(context.id),
      label: context.name,
    })),
  };
}

export default async function AddModelPage() {
  const { riskCategoryOptions, contextOptions } =
    await getRiskDropdownOptions();

  return (
    <AddModelForm
      riskCategoryOptions={riskCategoryOptions}
      contextOptions={contextOptions}
    />
  );
}
