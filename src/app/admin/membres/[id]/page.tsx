import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { BlockUserButton, FreeTicketButton } from '@/components/admin/actions';
import { ChevronLeft } from '@/components/icons';
import { fcfa, monthOf, per, relative, ticketNo } from '@/lib/format';
import { ADMIN_ACTION, CIRCLE_STATUS, TICKET_SOURCE } from '@/lib/labels';
import { getUserDetail, requireAdminPage } from '@/server/admin';

export const metadata: Metadata = { title: 'Membre' };

export default async function AdminMember({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const admin = await requireAdminPage(`/admin/membres/${id}`);
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const u = await getUserDetail(id);
  if (!u) notFound();

  return (
    <div className="view wide">
      <Link href="/admin/membres" className="back">
        <ChevronLeft strokeWidth={1.9} aria-hidden />
        Membres
      </Link>
      <div className="page-head">
        <div className="hello">
          <span className="av big">{u.name.charAt(0).toUpperCase()}</span>
          <div>
            <h1 className="h-app">{u.name}</h1>
            <div className="sub">
              Inscrit en {monthOf(u.createdAt)} · {u.isAdmin ? 'Administrateur' : 'Membre'}
            </div>
          </div>
        </div>
        {u.id !== admin.id && (
          <div className="actions">
            <FreeTicketButton userId={u.id} name={u.name} />
            <BlockUserButton userId={u.id} blocked={!!u.blockedAt} name={u.name} />
          </div>
        )}
      </div>

      {u.blockedAt && (
        <div className="notice error" style={{ marginBottom: 18 }}>
          <span>
            Compte suspendu {relative(u.blockedAt)}
            {u.blockedReason ? ` : ${u.blockedReason}` : '.'}
          </span>
        </div>
      )}

      <div className="grid-4">
        <div className="card kpi">
          <span className="label">Versements à l'heure</span>
          <span className="value">{u.counts.onTime}</span>
        </div>
        <div className="card kpi">
          <span className="label">Payés en retard</span>
          <span className="value">{u.counts.paidLate}</span>
        </div>
        <div className="card kpi">
          <span className="label">En retard, non payés</span>
          <span className="value">{u.counts.overdue}</span>
        </div>
        <div className="card kpi">
          <span className="label">Reçus en attente de validation</span>
          <span className="value">{u.counts.waiting}</span>
        </div>
      </div>

      <div className="grid-2" style={{ marginTop: 8 }}>
        <div className="col">
          <h2 className="section-h">Cercles</h2>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Cercle</th>
                  <th>Montant</th>
                  <th>Rôle</th>
                  <th>Statut</th>
                </tr>
              </thead>
              <tbody>
                {u.circles.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <Link className="link" href={`/admin/cercles/${c.id}`}>
                        {c.name}
                      </Link>
                    </td>
                    <td>
                      {fcfa(c.amount)} {per(c.frequency)}
                    </td>
                    <td>
                      {c.role === 'organizer' ? 'Organisateur' : 'Membre'}
                      {c.position ? `, tour ${c.position}` : ''}
                    </td>
                    <td>{CIRCLE_STATUS[c.status] ?? c.status}</td>
                  </tr>
                ))}
                {u.circles.length === 0 && (
                  <tr>
                    <td colSpan={4} className="sub">
                      Aucun cercle.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="col">
          <h2 className="section-h">Tickets pour dimanche</h2>
          {u.tickets.length === 0 ? (
            <div className="card sub">Aucun ticket pour le prochain tirage.</div>
          ) : (
            <div className="tickets" style={{ margin: 0 }}>
              {u.tickets.map((t) => (
                <div key={t.number} className="ticket">
                  <span className="no num">N° {ticketNo(t.number)}</span>
                  <span>
                    <b>{TICKET_SOURCE[t.source] ?? t.source}</b>
                    <span className="sub">{t.detail}</span>
                  </span>
                </div>
              ))}
            </div>
          )}

          <h2 className="section-h">Historique d'administration</h2>
          {u.actions.length === 0 ? (
            <div className="card sub">Aucune action sur ce compte.</div>
          ) : (
            <ul className="feed card" style={{ paddingBlock: 4 }}>
              {u.actions.map((a, i) => (
                <li key={i}>
                  <div>
                    <div>
                      <b>{ADMIN_ACTION[a.action] ?? a.action}</b>
                      {a.note ? ` : ${a.note}` : ''}
                    </div>
                    <div className="when">
                      {a.admin}, {relative(a.createdAt)}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
