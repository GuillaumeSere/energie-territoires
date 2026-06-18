import { sectorLabel } from "@/lib/format";
import type { SectorBreakdown } from "@/lib/types";

type EnergySectorChartProps = {
  sectors: SectorBreakdown[];
};

export function EnergySectorChart({ sectors }: EnergySectorChartProps) {
  return (
    <div className="chart-panel">
      <div className="section-heading compact">
        <span>Usages</span>
        <h2>Répartition par secteur</h2>
      </div>
      <div className="sector-list">
        {sectors.map((item) => (
          <div className="sector-row" key={item.sector}>
            <div>
              <strong>{sectorLabel(item.sector)}</strong>
              <span>{item.share} %</span>
            </div>
            <div className="sector-track">
              <span style={{ width: `${item.share}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
