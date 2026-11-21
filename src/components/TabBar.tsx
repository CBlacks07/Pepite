'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { CirclePlus, House, Ticket, UserRound } from './icons';

export const MEMBER_NAV = [
  {
    href: '/app',
    label: 'Accueil',
    long: 'Accueil',
    Icon: House,
    match: (p: string) => p === '/app' || p.startsWith('/app/cercle') || p === '/app/rejoindre',
  },
  { href: '/app/tirage', label: 'Tirage', long: 'Tirage du dimanche', Icon: Ticket, match: (p: string) => p === '/app/tirage' },
  { href: '/app/creer', label: 'Créer', long: 'Créer un cercle', Icon: CirclePlus, match: (p: string) => p === '/app/creer' },
  { href: '/app/profil', label: 'Profil', long: 'Mon profil', Icon: UserRound, match: (p: string) => p === '/app/profil' },
];

/** Barre d'onglets du bas, affichée sur téléphone uniquement (voir .tabbar dans globals.css). */
export function TabBar() {
  const pathname = usePathname();
  return (
    <nav className="tabbar" aria-label="Navigation de l'appli">
      {MEMBER_NAV.map(({ href, label, Icon, match }) => (
        <Link key={href} href={href} className="tab" aria-current={match(pathname) ? 'page' : undefined}>
          <Icon strokeWidth={1.9} aria-hidden />
          {label}
        </Link>
      ))}
    </nav>
  );
}
