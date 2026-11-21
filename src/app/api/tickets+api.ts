import { requireMember } from '@/server/auth';
import { db } from '@/server/db';
import { json, route } from '@/server/http';

// Tickets pour le prochain tirage du dimanche.
export const GET = route(async (request) => {
  const user = await requireMember(request);
  const sql = db();
  const [mine, [stats], [nextDue]] = await Promise.all([
    sql`
      select number, source, detail, created_at
      from draw_tickets where user_id = ${user.id} and draw_on = next_draw_on()
      order by created_at
    `,
    sql`select next_draw_on()::text as draw_on, (select count(*)::int from draw_tickets where draw_on = next_draw_on()) as in_play`,
    // Prochain versement qui peut rapporter un ticket.
    sql`
      select c.name, r.due_on::text as due_on
      from contributions k join rounds r on r.id = k.round_id join circles c on c.id = r.circle_id
      where k.member_id = ${user.id} and k.status = 'due' and r.due_on >= lome_today()
      order by r.due_on limit 1
    `,
  ]);
  return json({
    drawOn: stats.draw_on,
    inPlay: stats.in_play,
    max: 4,
    tickets: mine.map((t) => ({ number: t.number, source: t.source, detail: t.detail, createdAt: t.created_at })),
    nextDue: nextDue ? { circle: nextDue.name, dueOn: nextDue.due_on } : null,
  });
});
