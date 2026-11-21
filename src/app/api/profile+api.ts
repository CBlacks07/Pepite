import { requireMember } from '@/server/auth';
import { db } from '@/server/db';
import { json, route } from '@/server/http';

type Month = 'ontime' | 'late' | 'none' | 'current' | 'future';

// Score de fiabilité : ponctualité 70 %, ancienneté 20 %, cercles terminés 10 %.
export const GET = route(async (request) => {
  const user = await requireMember(request);
  const sql = db();
  const me = user.id;

  const [[base], history, [counts]] = await Promise.all([
    sql`
      select u.created_at,
             (select min(joined_at) from circle_members where user_id = ${me}) as first_join,
             lome_today()::text as today
      from users u where u.id = ${me}
    `,
    // Versements comptés : ceux validés, et ceux dont la date est passée sans validation.
    // La part du bénéficiaire, comptée d'office, est exclue.
    sql`
      select r.due_on::text as due_on,
             (k.status = 'paid' and (k.sent_at at time zone 'Africa/Lome')::date <= r.due_on) as on_time
      from contributions k join rounds r on r.id = k.round_id
      where k.member_id = ${me} and r.beneficiary_id <> ${me}
        and (k.status = 'paid' or r.due_on < lome_today())
      order by r.due_on
    `,
    sql`
      select
        (select count(*)::int from circle_members m join circles c on c.id = m.circle_id
          where m.user_id = ${me} and c.status = 'completed') as completed,
        (select count(*)::int from circle_members m join circles c on c.id = m.circle_id
          where c.created_by = ${me} and m.user_id <> ${me}) as invited
    `,
  ]);

  const total = history.length;
  const onTime = history.filter((h) => h.on_time).length;
  const since = new Date(base.first_join ?? base.created_at);
  const today = base.today as string;
  const [ty, tm] = today.split('-').map(Number);
  const monthsActive = Math.max(0, (ty - since.getUTCFullYear()) * 12 + (tm - 1 - since.getUTCMonth()));

  const parts = {
    punctuality: total ? onTime / total : 0,
    seniority: Math.min(monthsActive, 24) / 24,
    completed: Math.min(counts.completed, 5) / 5,
  };
  const score = total
    ? Math.round(100 * (0.7 * parts.punctuality + 0.2 * parts.seniority + 0.1 * parts.completed))
    : null;

  // Grille mois par mois.
  const byMonth = new Map<string, Month>();
  for (const h of history) {
    const key = (h.due_on as string).slice(0, 7);
    const prev = byMonth.get(key);
    if (!h.on_time) byMonth.set(key, 'late');
    else if (prev !== 'late') byMonth.set(key, 'ontime');
  }
  const firstYear = Math.max(since.getUTCFullYear(), ty - 2);
  const years: { year: number; months: Month[] }[] = [];
  for (let y = firstYear; y <= ty; y++) {
    const months: Month[] = [];
    for (let m = 1; m <= 12; m++) {
      const key = `${y}-${String(m).padStart(2, '0')}`;
      const isPast = y < ty || (y === ty && m < tm);
      const isCurrent = y === ty && m === tm;
      months.push(byMonth.get(key) ?? (isCurrent ? 'current' : isPast ? 'none' : 'future'));
    }
    years.push({ year: y, months });
  }

  // Mois d'affilée sans retard, en remontant depuis le plus récent.
  let streak = 0;
  const keys = [...byMonth.keys()].sort().reverse();
  for (const k of keys) {
    if (byMonth.get(k) === 'late') break;
    streak++;
  }

  return json({
    user: { id: me, displayName: user.displayName, phone: user.phone },
    memberSince: since.toISOString(),
    score,
    parts,
    stats: { streak, completed: counts.completed, invited: counts.invited, payments: total, onTime },
    history: years,
  });
});
