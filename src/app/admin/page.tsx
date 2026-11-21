import Link from 'next/link';

import { fcfa, dateLong, num, relative } from '@/lib/format';
import { ADMIN_ACTION } from '@/lib/labels';
import { getStats, requireAdminPage } from '@/server/admin';

function Kpi({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="card kpi">
      <span className="label">{label}</span>
      <span className="value">{value}</span>
      {hint && <span className="hint">{hint}</span>}
    </div>
  );
}

export default async function AdminStats() {
  await requireAdminPage();
  const s = await getStats();
  const punctuality = s.counted ? Math.round((100 * s.onTime) / s.counted) : null;

  return (
    <div className="view wide">
      <div className="page-head">
        <div>
          <div className="eyebrow">Administration</div>
          <h1 className="h-app">Statistiques</h1>
        </div>
      </div>

      <h2 className="section-h" style={{ marginTop: 0 }}>
        Membres et cercles
      </h2>
      <div className="grid-4">
        <Kpi label="Membres inscrits" value={num(s.users)} hint={`${num(s.usersWeek)} sur les 7 derniers jours`} />
        <Kpi label="Comptes suspendus" value={num(s.blocked)} />
        <Kpi label="Cercles actifs" value={num(s.active)} hint={`${num(s.forming)} en formation, ${num(s.completed)} terminés`} />
        <Kpi label="Cagnottes en cours" value={fcfa(s.activePots)} hint="Somme d'un tour de chaque cercle actif" />
      </div>

      <h2 className="section-h">Versements</h2>
      <div className="grid-4">
        <Kpi label="Versements validés" value={fcfa(s.validatedTotal)} hint="Depuis le lancement, hors part du bénéficiaire" />
        <Kpi label="Validés ce mois-ci" value={fcfa(s.validatedMonth)} />
        <Kpi
          label="Versements à l'heure"
          value={punctuality === null ? '–' : `${punctuality} %`}
          hint={`${num(s.onTime)} sur ${num(s.counted)} versements comptés`}
        />
        <Kpi label="Tickets pour dimanche" value={num(s.ticketsNext)} hint={`Tirage du ${dateLong(s.nextDraw)}`} />
      </div>

      <h2 className="section-h">À traiter</h2>
      <div className="grid-2 even">
        <Link href="/admin/litiges" className="card kpi">
          <span className="label">Reçus non validés depuis plus de 3 jours</span>
          <span className="value">{num(s.staleSent)}</span>
          <span className="hint" style={{ color: 'var(--brand)', fontWeight: 700 }}>
            Voir les litiges
          </span>
        </Link>
        <Link href="/admin/litiges" className="card kpi">
          <span className="label">Versements en retard</span>
          <span className="value">{num(s.late)}</span>
          <span className="hint" style={{ color: 'var(--brand)', fontWeight: 700 }}>
            Voir les litiges
          </span>
        </Link>
      </div>

      <h2 className="section-h">Journal des actions</h2>
      {s.actions.length === 0 ? (
        <div className="card sub">Aucune action d'administration pour l'instant.</div>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Action</th>
                <th>Détail</th>
                <th>Par</th>
                <th>Quand</th>
              </tr>
            </thead>
            <tbody>
              {s.actions.map((a, i) => (
                <tr key={i}>
                  <td className="strong">{ADMIN_ACTION[a.action] ?? a.action}</td>
                  <td>
                    {a.targetType === 'user' ? (
                      <Link className="link" href={`/admin/membres/${a.targetId}`}>
                        Voir le membre
                      </Link>
                    ) : a.targetType === 'draw' ? (
                      `Tirage du ${dateLong(a.targetId)}`
                    ) : null}
                    {a.note ? <div className="sub">{a.note}</div> : null}
                  </td>
                  <td>{a.admin}</td>
                  <td className="sub">{relative(a.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
