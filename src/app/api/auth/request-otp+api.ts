import { normalizePhone, randomString, sha256 } from '@/server/auth';
import { db } from '@/server/db';
import { HttpError, json, readJson, route } from '@/server/http';

const MAX_PER_HOUR = 5;

export const POST = route(async (request) => {
  const body = await readJson(request);
  const phone = normalizePhone(body.phone);
  if (!phone) {
    throw new HttpError(400, 'invalid_phone', 'Numéro invalide. Exemple : 90 12 34 56, ou +33 6 12 34 56 78 hors du Togo.');
  }

  const [{ recent }] = await db()`
    select count(*)::int as recent from otp_codes
    where phone = ${phone} and created_at > now() - interval '1 hour'
  `;
  if (recent >= MAX_PER_HOUR) {
    throw new HttpError(429, 'too_many_codes', "Trop de codes demandés. Réessaie dans une heure.");
  }

  const devMode = process.env.OTP_DEV_MODE === '1';
  if (!devMode) {
    // Aucun fournisseur SMS n'est encore branché : on refuse plutôt que d'envoyer un code invisible.
    throw new HttpError(503, 'sms_unavailable', "L'envoi des SMS n'est pas encore branché.");
  }

  const id = crypto.randomUUID();
  const code = randomString(6, '0123456789');
  await db()`
    insert into otp_codes (id, phone, code_hash, expires_at)
    values (${id}, ${phone}, ${await sha256(`${id}:${code}`)}, now() + interval '10 minutes')
  `;

  return json({ phone, sent: true, devCode: code });
});
