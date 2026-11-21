import type { Metadata } from 'next';
import Link from 'next/link';

import { Search } from '@/components/icons';
import { fcfa, num, per, relative } from '@/lib/format';
import { CIRCLE_STATUS } from '@/lib/labels';
import { listCircles, requireAdminPage } from '@/server/admin';

export const metadata: Metadata = { title: 'Cercles' };

export default async function AdminCircles({ searchParams }: { searchParams: Promise<{ q?: string | string[] }> }) {
  await requireAdminPage('/admin/cercles');
  const { q } = await searchParams;
  const query = typeof q === 'string' ? q.slice(0, 80) : '';
  const circles = await listCircles(query);

  return (
    <div className="view wide">
      <div className="page-head">
        <div>
          <div className="eyebrow">Administration</div>
          <h1 className="h-app">Cercles</h1>
        </div>
      </div>
      <form className="toolbar" action="/admin/cercles">
        <input className="input" name="q" defaultValue={query} placeholder="Chercher un nom de cercle ou un code d'invitation" aria-label="Recherche" />
        <button className="btn">
          <Search strokeWidth={1.9} aria-hidden />
          Chercher
        </button>
      </form>
      <p className="sub" style={{ marginTop: 0 }}>
        {num(circles.length)} {circles.length > 1 ? 'cercles affichés' : 'cercle affiché'}
        {circles.length === 100 ? ' (les 100 plus récents)' : ''}.
      </p>
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Cercle</th>
              <th>Organisateur</th>
              <th>Montant</th>
              <th className="r">Membres</th>
              <th className="r">Retards</th>
              <th>Statut</th>
              <th>Créé</th>
            </tr>
          </thead>
          <tbody>
            {circles.map((c) => (
              <tr key={c.id}>
                <td>
                  <Link className="link" href={`/admin/cercles/${c.id}`}>
                    {c.name}
                  </Link>
                  <div className="sub num">{c.inviteCode}</div>
                </td>
                <td>{c.organizer}</td>
                <td>
                  {fcfa(c.amount)} {per(c.frequency)}
                </td>
                <td className="r num">
                  {c.members}/{c.size}
                </td>
                <td className="r num">{c.late}</td>
                <td>{CIRCLE_STATUS[c.status] ?? c.status}</td>
                <td className="sub">{relative(c.createdAt)}</td>
              </tr>
            ))}
            {circles.length === 0 && (
              <tr>
                <td colSpan={7} className="sub">
                  Aucun cercle ne correspond.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
