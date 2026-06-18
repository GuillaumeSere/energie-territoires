import Link from "next/link";
import { EnergyLineChart } from "@/components/EnergyLineChart";
import { EnergySectorChart } from "@/components/EnergySectorChart";
import { FranceEnergyMap } from "@/components/FranceEnergyMap";
import { TerritorySearch } from "@/components/TerritorySearch";
import { formatCompact, formatEnergy, formatNumber, formatPercent } from "@/lib/format";
import { listTerritories, territories } from "@/lib/ore";

export default function Home() {
  const summaries = listTerritories();
  const totalConsumption = territories.reduce((sum, territory) => sum + territory.consumptionMwh, 0);
  const totalDataCenterConsumption = territories.reduce(
    (sum, territory) => sum + territory.dataCenterImpact.estimatedAnnualMwh,
    0,
  );
  const highPressureCount = territories.filter(
    (territory) => territory.dataCenterImpact.gridPressure === "forte",
  ).length;
  const population = territories.reduce((sum, territory) => sum + territory.population, 0);
  const pilot = territories[0];

  return (
    <main className="home-main">
      <section className="home-overview">
        <div className="home-overview-copy">
          <p className="eyebrow">Données publiques · SDES · Agence ORE · ODRÉ · ADEME</p>
          <h1>Observatoire énergie des territoires</h1>
          <p>
            Un cockpit ENGIE pour repérer les consommations locales, comparer les communes et prioriser
            les actions climat-air-énergie.
          </p>
          <div className="hero-actions">
            <Link href="/carte">Explorer la carte</Link>
            <Link href="/comparateur">Comparer</Link>
            <Link href="/methodologie">Voir la méthode</Link>
          </div>
        </div>

        <div className="home-stat-grid" aria-label="Synthèse observatoire">
          <article className="home-stat-card is-blue">
            <span>Territoires</span>
            <strong>{formatNumber(territories.length)}</strong>
            <p>communes pilotes</p>
          </article>
          <article className="home-stat-card is-green">
            <span>Population</span>
            <strong>{formatCompact(population)}</strong>
            <p>habitants suivis</p>
          </article>
          <article className="home-stat-card is-dark">
            <span>Consommation</span>
            <strong>{formatEnergy(totalConsumption)}</strong>
            <p>énergie agrégée</p>
          </article>
          <article className="home-stat-card is-amber">
            <span>Data centers</span>
            <strong>{formatEnergy(totalDataCenterConsumption)}</strong>
            <p>charge estimée</p>
          </article>
        </div>
      </section>

      <section className="home-workspace">
        <FranceEnergyMap territories={summaries} />
        <aside className="map-side-panel">
          <TerritorySearch territories={summaries} />
          <section className="map-insights">
            <div className="section-heading compact">
              <span>Synthèse nationale</span>
              <h2>Lecture rapide</h2>
            </div>
            <div className="map-insight-list">
              <article>
                <strong>{formatNumber(territories.length)}</strong>
                <span>territoires pilotes</span>
              </article>
              <article>
                <strong>{formatEnergy(totalConsumption)}</strong>
                <span>consommation agrégée</span>
              </article>
              <article>
                <strong>{formatEnergy(totalDataCenterConsumption)}</strong>
                <span>charge data centers estimée</span>
              </article>
              <article>
                <strong>{highPressureCount}</strong>
                <span>zones à pression réseau forte</span>
              </article>
            </div>
            <p>
              La carte met en évidence les concentrations urbaines, les pôles numériques et les territoires
              industriels à suivre pour arbitrer sobriété, décarbonation et capacités réseau.
            </p>
          </section>
        </aside>
      </section>

      <section className="analytics-grid home-analytics">
        <EnergyLineChart data={pilot.history} />
        <EnergySectorChart sectors={pilot.sectors} />
      </section>

      <section className="detail-grid home-detail-grid">
        <article>
          <div className="section-heading compact">
            <span>Data centers</span>
            <h2>Un nouvel usage électrique à piloter</h2>
          </div>
          <p>
            Les data centers peuvent concentrer une part importante de la demande électrique locale:
            calcul, stockage, refroidissement et continuité d&apos;alimentation. L&apos;observatoire suit
            leur consommation estimée, la pression réseau, le stress hydrique et le potentiel de chaleur fatale.
          </p>
        </article>
        <article>
          <div className="section-heading compact">
            <span>Lecture ENGIE</span>
            <h2>Réduire l&apos;impact sans freiner les usages</h2>
          </div>
          <ul className="action-list">
            <li>Contractualiser une électricité bas carbone et des garanties d&apos;origine traçables.</li>
            <li>Valoriser la chaleur fatale vers logements, piscines, hôpitaux ou réseaux urbains.</li>
            <li>Mesurer PUE, eau, flexibilité et capacité d&apos;effacement aux heures de pointe.</li>
          </ul>
        </article>
      </section>

      <section className="insight-band home-insight-band">
        <div className="section-heading">
          <span>Territoire repère</span>
          <h2>{pilot.name}</h2>
        </div>
        <p>
          La consommation baisse de {formatPercent(pilot.evolutionPercent)} depuis 2019 dans cet échantillon.
          Le tertiaire, le résidentiel et le numérique concentrent les principaux leviers de sobriété,
          efficacité et chaleur renouvelable.
        </p>
        <Link href={`/territoires/${pilot.code}`}>Ouvrir la fiche territoire</Link>
      </section>
    </main>
  );
}
