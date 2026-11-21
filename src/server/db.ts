// Accès à Neon. Ce fichier ne doit être importé QUE par des routes +api.ts :
// tout fichier de src/app importé par un écran finit dans le bundle du navigateur.
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
