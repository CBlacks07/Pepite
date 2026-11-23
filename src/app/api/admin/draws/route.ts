import { logAdmin, isSunday } from '@/server/adminLog';
import { requireAdmin } from '@/server/auth';
import { db } from '@/server/db';
import { HttpError, json, readJson, route, v } from '@/server/http';
import { DRAW } from '@/lib/rules';

// Préparer un tirage du dimanche : partenaire et contact.
export const POST = route(async (request) => {
  const admin = await requireAdmin(request);
  const body = await readJson(request);
  const drawOn = v.date(body.drawOn, 'Date du tirage');
  if (!isSunday(drawOn)) throw new HttpError(400, 'not_sunday', 'Le tirage a lieu un dimanche.');
  const sponsor = v.optionalText(body.sponsorName, 'Partenaire', DRAW.sponsorNameMax);
  const contact = v.optionalText(body.sponsorContact, 'Contact du partenaire', DRAW.sponsorContactMax);

  const rows = await db()`
    insert into draws (draw_on, sponsor_name, sponsor_contact)
    values (${drawOn}, ${sponsor}, ${contact})
    on conflict (draw_on) do update
      set sponsor_name = excluded.sponsor_name, sponsor_contact = excluded.sponsor_contact
      where draws.status = 'planned'
    returning draw_on
  `;
  if (!rows.length) throw new HttpError(409, 'draw_done', 'Ce tirage a déjà eu lieu.');
  await logAdmin(admin.id, 'plan_draw', 'draw', drawOn, sponsor);
  return json({ ok: true });
});
