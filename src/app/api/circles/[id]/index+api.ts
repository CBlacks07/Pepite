import { requireMember } from '@/server/auth';
import { db } from '@/server/db';
import { HttpError, json, route, v } from '@/server/http';

// Détail d'un cercle, visible seulement par ses membres.
export const GET = route(async (request, params) => {
  const user = await requireMember(request);
  const id = v.uuid(params.id, 'Cercle');
  const sql = db();

  // Tout part en parallèle (une seule attente réseau vers Neon) ; rien n'est renvoyé
  // si la personne n'est pas membre du cercle.
  const [[circle], members, rounds, current, late, contribs, reminded] = await Promise.all([
    sql`
      select c.id, c.name, c.amount, c.currency, c.frequency, c.size, c.status,
             c.new_members_last, c.deposit_required, c.invite_code, c.draw_seed, c.drawn_at,
             c.starts_on::text as starts_on, c.created_by, c.created_at
      from circles c
      join circle_members m on m.circle_id = c.id and m.user_id = ${user.id}
      where c.id = ${id}
    `,
    sql`
      select u.id, u.display_name as name, m.role, m.position, m.is_new
      from circle_members m join users u on u.id = m.user_id
      where m.circle_id = ${id}
      order by m.position nulls last, m.joined_at
    `,
    sql`
      select id, number, beneficiary_id, due_on::text as due_on
      from rounds where circle_id = ${id} order by number
    `,
    // Tour en cours : le premier dont la date limite n'est pas passée, sinon le dernier.
    sql`
      select r.id, r.number, r.beneficiary_id, r.due_on::text as due_on
      from rounds r where r.circle_id = ${id}
      order by (r.due_on < lome_today()), case when r.due_on >= lome_today() then r.number else -r.number end
      limit 1
    `,
    // Versements des tours passés toujours pas validés.
    sql`
      select k.member_id, k.status, r.id as round_id, r.number, r.beneficiary_id, r.due_on::text as due_on
      from contributions k join rounds r on r.id = k.round_id
      where r.circle_id = ${id} and r.due_on < lome_today() and k.status <> 'paid'
      order by r.number, k.member_id
    `,
    sql`
      select k.member_id, k.status, k.method, k.reference, k.sent_at
      from contributions k
      where k.round_id = (
        select r.id from rounds r where r.circle_id = ${id}
        order by (r.due_on < lome_today()), case when r.due_on >= lome_today() then r.number else -r.number end
        limit 1
      )
    `,
    sql`
      select distinct m.to_user from reminders m
      where m.from_user = ${user.id} and m.created_at > now() - interval '24 hours'
        and m.round_id = (
          select r.id from rounds r where r.circle_id = ${id}
          order by (r.due_on < lome_today()), case when r.due_on >= lome_today() then r.number else -r.number end
          limit 1
        )
    `,
  ]);
  if (!circle) throw new HttpError(404, 'not_found', 'Cercle introuvable.');

  const cur = current[0];

  return json({
    me: user.id,
    circle: {
      id: circle.id,
      name: circle.name,
      amount: circle.amount,
      currency: circle.currency,
      frequency: circle.frequency,
      size: circle.size,
      status: circle.status,
      newMembersLast: circle.new_members_last,
      depositRequired: circle.deposit_required,
      inviteCode: circle.invite_code,
      drawSeed: circle.draw_seed,
      drawnAt: circle.drawn_at,
      startsOn: circle.starts_on,
      createdBy: circle.created_by,
      isOrganizer: circle.created_by === user.id,
    },
    members: members.map((m) => ({ id: m.id, name: m.name, role: m.role, position: m.position, isNew: m.is_new })),
    rounds: rounds.map((r) => ({ id: r.id, number: r.number, beneficiaryId: r.beneficiary_id, dueOn: r.due_on })),
    current: cur
      ? {
          roundId: cur.id,
          number: cur.number,
          beneficiaryId: cur.beneficiary_id,
          dueOn: cur.due_on,
          contributions: contribs.map((k) => ({
            memberId: k.member_id,
            status: k.status,
            method: k.method,
            reference: k.reference,
            sentAt: k.sent_at,
          })),
          remindedIds: reminded.map((r) => r.to_user),
        }
      : null,
    late: late.map((k) => ({
      roundId: k.round_id,
      number: k.number,
      memberId: k.member_id,
      beneficiaryId: k.beneficiary_id,
      dueOn: k.due_on,
      status: k.status,
    })),
  });
});
