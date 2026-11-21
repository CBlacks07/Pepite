import type { Metadata } from 'next';
import Link from 'next/link';

import { Search } from '@/components/icons';
import { num, relative } from '@/lib/format';
import { listUsers, requireAdminPage } from '@/server/admin';

export const metadata: Metadata = { title: 'Membres' };

export default async function AdminMembers({ searchParams }: { searchParams: Promise<{ q?: string | string[] }> }) {
  await requireAdminPage('/admin/membres');
  const { q } = await searchParams;
  const query = typeof q === 'string' ? q.slice(0, 80) : '';
  const users = await listUsers(query);

  return (
    <div className="view wide">
      <div className="page-head">
        <div>
          <div className="eyebrow">Administration</div>
          <h1 className="h-app">Membres</h1>
        </div>
      </div>
      <form className="toolbar" action="/admin/membres">
        <input className="input" name="q" defaultValue={query} placeholder="Chercher un prénom ou un identifiant" aria-label="Recherche" />
        <button className="btn">
          <Search strokeWidth={1.9} aria-hidden />
          Chercher
        </button>
      </form>
      <p className="sub" style={{ marginTop: 0 }}>
        {num(users.length)} {users.length > 1 ? 'membres affichés' : 'membre affiché'}
        {users.length === 100 ? ' (les 100 plus récents)' : ''}.
      </p>
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Prénom</th>
              <th className="r">Cercles</th>
              <th className="r">Retards</th>
              <th>Statut</th>
              <th>Inscrit</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>
                  <Link className="link" href={`/admin/membres/${u.id}`}>
                    {u.name}
                  </Link>
                  {u.isAdmin && <span className="pill p-gold" style={{ marginLeft: 8 }}>Admin</span>}
                </td>
                <td className="r num">{u.circles}</td>
                <td className="r num">{u.late}</td>
                <td>
                  {u.blocked ? <span className="pill p-late">Suspendu</span> : <span className="pill p-paid">Actif</span>}
                </td>
                <td className="sub">{relative(u.createdAt)}</td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={5} className="sub">
                  Aucun membre ne correspond.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
