import { logAdmin } from '@/server/adminLog';
import { requireAdmin } from '@/server/auth';
import { db } from '@/server/db';
import { HttpError, json, route, v } from '@/server/http';

// Retirer un lot (seulement avant le tirage).
export const DELETE = route(async (request, params) => {
  const admin = await requireAdmin(request);
  const id = v.uuid(params.id, 'Lot');
  const rows = await db()`
    delete from draw_prizes p using draws d
    where p.id = ${id} and d.draw_on = p.draw_on and d.status = 'planned'
    returning p.draw_on::text as draw_on, p.label
  `;
  if (!rows.length) throw new HttpError(409, 'draw_done', 'Lot introuvable ou tirage déjà effectué.');
  await logAdmin(admin.id, 'delete_prize', 'draw', rows[0].draw_on, rows[0].label);
  return json({ ok: true });
});
