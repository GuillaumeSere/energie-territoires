import { FranceEnergyMap } from "@/components/FranceEnergyMap";
import { TerritorySearch } from "@/components/TerritorySearch";
import { formatEnergy, formatNumber } from "@/lib/format";
import { listTerritories, territories } from "@/lib/ore";

export default function MapPage() {
  const territorySummaries = listTerritories();
  const totalConsumption = territories.reduce((sum, territory) => sum + territory.consumptionMwh, 0);
  const totalDataCenters = territories.reduce(
    (sum, territory) => sum + territory.dataCenterImpact.estimatedAnnualMwh,
    0,
  );
  const highPressureCount = territories.filter(
    (territory) => territory.dataCenterImpact.gridPressure === "forte",
  ).length;

  return (
    <main className="map-main">
      <section className="map-overview" aria-labelledby="map-page-title">
        <div className="map-overview-copy">
          <p className="eyebrow">Exploration géographique</p>
          <h1 id="map-page-title">Carte des consommations locales</h1>
          <p>Filtre les communes, repère les zones à forte pression réseau et ouvre une fiche territoire.</p>
        </div>
        <div className="map-overview-stats" aria-label="Synthèse carte">
          <article>
            <strong>{formatNumber(territories.length)}</strong>
            <span>territoires pilotes</span>
          </article>
          <article>
            <strong>{formatEnergy(totalConsumption)}</strong>
            <span>consommation agrégée</span>
          </article>
          <article>
            <strong>{formatEnergy(totalDataCenters)}</strong>
            <span>charge data centers</span>
          </article>
          <article>
            <strong>{highPressureCount}</strong>
            <span>pressions fortes</span>
          </article>
        </div>
      </section>

      <section className="map-workspace">
        <FranceEnergyMap territories={territorySummaries} />
        <aside className="map-side-panel">
          <TerritorySearch territories={territorySummaries} />
          <section className="map-insights">
            <div className="section-heading compact">
              <span>Lecture rapide</span>
              <h2>Points de lecture</h2>
            </div>
            <p>
              Les pastilles indiquent la consommation: plus elles sont grandes, plus la demande locale est élevée.
              Utilise le zoom puis ouvre une commune pour voir le mix énergétique, les secteurs et l&apos;impact
              numérique.
            </p>
          </section>
        </aside>
      </section>
    </main>
  );
}
