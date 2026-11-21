import type { Metadata } from 'next';
import Link from 'next/link';

import { AddPrizeForm, DeletePrizeButton, DeliveredButton, DrawSponsorForm, RunDrawButton } from '@/components/admin/actions';
import { dateLong, fcfa, num, ticketNo } from '@/lib/format';
import { getDraws, requireAdminPage } from '@/server/admin';

export const metadata: Metadata = { title: 'Tirage du dimanche' };

export default async function AdminDraws() {
  await requireAdminPage('/admin/tirage');
  const data = await getDraws();
  const next = data.draws.find((d) => d.drawOn === data.nextDrawOn);
  const toRun = data.draws.filter((d) => d.status === 'planned' && d.due);
  const done = data.draws.filter((d) => d.status === 'done').slice(0, 4);
  const nextPrizes = next?.prizes ?? [];
  const totalPrizes = nextPrizes.reduce((s, p) => s + p.quantity, 0);

  return (
    <div className="view wide">
      <div className="page-head">
        <div>
          <div className="eyebrow">Administration</div>
          <h1 className="h-app">Tirage du dimanche</h1>
          <p className="sub" style={{ margin: '4px 0 0', maxWidth: '70ch' }}>
            Les lots sont offerts par des partenaires, jamais pris sur les cagnottes. Le tirage se lance à partir du
            dimanche 20 h, heure de Lomé.
          </p>
        </div>
      </div>

      {toRun.length > 0 && (
        <>
          <h2 className="section-h" style={{ marginTop: 0 }}>
            À lancer maintenant
          </h2>
          <div className="col">
            {toRun.map((d) => (
              <div key={d.drawOn} className="card" style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 240 }}>
                  <b>Tirage du {dateLong(d.drawOn)}</b>
                  <div className="sub">
                    {num(d.ticketsCount)} tickets, {num(d.prizes.reduce((s, p) => s + p.quantity, 0))} lots
                    {d.sponsorName ? `, offerts par ${d.sponsorName}` : ''}.
                  </div>
                </div>
                {d.prizes.length > 0 ? (
                  <RunDrawButton drawOn={d.drawOn} tickets={d.ticketsCount} />
                ) : (
                  <span className="pill p-due">Aucun lot saisi</span>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      <h2 className="section-h">Prochain tirage : {dateLong(data.nextDrawOn)}, 20 h</h2>
      <div className="grid-2">
        <div className="col">
          <div className="card">
            <DrawSponsorForm drawOn={data.nextDrawOn} sponsorName={next?.sponsorName ?? null} sponsorContact={next?.sponsorContact ?? null} />
          </div>
          <div className="card">
            <AddPrizeForm drawOn={data.nextDrawOn} />
          </div>
        </div>
        <div className="col">
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Lot</th>
                  <th className="r">Valeur</th>
                  <th className="r">Quantité</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {nextPrizes.map((p) => (
                  <tr key={p.id}>
                    <td className="strong">{p.label}</td>
                    <td className="r num">{fcfa(p.value)}</td>
                    <td className="r num">{p.quantity}</td>
                    <td className="r">
                      <DeletePrizeButton prizeId={p.id} />
                    </td>
                  </tr>
                ))}
                {nextPrizes.length === 0 && (
                  <tr>
                    <td colSpan={4} className="sub">
                      Aucun lot pour l'instant. Les membres voient « annoncés avec le partenaire de la semaine ».
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <p className="sub" style={{ margin: 0 }}>
            {num(data.nextTickets)} tickets en jeu pour l'instant
            {totalPrizes ? `, ${num(totalPrizes)} lots, soit environ 1 chance sur ${num(Math.max(1, Math.round(data.nextTickets / totalPrizes)))} par ticket` : ''}.
          </p>
        </div>
      </div>

      <h2 className="section-h">Derniers tirages</h2>
      {done.length === 0 ? (
        <div className="card sub">Aucun tirage effectué pour l'instant.</div>
      ) : (
        done.map((d) => (
          <div key={d.drawOn} className="col" style={{ marginBottom: 22 }}>
            <div>
              <b>{dateLong(d.drawOn)}</b>
              <span className="sub">
                {' '}
                · {num(d.winners.length)} gagnants sur {num(d.ticketsCount)} tickets · code de vérification{' '}
                <b className="num">{d.seed}</b>
                {d.sponsorName ? ` · ${d.sponsorName}` : ''}
              </span>
            </div>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Gagnant</th>
                    <th>Ticket</th>
                    <th>Lot</th>
                    <th className="r">Remise</th>
                  </tr>
                </thead>
                <tbody>
                  {d.winners.map((w) => (
                    <tr key={w.id}>
                      <td>
                        <Link className="link" href={`/admin/membres/${w.userId}`}>
                          {w.name}
                        </Link>
                      </td>
                      <td className="num">N° {ticketNo(w.number)}</td>
                      <td>
                        {w.label}, {fcfa(w.value)}
                      </td>
                      <td className="r">{w.delivered ? <span className="pill p-paid">Remis</span> : <DeliveredButton winnerId={w.id} />}</td>
                    </tr>
                  ))}
                  {d.winners.length === 0 && (
                    <tr>
                      <td colSpan={4} className="sub">
                        Aucun ticket n'était en jeu.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
