import Link from "next/link";
import { ModelsOverviewTable } from "@/app/models-overview-table";
import { modelsOverviewMockData } from "@/app/models-overview-mock-data";

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-6xl px-8 py-12">
      <h1 className="mb-6 text-2xl font-semibold tracking-tight text-zinc-900">
        Models overview
      </h1>
      <ModelsOverviewTable models={modelsOverviewMockData} />
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
