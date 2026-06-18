"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { formatEnergy, formatPercent } from "@/lib/format";
import type { CommuneSearchResult } from "@/lib/communes";
import type { TerritorySummary } from "@/lib/types";

type TerritorySearchProps = {
  territories: TerritorySummary[];
};

export function TerritorySearch({ territories }: TerritorySearchProps) {
  const [query, setQuery] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  const [communeResults, setCommuneResults] = useState<CommuneSearchResult[]>([]);
  const [isSearchingCommunes, setIsSearchingCommunes] = useState(false);

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

  useEffect(() => {
    const normalized = query.trim();

    if (normalized.length < 2) {
      return;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      setIsSearchingCommunes(true);

      try {
        const response = await fetch(`/api/communes/search?q=${encodeURIComponent(normalized)}&limit=8`, {
          signal: controller.signal,
        });
        const data = (await response.json()) as { communes?: CommuneSearchResult[] };
        const pilotCodes = new Set(territories.map((territory) => territory.code));

        setCommuneResults((data.communes ?? []).filter((commune) => !pilotCodes.has(commune.code)));
      } catch {
        if (!controller.signal.aborted) {
          setCommuneResults([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsSearchingCommunes(false);
        }
      }
    }, 220);

    return () => {
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [query, territories]);

  const visibleResults = isExpanded ? results : results.slice(0, 6);
  const hiddenResultsCount = results.length - visibleResults.length;
  const showCommuneResults = query.trim().length >= 2 && communeResults.length > 0;

  return (
    <section className="search-shell" aria-label="Recherche territoire">
      <div className="search-input">
        <span>Commune ou code INSEE</span>
        <input
          value={query}
          onChange={(event) => {
            const nextQuery = event.target.value;
            setQuery(nextQuery);
            setIsExpanded(false);

            if (nextQuery.trim().length < 2) {
              setCommuneResults([]);
              setIsSearchingCommunes(false);
            }
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
      {showCommuneResults || isSearchingCommunes ? (
        <div className="commune-directory-results" aria-live="polite">
          <span>Annuaire national</span>
          {isSearchingCommunes ? <p>Recherche des communes...</p> : null}
          {communeResults.map((commune) => (
            <Link href={`/territoires/${commune.code}`} key={commune.code} className="commune-directory-result">
              <div>
                <strong>{commune.name}</strong>
                <span>
                  {commune.department} · {commune.region}
                </span>
              </div>
              <div>
                <b>{commune.estimatedConsumptionMwh ? formatEnergy(commune.estimatedConsumptionMwh) : commune.code}</b>
                <span>
                  {commune.estimatedEvolutionPercent !== undefined
                    ? formatPercent(commune.estimatedEvolutionPercent)
                    : "Fiche estimee"}
                </span>
              </div>
            </Link>
          ))}
        </div>
      ) : null}
    </section>
  );
}
