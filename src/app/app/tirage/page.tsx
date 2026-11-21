'use client';

import { Award, Ban, CircleCheck, Gift, Info, PartyPopper, Timer, Trophy } from '@/components/icons';
import { ErrorNotice, PageSkeleton } from '@/components/ui';
import { countdown, dateLong, fcfa, num, ticketNo } from '@/lib/format';
import { useNow } from '@/lib/hooks';
import { useTickets } from '@/lib/queries';
import type { TicketsData } from '@/lib/types';

const SOURCE: Record<TicketsData['tickets'][number]['source'], string> = {
  on_time: "Versement à l'heure",
  loyalty: 'Bonus régularité',
  invite: 'Invitation acceptée',
  free_entry: 'Participation gratuite',
};

export default function Tirage() {
  const q = useTickets();
  const now = useNow();

  if (q.isPending) return <PageSkeleton />;
  if (q.isError)
    return (
      <div className="view">
        <ErrorNotice error={q.error} onRetry={() => q.refetch()} />
      </div>
    );

  const d = q.data;
  const free = Math.max(0, d.max - d.tickets.length);
  const totalPrizes = d.prizes.reduce((s, p) => s + p.quantity, 0);
  const odds = totalPrizes && d.inPlay ? Math.max(1, Math.round(d.inPlay / totalPrizes)) : null;

  return (
    <div className="view">
      <div className="page-head">
        <div>
          <div className="eyebrow">Tirage du dimanche</div>
          <h1 className="h-app" style={{ marginTop: 4 }}>
            Tes chances cette semaine
          </h1>
        </div>
      </div>

      <div className="grid-2">
        <div className="col">
          <div className="card cd" style={{ marginTop: 0 }}>
            <span className="itile gold">
              <Timer strokeWidth={1.9} aria-hidden />
            </span>
            <div>
              <div className="sub">Prochain tirage : {dateLong(d.drawOn)}, 20 h (heure de Lomé)</div>
              <div className="count-big num">{now ? countdown(d.drawOn, now).long : '…'}</div>
            </div>
          </div>

          <h2 className="section-h">
            Tes tickets : {d.tickets.length} sur {d.max}
          </h2>
          <div className="tickets" style={{ margin: 0 }}>
            {d.tickets.map((t) => (
              <div key={t.number} className="ticket">
                <span className="no num">N° {ticketNo(t.number)}</span>
                <span>
                  <b>{SOURCE[t.source]}</b>
                  <span className="sub">{t.detail}</span>
                </span>
              </div>
            ))}
            {Array.from({ length: free }, (_, i) => (
              <div key={`free-${i}`} className="ticket empty">
                <span className="no num">N° ——</span>
                <span>
                  <b>Ticket libre</b>
                  <span className="sub">
                    {d.nextDue
                      ? `Paie ta part de ${d.nextDue.circle} à l'heure pour l'obtenir.`
                      : "Paie ta part à l'heure dans un cercle pour l'obtenir."}
                  </span>
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="col">
          <h2 className="section-h">Les lots de la semaine</h2>
          {d.prizes.length === 0 ? (
            <div className="card" style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <span className="itile sm gold">
                <Gift strokeWidth={1.9} aria-hidden />
              </span>
              <div>
                <b>Annoncés avec le partenaire de la semaine</b>
                <div className="sub">
                  Les lots sont offerts par des partenaires, jamais pris sur les cagnottes. {num(d.inPlay)}{' '}
                  {d.inPlay > 1 ? 'tickets sont en jeu' : 'ticket est en jeu'} pour l'instant.
                </div>
              </div>
            </div>
          ) : (
            <div className="card" style={{ paddingBlock: '6px 14px' }}>
              {d.prizes.map((p, i) => (
                <div key={i} className="pr">
                  <span className="itile sm gold">
                    {i === 0 ? <Trophy strokeWidth={1.9} aria-hidden /> : <Gift strokeWidth={1.9} aria-hidden />}
                  </span>
                  <span className="q">{p.quantity} ×</span>
                  <span>
                    {p.label} : {fcfa(p.value)}
                  </span>
                </div>
              ))}
              <div className="odds">
                {num(totalPrizes)} {totalPrizes > 1 ? 'lots offerts' : 'lot offert'}
                {d.sponsor ? ` par ${d.sponsor}` : ''}. {num(d.inPlay)} {d.inPlay > 1 ? 'tickets' : 'ticket'} en jeu pour
                l'instant
                {odds ? `, soit environ 1 chance sur ${num(odds)} par ticket.` : '.'}
              </div>
            </div>
          )}

          {d.lastDraw && (
            <>
              <h2 className="section-h">Dernier tirage, {dateLong(d.lastDraw.drawOn)}</h2>
              {d.lastDraw.myWins.length > 0 ? (
                d.lastDraw.myWins.map((w) => (
                  <div key={w.number} className="res win" style={{ marginTop: 0 }}>
                    <span className="itile gold">
                      <PartyPopper strokeWidth={1.9} aria-hidden />
                    </span>
                    <div>
                      <b>
                        Ton ticket N° {ticketNo(w.number)} gagne : {w.label}, {fcfa(w.value)}.
                      </b>
                      <span className="sub">
                        {w.delivered ? 'Lot remis.' : "L'équipe Pépite te contacte pour te remettre ton lot."}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="res" style={{ marginTop: 0 }}>
                  <span className="itile">
                    <Award strokeWidth={1.9} aria-hidden />
                  </span>
                  <div>
                    <b>Pas cette fois.</b>
                    <span className="sub">
                      {num(d.lastDraw.winners)} {d.lastDraw.winners > 1 ? 'gagnants' : 'gagnant'} sur{' '}
                      {num(d.lastDraw.ticketsCount ?? 0)} tickets. Ton épargne, elle, avance.
                    </span>
                  </div>
                </div>
              )}
            </>
          )}

          <h2 className="section-h">Les règles</h2>
          <ul className="ilist">
            <li>
              <CircleCheck strokeWidth={1.9} aria-hidden />
              <span>1 ticket pour chaque versement fait à l'heure et validé par le bénéficiaire.</span>
            </li>
            <li>
              <Award strokeWidth={1.9} aria-hidden />
              <span>
                1 ticket quand une personne que tu invites rejoint son premier cercle. Bonus régularité après 12 mois
                sans retard : bientôt.
              </span>
            </li>
            <li>
              <Ban strokeWidth={1.9} aria-hidden />
              <span>4 tickets maximum par tirage. Les tickets ne s'achètent pas.</span>
            </li>
            <li>
              <Info strokeWidth={1.9} aria-hidden />
              <span>
                Participation gratuite possible sans versement :{' '}
                <a href="/reglement" style={{ color: 'var(--brand)', fontWeight: 700 }}>
                  voir le règlement du jeu
                </a>
                .
              </span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
