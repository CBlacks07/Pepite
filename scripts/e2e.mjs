// Test de bout en bout de l'API et de l'admin, sur la vraie base Neon.
// Prérequis : le serveur tourne (npm run build puis npm run start).
// Usage : npm run test:e2e   (les données de test, prénoms « E2E-… », sont supprimées à la fin)
import { createHash } from 'node:crypto';

import { neon } from '@neondatabase/serverless';

const BASE = process.env.E2E_BASE_URL ?? 'http://localhost:3000';
const PREFIX = 'E2E-';
const TEST_DRAW = '2000-01-02'; // un dimanche passé, réservé aux tests
const sql = neon(process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL);

let passed = 0;
function ok(cond, label, extra) {
  if (!cond) {
    console.error(`  ÉCHEC  ${label}`, extra === undefined ? '' : JSON.stringify(extra).slice(0, 400));
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
    redirect: 'manual',
  });
  const text = await res.text();
  let data = null;
  try {
    data = JSON.parse(text);
  } catch {}
  return { status: res.status, data, text, location: res.headers.get('location'), setCookie: res.headers.getSetCookie?.() ?? [] };
}

async function cleanup() {
  const like = PREFIX + '%';
  await sql`delete from draws where draw_on = ${TEST_DRAW}`;
  await sql`delete from circles where created_by in (select id from users where display_name like ${like})`;
  await sql`delete from users where display_name like ${like}`;
}

const sessionOf = (r) => r.setCookie.find((c) => c.startsWith('pepite_session='))?.split(';')[0];

async function signUp(name) {
  const r = await call('/api/auth/signup', { body: { displayName: `${PREFIX}${name}` } });
  const cookie = sessionOf(r);
  ok(r.status === 201 && cookie && /^[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(r.data?.recoveryCode ?? ''), `${name} s'inscrit avec son prénom (code de secours reçu)`, r.data);
  ok(r.setCookie.some((c) => /HttpOnly/i.test(c) && /SameSite=Lax/i.test(c)), `${name} : cookie de session HttpOnly`);
  return { name, cookie, id: r.data.user.id, code: r.data.recoveryCode };
}

const plusDays = (n) => new Date(Date.now() + n * 864e5).toISOString().slice(0, 10);

try {
  await cleanup();

  console.log('\nSanté et site public');
  const h = await call('/api/health');
  ok(h.status === 200 && h.data.ok, `API et base Neon joignables (schéma ${h.data?.schema})`);
  for (const p of ['/', '/connexion', '/reglement', '/conditions', '/confidentialite', '/manifest.webmanifest', '/sw.js']) {
    const r = await call(p);
    ok(r.status === 200, `page publique ${p} : 200`);
  }
  ok((await call('/app')).status === 307, "espace membre sans connexion : redirection vers /connexion");
  ok((await call('/api/home')).status === 401, 'API sans connexion : 401');

  console.log('\nInscription et code de secours');
  const afi = await signUp('Afi');
  const komlan = await signUp('Komlan');
  const abla = await signUp('Abla');
  const users = { [afi.id]: afi, [komlan.id]: komlan, [abla.id]: abla };
  ok((await call('/api/auth/signup', { body: { displayName: '   ' } })).status === 400, 'prénom vide refusé');

  const rec = await call('/api/auth/recover', { body: { code: abla.code.toLowerCase().replace('-', ' ') } });
  ok(rec.status === 200 && rec.data.user.id === abla.id && sessionOf(rec), 'reconnexion avec le code de secours (minuscules et espace acceptés)');
  ok((await call('/api/auth/recover', { body: { code: 'ZZZZ-ZZZZ' } })).status === 404, 'code de secours inconnu refusé');
  const regen = await call('/api/me/recovery', { cookie: abla.cookie, body: {} });
  ok(regen.status === 200 && regen.data.recoveryCode !== abla.code, 'nouveau code de secours généré');
  ok((await call('/api/auth/recover', { body: { code: abla.code } })).status === 404, "l'ancien code ne marche plus");
  abla.code = regen.data.recoveryCode;
  ok((await call('/api/circles', { body: 'name=x', contentType: 'text/plain', cookie: afi.cookie })).status === 415, 'envoi hors JSON refusé (protection CSRF)');

  console.log('\nCercle, invitations et tirage de l\'ordre');
  const created = await call('/api/circles', {
    cookie: afi.cookie,
    body: { name: 'Test e2e', amount: 25000, frequency: 'monthly', size: 3, newMembersLast: false, depositRequired: false },
  });
  ok(created.status === 201, `Afi crée un cercle (code ${created.data?.inviteCode})`);
  const circleId = created.data.id;
  const invite = await call(`/rejoindre?code=${created.data.inviteCode}`);
  ok(invite.status === 307 && invite.location?.includes('/connexion?next='), "lien d'invitation sans compte : vers l'inscription");
  ok((await call(`/api/circles/${circleId}`, { cookie: komlan.cookie })).status === 404, "Komlan ne voit pas le cercle avant d'y entrer");
  ok((await call('/api/circles/join', { cookie: komlan.cookie, body: { code: created.data.inviteCode.toLowerCase() } })).data?.id === circleId, 'Komlan rejoint');
  ok((await call('/api/circles/join', { cookie: abla.cookie, body: { code: created.data.inviteCode } })).data?.id === circleId, 'Abla rejoint');
  let c = (await call(`/api/circles/${circleId}`, { cookie: afi.cookie })).data;
  ok(c.members.length === 3 && c.members.every((m) => m.isNew), 'cercle complet, tous nouveaux (tirage équitable)');
  ok((await call(`/api/circles/${circleId}/draw`, { cookie: abla.cookie, body: { startsOn: plusDays(7) } })).status === 403, "seule l'organisatrice lance le tirage");
  const drawn = await call(`/api/circles/${circleId}/draw`, { cookie: afi.cookie, body: { startsOn: plusDays(7) } });
  ok(drawn.status === 200, `ordre tiré (code ${drawn.data?.seed})`);
  c = (await call(`/api/circles/${circleId}`, { cookie: komlan.cookie })).data;
  const expected = Object.keys(users).sort((a, b) =>
    createHash('md5').update(c.circle.drawSeed + a).digest('hex').localeCompare(createHash('md5').update(c.circle.drawSeed + b).digest('hex')),
  );
  ok(JSON.stringify(c.rounds.map((r) => r.beneficiaryId)) === JSON.stringify(expected), "l'ordre se recalcule avec le code de vérification");

  const ben = users[c.current.beneficiaryId];
  const [payer, other] = Object.values(users).filter((u) => u.id !== ben.id);
  const roundId = c.current.roundId;
  const contribOf = async (memberId) =>
    (await sql`select k.id, k.status from contributions k where k.round_id = ${roundId} and k.member_id = ${memberId}`)[0];

  console.log('\nVersements et rappels');
  ok((await call(`/api/rounds/${roundId}/contribution`, { cookie: payer.cookie, body: { method: 'mobile_money', reference: 'MIXX-TEST-1' } })).status === 200, `${payer.name} déclare un versement Mixx`);
  ok((await call(`/api/rounds/${roundId}/validate`, { cookie: other.cookie, body: { memberId: payer.id } })).status === 403, `${other.name} ne peut pas valider à la place de ${ben.name}`);
  const val = await call(`/api/rounds/${roundId}/validate`, { cookie: ben.cookie, body: { memberId: payer.id } });
  ok(val.status === 200 && Number.isInteger(val.data.ticket), `${ben.name} valide : ticket N° ${val.data?.ticket} pour ${payer.name}`);
  const msg = `Petit rappel pour la cagnotte de ${ben.name}.`;
  ok((await call(`/api/rounds/${roundId}/remind`, { cookie: ben.cookie, body: { memberId: other.id, message: msg } })).status === 200, `rappel privé à ${other.name}`);
  const home = (await call('/api/home', { cookie: other.cookie })).data;
  ok(home.reminders.length === 1, `${other.name} voit le rappel dans sa cloche`);

  console.log('\nAdministration');
  ok((await call('/admin', { cookie: afi.cookie })).status === 404, 'membre simple : /admin introuvable (404)');
  ok((await call('/api/admin/draws', { cookie: afi.cookie, body: { drawOn: TEST_DRAW } })).status === 403, 'membre simple : API admin refusée (403)');
  await sql`update users set is_admin = true where id = ${afi.id}`;
  const adminPage = await call('/admin', { cookie: afi.cookie });
  ok(adminPage.status === 200 && adminPage.text.includes('Statistiques'), 'admin : page des statistiques');
  for (const p of ['/admin/membres', `/admin/membres/${abla.id}`, '/admin/cercles', `/admin/cercles/${circleId}`, '/admin/litiges', '/admin/tirage']) {
    ok((await call(p, { cookie: afi.cookie })).status === 200, `admin : ${p}`);
  }

  // Litige 1 : reçu refusé puis versement validé par le support.
  ok((await call(`/api/rounds/${roundId}/contribution`, { cookie: other.cookie, body: { method: 'mobile_money', reference: 'FAUX-RECU' } })).status === 200, `${other.name} déclare un reçu`);
  const k = await contribOf(other.id);
  ok((await call(`/api/admin/contributions/${k.id}/resolve`, { cookie: afi.cookie, body: { decision: 'due', note: '' } })).status === 400, 'litige : une note est obligatoire');
  ok((await call(`/api/admin/contributions/${k.id}/resolve`, { cookie: afi.cookie, body: { decision: 'due', note: 'Référence introuvable chez Mixx' } })).status === 200, "litige : reçu refusé par l'admin");
  ok((await contribOf(other.id)).status === 'due', 'le versement repasse en attente');
  const forced = await call(`/api/admin/contributions/${k.id}/resolve`, { cookie: afi.cookie, body: { decision: 'paid', note: 'Espèces confirmées par les deux' } });
  ok(forced.status === 200 && (await contribOf(other.id)).status === 'paid', "litige : versement validé par l'admin");
  const feed = (await call('/api/home', { cookie: ben.cookie })).data.feed;
  ok(feed.some((e) => e.kind === 'contribution_validated' && e.actor === null), 'le fil affiche une validation par le support');

  // Suspension.
  ok((await call(`/api/admin/users/${abla.id}/block`, { cookie: afi.cookie, body: { blocked: true, reason: 'Test de suspension' } })).status === 200, 'Abla suspendue');
  ok((await call('/api/me', { cookie: abla.cookie })).status === 401, 'sa session est fermée');
  ok((await call('/api/auth/recover', { body: { code: abla.code } })).status === 403, 'reconnexion refusée tant que le compte est suspendu');
  ok((await call(`/api/admin/users/${abla.id}/block`, { cookie: afi.cookie, body: { blocked: false } })).status === 200, 'Abla rétablie');
  ok((await call('/api/auth/recover', { body: { code: abla.code } })).status === 200, 'Abla peut se reconnecter');

  // Participation gratuite.
  const free = await call(`/api/admin/users/${komlan.id}/ticket`, { cookie: afi.cookie, body: { note: 'Demande par message' } });
  ok(free.status === 200 && Number.isInteger(free.data.number), `ticket gratuit N° ${free.data?.number} pour Komlan`);
  const kt = (await call('/api/tickets', { cookie: komlan.cookie })).data;
  ok(kt.tickets.some((t) => t.source === 'free_entry'), 'il apparaît dans ses tickets');

  // Tirage du dimanche, sur une date de test passée.
  ok((await call('/api/admin/draws', { cookie: afi.cookie, body: { drawOn: '2000-01-03' } })).status === 400, 'un tirage hors dimanche est refusé');
  ok((await call('/api/admin/draws', { cookie: afi.cookie, body: { drawOn: TEST_DRAW, sponsorName: 'Partenaire test' } })).status === 200, 'tirage préparé avec un partenaire');
  ok((await call(`/api/admin/draws/${TEST_DRAW}/run`, { cookie: afi.cookie, body: {} })).status === 409, 'impossible de lancer un tirage sans lot');
  ok((await call(`/api/admin/draws/${TEST_DRAW}/prizes`, { cookie: afi.cookie, body: { label: 'Crédit téléphone', value: 2000, quantity: 2 } })).status === 201, 'lot ajouté : 2 x 2 000 F CFA');
  for (const [i, u] of Object.values(users).entries()) {
    await sql`insert into draw_tickets (user_id, draw_on, number, source) values (${u.id}, ${TEST_DRAW}, ${10001 + i}, 'on_time')`;
  }
  const run = await call(`/api/admin/draws/${TEST_DRAW}/run`, { cookie: afi.cookie, body: { note: 'Test automatique' } });
  ok(run.status === 200 && run.data.winners === 2, `tirage effectué : 2 gagnants sur 3 tickets (code ${run.data?.seed})`);
  const winners = await sql`select w.id, t.number from draw_winners w join draw_tickets t on t.id = w.ticket_id where w.draw_on = ${TEST_DRAW}`;
  const order = [10001, 10002, 10003].sort((a, b) =>
    createHash('md5').update(run.data.seed + a).digest('hex').localeCompare(createHash('md5').update(run.data.seed + b).digest('hex')),
  );
  ok(winners.map((w) => w.number).sort().join() === order.slice(0, 2).sort().join(), 'les gagnants se recalculent avec le code du tirage');
  ok((await call(`/api/admin/draws/${TEST_DRAW}/run`, { cookie: afi.cookie, body: {} })).status === 409, 'impossible de relancer le même tirage');
  ok((await call(`/api/admin/winners/${winners[0].id}/delivered`, { cookie: afi.cookie, body: {} })).status === 200, 'lot marqué comme remis');
  const actions = await sql`select count(*)::int as n from admin_actions where admin_id = ${afi.id}`;
  ok(actions[0].n >= 8, `${actions[0].n} actions inscrites au journal`);

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
