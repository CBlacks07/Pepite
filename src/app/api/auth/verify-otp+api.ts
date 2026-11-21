import { createSession, normalizePhone, sha256 } from '@/server/auth';
import { db } from '@/server/db';
import { HttpError, json, readJson, route } from '@/server/http';

const MAX_ATTEMPTS = 5;

export const POST = route(async (request) => {
  const body = await readJson(request);
  const phone = normalizePhone(body.phone);
  const code = typeof body.code === 'string' ? body.code.replace(/\s/g, '') : '';
  if (!phone || !/^\d{6}$/.test(code)) {
    throw new HttpError(400, 'invalid', 'Entre le code à 6 chiffres reçu par SMS.');
  }

  const [otp] = await db()`
    select id, code_hash, attempts from otp_codes
    where phone = ${phone} and consumed_at is null and expires_at > now()
    order by created_at desc limit 1
  `;
  if (!otp) throw new HttpError(400, 'code_expired', 'Code expiré. Demande un nouveau code.');
  if (otp.attempts >= MAX_ATTEMPTS) {
    throw new HttpError(429, 'too_many_attempts', 'Trop d’essais. Demande un nouveau code.');
  }

  if ((await sha256(`${otp.id}:${code}`)) !== otp.code_hash) {
    await db()`update otp_codes set attempts = attempts + 1 where id = ${otp.id}`;
    throw new HttpError(400, 'wrong_code', 'Code incorrect.');
  }

  // Marque le code comme utilisé ; la condition évite qu'il serve deux fois en parallèle.
  const consumed = await db()`
    update otp_codes set consumed_at = now() where id = ${otp.id} and consumed_at is null returning id
  `;
  if (consumed.length === 0) throw new HttpError(400, 'code_expired', 'Code déjà utilisé. Demande un nouveau code.');

  const [user] = await db()`
    insert into users (phone) values (${phone})
    on conflict (phone) do update set phone = excluded.phone
    returning id, phone, display_name
  `;
  const cookie = await createSession(user.id, request);
  return json(
    { user: { id: user.id, phone: user.phone, displayName: user.display_name } },
    200,
    { 'Set-Cookie': cookie },
  );
});
