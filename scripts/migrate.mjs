// Applique les migrations SQL de db/migrations dans l'ordre, une seule fois chacune.
// Usage : npm run db:migrate   (utilise DATABASE_URL_UNPOOLED, la connexion directe)
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { Client } from '@neondatabase/serverless';

const url = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
if (!url) {
  console.error('DATABASE_URL_UNPOOLED manquant (lance avec --env-file=.env.local).');
  process.exit(1);
}

const dir = join(import.meta.dirname, '..', 'db', 'migrations');
const files = (await readdir(dir)).filter((f) => f.endsWith('.sql')).sort();

const client = new Client(url);
await client.connect();
try {
  await client.query(
    'create table if not exists schema_migrations (version text primary key, applied_at timestamptz not null default now())',
  );
  const { rows } = await client.query('select version from schema_migrations');
  const done = new Set(rows.map((r) => r.version));

  let applied = 0;
  for (const file of files) {
    if (done.has(file)) continue;
    const text = await readFile(join(dir, file), 'utf8');
    process.stdout.write(`-> ${file} ... `);
    await client.query('begin');
    try {
      await client.query(text);
      await client.query('insert into schema_migrations (version) values ($1)', [file]);
      await client.query('commit');
      console.log('ok');
      applied++;
    } catch (err) {
      await client.query('rollback');
      console.log('ÉCHEC');
      throw err;
    }
  }
  console.log(applied ? `${applied} migration(s) appliquée(s).` : 'Base déjà à jour.');
} finally {
  await client.end();
}
