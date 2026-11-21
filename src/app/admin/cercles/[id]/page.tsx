import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { ChevronLeft } from '@/components/icons';
import { dateShort, fcfa, monthOf, per } from '@/lib/format';
import { CIRCLE_STATUS } from '@/lib/labels';
import { getCircleDetail, requireAdminPage } from '@/server/admin';

export const metadata: Metadata = { title: 'Cercle' };

export default async function AdminCircle({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireAdminPage(`/admin/cercles/${id}`);
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const c = await getCircleDetail(id);
  if (!c) notFound();
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="view wide">
      <Link href="/admin/cercles" className="back">
        <ChevronLeft strokeWidth={1.9} aria-hidden />
        Cercles
      </Link>
      <div className="page-head">
        <div>
          <h1 className="h-app">{c.name}</h1>
          <div className="sub">
            {fcfa(c.amount)} {per(c.frequency)} · {c.size} membres · {CIRCLE_STATUS[c.status] ?? c.status} · créé en{' '}
            {monthOf(c.createdAt)} par {c.organizer}
          </div>
        </div>
      </div>

      <div className="grid-2">
        <div className="col">
          <h2 className="section-h">Tours</h2>
          {c.rounds.length === 0 ? (
            <div className="card sub">L'ordre n'a pas encore été tiré (code d'invitation {c.inviteCode}).</div>
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Tour</th>
                    <th>Reçoit</th>
                    <th>Date limite</th>
                    <th className="r">Payés</th>
                    <th className="r">Reçus</th>
                    <th className="r">En attente</th>
                  </tr>
                </thead>
                <tbody>
                  {c.rounds.map((r) => (
                    <tr key={r.id}>
                      <td className="num strong">{r.number}</td>
                      <td>{r.beneficiary}</td>
                      <td className="num">{dateShort(r.dueOn)}</td>
                      <td className="r num">
                        {r.paid}/{c.size}
                      </td>
                      <td className="r num">{r.sent}</td>
                      <td className="r num">
                        {r.due > 0 && r.dueOn < today ? <span className="pill p-late">{r.due} en retard</span> : r.due}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {c.drawSeed && <p className="sub">Code de vérification du tirage de l'ordre : <b className="num">{c.drawSeed}</b></p>}
        </div>

        <div className="col">
          <h2 className="section-h">Membres</h2>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Prénom</th>
                  <th>Rôle</th>
                  <th className="r">Tour</th>
                </tr>
              </thead>
              <tbody>
                {c.members.map((m) => (
                  <tr key={m.id}>
                    <td>
                      <Link className="link" href={`/admin/membres/${m.id}`}>
                        {m.name}
                      </Link>
                      {m.isNew && <span className="sub"> · nouveau</span>}
                    </td>
                    <td>{m.role === 'organizer' ? 'Organisateur' : 'Membre'}</td>
                    <td className="r num">{m.position ?? '–'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
