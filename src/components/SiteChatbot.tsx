"use client";

import { FormEvent, useState } from "react";
import { formatEmissions, formatEnergy, formatNumber, formatPercent, sectorLabel } from "@/lib/format";
import { territories } from "@/lib/ore";

type ChatMessage = {
  id: number;
  role: "bot" | "user";
  text: string;
};

const starterMessages: ChatMessage[] = [
  {
    id: 1,
    role: "bot",
    text: "Bonjour, je peux t'aider à lire les indicateurs, trouver une commune, comparer des territoires ou comprendre les données.",
  },
];

const quickPrompts = [
  "Que montre la carte ?",
  "Comparer des villes",
  "Impact data centers",
  "Sources des données",
  "Ville la plus consommante",
  "Comment lire les KPI ?",
];

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

function includesAny(value: string, terms: string[]) {
  return terms.some((term) => value.includes(term));
}

function findTerritory(normalized: string) {
  return territories.find((territory) => {
    const searchable = normalize(
      `${territory.name} ${territory.code} ${territory.department} ${territory.region}`,
    );

    return searchable
      .split(" ")
      .some((part) => part.length > 2 && normalized.includes(part)) || normalized.includes(territory.code);
  });
}

function formatTopTerritoriesByConsumption() {
  return [...territories]
    .sort((first, second) => second.consumptionMwh - first.consumptionMwh)
    .slice(0, 3)
    .map((territory, index) => `${index + 1}. ${territory.name}: ${formatEnergy(territory.consumptionMwh)}`)
    .join(" ");
}

function formatTerritoryAnswer(message: string) {
  const normalized = normalize(message);
  const territory = findTerritory(normalized);

  if (!territory) {
    return null;
  }

  const mainSector = [...territory.sectors].sort((first, second) => second.share - first.share)[0];

  if (includesAny(normalized, ["data", "center", "datacenter", "numerique"])) {
    return `${territory.name}: les data centers représentent environ ${formatEnergy(
      territory.dataCenterImpact.estimatedAnnualMwh,
    )}, soit ${formatPercent(territory.dataCenterImpact.shareOfTerritoryConsumption)} de la consommation locale. Pression réseau: ${territory.dataCenterImpact.gridPressure}.`;
  }

  if (includesAny(normalized, ["emission", "co2", "carbone"])) {
    return `${territory.name}: les émissions estimées sont de ${formatEmissions(
      territory.emissionsTco2e,
    )}. Pour analyser le détail, ouvre la fiche territoire depuis la carte ou la recherche.`;
  }

  if (includesAny(normalized, ["renouvelable", "enr", "mix", "electricite", "gaz", "chaleur"])) {
    return `${territory.name}: part renouvelable ${formatPercent(
      territory.renewableShare,
    )}. Mix: électricité ${territory.energyMix.electricite} %, gaz ${territory.energyMix.gaz} %, chaleur ${territory.energyMix.chaleur} %, carburants ${territory.energyMix.carburants} %.`;
  }

  if (includesAny(normalized, ["secteur", "residentiel", "tertiaire", "industrie", "transport"])) {
    return `${territory.name}: le principal secteur est ${sectorLabel(mainSector.sector)} avec ${mainSector.share} % de la consommation. La fiche territoire détaille tous les secteurs.`;
  }

  return `${territory.name} (${territory.department}) consomme ${formatEnergy(
    territory.consumptionMwh,
  )}, avec une évolution de ${formatPercent(territory.evolutionPercent)}. Population suivie: ${formatNumber(
    territory.population,
  )} habitants.`;
}

function getBotReply(message: string) {
  const normalized = normalize(message);
  const territoryAnswer = formatTerritoryAnswer(message);

  if (territoryAnswer) {
    return territoryAnswer;
  }

  if (includesAny(normalized, ["bonjour", "salut", "hello", "coucou"])) {
    return "Bonjour. Tu peux me poser une question sur une ville, les KPI, la carte, le comparateur, la méthodologie ou l'impact des data centers.";
  }

  if (includesAny(normalized, ["carte", "geographique", "marker", "pastille", "zoom"])) {
    return "La carte sert à repérer les territoires pilotes. Les pastilles sont proportionnelles à la consommation: plus une pastille est grande, plus la demande locale est élevée.";
  }

  if (includesAny(normalized, ["compar", "difference", "versus", "vs", "classement"])) {
    return "Le comparateur permet de mettre plusieurs territoires côte à côte: population, consommation, émissions, évolution, pression réseau et impact numérique.";
  }

  if (includesAny(normalized, ["ville la plus", "plus consomm", "top", "classement"])) {
    return `Les plus fortes consommations de l'échantillon sont: ${formatTopTerritoriesByConsumption()}`;
  }

  if (includesAny(normalized, ["kpi", "indicateur", "chiffre", "lecture rapide", "lire"])) {
    return "Les KPI résument l'échantillon: nombre de territoires, consommation agrégée, charge estimée des data centers et zones à forte pression réseau.";
  }

  if (includesAny(normalized, ["data", "center", "datacenter", "numerique", "serveur"])) {
    return "L'impact data center est une estimation de consommation électrique locale. Il faut surtout regarder sa part dans la consommation du territoire, la pression réseau, l'eau, le PUE et la chaleur fatale.";
  }

  if (includesAny(normalized, ["reseau", "pression", "raccordement", "enedis", "rte"])) {
    return "La pression réseau indique les zones où les nouveaux usages électriques peuvent demander plus de vigilance: raccordement, pointes, flexibilité et capacité locale.";
  }

  if (includesAny(normalized, ["dpe", "logement", "renovation", "batiment"])) {
    return "Les données DPE servent à repérer la qualité énergétique du parc bâti. Les classes E, F et G signalent souvent des priorités de rénovation.";
  }

  if (includesAny(normalized, ["emission", "co2", "carbone", "decarbonation", "climat"])) {
    return "Les émissions permettent de relier la consommation aux trajectoires climat. Compare-les avec le mix énergétique et les secteurs dominants pour identifier les leviers.";
  }

  if (includesAny(normalized, ["renouvelable", "enr", "solaire", "chaleur", "mix", "gaz", "electricite"])) {
    return "Le mix énergétique montre la part électricité, gaz, chaleur, froid et carburants. La part renouvelable aide à qualifier le potentiel de décarbonation.";
  }

  if (includesAny(normalized, ["source", "donnee", "methode", "methodologie", "fiable", "origine"])) {
    return "La méthodologie décrit les sources publiques et les hypothèses de démonstration. Les données réelles peuvent ensuite être branchées aux API publiques ou aux données opérateurs.";
  }

  if (includesAny(normalized, ["comment", "aide", "utiliser", "faire", "trouver"])) {
    return "Tu peux commencer par chercher une ville dans la carte, ouvrir sa fiche, puis utiliser le comparateur pour confronter plusieurs territoires.";
  }

  return "Je peux répondre sur les villes présentes, la carte, le comparateur, les KPI, les secteurs, les émissions, le DPE, le mix énergétique, le réseau et les data centers. Essaie par exemple: « Paris data centers » ou « ville la plus consommante ». ";
}

export function SiteChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>(starterMessages);
  const [isSending, setIsSending] = useState(false);

  async function sendMessage(text: string) {
    const trimmed = text.trim();

    if (!trimmed || isSending) {
      return;
    }

    const history = messages.slice(-8);
    const fallbackReply = getBotReply(trimmed);
    let loadingId = 0;

    setIsOpen(true);
    setIsSending(true);
    setMessages((current) => {
      const nextId = current.length + 1;
      loadingId = nextId + 1;

      return [
        ...current,
        { id: nextId, role: "user", text: trimmed },
        { id: loadingId, role: "bot", text: "Je cherche la meilleure réponse..." },
      ];
    });
    setInput("");

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: trimmed,
          history,
        }),
      });

      const data = (await response.json()) as { reply?: string; error?: string };
      const reply = response.ok && data.reply ? data.reply : `${fallbackReply} (${data.error ?? "mode IA indisponible"})`;

      setMessages((current) =>
        current.map((message) => (message.id === loadingId ? { ...message, text: reply } : message)),
      );
    } catch {
      setMessages((current) =>
        current.map((message) =>
          message.id === loadingId ? { ...message, text: `${fallbackReply} (mode IA indisponible)` } : message,
        ),
      );
    } finally {
      setIsSending(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void sendMessage(input);
  }

  return (
    <section className={`site-chatbot ${isOpen ? "is-open" : ""}`} aria-label="Assistant du site">
      {isOpen ? (
        <div className="chatbot-panel">
          <div className="chatbot-header">
            <div>
              <span>Assistant</span>
              <strong>Observatoire énergie</strong>
            </div>
            <button type="button" onClick={() => setIsOpen(false)} aria-label="Fermer le chat">
              ×
            </button>
          </div>

          <div className="chatbot-messages" aria-live="polite">
            {messages.map((message) => (
              <p key={message.id} className={`chatbot-message is-${message.role}`}>
                {message.text}
              </p>
            ))}
          </div>

          <div className="chatbot-prompts" aria-label="Suggestions">
            {quickPrompts.map((prompt) => (
              <button key={prompt} type="button" onClick={() => void sendMessage(prompt)} disabled={isSending}>
                {prompt}
              </button>
            ))}
          </div>

          <form className="chatbot-form" onSubmit={handleSubmit}>
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Question sur une ville, un KPI, le réseau..."
              aria-label="Message pour le chatbot"
              disabled={isSending}
            />
            <button type="submit" disabled={isSending}>
              {isSending ? "..." : "Envoyer"}
            </button>
          </form>
        </div>
      ) : null}

      <button
        type="button"
        className="chatbot-toggle"
        onClick={() => setIsOpen((current) => !current)}
        aria-expanded={isOpen}
        aria-label={isOpen ? "Fermer le chat" : "Ouvrir le chat"}
      >
        Chat
      </button>
    </section>
  );
}
