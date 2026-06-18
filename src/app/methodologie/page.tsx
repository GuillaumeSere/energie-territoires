const sources = [
  {
    name: "API Données locales de consommation d'énergie SDES",
    use: "Socle multi-énergies pour consommation, planification climat-air-énergie et modélisation émissions.",
  },
  {
    name: "Agence ORE",
    use: "Séries annuelles électricité et gaz par commune, secteur, catégorie de consommation et code NAF.",
  },
  {
    name: "ODRÉ",
    use: "Compléments production, infrastructures, stockage, mobilité, marchés, météo et territoires.",
  },
  {
    name: "ADEME DPE logements",
    use: "Classes énergie, classes GES, dates de diagnostic et recherche par adresse pour le volet bâtiments.",
  },
];

export default function MethodologyPage() {
  return (
    <main>
      <section className="page-hero">
        <div>
          <p className="eyebrow">Transparence des calculs</p>
          <h1>Méthodologie</h1>
          <p>
            Le site distingue les données sources, les indicateurs transformés et les recommandations.
            Les valeurs actuelles servent de prototype et les connecteurs sont prêts à être branchés aux API publiques.
          </p>
        </div>
      </section>

      <section className="method-grid">
        {sources.map((source) => (
          <article key={source.name}>
            <span>Source publique</span>
            <h2>{source.name}</h2>
            <p>{source.use}</p>
          </article>
        ))}
      </section>

      <section className="source-note">
        <p>
          Prochaine étape données: normaliser les codes INSEE, stocker les séries par année et documenter les facteurs
          d&apos;émission utilisés pour convertir les consommations en tCO2e.
        </p>
      </section>
    </main>
  );
}
