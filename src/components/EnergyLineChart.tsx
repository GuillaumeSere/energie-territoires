"use client";

import { useState } from "react";
import { formatEmissions, formatEnergy } from "@/lib/format";
import type { EnergyPoint } from "@/lib/types";

type EnergyLineChartProps = {
  data: EnergyPoint[];
};

export function EnergyLineChart({ data }: EnergyLineChartProps) {
  const [activeYear, setActiveYear] = useState<number | null>(data.at(-1)?.year ?? null);
  const width = 680;
  const height = 260;
  const padding = 34;
  const values = data.map((point) => point.consumptionMwh);
  const min = Math.min(...values) * 0.98;
  const max = Math.max(...values) * 1.02;
  const range = max - min || 1;

  const points = data.map((point, index) => {
    const x = padding + (index / Math.max(data.length - 1, 1)) * (width - padding * 2);
    const y = height - padding - ((point.consumptionMwh - min) / range) * (height - padding * 2);
    return { ...point, x, y };
  });

  const path = points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");
  const activePoint = points.find((point) => point.year === activeYear) ?? points.at(-1);
  const tooltipX = activePoint ? Math.min(Math.max(activePoint.x - 82, 10), width - 174) : 0;
  const tooltipY = activePoint ? Math.max(activePoint.y - 88, 10) : 0;

  return (
    <div className="chart-panel">
      <div className="section-heading compact">
        <span>Historique</span>
        <h2>Consommation annuelle</h2>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Evolution de la consommation annuelle">
        <defs>
          <linearGradient id="energyLine" x1="0" x2="1">
            <stop offset="0%" stopColor="#00a85a" />
            <stop offset="100%" stopColor="#00a3ff" />
          </linearGradient>
        </defs>
        {[0, 1, 2, 3].map((line) => {
          const y = padding + line * ((height - padding * 2) / 3);
          return <line key={line} x1={padding} x2={width - padding} y1={y} y2={y} className="grid-line" />;
        })}
        {activePoint ? (
          <line
            x1={activePoint.x}
            x2={activePoint.x}
            y1={padding}
            y2={height - padding}
            className="active-grid-line"
          />
        ) : null}
        <path d={path} fill="none" stroke="url(#energyLine)" strokeWidth="5" strokeLinecap="round" />
        {points.map((point) => (
          <g
            key={point.year}
            className={point.year === activePoint?.year ? "chart-point is-active" : "chart-point"}
            tabIndex={0}
            role="button"
            aria-label={`${point.year}: ${formatEnergy(point.consumptionMwh)}, ${formatEmissions(point.emissionsTco2e)}`}
            onMouseEnter={() => setActiveYear(point.year)}
            onFocus={() => setActiveYear(point.year)}
          >
            <circle cx={point.x} cy={point.y} r="7" />
            <circle className="hit-zone" cx={point.x} cy={point.y} r="18" />
            <text x={point.x} y={height - 8} textAnchor="middle">
              {point.year}
            </text>
          </g>
        ))}
        {activePoint ? (
          <g className="chart-tooltip" transform={`translate(${tooltipX} ${tooltipY})`}>
            <rect width="164" height="72" rx="6" />
            <text x="12" y="22" className="tooltip-year">
              {activePoint.year}
            </text>
            <text x="12" y="43">
              {formatEnergy(activePoint.consumptionMwh)}
            </text>
            <text x="12" y="61">
              {formatEmissions(activePoint.emissionsTco2e)}
            </text>
          </g>
        ) : null}
      </svg>
    </div>
  );
}
