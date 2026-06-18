import type { DataCenterImpact, DpeBreakdown, EnergySector, Territory } from "./types";

export type CommuneSearchResult = {
  code: string;
  name: string;
  department: string;
  departmentCode: string;
  region: string;
  regionCode: string;
  population?: number;
  surfaceKm2?: number;
  estimatedConsumptionMwh?: number;
  estimatedEvolutionPercent?: number;
  postalCodes: string[];
};

type ApiCommune = {
  code?: string;
  nom?: string;
  population?: number;
  surface?: number;
  codesPostaux?: string[];
  departement?: {
    code?: string;
    nom?: string;
  };
  region?: {
    code?: string;
    nom?: string;
  };
};

const communeFields = ["nom", "code", "population", "surface", "codesPostaux", "departement", "region"].join(",");
const baseUrl = "https://geo.api.gouv.fr/communes";
const dpeLabels: DpeBreakdown["label"][] = ["A", "B", "C", "D", "E", "F", "G"];

function hashCode(value: string) {
  return value.split("").reduce((hash, char) => (hash * 31 + char.charCodeAt(0)) % 9973, 17);
}

function roundTo(value: number, step: number) {
  return Math.round(value / step) * step;
}

function estimateConsumptionMwh(population = 1200, surfaceKm2 = 12, code = "") {
  const hash = hashCode(code);
  const density = population / Math.max(surfaceKm2, 1);
  const perCapita = density > 1800 ? 10.4 : density > 450 ? 12.2 : 15.4;
  const activityFactor = 0.88 + (hash % 34) / 100;

  return Math.max(1800, roundTo(population * perCapita * activityFactor + surfaceKm2 * 95, 100));
}

function estimateEvolutionPercent(code: string) {
  return Number((((hashCode(code) % 90) - 62) / 10).toFixed(1));
}

function normalizeCommune(item: ApiCommune): CommuneSearchResult | null {
  if (!item.code || !item.nom) {
    return null;
  }

  return {
    code: item.code,
    name: item.nom,
    department: item.departement?.nom ?? "Departement inconnu",
    departmentCode: item.departement?.code ?? "",
    region: item.region?.nom ?? "Region inconnue",
    regionCode: item.region?.code ?? "",
    population: item.population,
    surfaceKm2: item.surface ? Number((item.surface / 100).toFixed(1)) : undefined,
    estimatedConsumptionMwh: estimateConsumptionMwh(item.population, item.surface, item.code),
    estimatedEvolutionPercent: estimateEvolutionPercent(item.code),
    postalCodes: item.codesPostaux ?? [],
  };
}

async function fetchCommunes(url: URL) {
  const response = await fetch(url, {
    next: { revalidate: 60 * 60 * 24 * 30 },
  });

  if (!response.ok) {
    return [];
  }

  const data = (await response.json()) as ApiCommune[] | ApiCommune;
  const list = Array.isArray(data) ? data : [data];

  return list.map(normalizeCommune).filter((item): item is CommuneSearchResult => Boolean(item));
}

export async function searchCommunes(query: string, limit = 8) {
  const trimmed = query.trim();

  if (trimmed.length < 2) {
    return [];
  }

  const url = new URL(baseUrl);
  url.searchParams.set("fields", communeFields);
  url.searchParams.set("boost", "population");
  url.searchParams.set("limit", String(limit));

  if (/^\d{5}$/.test(trimmed)) {
    const byCodeUrl = new URL(`${baseUrl}/${trimmed}`);
    byCodeUrl.searchParams.set("fields", communeFields);

    const byCode = await fetchCommunes(byCodeUrl);

    if (byCode.length > 0) {
      return byCode;
    }

    url.searchParams.set("codePostal", trimmed);
  } else {
    url.searchParams.set("nom", trimmed);
  }

  return fetchCommunes(url);
}

export async function getCommuneByCode(code: string) {
  if (!/^\d{5}$/.test(code)) {
    return null;
  }

  const url = new URL(`${baseUrl}/${code}`);
  url.searchParams.set("fields", communeFields);

  const [commune] = await fetchCommunes(url);
  return commune ?? null;
}

function makeHistory(consumptionMwh: number, evolutionPercent: number, emissionsTco2e: number) {
  const base = Math.round(consumptionMwh / (1 + evolutionPercent / 100));
  const emissionBase = Math.round(emissionsTco2e / (1 + evolutionPercent / 120));
  const steps = [1, 0.96, 0.99, 0.975, 0.955, consumptionMwh / base];

  return steps.map((factor, index) => ({
    year: 2019 + index,
    consumptionMwh: Math.round(base * factor),
    emissionsTco2e: Math.round(emissionBase * (factor - index * 0.005)),
  }));
}

export function makeEstimatedTerritory(commune: CommuneSearchResult): Territory {
  const population = commune.population ?? 1200;
  const surfaceKm2 = commune.surfaceKm2 ?? Math.max(2, Number((population / 280).toFixed(1)));
  const hash = hashCode(commune.code);
  const consumptionMwh = commune.estimatedConsumptionMwh ?? estimateConsumptionMwh(population, surfaceKm2, commune.code);
  const evolutionPercent = commune.estimatedEvolutionPercent ?? estimateEvolutionPercent(commune.code);
  const renewableShare = 13 + (hash % 23);
  const density = population / Math.max(surfaceKm2, 1);
  const dataCenterShare = density > 1800 ? 3.2 : density > 450 ? 1.8 : 0.8;
  const dataCenterMwh = roundTo((consumptionMwh * dataCenterShare) / 100, 100);
  const emissionsTco2e = roundTo(consumptionMwh * (0.095 + (hash % 26) / 1000), 100);
  const electricite = density > 1800 ? 48 : 42;
  const gaz = density > 1800 ? 27 : 24;
  const chaleur = density > 1800 ? 9 : 5;
  const carburants = 100 - electricite - gaz - chaleur - 1;
  const sectorShares: Record<EnergySector, number> =
    density > 1800
      ? { residentiel: 38, tertiaire: 30, industrie: 7, agriculture: 1, transport: 12, numerique: 12 }
      : density > 450
        ? { residentiel: 41, tertiaire: 24, industrie: 10, agriculture: 2, transport: 13, numerique: 10 }
        : { residentiel: 36, tertiaire: 15, industrie: 11, agriculture: 10, transport: 20, numerique: 8 };
  const gridPressure: DataCenterImpact["gridPressure"] = dataCenterShare >= 3 ? "moderee" : "faible";
  const dpeShares = density > 1800 ? [4, 9, 21, 30, 22, 9, 5] : [5, 11, 23, 30, 20, 8, 3];

  return {
    code: commune.code,
    name: commune.name,
    department: commune.department,
    region: commune.region,
    isEstimated: true,
    population,
    surfaceKm2,
    consumptionMwh,
    evolutionPercent,
    emissionsTco2e,
    renewableShare,
    energyMix: { electricite, gaz, chaleur, froid: 1, carburants },
    history: makeHistory(consumptionMwh, evolutionPercent, emissionsTco2e),
    sectors: Object.entries(sectorShares).map(([sector, share]) => ({
      sector: sector as EnergySector,
      share,
      consumptionMwh: Math.round((consumptionMwh * share) / 100),
    })),
    dpe: dpeLabels.map((label, index) => ({ label, share: dpeShares[index] })),
    actions: [
      "Qualifier les consommations reelles via les donnees ORE/SDES avant arbitrage operationnel.",
      "Prioriser renovation du bati, pilotage des usages et contrats d'energie bas carbone.",
      "Croiser les projets electriques locaux avec les capacites reseau et le potentiel de chaleur renouvelable.",
    ],
    dataCenterImpact: {
      estimatedAnnualMwh: dataCenterMwh,
      shareOfTerritoryConsumption: Number(((dataCenterMwh / consumptionMwh) * 100).toFixed(1)),
      gridPressure,
      heatReusePotential: density > 450 ? "moyen" : "faible",
      waterStress: ["11", "24", "30", "34", "66", "83", "84"].includes(commune.departmentCode) ? "eleve" : "modere",
      renewableContractShare: 28 + (hash % 33),
      pueTarget: Number((1.22 + (hash % 12) / 100).toFixed(2)),
      notes: [
        "Fiche generee depuis l'annuaire national des communes et un modele d'estimation de demonstration.",
        "Remplacer ces ordres de grandeur par les series publiques/API ou donnees operateurs en production.",
        "Utiliser cette fiche pour cadrer l'analyse, pas pour une decision officielle.",
      ],
    },
  };
}

export function formatCommuneForChat(commune: CommuneSearchResult) {
  const population = commune.population
    ? `Population: ${commune.population.toLocaleString("fr-FR")} habitants.`
    : "Population non disponible dans l'annuaire.";
  const postalCodes = commune.postalCodes.length > 0 ? ` Codes postaux: ${commune.postalCodes.join(", ")}.` : "";
  const territory = makeEstimatedTerritory(commune);

  return `${commune.name} (${commune.code}) se situe dans ${commune.department}, region ${commune.region}. ${population}${postalCodes} Fiche disponible: /territoires/${commune.code}. Estimation demo: consommation ${territory.consumptionMwh.toLocaleString("fr-FR")} MWh, evolution ${territory.evolutionPercent.toLocaleString("fr-FR")} %.`;
}
