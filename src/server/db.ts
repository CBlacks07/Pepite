// Accès à Neon. Code serveur uniquement : `server-only` fait échouer le build
// si un composant client l'importe par erreur.
import 'server-only';

import { neon, type NeonQueryFunction } from '@neondatabase/serverless';

let client: NeonQueryFunction<false, false> | undefined;

export function db(): NeonQueryFunction<false, false> {
  if (!client) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error('DATABASE_URL manquant côté serveur.');
    client = neon(url);
  }
  return client;
}
