import { requireMember } from '@/server/auth';
import { db } from '@/server/db';
import { json, route } from '@/server/http';
import { DRAW } from '@/lib/rules';

// Tickets pour le prochain tirage du dimanche, lots annoncés et derniers résultats.
export const GET = route(async (request) => {
  const user = await requireMember(request);
  const sql = db();
  const [mine, [stats], [nextDue], [upcoming], prizes, [last], myWins] = await Promise.all([
    sql`
      select number, source, detail, created_at
      from draw_tickets where user_id = ${user.id} and draw_on = next_draw_on()
      order by created_at
    `,
    sql`select next_draw_on()::text as draw_on, (select count(*)::int from draw_tickets where draw_on = next_draw_on()) as in_play`,
    sql`
      select c.name, r.due_on::text as due_on
      from contributions k join rounds r on r.id = k.round_id join circles c on c.id = r.circle_id
      where k.member_id = ${user.id} and k.status = 'due' and r.due_on >= lome_today()
      order by r.due_on limit 1
    `,
    sql`select sponsor_name from draws where draw_on = next_draw_on()`,
    sql`
      select label, value, quantity from draw_prizes
      where draw_on = next_draw_on() order by value desc, created_at
    `,
    sql`
      select d.draw_on::text as draw_on, d.tickets_count, d.sponsor_name,
             (select count(*)::int from draw_winners w where w.draw_on = d.draw_on) as winners
      from draws d where d.status = 'done' order by d.draw_on desc limit 1
    `,
    sql`
      select t.number, p.label, p.value, w.delivered_at
      from draw_winners w
      join draw_tickets t on t.id = w.ticket_id
      join draw_prizes p on p.id = w.prize_id
      where w.user_id = ${user.id}
        and w.draw_on = (select max(draw_on) from draws where status = 'done')
      order by p.value desc
    `,
  ]);
  return json({
    drawOn: stats.draw_on,
    inPlay: stats.in_play,
    max: DRAW.maxTicketsPerPerson,
    tickets: mine.map((t) => ({ number: t.number, source: t.source, detail: t.detail, createdAt: t.created_at })),
    nextDue: nextDue ? { circle: nextDue.name, dueOn: nextDue.due_on } : null,
    sponsor: upcoming?.sponsor_name ?? null,
    prizes: prizes.map((p) => ({ label: p.label, value: p.value, quantity: p.quantity })),
    lastDraw: last
      ? {
          drawOn: last.draw_on,
          ticketsCount: last.tickets_count,
          winners: last.winners,
          sponsor: last.sponsor_name,
          myWins: myWins.map((w) => ({ number: w.number, label: w.label, value: w.value, delivered: !!w.delivered_at })),
        }
      : null,
  });
});
