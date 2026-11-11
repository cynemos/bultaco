// Sauvegarde complète du site : contenu de la base (JSON) + fichiers du stockage photos.
//
// Utilisé par la tâche GitHub Actions « Sauvegarde » (.github/workflows/backup.yml),
// mais peut aussi être lancé à la main :
//   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/backup.mjs [dossier]
//
// La clé « service_role » est nécessaire pour lire les données réservées à l'admin
// (factures, paramètres privés). Elle ne doit JAMAIS être mise dans le site ni dans le dépôt :
// uniquement dans les « secrets » GitHub.

import { createClient } from '@supabase/supabase-js';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error('SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont nécessaires.');
  process.exit(1);
}

const supabase = createClient(url, key, { auth: { persistSession: false } });
const outDir = process.argv[2] || 'backup';
const TABLES = ['photos', 'timeline_events', 'technical_specs', 'parts_costs', 'invoices', 'settings', 'admins'];
const BUCKET = 'restoration-photos';

const save = async (path, content) => {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, content);
};

// 1. Tables
const summary = { date: new Date().toISOString(), tables: {}, files: 0, bytes: 0, errors: [] };
for (const table of TABLES) {
  const rows = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase.from(table).select('*').range(from, from + 999);
    if (error) {
      summary.errors.push(`${table} : ${error.message}`);
      break;
    }
    rows.push(...data);
    if (data.length < 1000) break;
  }
  summary.tables[table] = rows.length;
  await save(join(outDir, 'data', `${table}.json`), JSON.stringify(rows, null, 2));
  console.log(`✔ ${table} : ${rows.length} lignes`);
}

// 2. Fichiers du stockage (parcours récursif des dossiers)
const listAll = async prefix => {
  const files = [];
  for (let offset = 0; ; offset += 100) {
    const { data, error } = await supabase.storage.from(BUCKET).list(prefix, { limit: 100, offset });
    if (error) throw error;
    for (const item of data) {
      const path = prefix ? `${prefix}/${item.name}` : item.name;
      if (item.id === null) files.push(...(await listAll(path)));
      else files.push(path);
    }
    if (data.length < 100) break;
  }
  return files;
};

const files = await listAll('');
for (const path of files) {
  const { data, error } = await supabase.storage.from(BUCKET).download(path);
  if (error) {
    summary.errors.push(`${path} : ${error.message}`);
    continue;
  }
  const buffer = Buffer.from(await data.arrayBuffer());
  await save(join(outDir, 'files', path), buffer);
  summary.files += 1;
  summary.bytes += buffer.length;
}
console.log(`✔ stockage : ${summary.files} fichiers, ${(summary.bytes / 1024 / 1024).toFixed(1)} Mo`);

await save(join(outDir, 'resume.json'), JSON.stringify(summary, null, 2));

if (summary.errors.length) {
  console.error('⚠ Erreurs :\n' + summary.errors.join('\n'));
  process.exit(1);
}
console.log('Sauvegarde terminée.');
