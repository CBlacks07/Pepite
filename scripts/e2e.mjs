// Test de bout en bout de l'API, sur la vraie base Neon, avec 3 personnes fictives.
// Prérequis : le serveur tourne (npm run build puis npm run serve) avec OTP_DEV_MODE=1.
// Usage : npm run test:e2e   (les données de test sont supprimées à la fin)
import { neon } from '@neondatabase/serverless';

const BASE = process.env.E2E_BASE_URL ?? 'http://localhost:8081';
const TEST_PREFIX = '+99900';
const sql = neon(process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL);

let passed = 0;
function ok(cond, label, extra) {
  if (!cond) {
    console.error(`  ÉCHEC  ${label}`, extra ?? '');
    throw new Error(label);
  }
  passed++;
  console.log(`  ok     ${label}`);
}

async function call(path, { method, body, cookie, contentType } = {}) {
  const headers = {};
  if (cookie) headers.cookie = cookie;
  if (body !== undefined) headers['content-type'] = contentType ?? 'application/json';
  const res = await fetch(BASE + path, {
    method: method ?? (body !== undefined ? 'POST' : 'GET'),
    headers,
    body: body === undefined ? undefined : typeof body === 'string' ? body : JSON.stringify(body),
  });
  const data = await res.json().catch(() => null);
  return { status: res.status, data, setCookie: res.headers.getSetCookie?.() ?? [] };
}

async function cleanup() {
  const like = TEST_PREFIX + '%';
  await sql`delete from circles where created_by in (select id from users where phone like ${like})`;
  await sql`delete from users where phone like ${like}`;
  await sql`delete from otp_codes where phone like ${like}`;
}

async function signUp(phone, name) {
  const r1 = await call('/api/auth/request-otp', { body: { phone } });
  ok(r1.status === 200 && /^\d{6}$/.test(r1.data?.devCode ?? ''), `${name} : code reçu (mode test)`, r1);
  const wrong = await call('/api/auth/verify-otp', { body: { phone, code: r1.data.devCode === '000000' ? '111111' : '000000' } });
  ok(wrong.status === 400, `${name} : un mauvais code est refusé`, wrong);
  const r2 = await call('/api/auth/verify-otp', { body: { phone, code: r1.data.devCode } });
  const cookie = r2.setCookie.find((c) => c.startsWith('pepite_session='));
  ok(r2.status === 200 && cookie && /HttpOnly/i.test(cookie) && /SameSite=Lax/i.test(cookie), `${name} : session ouverte (cookie HttpOnly)`, r2);
  const session = cookie.split(';')[0];
  const r3 = await call('/api/me', { method: 'PATCH', body: { displayName: name }, cookie: session });
  ok(r3.status === 200 && r3.data.user.displayName === name, `${name} : prénom enregistré`);
  return { name, phone, cookie: session, id: r3.data.user.id };
}

const today = new Date().toISOString().slice(0, 10);
const plusDays = (n) => new Date(Date.now() + n * 864e5).toISOString().slice(0, 10);

try {
  await cleanup();

  console.log('\nSanté');
  const h = await call('/api/health');
  ok(h.status === 200 && h.data.ok && h.data.schema, `API et base Neon joignables (schéma ${h.data?.schema})`);

  console.log('\nSécurité');
  ok((await call('/api/home')).status === 401, 'sans connexion : /api/home renvoie 401');
  ok((await call('/api/auth/request-otp', { body: { phone: '123' } })).status === 400, 'numéro invalide refusé');

  console.log('\nInscription de 3 personnes');
  const afi = await signUp(`${TEST_PREFIX}0000001`, 'Afi');
  const komlan = await signUp(`${TEST_PREFIX}0000002`, 'Komlan');
  const abla = await signUp(`${TEST_PREFIX}0000003`, 'Abla');
  const users = { [afi.id]: afi, [komlan.id]: komlan, [abla.id]: abla };

  const csrf = await call('/api/circles', { body: 'name=x', contentType: 'text/plain', cookie: afi.cookie });
  ok(csrf.status === 415, 'envoi hors JSON refusé (protection CSRF)');

  console.log('\nCréation et invitations');
  const created = await call('/api/circles', {
    cookie: afi.cookie,
    body: { name: 'Test e2e', amount: 25000, frequency: 'monthly', size: 3, newMembersLast: false, depositRequired: false },
  });
  ok(created.status === 201 && /^[A-Z0-9]{6}$/.test(created.data.inviteCode), `Afi crée un cercle (code ${created.data?.inviteCode})`);
  const circleId = created.data.id;
  const code = created.data.inviteCode;

  ok((await call(`/api/circles/${circleId}`, { cookie: komlan.cookie })).status === 404, "Komlan ne voit pas le cercle avant d'y entrer");
  ok((await call('/api/circles/join', { cookie: komlan.cookie, body: { code: 'ZZZZZZ' } })).status === 404, 'code inconnu refusé');
  ok((await call('/api/circles/join', { cookie: komlan.cookie, body: { code: code.toLowerCase() } })).data?.id === circleId, 'Komlan rejoint (code en minuscules accepté)');
  ok((await call('/api/circles/join', { cookie: abla.cookie, body: { code } })).data?.id === circleId, 'Abla rejoint');

  let c = (await call(`/api/circles/${circleId}`, { cookie: afi.cookie })).data;
  ok(c.circle.status === 'forming' && c.members.length === 3, 'cercle complet, en formation');
  ok(c.members.every((m) => m.isNew), "tous comptés comme nouveaux, organisatrice comprise (tirage équitable)");

  console.log("\nTirage de l'ordre");
  ok((await call(`/api/circles/${circleId}/draw`, { cookie: abla.cookie, body: { startsOn: plusDays(7) } })).status === 403, "Abla (pas organisatrice) ne peut pas lancer le tirage");
  ok((await call(`/api/circles/${circleId}/draw`, { cookie: afi.cookie, body: { startsOn: '2000-01-01' } })).status === 400, 'date passée refusée');
  const drawn = await call(`/api/circles/${circleId}/draw`, { cookie: afi.cookie, body: { startsOn: plusDays(7) } });
  ok(drawn.status === 200 && /^[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(drawn.data.seed), `ordre tiré (code ${drawn.data?.seed})`);
  ok((await call(`/api/circles/${circleId}/draw`, { cookie: afi.cookie, body: { startsOn: plusDays(7) } })).status === 409, 'impossible de retirer une deuxième fois');

  c = (await call(`/api/circles/${circleId}`, { cookie: komlan.cookie })).data;
  ok(c.circle.status === 'active' && c.rounds.length === 3 && c.current?.number === 1, '3 tours créés, tour 1 en cours');
  // Vérifiable : on recalcule l'ordre avec md5(code || id).
  const { createHash } = await import('node:crypto');
  const expected = Object.keys(users).sort((a, b) =>
    createHash('md5').update(c.circle.drawSeed + a).digest('hex').localeCompare(createHash('md5').update(c.circle.drawSeed + b).digest('hex')),
  );
  ok(JSON.stringify(c.rounds.map((r) => r.beneficiaryId)) === JSON.stringify(expected), "l'ordre se recalcule avec le code de vérification");

  const ben = users[c.current.beneficiaryId];
  const [payer, late] = Object.values(users).filter((u) => u.id !== ben.id);
  const roundId = c.current.roundId;
  const st = Object.fromEntries(c.current.contributions.map((k) => [k.memberId, k.status]));
  ok(st[ben.id] === 'paid' && st[payer.id] === 'due' && st[late.id] === 'due', `${ben.name} reçoit au tour 1 ; sa part est comptée d'office`);

  console.log('\nVersements');
  ok((await call(`/api/rounds/${roundId}/contribution`, { cookie: ben.cookie, body: { method: 'cash' } })).status === 400, `${ben.name} n'a rien à se verser`);
  const decl = await call(`/api/rounds/${roundId}/contribution`, { cookie: payer.cookie, body: { method: 'mobile_money', reference: 'MIXX-TEST-4471' } });
  ok(decl.status === 200, `${payer.name} déclare son versement Mixx`);
  ok((await call(`/api/rounds/${roundId}/validate`, { cookie: late.cookie, body: { memberId: payer.id } })).status === 403, `${late.name} ne peut pas valider à la place du bénéficiaire`);
  const val = await call(`/api/rounds/${roundId}/validate`, { cookie: ben.cookie, body: { memberId: payer.id } });
  ok(val.status === 200 && Number.isInteger(val.data.ticket), `${ben.name} valide : ${payer.name} gagne le ticket N° ${val.data?.ticket}`);
  ok((await call(`/api/rounds/${roundId}/validate`, { cookie: ben.cookie, body: { memberId: payer.id } })).status === 409, 'double validation refusée');

  const t = (await call('/api/tickets', { cookie: payer.cookie })).data;
  ok(t.tickets.some((x) => x.number === val.data.ticket && x.source === 'on_time'), `le ticket apparaît dans le tirage du ${t.drawOn}`);
  const afiTickets = (await call('/api/tickets', { cookie: afi.cookie })).data.tickets.filter((x) => x.source === 'invite');
  ok(afiTickets.length === 2, 'Afi gagne 2 tickets « invitation » (Komlan et Abla rejoignent leur 1er cercle)');

  console.log('\nRappels');
  const msg = `Salut ${late.name}, petit rappel pour la cagnotte de ${ben.name}.`;
  ok((await call(`/api/rounds/${roundId}/remind`, { cookie: ben.cookie, body: { memberId: late.id, message: msg } })).status === 200, `${ben.name} envoie un rappel privé à ${late.name}`);
  ok((await call(`/api/rounds/${roundId}/remind`, { cookie: ben.cookie, body: { memberId: late.id, message: msg } })).status === 429, 'un seul rappel par 24 h');
  let home = (await call('/api/home', { cookie: late.cookie })).data;
  ok(home.reminders.length === 1 && home.reminders[0].message === msg, `${late.name} voit le rappel dans sa cloche`);
  await call('/api/reminders/read', { cookie: late.cookie, body: {} });
  home = (await call('/api/home', { cookie: late.cookie })).data;
  ok(home.reminders.length === 0, 'rappel marqué comme lu');

  const cash = await call(`/api/rounds/${roundId}/validate`, { cookie: ben.cookie, body: { memberId: late.id } });
  ok(cash.status === 200, `${ben.name} valide les espèces remises par ${late.name}`);
  c = (await call(`/api/circles/${circleId}`, { cookie: ben.cookie })).data;
  const round1 = c.current.contributions.filter((k) => k.status === 'paid').length;
  ok(round1 === 3, 'tour 1 complet : bocal plein (3 sur 3)');

  console.log('\nAccueil et profil');
  home = (await call('/api/home', { cookie: payer.cookie })).data;
  const expectSaved = new Date(plusDays(7)).getUTCFullYear() === new Date(today).getUTCFullYear() ? 25000 : 0;
  ok(home.saved === expectSaved && home.circles[0]?.id === circleId, `accueil de ${payer.name} : ${home.saved} F CFA mis de côté cette année`);
  ok(home.feed.length >= 4, `fil d'actualité : ${home.feed.length} nouvelles`);
  const prof = (await call('/api/profile', { cookie: payer.cookie })).data;
  ok(prof.score !== null && prof.score > 0 && prof.stats.onTime === 1, `score de fiabilité de ${payer.name} : ${prof.score}/100`);

  console.log('\nDéconnexion');
  const out = await call('/api/auth/logout', { cookie: payer.cookie, body: {} });
  ok(out.status === 200 && out.setCookie.some((x) => /Max-Age=0/.test(x)), 'cookie effacé');
  ok((await call('/api/me', { cookie: payer.cookie })).status === 401, 'ancienne session refusée');

  console.log(`\n${passed} vérifications réussies.`);
} catch (err) {
  console.error(`\nTest interrompu après ${passed} vérifications : ${err.message}`);
  process.exitCode = 1;
} finally {
  await cleanup();
  console.log('Données de test supprimées.');
}
