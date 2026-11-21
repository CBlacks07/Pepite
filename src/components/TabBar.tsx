import { usePathname } from 'expo-router';

import { A } from './A';
import { CirclePlus, House, Ticket, UserRound } from './icons';

const TABS = [
  { href: '/', label: 'Accueil', Icon: House, match: (p: string) => p === '/' || p.startsWith('/cercle') || p === '/rejoindre' },
  { href: '/tirage', label: 'Tirage', Icon: Ticket, match: (p: string) => p === '/tirage' },
  { href: '/creer', label: 'Créer', Icon: CirclePlus, match: (p: string) => p === '/creer' },
  { href: '/profil', label: 'Profil', Icon: UserRound, match: (p: string) => p === '/profil' },
];

export function TabBar() {
  const pathname = usePathname();
  return (
    <nav className="tabbar" aria-label="Navigation de l'appli">
      {TABS.map(({ href, label, Icon, match }) => (
        <A key={href} href={href} className="tab" aria-current={match(pathname) ? 'page' : undefined}>
          <Icon strokeWidth={1.9} aria-hidden />
          {label}
        </A>
      ))}
    </nav>
  );
}
