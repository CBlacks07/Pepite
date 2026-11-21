'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

import { ArrowLeft, ChartColumn, Scale, Ticket, Users, UsersRound } from '../icons';

const NAV = [
  { href: '/admin', label: 'Statistiques', Icon: ChartColumn, match: (p: string) => p === '/admin' },
  { href: '/admin/membres', label: 'Membres', Icon: Users, match: (p: string) => p.startsWith('/admin/membres') },
  { href: '/admin/cercles', label: 'Cercles', Icon: UsersRound, match: (p: string) => p.startsWith('/admin/cercles') },
  { href: '/admin/litiges', label: 'Litiges', Icon: Scale, match: (p: string) => p.startsWith('/admin/litiges') },
  { href: '/admin/tirage', label: 'Tirage du dimanche', Icon: Ticket, match: (p: string) => p.startsWith('/admin/tirage') },
];

export function AdminShell({ name, children }: { name: string; children: ReactNode }) {
  const pathname = usePathname();
  const links = NAV.map(({ href, label, Icon, match }) => (
    <Link key={href} href={href} className="nav-item" aria-current={match(pathname) ? 'page' : undefined}>
      <Icon strokeWidth={1.9} aria-hidden />
      {label}
    </Link>
  ));
  return (
    <div className="shell admin">
      <aside className="side" aria-label="Administration">
        <Link href="/admin" className="brand">
          P<span className="e">é</span>pite
        </Link>
        <span className="side-label" style={{ paddingTop: 0 }}>
          Administration
        </span>
        {links}
        <div className="side-spacer" />
        <Link href="/app" className="nav-item">
          <ArrowLeft strokeWidth={1.9} aria-hidden />
          Espace membre
        </Link>
        <div className="side-me">
          <span className="av mini">{name.charAt(0).toUpperCase()}</span>
          <div>
            <b>{name}</b>
            <span className="sub">Administrateur</span>
          </div>
        </div>
      </aside>
      <nav className="topnav" aria-label="Administration">
        {links}
        <Link href="/app" className="nav-item">
          <ArrowLeft strokeWidth={1.9} aria-hidden />
          Espace membre
        </Link>
      </nav>
      <main className="main">{children}</main>
    </div>
  );
}
