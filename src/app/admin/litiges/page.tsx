import type { Metadata } from 'next';
import Link from 'next/link';

import { ResolveButtons } from '@/components/admin/actions';
import { dateShort, fcfa, relative } from '@/lib/format';
import { METHOD } from '@/lib/labels';
import { STALE_RECEIPT_DAYS } from '@/lib/rules';
import { listDisputes, requireAdminPage } from '@/server/admin';

export const metadata: Metadata = { title: 'Litiges' };

type Dispute = Awaited<ReturnType<typeof listDisputes>>[number];

function DisputeTable({ rows, empty }: { rows: Dispute[]; empty: string }) {
  if (rows.length === 0) return <div className="card sub">{empty}</div>;
  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            <th>Cercle</th>
            <th>Qui doit</th>
            <th>À qui</th>
            <th>Montant</th>
            <th>Date limite</th>
            <th>Reçu</th>
            <th className="r">Décision</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((k) => (
            <tr key={k.id}>
              <td>
                <Link className="link" href={`/admin/cercles/${k.circleId}`}>
                  {k.circle}
                </Link>
                <div className="sub">Tour {k.number}</div>
              </td>
              <td>
                <Link className="link" href={`/admin/membres/${k.memberId}`}>
                  {k.member}
                </Link>
              </td>
              <td>
                <Link className="link" href={`/admin/membres/${k.beneficiaryId}`}>
                  {k.beneficiary}
                </Link>
              </td>
              <td className="num">{fcfa(k.amount)}</td>
              <td className="num">{dateShort(k.dueOn)}</td>
              <td>
                {k.status === 'sent' ? (
                  <>
                    {k.method ? METHOD[k.method] : 'Reçu'}
                    {k.reference ? <div className="sub num">Réf. {k.reference}</div> : null}
                    {k.sentAt ? <div className="sub">Envoyé {relative(k.sentAt)}</div> : null}
                  </>
                ) : (
                  <span className="sub">Aucun</span>
                )}
              </td>
              <td className="r">
                <ResolveButtons
                  contributionId={k.id}
                  status={k.status}
                  member={k.member}
                  beneficiary={k.beneficiary}
                  amount={k.amount}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default async function AdminDisputes() {
  await requireAdminPage('/admin/litiges');
  const rows = await listDisputes();
  const stale = rows.filter((k) => k.status === 'sent');
  const late = rows.filter((k) => k.status === 'due');

  return (
    <div className="view wide">
      <div className="page-head">
        <div>
          <h1 className="h-app">Litiges de paiement</h1>
          <p className="sub page-intro">
            Avant de trancher, vérifie la référence auprès des deux personnes. Chaque décision est gardée dans le journal
            avec ta note.
          </p>
        </div>
      </div>

      <h2 className="section-h mt-0">
        Reçus non validés depuis plus de {STALE_RECEIPT_DAYS} jours ({stale.length})
      </h2>
      <DisputeTable rows={stale} empty={`Aucun reçu en attente depuis plus de ${STALE_RECEIPT_DAYS} jours.`} />

      <h2 className="section-h">Versements en retard ({late.length})</h2>
      <DisputeTable rows={late} empty="Aucun versement en retard." />
    </div>
  );
}
