import { ModelsOverviewTable } from "@/app/models-overview-table";
import { modelsOverviewMockData } from "@/app/models-overview-mock-data";

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-6xl px-8 py-12">
      <h1 className="mb-6 text-2xl font-semibold tracking-tight text-zinc-900">
        Models overview
      </h1>
      <ModelsOverviewTable models={modelsOverviewMockData} />
    </main>
  );
}
