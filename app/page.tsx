import Link from "next/link";
import { ModelsOverviewTable } from "@/app/models-overview-table";
import { fetchModels } from "@/app/lib/postgres";
import { buildModelsOverview } from "@/app/lib/models-overview";

const ORG_ID = 1; // hardcoded until auth/org-selection exists

export default async function Home() {
  const rows = await fetchModels(ORG_ID);
  const models = buildModelsOverview(rows);

  return (
    <main className="mx-auto w-full max-w-6xl px-8 py-12">
      <h1 className="mb-6 text-2xl font-semibold tracking-tight text-zinc-900">
        Models overview
      </h1>
      <ModelsOverviewTable models={models} />
      <div className="mt-4 flex justify-end">
        <Link
          href="/add-model"
          className="inline-flex items-center rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700"
        >
          Add model
        </Link>
      </div>
    </main>
  );
}
