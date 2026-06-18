import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { SiteNavigation } from "@/components/SiteNavigation";
import { SiteChatbot } from "@/components/SiteChatbot";
import "./globals.css";

export const metadata: Metadata = {
  title: "Observatoire Energie des Territoires | ENGIE",
  description: "Tableau de bord territorial pour explorer consommation, émissions et performance énergétique.",
};

const navItems = [
  { href: "/", label: "Observatoire" },
  { href: "/carte", label: "Carte" },
  { href: "/comparateur", label: "Comparateur" },
  { href: "/methodologie", label: "Méthodologie" },
];

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body>
        <header className="site-header">
          <Link href="/" className="brand" aria-label="Retour accueil">
            <Image
              src="/logo.png"
              alt="Observatoire Energie des Territoires"
              width={512}
              height={512}
              priority
            />
          </Link>
          <SiteNavigation items={navItems} />
        </header>
        {children}
        <SiteChatbot />
        <footer className="site-footer">
          <div>
            <strong>Observatoire Energie des Territoires</strong>
            <span>Données publiques de démonstration pour explorer les consommations locales.</span>
          </div>
          <nav aria-label="Liens de pied de page">
            <Link href="/carte">Carte</Link>
            <Link href="/comparateur">Comparateur</Link>
            <Link href="/methodologie">Méthodologie</Link>
          </nav>
        </footer>
      </body>
    </html>
  );
}
