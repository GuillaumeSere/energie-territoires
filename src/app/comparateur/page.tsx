import { ComparatorTable } from "@/components/ComparatorTable";
import { territories } from "@/lib/ore";

export default function ComparatorPage() {
  return (
    <main>
      <section className="page-hero">
        <div>
          <p className="eyebrow">Benchmark territorial</p>
          <h1>Comparateur énergie et émissions</h1>
          <p>
            Compare les profils de consommation, la dynamique récente, la charge data centers et les leviers
            prioritaires entre communes pilotes.
          </p>
        </div>
      </section>

      <ComparatorTable territories={territories} />
    </main>
  );
}
