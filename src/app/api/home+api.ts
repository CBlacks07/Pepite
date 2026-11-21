import { requireMember } from '@/server/auth';
import { db } from '@/server/db';
import { json, route } from '@/server/http';

// Tout ce que montre l'accueil, en un seul appel.
export const GET = route(async (request) => {
  const user = await requireMember(request);
  const sql = db();
  const me = user.id;

  const [[saved], [nextTurn], [tickets], circles, feed, reminders] = await Promise.all([
    sql`
      select coalesce(sum(c.amount), 0)::int as total, extract(year from lome_today())::int as year
      from contributions k
      join rounds r on r.id = k.round_id
      join circles c on c.id = r.circle_id
      where k.member_id = ${me} and k.status = 'paid'
        and extract(year from r.due_on) = extract(year from lome_today())
        -- Sa propre part (comptée d'office au tirage) ne compte qu'une fois son tour arrivé.
        and (r.beneficiary_id <> ${me} or r.due_on <= lome_today())
    `,
    sql`
      select c.id, c.name, (c.amount * c.size)::int as pot, r.due_on::text as due_on
      from rounds r join circles c on c.id = r.circle_id
      where r.beneficiary_id = ${me} and r.due_on >= lome_today()
      order by r.due_on limit 1
    `,
    sql`
      select count(*)::int as count, next_draw_on()::text as draw_on
      from draw_tickets where user_id = ${me} and draw_on = next_draw_on()
    `,
    sql`
      select c.id, c.name, c.amount, c.frequency, c.size, c.status, c.starts_on::text as starts_on,
             (select count(*)::int from circle_members m2 where m2.circle_id = c.id) as members,
             cur.number as current_number, cur.due_on::text as current_due,
             (cur.beneficiary_id = ${me}) as i_receive,
             mine.status as my_status
      from circle_members m
      join circles c on c.id = m.circle_id
      left join lateral (
        select r.* from rounds r where r.circle_id = c.id
        order by (r.due_on < lome_today()), case when r.due_on >= lome_today() then r.number else -r.number end
        limit 1
      ) cur on true
      left join contributions mine on mine.round_id = cur.id and mine.member_id = ${me}
      where m.user_id = ${me}
      order by (c.status = 'completed'), c.created_at desc
    `,
    sql`
      select e.kind, e.amount, e.created_at, c.name as circle,
             a.display_name as actor, t.display_name as target,
             (e.actor_id = ${me}) as actor_is_me, (e.target_id = ${me}) as target_is_me
      from events e
      join circles c on c.id = e.circle_id
      join circle_members m on m.circle_id = e.circle_id and m.user_id = ${me}
      left join users a on a.id = e.actor_id
      left join users t on t.id = e.target_id
      order by e.created_at desc
      limit 8
    `,
    sql`
      select r.id, r.message, r.created_at, u.display_name as from_name, c.name as circle, c.id as circle_id
      from reminders r
      join users u on u.id = r.from_user
      join rounds ro on ro.id = r.round_id
      join circles c on c.id = ro.circle_id
      where r.to_user = ${me} and r.read_at is null
      order by r.created_at desc limit 10
    `,
  ]);

  return json({
    user: { id: me, displayName: user.displayName },
    year: saved.year,
    saved: saved.total,
    nextTurn: nextTurn
      ? { circleId: nextTurn.id, circleName: nextTurn.name, pot: nextTurn.pot, dueOn: nextTurn.due_on }
      : null,
    tickets: { count: tickets.count, max: 4, drawOn: tickets.draw_on },
    circles: circles.map((c) => ({
      id: c.id,
      name: c.name,
      amount: c.amount,
      frequency: c.frequency,
      size: c.size,
      members: c.members,
      status: c.status,
      startsOn: c.starts_on,
      currentNumber: c.current_number,
      currentDue: c.current_due,
      iReceive: c.i_receive,
      myStatus: c.my_status,
    })),
    feed: feed.map((e) => ({
      kind: e.kind,
      amount: e.amount,
      createdAt: e.created_at,
      circle: e.circle,
      actor: e.actor,
      target: e.target,
      actorIsMe: e.actor_is_me,
      targetIsMe: e.target_is_me,
    })),
    reminders: reminders.map((r) => ({
      id: r.id,
      message: r.message,
      createdAt: r.created_at,
      fromName: r.from_name,
      circle: r.circle,
      circleId: r.circle_id,
    })),
  });
});
