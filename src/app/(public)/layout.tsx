import Link from 'next/link';
import type { ReactNode } from 'react';

import { currentUser } from '@/server/auth';

export default async function PublicLayout({ children }: { children: ReactNode }) {
  const user = await currentUser();
  return (
    <div className="site">
      <header className="site-header">
        <div className="wrap">
          <Link href="/" className="brand">
            P<span className="e">é</span>pite
          </Link>
          <nav className="site-nav" aria-label="Site">
            <Link href="/#comment">Comment ça marche</Link>
            <Link href="/#tirage">Le tirage du dimanche</Link>
            <Link href="/#questions">Questions</Link>
          </nav>
          <div className="site-cta">
            {user?.displayName ? (
              <Link className="btn small" href="/app">
                Ouvrir mon espace
              </Link>
            ) : (
              <>
                <Link className="btn small ghost" href="/connexion?mode=code">
                  Me reconnecter
                </Link>
                <Link className="btn small" href="/connexion">
                  Créer mon compte
                </Link>
              </>
            )}
          </div>
        </div>
      </header>
      <main className="site-main">{children}</main>
      <footer className="site-footer">
        <div className="wrap">
          <span>Pépite, la tontine entre proches. Lomé, Togo.</span>
          <nav aria-label="Informations légales">
            <Link href="/reglement">Règlement du jeu</Link>
            <Link href="/conditions">Conditions d'utilisation</Link>
            <Link href="/confidentialite">Confidentialité</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
