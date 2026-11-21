import { newRecoveryCode, recoveryHash, requireMember } from '@/server/auth';
import { db } from '@/server/db';
import { json, route } from '@/server/http';

// Nouveau code de secours (l'ancien cesse de fonctionner).
export const POST = route(async (request) => {
  const user = await requireMember(request);
  const code = newRecoveryCode();
  await db()`update users set recovery_hash = ${await recoveryHash(code)} where id = ${user.id}`;
  return json({ recoveryCode: code });
});
