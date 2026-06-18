import { notFound } from "next/navigation";
import Link from "next/link";
import { EnergyKpiCard } from "@/components/EnergyKpiCard";
import { EnergyLineChart } from "@/components/EnergyLineChart";
import { EnergyMixChart } from "@/components/EnergyMixChart";
import { EnergySectorChart } from "@/components/EnergySectorChart";
import { formatEmissions, formatEnergy, formatNumber, formatPercent } from "@/lib/format";
import { getTerritory, listTerritories } from "@/lib/ore";

export async function generateStaticParams() {
  return listTerritories().map((territory) => ({ code: territory.code }));
}

export default async function TerritoryPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const territory = await getTerritory(code);

  if (!territory) {
    notFound();
  }

  return (
    <main>
      <section className="page-hero compact-hero">
        <div>
          <p className="eyebrow">
            {territory.department} · {territory.region}
          </p>
          <h1>{territory.name}</h1>
          <p>
            Fiche territoriale pour suivre les usages énergétiques, les émissions associées, les charges
            numériques et les poches d&apos;action à prioriser.
          </p>
        </div>
        <Link href="/comparateur">Comparer ce territoire</Link>
      </section>

      <section className="kpi-grid">
        <EnergyKpiCard label="Consommation" value={formatEnergy(territory.consumptionMwh)} detail="Total annuel multi-énergies" tone="dark" />
        <EnergyKpiCard label="Evolution" value={formatPercent(territory.evolutionPercent)} detail="Variation depuis 2019" tone="green" />
        <EnergyKpiCard label="Emissions" value={formatEmissions(territory.emissionsTco2e)} detail="Ordre de grandeur tCO2e" tone="amber" />
        <EnergyKpiCard label="Part renouvelable" value={`${territory.renewableShare} %`} detail="Electricité, chaleur et gaz verts" tone="blue" />
        <EnergyKpiCard
          label="Data centers"
          value={formatEnergy(territory.dataCenterImpact.estimatedAnnualMwh)}
          detail={`${territory.dataCenterImpact.shareOfTerritoryConsumption} % de la consommation locale estimée`}
          tone="amber"
        />
        <EnergyKpiCard
          label="PUE cible"
          value={territory.dataCenterImpact.pueTarget.toLocaleString("fr-FR")}
          detail={`Pression réseau ${territory.dataCenterImpact.gridPressure}`}
          tone="blue"
        />
      </section>

      <section className="analytics-grid">
        <EnergyLineChart data={territory.history} />
        <EnergySectorChart sectors={territory.sectors} />
      </section>

      <section className="mix-section">
        <EnergyMixChart
          mix={territory.energyMix}
          totalConsumptionMwh={territory.consumptionMwh}
          renewableShare={territory.renewableShare}
        />
      </section>

      <section className="detail-grid">
        <article>
          <div className="section-heading compact">
            <span>Bâtiments</span>
            <h2>Performance DPE</h2>
          </div>
          <div className="dpe-scale">
            {territory.dpe.map((item) => (
              <div key={item.label}>
                <span>{item.label}</span>
                <strong style={{ height: `${Math.max(item.share * 3, 18)}px` }}>{item.share} %</strong>
              </div>
            ))}
          </div>
        </article>
        <article>
          <div className="section-heading compact">
            <span>Plan d&apos;action</span>
            <h2>Leviers ENGIE possibles</h2>
          </div>
          <ul className="action-list">
            {territory.actions.map((action) => (
              <li key={action}>{action}</li>
            ))}
          </ul>
        </article>
        <article>
          <div className="section-heading compact">
            <span>Impact numérique</span>
            <h2>Data centers et infrastructures IT</h2>
          </div>
          <div className="impact-grid">
            <p>
              <strong>{territory.dataCenterImpact.gridPressure}</strong>
              <span>Pression réseau</span>
            </p>
            <p>
              <strong>{territory.dataCenterImpact.heatReusePotential}</strong>
              <span>Potentiel chaleur fatale</span>
            </p>
            <p>
              <strong>{territory.dataCenterImpact.waterStress}</strong>
              <span>Stress eau/refroidissement</span>
            </p>
            <p>
              <strong>{territory.dataCenterImpact.renewableContractShare} %</strong>
              <span>Contrats électriques renouvelables</span>
            </p>
          </div>
          <ul className="action-list">
            {territory.dataCenterImpact.notes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </article>
      </section>

      <section className="source-note">
        <p>
          Population: {formatNumber(territory.population)} habitants · Surface: {territory.surfaceKm2} km2 ·
          Code INSEE: {territory.code}
        </p>
      </section>
    </main>
  );
}
