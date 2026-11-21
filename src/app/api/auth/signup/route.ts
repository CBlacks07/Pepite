import { createSession, newRecoveryCode, recoveryHash } from '@/server/auth';
import { db } from '@/server/db';
import { json, readJson, route, v } from '@/server/http';

// Inscription avec un prénom seul (en attendant un service SMS).
// Le code de secours n'est montré qu'une fois : la base n'en garde que l'empreinte.
export const POST = route(async (request) => {
  const body = await readJson(request);
  const name = v.text(body.displayName, 'Prénom', { max: 40 });

  for (let attempt = 0; attempt < 4; attempt++) {
    const code = newRecoveryCode();
    try {
      const [user] = await db()`
        insert into users (display_name, recovery_hash)
        values (${name}, ${await recoveryHash(code)})
        returning id, display_name, is_admin
      `;
      const cookie = await createSession(user.id, request);
      return json(
        { user: { id: user.id, displayName: user.display_name, isAdmin: user.is_admin }, recoveryCode: code },
        201,
        { 'Set-Cookie': cookie },
      );
    } catch (err) {
      if ((err as { code?: string }).code !== '23505') throw err;
    }
  }
  throw new Error('Impossible de créer le compte.');
});
