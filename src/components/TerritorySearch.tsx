"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { formatEnergy, formatPercent } from "@/lib/format";
import type { TerritorySummary } from "@/lib/types";

type TerritorySearchProps = {
  territories: TerritorySummary[];
};

export function TerritorySearch({ territories }: TerritorySearchProps) {
  const [query, setQuery] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);

  const results = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return territories;
    }

    return territories.filter((territory) =>
      [territory.name, territory.code, territory.department, territory.region]
        .join(" ")
        .toLowerCase()
        .includes(normalized),
    );
  }, [query, territories]);

  const visibleResults = isExpanded ? results : results.slice(0, 6);
  const hiddenResultsCount = results.length - visibleResults.length;

  return (
    <section className="search-shell" aria-label="Recherche territoire">
      <div className="search-input">
        <span>Commune ou code INSEE</span>
        <input
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setIsExpanded(false);
          }}
          placeholder="Paris, Lyon, 75056..."
        />
      </div>
      <div className="territory-results">
        {visibleResults.map((territory) => (
          <Link href={`/territoires/${territory.code}`} key={territory.code} className="territory-result">
            <div>
              <strong>{territory.name}</strong>
              <span>
                {territory.department} · {territory.region}
              </span>
            </div>
            <div>
              <b>{formatEnergy(territory.consumptionMwh)}</b>
              <span>{formatPercent(territory.evolutionPercent)}</span>
            </div>
          </Link>
        ))}
      </div>
      {results.length > 6 ? (
        <button
          type="button"
          className={`territory-more-button ${isExpanded ? "is-expanded" : ""}`}
          onClick={() => setIsExpanded((current) => !current)}
        >
          {isExpanded ? "Voir moins" : `Voir plus (${hiddenResultsCount})`}
        </button>
      ) : null}
    </section>
  );
}
