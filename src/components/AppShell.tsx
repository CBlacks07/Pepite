'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

import { initial } from '@/lib/format';

import { ShieldCheck, UserPlus } from './icons';
import { MEMBER_NAV, TabBar } from './TabBar';

/** Cadre de l'espace membre : menu latéral sur ordinateur, onglets en bas sur téléphone. */
export function AppShell({ user, children }: { user: { displayName: string; isAdmin: boolean }; children: ReactNode }) {
  const pathname = usePathname();
  return (
    <div className="shell">
      <aside className="side" aria-label="Menu">
        <Link href="/app" className="brand">
          P<span className="e">é</span>pite
        </Link>
        {MEMBER_NAV.map(({ href, long, Icon, match }) => (
          <Link key={href} href={href} className="nav-item" aria-current={match(pathname) ? 'page' : undefined}>
            <Icon strokeWidth={1.9} aria-hidden />
            {long}
          </Link>
        ))}
        <Link
          href="/app/rejoindre"
          className="nav-item"
          aria-current={pathname === '/app/rejoindre' ? 'page' : undefined}
        >
          <UserPlus strokeWidth={1.9} aria-hidden />
          Rejoindre un cercle
        </Link>
        {user.isAdmin && (
          <>
            <span className="side-label">Équipe</span>
            <Link href="/admin" className="nav-item">
              <ShieldCheck strokeWidth={1.9} aria-hidden />
              Administration
            </Link>
          </>
        )}
        <div className="side-spacer" />
        <Link href="/app/profil" className="side-me">
          <span className="av mini">{initial(user.displayName)}</span>
          <div>
            <b>{user.displayName}</b>
            <span className="sub">{user.isAdmin ? 'Administrateur' : 'Membre'}</span>
          </div>
        </Link>
      </aside>
      <main className="main">{children}</main>
      <TabBar />
    </div>
  );
}
