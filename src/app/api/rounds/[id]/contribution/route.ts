import { requireMember } from '@/server/auth';
import { db } from '@/server/db';
import { json, readJson, route, v } from '@/server/http';
import { TEXT } from '@/lib/rules';

// Le membre déclare avoir payé sa part ; le bénéficiaire devra valider.
export const POST = route(async (request, params) => {
  const user = await requireMember(request);
  const roundId = v.uuid(params.id, 'Tour');
  const body = await readJson(request);
  const method = v.oneOf(body.method, 'Moyen de paiement', ['mobile_money', 'bank_transfer', 'cash'] as const);
  const reference = v.optionalText(body.reference, 'Référence', TEXT.paymentReferenceMax);
  await db()`select declare_contribution(${user.id}, ${roundId}, ${method}, ${reference})`;
  return json({ ok: true });
});
