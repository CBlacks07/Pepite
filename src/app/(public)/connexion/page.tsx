import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { currentUser } from '@/server/auth';

import { Connexion } from './Connexion';

export const metadata: Metadata = { title: 'Connexion' };

function safeNext(next: unknown): string {
  return typeof next === 'string' && next.startsWith('/') && !next.startsWith('//') ? next : '/app';
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[]; mode?: string | string[] }>;
}) {
  const { next, mode } = await searchParams;
  const target = safeNext(next);
  const user = await currentUser();
  if (user?.displayName) redirect(target);

  const invited = target.startsWith('/app/rejoindre');
  return (
    <div className="wrap">
      <div className="auth-wrap">
        <div>
          <div className="eyebrow">{invited ? 'Tu as été invité dans un cercle' : 'Bienvenue'}</div>
          <h1>
            P<span className="e">é</span>pite
          </h1>
          <p className="lede">
            La tontine entre proches, avec un tirage bonus le dimanche. Chacun reçoit la cagnotte à son tour, et chaque
            versement fait à l'heure rapporte un ticket.
          </p>
        </div>
        <Connexion next={target} initialMode={mode === 'code' ? 'code' : 'new'} invited={invited} />
      </div>
    </div>
  );
}
