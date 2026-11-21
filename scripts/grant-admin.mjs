// Donne (ou retire) les droits d'administration à un compte.
// Usage : npm run admin:grant -- "Prénom"            -> liste les comptes de ce prénom
//         npm run admin:grant -- <identifiant>        -> donne les droits
//         npm run admin:grant -- <identifiant> --retirer
import { neon } from '@neondatabase/serverless';

const url = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
if (!url) {
  console.error('DATABASE_URL manquant (lance avec --env-file=.env.local).');
  process.exit(1);
}
const [target, flag] = process.argv.slice(2);
if (!target) {
  console.error('Indique un prénom ou un identifiant : npm run admin:grant -- "Akossiwa"');
  process.exit(1);
}
const sql = neon(url);
const isId = /^[0-9a-f-]{36}$/i.test(target);

if (!isId) {
  const rows = await sql`
    select id, display_name, is_admin, created_at from users
    where display_name ilike ${target} order by created_at desc limit 20
  `;
  if (!rows.length) {
    console.log(`Aucun compte avec le prénom « ${target} ».`);
  } else {
    console.log(`Comptes « ${target} » (relance avec l'identifiant voulu) :`);
    for (const r of rows) {
      console.log(`  ${r.id}  inscrit le ${r.created_at.toISOString().slice(0, 10)}${r.is_admin ? '  [déjà admin]' : ''}`);
    }
  }
  process.exit(0);
}

const grant = flag !== '--retirer';
const rows = await sql`update users set is_admin = ${grant} where id = ${target} returning display_name`;
if (!rows.length) {
  console.error('Aucun compte avec cet identifiant.');
  process.exit(1);
}
console.log(grant ? `${rows[0].display_name} est maintenant administrateur.` : `${rows[0].display_name} n'est plus administrateur.`);
