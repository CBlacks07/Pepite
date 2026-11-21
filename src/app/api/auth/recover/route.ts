import { createSession, normalizeRecoveryCode, recoveryHash } from '@/server/auth';
import { db } from '@/server/db';
import { HttpError, json, readJson, route } from '@/server/http';

// Se reconnecter sur un autre appareil avec son code de secours.
export const POST = route(async (request) => {
  const body = await readJson(request);
  const code = normalizeRecoveryCode(body.code);
  if (!code) throw new HttpError(400, 'invalid_code', 'Le code de secours a 8 caractères, par exemple ABCD-EFGH.');

  const [user] = await db()`
    select id, display_name, is_admin, blocked_at from users where recovery_hash = ${await recoveryHash(code)}
  `;
  if (!user) throw new HttpError(404, 'unknown_code', 'Aucun compte avec ce code. Vérifie les lettres et les chiffres.');
  if (user.blocked_at) throw new HttpError(403, 'blocked', 'Ce compte est suspendu. Contacte le support Pépite.');

  const cookie = await createSession(user.id, request);
  return json(
    { user: { id: user.id, displayName: user.display_name, isAdmin: user.is_admin } },
    200,
    { 'Set-Cookie': cookie },
  );
});
