import { CODE_ALPHABET, randomString, requireMember } from '@/server/auth';
import { db } from '@/server/db';
import { json, readJson, route, v } from '@/server/http';
import { CIRCLE } from '@/lib/rules';

// Créer un cercle. L'organisateur en devient le premier membre.
export const POST = route(async (request) => {
  const user = await requireMember(request);
  const body = await readJson(request);
  const name = v.text(body.name, 'Nom du cercle', { max: CIRCLE.nameMax });
  const amount = v.int(body.amount, 'Montant', CIRCLE.amountMin, CIRCLE.amountMax);
  const frequency = v.oneOf(body.frequency, 'Rythme', ['weekly', 'monthly'] as const);
  const size = v.int(body.size, 'Nombre de membres', CIRCLE.sizeMin, CIRCLE.sizeMax);
  const newLast = v.bool(body.newMembersLast, 'Nouveaux en dernier');
  const deposit = v.bool(body.depositRequired, 'Caution');

  // Le code est tiré côté serveur ; en cas de collision (rarissime), on retire.
  for (let attempt = 0; attempt < 4; attempt++) {
    const code = randomString(6, CODE_ALPHABET);
    try {
      const [row] = await db()`
        select create_circle(${user.id}, ${name}, ${amount}, ${frequency}, ${size}, ${newLast}, ${deposit}, ${code}) as id
      `;
      return json({ id: row.id, inviteCode: code }, 201);
    } catch (err) {
      if ((err as { code?: string }).code !== '23505') throw err;
    }
  }
  throw new Error("Impossible de générer un code d'invitation.");
});
