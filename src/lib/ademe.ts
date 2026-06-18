import { territories } from "./ore";

export async function getDpeBreakdown(code: string) {
  const territory = territories.find((item) => item.code === code);
  return territory?.dpe ?? [];
}

export const dpeSources = [
  "API DPE logements ADEME pour classes énergie et GES",
  "Recherche par adresse à brancher côté serveur pour les parcours bâtiment",
];
