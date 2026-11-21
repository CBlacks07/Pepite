import { Award, Ban, CircleCheck, Gift, Info, Timer } from '@/components/icons';
import { ErrorNotice, PageSkeleton } from '@/components/ui';
import { countdown, dateLong, num, ticketNo } from '@/lib/format';
import { useNow } from '@/lib/hooks';
import { useTickets } from '@/lib/queries';
import type { TicketsData } from '@/lib/types';

const SOURCE: Record<TicketsData['tickets'][number]['source'], string> = {
  on_time: "Versement à l'heure",
  loyalty: 'Bonus régularité',
  invite: 'Invitation acceptée',
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

  return (
    <div className="view">
      <div className="eyebrow">Tirage du dimanche</div>
      <h1 className="h-app" style={{ marginTop: 4 }}>
        Tes chances cette semaine
      </h1>
      <div className="card cd">
        <span className="itile gold">
          <Timer strokeWidth={1.9} aria-hidden />
        </span>
        <div>
          <div className="sub">Prochain tirage : {dateLong(d.drawOn)}, 20 h</div>
          <div className="count-big num">{now ? countdown(d.drawOn, now).long : '…'}</div>
        </div>
      </div>

      <h2 className="section-h">
        Tes tickets : {d.tickets.length} sur {d.max}
      </h2>
      <div className="tickets">
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

      <h2 className="section-h">Les lots de la semaine</h2>
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

      <h2 className="section-h">Les règles</h2>
      <ul className="ilist">
        <li>
          <CircleCheck strokeWidth={1.9} aria-hidden />
          <span>1 ticket pour chaque versement fait à l'heure et validé par le bénéficiaire.</span>
        </li>
        <li>
          <Award strokeWidth={1.9} aria-hidden />
          <span>1 ticket quand une personne que tu invites rejoint son premier cercle. Bonus régularité après 12 mois sans retard : bientôt.</span>
        </li>
        <li>
          <Ban strokeWidth={1.9} aria-hidden />
          <span>4 tickets maximum par tirage. Les tickets ne s'achètent pas.</span>
        </li>
        <li>
          <Info strokeWidth={1.9} aria-hidden />
          <span>Participation gratuite possible sans versement : voir le règlement du jeu.</span>
        </li>
      </ul>
    </div>
  );
}
