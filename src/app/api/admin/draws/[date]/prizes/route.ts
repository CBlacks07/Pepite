import { isSunday, logAdmin } from '@/server/adminLog';
import { requireAdmin } from '@/server/auth';
import { db } from '@/server/db';
import { HttpError, json, readJson, route, v } from '@/server/http';
import { DRAW } from '@/lib/rules';

// Ajouter un lot à un tirage pas encore effectué.
export const POST = route(async (request, params) => {
  const admin = await requireAdmin(request);
  const drawOn = v.date(params.date, 'Date du tirage');
  if (!isSunday(drawOn)) throw new HttpError(400, 'not_sunday', 'Le tirage a lieu un dimanche.');
  const body = await readJson(request);
  const label = v.text(body.label, 'Lot', { max: DRAW.prizeLabelMax });
  const value = v.int(body.value, 'Valeur (F CFA)', 1, DRAW.prizeValueMax);
  const quantity = v.int(body.quantity, 'Quantité', 1, DRAW.prizeQuantityMax);

  const sql = db();
  await sql`insert into draws (draw_on) values (${drawOn}) on conflict (draw_on) do nothing`;
  const [d] = await sql`select status from draws where draw_on = ${drawOn}`;
  if (d.status !== 'planned') throw new HttpError(409, 'draw_done', 'Ce tirage a déjà eu lieu.');
  const [p] = await sql`
    insert into draw_prizes (draw_on, label, value, quantity)
    values (${drawOn}, ${label}, ${value}, ${quantity}) returning id
  `;
  await logAdmin(admin.id, 'add_prize', 'draw', drawOn, `${quantity} x ${label} (${value} F CFA)`);
  return json({ ok: true, id: p.id }, 201);
});
