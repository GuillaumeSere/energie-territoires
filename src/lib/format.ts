const compactFormatter = new Intl.NumberFormat("fr-FR", {
  notation: "compact",
  maximumFractionDigits: 1,
});

const numberFormatter = new Intl.NumberFormat("fr-FR");

export function formatNumber(value: number) {
  return numberFormatter.format(value);
}

export function formatCompact(value: number) {
  return compactFormatter.format(value);
}

export function formatEnergy(value: number) {
  return `${compactFormatter.format(value)} MWh`;
}

export function formatPercent(value: number) {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`;
}

export function formatEmissions(value: number) {
  return `${compactFormatter.format(value)} tCO2e`;
}

export function sectorLabel(sector: string) {
  const labels: Record<string, string> = {
    residentiel: "Résidentiel",
    tertiaire: "Tertiaire",
    industrie: "Industrie",
    agriculture: "Agriculture",
    transport: "Transport",
    numerique: "Numérique / data centers",
  };

  return labels[sector] ?? sector;
}

export function energySourceLabel(source: string) {
  const labels: Record<string, string> = {
    electricite: "Electricité",
    gaz: "Gaz",
    chaleur: "Chaleur",
    froid: "Froid",
    carburants: "Carburants",
  };

  return labels[source] ?? source;
}
