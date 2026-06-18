"use client";

import { useState } from "react";
import Link from "next/link";

type NavItem = {
  href: string;
  label: string;
};

type SiteNavigationProps = {
  items: NavItem[];
};

export function SiteNavigation({ items }: SiteNavigationProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="site-nav">
      <button
        type="button"
        className={isOpen ? "menu-toggle is-open" : "menu-toggle"}
        aria-expanded={isOpen}
        aria-controls="primary-navigation"
        aria-label={isOpen ? "Fermer le menu" : "Ouvrir le menu"}
        onClick={() => setIsOpen((current) => !current)}
      >
        <span />
        <span />
        <span />
      </button>

      <nav id="primary-navigation" className={isOpen ? "is-open" : ""} aria-label="Navigation principale">
        {items.map((item) => (
          <Link href={item.href} key={item.href} onClick={() => setIsOpen(false)}>
            {item.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
