import type { ReactNode } from 'react';

import { Info } from './icons';

/** Gabarit des pages légales, avec l'avertissement « projet à faire relire ». */
export function LegalPage({ eyebrow, title, updated, children }: { eyebrow: string; title: string; updated: string; children: ReactNode }) {
  return (
    <div className="wrap">
      <article className="legal">
        <div className="eyebrow">{eyebrow}</div>
        <h1>{title}</h1>
        <p className="sub">Dernière mise à jour : {updated}</p>
        <div className="notice">
          <Info strokeWidth={1.9} aria-hidden />
          <span>
            Projet de texte à faire relire par un juriste au Togo avant le lancement public. Les mentions entre
            crochets sont à compléter.
          </span>
        </div>
        {children}
      </article>
    </div>
  );
}
