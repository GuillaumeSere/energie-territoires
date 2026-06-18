export type EnergySource = "electricite" | "gaz" | "chaleur" | "froid" | "carburants";

export type EnergySector =
  | "residentiel"
  | "tertiaire"
  | "industrie"
  | "agriculture"
  | "transport"
  | "numerique";

export type EnergyPoint = {
  year: number;
  consumptionMwh: number;
  emissionsTco2e: number;
};

export type SectorBreakdown = {
  sector: EnergySector;
  consumptionMwh: number;
  share: number;
};

export type DpeBreakdown = {
  label: "A" | "B" | "C" | "D" | "E" | "F" | "G";
  share: number;
};

export type DataCenterImpact = {
  estimatedAnnualMwh: number;
  shareOfTerritoryConsumption: number;
  gridPressure: "faible" | "moderee" | "forte";
  heatReusePotential: "faible" | "moyen" | "eleve";
  waterStress: "faible" | "modere" | "eleve";
  renewableContractShare: number;
  pueTarget: number;
  notes: string[];
};

export type Territory = {
  code: string;
  name: string;
  department: string;
  region: string;
  population: number;
  surfaceKm2: number;
  consumptionMwh: number;
  evolutionPercent: number;
  emissionsTco2e: number;
  renewableShare: number;
  energyMix: Record<EnergySource, number>;
  dataCenterImpact: DataCenterImpact;
  history: EnergyPoint[];
  sectors: SectorBreakdown[];
  dpe: DpeBreakdown[];
  actions: string[];
};

export type TerritorySummary = Pick<
  Territory,
  "code" | "name" | "department" | "region" | "population" | "consumptionMwh" | "evolutionPercent"
>;
