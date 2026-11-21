import { logAdmin } from '@/server/adminLog';
import { requireAdmin } from '@/server/auth';
import { db } from '@/server/db';
import { HttpError, json, route, v } from '@/server/http';

// Marquer un lot comme remis au gagnant.
export const POST = route(async (request, params) => {
  const admin = await requireAdmin(request);
  const id = v.uuid(params.id, 'Gagnant');
  const rows = await db()`
    update draw_winners set delivered_at = now(), delivered_by = ${admin.id}
    where id = ${id} and delivered_at is null
    returning draw_on::text as draw_on
  `;
  if (!rows.length) throw new HttpError(409, 'already_delivered', 'Lot introuvable ou déjà remis.');
  await logAdmin(admin.id, 'deliver_prize', 'winner', id, rows[0].draw_on);
  return json({ ok: true });
});
