import { formatEnergy, formatPercent } from "@/lib/format";
import { formatCommuneForChat, searchCommunes } from "@/lib/communes";
import { territories } from "@/lib/ore";

type ChatRequest = {
  message?: string;
  history?: {
    role: "user" | "bot";
    text: string;
  }[];
};

type OpenAITextContent = {
  type: string;
  text?: string;
};

type OpenAIOutputItem = {
  type?: string;
  content?: OpenAITextContent[];
};

type OpenAIResponse = {
  output_text?: string;
  output?: OpenAIOutputItem[];
  error?: {
    message?: string;
  };
};

const model = process.env.OPENAI_MODEL ?? "gpt-5.4";

const territoryContext = territories
  .map((territory) => {
    const dataCenter = territory.dataCenterImpact;

    return [
      `${territory.name} (${territory.code}, ${territory.department}, ${territory.region})`,
      `population ${territory.population}`,
      `consommation ${formatEnergy(territory.consumptionMwh)}`,
      `evolution ${formatPercent(territory.evolutionPercent)}`,
      `renouvelable ${formatPercent(territory.renewableShare)}`,
      `data centers ${formatEnergy(dataCenter.estimatedAnnualMwh)} (${formatPercent(
        dataCenter.shareOfTerritoryConsumption,
      )})`,
      `pression reseau ${dataCenter.gridPressure}`,
    ].join(", ");
  })
  .join("\n");

const assistantInstructions = `
Tu es l'assistant de l'Observatoire Energie des Territoires, un site de demonstration ENGIE.
Reponds en francais, de facon concise, claire et utile.
Tu peux aider sur: navigation du site, carte, comparateur, methodologie, KPI, consommation, emissions, DPE, mix energetique, data centers, pression reseau et lecture des fiches territoire.
Utilise les donnees ci-dessous quand la question porte sur une commune presente dans l'observatoire.
Si la question demande une donnee absente ou une actualite, dis clairement que l'observatoire ne contient pas cette information.
Ne promets pas une precision officielle: les donnees sont une demonstration a remplacer par des sources publiques/API ou donnees operateurs en production.

Territoires disponibles:
${territoryContext}
`.trim();

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

function findPilotTerritory(message: string) {
  const normalized = normalize(message);

  return territories.find((territory) => {
    const searchable = normalize(
      `${territory.name} ${territory.code} ${territory.department} ${territory.region}`,
    );

    return searchable
      .split(" ")
      .some((part) => part.length > 2 && normalized.includes(part)) || normalized.includes(territory.code);
  });
}

async function findCommuneMention(message: string) {
  if (findPilotTerritory(message)) {
    return null;
  }

  const codeMatch = message.match(/\b\d{5}\b/);

  if (codeMatch) {
    const [commune] = await searchCommunes(codeMatch[0], 1);
    return commune ?? null;
  }

  const normalized = message
    .replace(/[?!.,;:()]/g, " ")
    .split(/\s+/)
    .filter((part) => part.length > 2)
    .join(" ");
  const [commune] = await searchCommunes(normalized, 1);

  return commune ?? null;
}

function extractOutputText(response: OpenAIResponse) {
  if (response.output_text) {
    return response.output_text;
  }

  return (
    response.output
      ?.flatMap((item) => item.content ?? [])
      .map((content) => content.text)
      .filter(Boolean)
      .join("\n") ?? ""
  );
}

export async function POST(request: Request) {
  const body = (await request.json()) as ChatRequest;
  const message = body.message?.trim();

  if (!message) {
    return Response.json({ error: "Message vide" }, { status: 400 });
  }

  const communeMention = await findCommuneMention(message);

  if (communeMention) {
    return Response.json({ reply: formatCommuneForChat(communeMention) });
  }

  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return Response.json(
      {
        error: "OPENAI_API_KEY est manquante. Ajoute-la dans .env.local pour activer l'assistant IA.",
      },
      { status: 503 },
    );
  }

  const recentHistory = (body.history ?? [])
    .slice(-8)
    .map((item) => `${item.role === "user" ? "Utilisateur" : "Assistant"}: ${item.text}`)
    .join("\n");

  const input = [
    recentHistory ? `Conversation recente:\n${recentHistory}` : null,
    `Nouvelle question utilisateur:\n${message}`,
  ]
    .filter(Boolean)
    .join("\n\n");

  const openAIResponse = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      instructions: assistantInstructions,
      input,
      max_output_tokens: 450,
    }),
  });

  const data = (await openAIResponse.json()) as OpenAIResponse;

  if (!openAIResponse.ok) {
    return Response.json(
      { error: data.error?.message ?? "Erreur pendant l'appel au modele." },
      { status: openAIResponse.status },
    );
  }

  const reply = extractOutputText(data).trim();

  if (!reply) {
    return Response.json({ error: "Le modele n'a pas renvoye de texte." }, { status: 502 });
  }

  return Response.json({ reply });
}
