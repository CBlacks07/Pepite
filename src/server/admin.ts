// Lectures de l'administration (pages serveur). Toute écriture passe par /api/admin/*.
import 'server-only';

import { notFound, redirect } from 'next/navigation';

import { currentUser, type SessionUser } from './auth';
import { db } from './db';

/** À appeler en tête de chaque page d'admin : 404 pour qui n'est pas admin. */
export async function requireAdminPage(next = '/admin'): Promise<SessionUser> {
  const user = await currentUser();
  if (!user) redirect(`/connexion?next=${encodeURIComponent(next)}`);
  if (!user.isAdmin) notFound();
  return user;
}

export async function getStats() {
  const sql = db();
  const [[s], actions] = await Promise.all([
    sql`
      select
        (select count(*) from users)::int as users,
        (select count(*) from users where created_at > now() - interval '7 days')::int as users_week,
        (select count(*) from users where blocked_at is not null)::int as blocked,
        (select count(*) from circles where status = 'forming')::int as forming,
        (select count(*) from circles where status = 'active')::int as active,
        (select count(*) from circles where status = 'completed')::int as completed,
        (select coalesce(sum(c.amount * c.size), 0) from circles c where c.status = 'active')::bigint as active_pots,
        (select coalesce(sum(c.amount), 0) from contributions k join rounds r on r.id = k.round_id
           join circles c on c.id = r.circle_id
           where k.status = 'paid' and r.beneficiary_id <> k.member_id)::bigint as validated_total,
        (select coalesce(sum(c.amount), 0) from contributions k join rounds r on r.id = k.round_id
           join circles c on c.id = r.circle_id
           where k.status = 'paid' and r.beneficiary_id <> k.member_id
             and k.validated_at >= date_trunc('month', now() at time zone 'Africa/Lome') at time zone 'Africa/Lome')::bigint as validated_month,
        (select count(*) from contributions k join rounds r on r.id = k.round_id
           where r.beneficiary_id <> k.member_id and (k.status = 'paid' or r.due_on < lome_today()))::int as counted,
        (select count(*) from contributions k join rounds r on r.id = k.round_id
           where r.beneficiary_id <> k.member_id and k.status = 'paid'
             and (k.sent_at at time zone 'Africa/Lome')::date <= r.due_on)::int as on_time,
        (select count(*) from contributions where status = 'sent' and sent_at < now() - interval '3 days')::int as stale_sent,
        (select count(*) from contributions k join rounds r on r.id = k.round_id
           where k.status = 'due' and r.due_on < lome_today())::int as late,
        (select count(*) from draw_tickets where draw_on = next_draw_on())::int as tickets_next,
        next_draw_on()::text as next_draw
    `,
    sql`
      select a.action, a.target_type, a.target_id, a.note, a.created_at, u.display_name as admin
      from admin_actions a join users u on u.id = a.admin_id
      order by a.created_at desc limit 12
    `,
  ]);
  return {
    users: s.users as number,
    usersWeek: s.users_week as number,
    blocked: s.blocked as number,
    forming: s.forming as number,
    active: s.active as number,
    completed: s.completed as number,
    activePots: Number(s.active_pots),
    validatedTotal: Number(s.validated_total),
    validatedMonth: Number(s.validated_month),
    counted: s.counted as number,
    onTime: s.on_time as number,
    staleSent: s.stale_sent as number,
    late: s.late as number,
    ticketsNext: s.tickets_next as number,
    nextDraw: s.next_draw as string,
    actions: actions.map((a) => ({
      action: a.action as string,
      targetType: a.target_type as string,
      targetId: a.target_id as string,
      note: a.note as string | null,
      createdAt: (a.created_at as Date).toISOString(),
      admin: a.admin as string,
    })),
  };
}

export async function listUsers(q: string) {
  const term = q.trim();
  const rows = await db()`
    select u.id, u.display_name, u.created_at, u.is_admin, u.blocked_at,
           (select count(*) from circle_members m where m.user_id = u.id)::int as circles,
           (select count(*) from contributions k join rounds r on r.id = k.round_id
              where k.member_id = u.id and r.beneficiary_id <> u.id and k.status <> 'paid'
                and r.due_on < lome_today())::int as late
    from users u
    where ${term} = '' or u.display_name ilike '%' || ${term} || '%' or u.id::text = ${term}
    order by u.created_at desc
    limit 100
  `;
  return rows.map((u) => ({
    id: u.id as string,
    name: (u.display_name as string | null) ?? '(sans prénom)',
    createdAt: (u.created_at as Date).toISOString(),
    isAdmin: u.is_admin as boolean,
    blocked: !!u.blocked_at,
    circles: u.circles as number,
    late: u.late as number,
  }));
}

export async function getUserDetail(id: string) {
  const sql = db();
  const [[u], circles, [counts], tickets, actions] = await Promise.all([
    sql`select id, display_name, created_at, is_admin, blocked_at, blocked_reason from users where id = ${id}`,
    sql`
      select c.id, c.name, c.status, c.amount, c.frequency, m.role, m.position
      from circle_members m join circles c on c.id = m.circle_id
      where m.user_id = ${id} order by c.created_at desc
    `,
    sql`
      select
        count(*) filter (where k.status = 'paid' and (k.sent_at at time zone 'Africa/Lome')::date <= r.due_on)::int as on_time,
        count(*) filter (where k.status = 'paid' and (k.sent_at at time zone 'Africa/Lome')::date > r.due_on)::int as paid_late,
        count(*) filter (where k.status <> 'paid' and r.due_on < lome_today())::int as overdue,
        count(*) filter (where k.status = 'sent')::int as waiting
      from contributions k join rounds r on r.id = k.round_id
      where k.member_id = ${id} and r.beneficiary_id <> ${id}
    `,
    sql`
      select number, source, detail from draw_tickets
      where user_id = ${id} and draw_on = next_draw_on() order by created_at
    `,
    sql`
      select a.action, a.note, a.created_at, x.display_name as admin
      from admin_actions a join users x on x.id = a.admin_id
      where a.target_type = 'user' and a.target_id = ${id}
      order by a.created_at desc limit 20
    `,
  ]);
  if (!u) return null;
  return {
    id: u.id as string,
    name: (u.display_name as string | null) ?? '(sans prénom)',
    createdAt: (u.created_at as Date).toISOString(),
    isAdmin: u.is_admin as boolean,
    blockedAt: u.blocked_at ? (u.blocked_at as Date).toISOString() : null,
    blockedReason: u.blocked_reason as string | null,
    circles: circles.map((c) => ({
      id: c.id as string,
      name: c.name as string,
      status: c.status as string,
      amount: c.amount as number,
      frequency: c.frequency as 'weekly' | 'monthly',
      role: c.role as string,
      position: c.position as number | null,
    })),
    counts: {
      onTime: counts.on_time as number,
      paidLate: counts.paid_late as number,
      overdue: counts.overdue as number,
      waiting: counts.waiting as number,
    },
    tickets: tickets.map((t) => ({ number: t.number as number, source: t.source as string, detail: t.detail as string | null })),
    actions: actions.map((a) => ({
      action: a.action as string,
      note: a.note as string | null,
      createdAt: (a.created_at as Date).toISOString(),
      admin: a.admin as string,
    })),
  };
}

export async function listCircles(q: string) {
  const term = q.trim();
  const rows = await db()`
    select c.id, c.name, c.amount, c.frequency, c.size, c.status, c.invite_code, c.created_at,
           u.display_name as organizer,
           (select count(*) from circle_members m where m.circle_id = c.id)::int as members,
           (select count(*) from contributions k join rounds r on r.id = k.round_id
              where r.circle_id = c.id and k.status <> 'paid' and r.due_on < lome_today())::int as late
    from circles c join users u on u.id = c.created_by
    where ${term} = '' or c.name ilike '%' || ${term} || '%' or c.invite_code = upper(${term})
    order by c.created_at desc
    limit 100
  `;
  return rows.map((c) => ({
    id: c.id as string,
    name: c.name as string,
    amount: c.amount as number,
    frequency: c.frequency as 'weekly' | 'monthly',
    size: c.size as number,
    status: c.status as string,
    inviteCode: c.invite_code as string,
    createdAt: (c.created_at as Date).toISOString(),
    organizer: c.organizer as string,
    members: c.members as number,
    late: c.late as number,
  }));
}

export async function getCircleDetail(id: string) {
  const sql = db();
  const [[c], members, rounds] = await Promise.all([
    sql`
      select c.*, c.starts_on::text as starts_on_text, u.display_name as organizer
      from circles c join users u on u.id = c.created_by where c.id = ${id}
    `,
    sql`
      select u.id, u.display_name, m.role, m.position, m.is_new, m.joined_at
      from circle_members m join users u on u.id = m.user_id
      where m.circle_id = ${id} order by m.position nulls last, m.joined_at
    `,
    sql`
      select r.id, r.number, r.due_on::text as due_on, b.display_name as beneficiary,
             count(*) filter (where k.status = 'paid')::int as paid,
             count(*) filter (where k.status = 'sent')::int as sent,
             count(*) filter (where k.status = 'due')::int as due
      from rounds r join users b on b.id = r.beneficiary_id
      join contributions k on k.round_id = r.id
      where r.circle_id = ${id}
      group by r.id, b.display_name order by r.number
    `,
  ]);
  if (!c) return null;
  return {
    id: c.id as string,
    name: c.name as string,
    amount: c.amount as number,
    frequency: c.frequency as 'weekly' | 'monthly',
    size: c.size as number,
    status: c.status as string,
    inviteCode: c.invite_code as string,
    drawSeed: c.draw_seed as string | null,
    startsOn: c.starts_on_text as string | null,
    organizer: c.organizer as string,
    createdAt: (c.created_at as Date).toISOString(),
    members: members.map((m) => ({
      id: m.id as string,
      name: m.display_name as string,
      role: m.role as string,
      position: m.position as number | null,
      isNew: m.is_new as boolean,
    })),
    rounds: rounds.map((r) => ({
      id: r.id as string,
      number: r.number as number,
      dueOn: r.due_on as string,
      beneficiary: r.beneficiary as string,
      paid: r.paid as number,
      sent: r.sent as number,
      due: r.due as number,
    })),
  };
}

export async function listDisputes() {
  const rows = await db()`
    select k.id, k.status, k.method, k.reference, k.sent_at, r.number, r.due_on::text as due_on,
           c.id as circle_id, c.name as circle, c.amount,
           m.id as member_id, m.display_name as member, b.id as beneficiary_id, b.display_name as beneficiary
    from contributions k
    join rounds r on r.id = k.round_id
    join circles c on c.id = r.circle_id
    join users m on m.id = k.member_id
    join users b on b.id = r.beneficiary_id
    where (k.status = 'sent' and k.sent_at < now() - interval '3 days')
       or (k.status = 'due' and r.due_on < lome_today())
    order by r.due_on, c.name
    limit 200
  `;
  return rows.map((k) => ({
    id: k.id as string,
    status: k.status as 'sent' | 'due',
    method: k.method as string | null,
    reference: k.reference as string | null,
    sentAt: k.sent_at ? (k.sent_at as Date).toISOString() : null,
    number: k.number as number,
    dueOn: k.due_on as string,
    circleId: k.circle_id as string,
    circle: k.circle as string,
    amount: k.amount as number,
    memberId: k.member_id as string,
    member: k.member as string,
    beneficiaryId: k.beneficiary_id as string,
    beneficiary: k.beneficiary as string,
  }));
}

export async function getDraws() {
  const sql = db();
  const [[next], draws, prizes, winners] = await Promise.all([
    sql`
      select next_draw_on()::text as draw_on,
             (select count(*)::int from draw_tickets where draw_on = next_draw_on()) as tickets
    `,
    sql`
      select d.draw_on::text as draw_on, d.sponsor_name, d.sponsor_contact, d.status, d.seed, d.tickets_count,
             d.drawn_at,
             (now() >= (d.draw_on + time '20:00') at time zone 'Africa/Lome') as due,
             (select count(*)::int from draw_tickets t where t.draw_on = d.draw_on) as tickets
      from draws d order by d.draw_on desc limit 12
    `,
    sql`
      select id, draw_on::text as draw_on, label, value, quantity
      from draw_prizes order by draw_on desc, value desc, created_at
    `,
    sql`
      select w.id, w.draw_on::text as draw_on, w.delivered_at, u.id as user_id, u.display_name as name,
             t.number, p.label, p.value
      from draw_winners w
      join users u on u.id = w.user_id
      join draw_tickets t on t.id = w.ticket_id
      join draw_prizes p on p.id = w.prize_id
      where w.draw_on in (select draw_on from draws where status = 'done' order by draw_on desc limit 4)
      order by w.draw_on desc, p.value desc, t.number
    `,
  ]);
  const byDraw = (list: Record<string, unknown>[], day: string) => list.filter((x) => x.draw_on === day);
  return {
    nextDrawOn: next.draw_on as string,
    nextTickets: next.tickets as number,
    draws: draws.map((d) => ({
      drawOn: d.draw_on as string,
      sponsorName: d.sponsor_name as string | null,
      sponsorContact: d.sponsor_contact as string | null,
      status: d.status as 'planned' | 'done',
      seed: d.seed as string | null,
      ticketsCount: (d.tickets_count as number | null) ?? (d.tickets as number),
      due: d.due as boolean,
      prizes: byDraw(prizes, d.draw_on as string).map((p) => ({
        id: p.id as string,
        label: p.label as string,
        value: p.value as number,
        quantity: p.quantity as number,
      })),
      winners: byDraw(winners, d.draw_on as string).map((w) => ({
        id: w.id as string,
        userId: w.user_id as string,
        name: w.name as string,
        number: w.number as number,
        label: w.label as string,
        value: w.value as number,
        delivered: !!w.delivered_at,
      })),
    })),
  };
}
