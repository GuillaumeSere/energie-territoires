"use client";

import { useState } from "react";
import Link from "next/link";
import { formatCompact, formatEmissions, formatEnergy, formatNumber, formatPercent } from "@/lib/format";
import type { Territory } from "@/lib/types";

type SortKey = "name" | "population" | "consumptionMwh" | "dataCenters" | "evolutionPercent" | "emissionsTco2e";
type SortDirection = "asc" | "desc";

type ComparatorTableProps = {
  territories: Territory[];
};

const columns: { key: SortKey; label: string; shortLabel?: string }[] = [
  { key: "name", label: "Territoire" },
  { key: "population", label: "Population" },
  { key: "consumptionMwh", label: "Consommation", shortLabel: "Conso." },
  { key: "dataCenters", label: "Data centers", shortLabel: "Data" },
  { key: "evolutionPercent", label: "Evolution" },
  { key: "emissionsTco2e", label: "Emissions" },
];

function getSortValue(territory: Territory, key: SortKey) {
  if (key === "dataCenters") {
    return territory.dataCenterImpact.estimatedAnnualMwh;
  }

  return territory[key];
}

export function ComparatorTable({ territories }: ComparatorTableProps) {
  const [sort, setSort] = useState<{ key: SortKey; direction: SortDirection }>({
    key: "consumptionMwh",
    direction: "desc",
  });

  const maxConsumption = Math.max(...territories.map((territory) => territory.consumptionMwh));
  const maxDataCenters = Math.max(...territories.map((territory) => territory.dataCenterImpact.estimatedAnnualMwh));
  const totals = {
    population: territories.reduce((sum, territory) => sum + territory.population, 0),
    consumption: territories.reduce((sum, territory) => sum + territory.consumptionMwh, 0),
    dataCenters: territories.reduce((sum, territory) => sum + territory.dataCenterImpact.estimatedAnnualMwh, 0),
    emissions: territories.reduce((sum, territory) => sum + territory.emissionsTco2e, 0),
  };

  const sortedTerritories = [...territories].sort((a, b) => {
    const aValue = getSortValue(a, sort.key);
    const bValue = getSortValue(b, sort.key);
    const direction = sort.direction === "asc" ? 1 : -1;

    if (typeof aValue === "string" && typeof bValue === "string") {
      return aValue.localeCompare(bValue, "fr") * direction;
    }

    return (Number(aValue) - Number(bValue)) * direction;
  });

  function handleSort(key: SortKey) {
    setSort((current) => ({
      key,
      direction: current.key === key && current.direction === "desc" ? "asc" : "desc",
    }));
  }

  return (
    <section className="comparison-shell" aria-label="Comparateur territorial">
      <div className="comparison-summary">
        <article>
          <span>Territoires: </span>
          <strong>{territories.length}</strong>
        </article>
        <article>
          <span>Population: </span>
          <strong>{formatCompact(totals.population)}</strong>
        </article>
        <article>
          <span>Consommation: </span>
          <strong>{formatEnergy(totals.consumption)}</strong>
        </article>
        <article>
          <span>Data centers: </span>
          <strong>{formatEnergy(totals.dataCenters)}</strong>
        </article>
        <article>
          <span>Emissions: </span>
          <strong>{formatEmissions(totals.emissions)}</strong>
        </article>
      </div>

      <div className="comparison-table" aria-label="Tableau comparatif triable">
        <div className="comparison-row comparison-head">
          {columns.map((column) => {
            const isActive = sort.key === column.key;
            const indicator = isActive ? (sort.direction === "asc" ? "↑" : "↓") : "↕";

            return (
              <button
                type="button"
                key={column.key}
                onClick={() => handleSort(column.key)}
                className={isActive ? "is-active" : ""}
                aria-label={`Trier par ${column.label} ${
                  isActive && sort.direction === "desc" ? "croissant" : "décroissant"
                }`}
              >
                <span>{column.shortLabel ?? column.label}</span>
                <b>{indicator}</b>
              </button>
            );
          })}
        </div>

        {sortedTerritories.map((territory, index) => {
          const consumptionWidth = Math.max((territory.consumptionMwh / maxConsumption) * 100, 4);
          const dataCenterWidth = Math.max(
            (territory.dataCenterImpact.estimatedAnnualMwh / maxDataCenters) * 100,
            4,
          );

          return (
            <Link href={`/territoires/${territory.code}`} className="comparison-row comparison-body-row" key={territory.code}>
              <div className="territory-cell">
                <b>{index + 1}</b>
                <div>
                  <strong>{territory.name} </strong>
                  <span>
                    {territory.department} · {territory.region}
                  </span>
                </div>
              </div>
              <span className="metric-cell">{formatNumber(territory.population)}</span>
              <div className="bar-cell">
                <strong>{formatEnergy(territory.consumptionMwh)}</strong>
                <i>
                  <span style={{ width: `${consumptionWidth}%` }} />
                </i>
              </div>
              <div className="bar-cell data-cell">
                <strong>{formatEnergy(territory.dataCenterImpact.estimatedAnnualMwh)}</strong>
                <i>
                  <span style={{ width: `${dataCenterWidth}%` }} />
                </i>
              </div>
              <span className={territory.evolutionPercent <= 0 ? "trend-badge is-good" : "trend-badge is-warning"}>
                {formatPercent(territory.evolutionPercent)}
              </span>
              <span className="metric-cell">{formatEmissions(territory.emissionsTco2e)}</span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
