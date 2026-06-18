import { energySourceLabel, formatEnergy } from "@/lib/format";
import type { EnergySource } from "@/lib/types";

type EnergyMixChartProps = {
  mix: Record<EnergySource, number>;
  totalConsumptionMwh: number;
  renewableShare: number;
};

const sourceColors: Record<EnergySource, string> = {
  electricite: "#00a3ff",
  gaz: "#6f7f78",
  chaleur: "#00a85a",
  froid: "#7dd8ff",
  carburants: "#e7a628",
};

const sourceOrder: EnergySource[] = ["electricite", "gaz", "chaleur", "froid", "carburants"];

export function EnergyMixChart({ mix, totalConsumptionMwh, renewableShare }: EnergyMixChartProps) {
  return (
    <article className="energy-mix-card">
      <div className="section-heading compact">
        <span>Sources d&apos;énergie</span>
        <h2>Mix énergétique territorial</h2>
      </div>

      <div className="mix-stack" aria-label="Répartition des sources d'énergie">
        {sourceOrder.map((source) => (
          <span
            key={source}
            style={{
              width: `${mix[source]}%`,
              background: sourceColors[source],
            }}
            title={`${energySourceLabel(source)}: ${mix[source]} %`}
          />
        ))}
      </div>

      <div className="mix-list">
        {sourceOrder.map((source) => {
          const share = mix[source];
          const consumption = Math.round((totalConsumptionMwh * share) / 100);

          return (
            <div className="mix-row" key={source}>
              <div>
                <i style={{ background: sourceColors[source] }} />
                <strong>{energySourceLabel(source)}</strong>
              </div>
              <span>{share} %</span>
              <em>{formatEnergy(consumption)}</em>
            </div>
          );
        })}
      </div>

      <div className="renewable-note">
        <strong>{renewableShare} %</strong>
        <span>Part renouvelable estimée dans le mix local</span>
      </div>
    </article>
  );
}
