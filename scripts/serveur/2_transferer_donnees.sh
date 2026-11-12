#!/bin/bash
# Étape 2 — Copie le contenu du Supabase cloud de Bultaco vers l'instance du serveur :
# comptes (avec leurs mots de passe), tables, règles d'accès, fichiers (photos, documents),
# puis réécrit les adresses des photos vers le serveur. Sans sudo. Le cloud n'est pas modifié.
#
# Avant de lancer, créer le fichier privé ~/.config/bultaco-migration (chmod 600) avec deux lignes :
#   CLOUD_DB_URL='postgresql://postgres.khbfoeyprxslquxobwzh:MOT_DE_PASSE@aws-…pooler.supabase.com:5432/postgres'
#   CLOUD_SERVICE_KEY='clé service_role (ou sb_secret_…) du projet cloud'
# - CLOUD_DB_URL : tableau de bord Supabase → bouton « Connect » → « Session pooler »
#   (la connexion « Direct » ne marche pas depuis le serveur : elle demande IPv6).
# - CLOUD_SERVICE_KEY : Project Settings → API Keys.
#
# À relancer le jour de la bascule pour reprendre les dernières modifications : vider d'abord
# l'instance avec   cd ~/supabase-bultaco && supabase stop --no-backup && supabase start
set -euo pipefail

ANCIENNE_ADRESSE=${ANCIENNE_ADRESSE:-https://khbfoeyprxslquxobwzh.supabase.co}
NOUVELLE_ADRESSE=${NOUVELLE_ADRESSE:-https://api-bultaco.cyneprod.org}
INSTANCE=/home/cynemos/supabase-bultaco
DB=supabase_db_bultaco
API=http://127.0.0.1:54325
TRAVAIL=/home/cynemos/bultaco-migration/transfert_$(date +%F_%H%M)

[ -r "$HOME/.config/bultaco-migration" ] || { echo "Fichier ~/.config/bultaco-migration absent (voir l'en-tête de ce script)."; exit 1; }
. "$HOME/.config/bultaco-migration"
: "${CLOUD_DB_URL:?CLOUD_DB_URL manquant}" "${CLOUD_SERVICE_KEY:?CLOUD_SERVICE_KEY manquant}"
export CLOUD_DB_URL CLOUD_SERVICE_KEY ANCIENNE_ADRESSE API
LOCAL_SERVICE_KEY=$( (cd "$INSTANCE" && supabase status -o env 2>/dev/null) | grep '^SERVICE_ROLE_KEY=' | cut -d'"' -f2)
[ -n "$LOCAL_SERVICE_KEY" ] || { echo "Instance Bultaco non démarrée (étape 1)."; exit 1; }
export LOCAL_SERVICE_KEY

# psql/pg_dump du conteneur : même version que la base, et le mot de passe n'apparaît pas dans la liste des processus
cloud()  { docker exec -i -e CLOUD_DB_URL "$DB" sh -c 'psql "$CLOUD_DB_URL" -v ON_ERROR_STOP=1 -At "$@"' sh "$@"; }
locale() { docker exec -i "$DB" psql -U postgres -d postgres -At "$@"; }

echo "=== 0. Vérifications"
cloud -c "select 'cloud joignable, Postgres ' || current_setting('server_version')"
if [ "$(locale -c "select count(*) from pg_tables where schemaname='public'")" != 0 ]; then
  echo "L'instance du serveur contient déjà des tables. Pour recommencer :"
  echo "  cd ~/supabase-bultaco && supabase stop --no-backup && supabase start"
  exit 1
fi
( umask 077; mkdir -p "$TRAVAIL" )
cd "$TRAVAIL"

echo "=== 1. Comptes"
cloud -c "select coalesce(json_agg(json_build_object('id', id, 'email', email, 'password_hash', encrypted_password)), '[]') from auth.users" > comptes.json
python3 - <<'PY'
import json, os, urllib.request, urllib.error
cle, api = os.environ["LOCAL_SERVICE_KEY"], os.environ["API"]
for compte in json.load(open("comptes.json")):
    corps = json.dumps({**compte, "email_confirm": True}).encode()
    requete = urllib.request.Request(f"{api}/auth/v1/admin/users", data=corps, method="POST",
        headers={"apikey": cle, "Authorization": f"Bearer {cle}", "Content-Type": "application/json"})
    try:
        urllib.request.urlopen(requete, timeout=30)
        print("  compte créé :", compte["email"])
    except urllib.error.HTTPError as erreur:
        raise SystemExit(f"  ÉCHEC pour {compte['email']} : {erreur.code} {erreur.read().decode()[:200]}")
PY
rm -f comptes.json   # contient les empreintes des mots de passe

echo "=== 2. Tables, fonctions et règles d'accès (schéma public)"
docker exec -i -e CLOUD_DB_URL "$DB" sh -c 'pg_dump "$CLOUD_DB_URL" --schema=public --no-publications --no-subscriptions' > public.sql
# Deux erreurs sont attendues dans une instance neuve : le schéma public existe déjà, et les droits
# par défaut du rôle supabase_admin y sont déjà en place, identiques à ceux du cloud (vérifié le 12/11/2026).
locale -f - < public.sql > restauration.log 2>&1 || true
grep -E "ERROR" restauration.log | grep -vE 'schema "public" already exists|permission denied to change default privileges' > erreurs.log || true
if [ -s erreurs.log ]; then echo "  ATTENTION, erreurs de restauration :"; cut -c1-200 erreurs.log | head -20; else echo "  restauration sans erreur"; fi

echo "=== 3. Dossiers de stockage et leurs règles d'accès"
cloud -c "select format('insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values (%L, %L, %L, %L, %L) on conflict (id) do nothing;', id, name, public, file_size_limit, allowed_mime_types) from storage.buckets" > stockage.sql
cloud -c "select format('create policy %I on %I.%I as %s for %s to %s%s%s;', policyname, schemaname, tablename, permissive, cmd, array_to_string(roles, ', '), coalesce(' using (' || qual || ')', ''), coalesce(' with check (' || with_check || ')', '')) from pg_policies where schemaname = 'storage'" >> stockage.sql
locale -v ON_ERROR_STOP=1 -f - < stockage.sql > /dev/null
echo "  $(grep -c '^insert' stockage.sql) dossier(s), $(grep -c '^create policy' stockage.sql) règle(s)"

echo "=== 4. Fichiers"
cloud -c "select coalesce(json_agg(json_build_object('bucket', bucket_id, 'name', name, 'type', metadata->>'mimetype', 'cache', metadata->>'cacheControl')), '[]') from storage.objects" > fichiers.json
python3 - <<'PY'
import json, os, urllib.parse, urllib.request, urllib.error
cloud, api = os.environ["ANCIENNE_ADRESSE"], os.environ["API"]
cle_cloud, cle_locale = os.environ["CLOUD_SERVICE_KEY"], os.environ["LOCAL_SERVICE_KEY"]
fichiers, octets, echecs = json.load(open("fichiers.json")), 0, []
for numero, f in enumerate(fichiers, 1):
    chemin = f"{f['bucket']}/{urllib.parse.quote(f['name'])}"
    try:
        lecture = urllib.request.Request(f"{cloud}/storage/v1/object/{chemin}",
            headers={"apikey": cle_cloud, "Authorization": f"Bearer {cle_cloud}"})
        contenu = urllib.request.urlopen(lecture, timeout=300).read()
        envoi = urllib.request.Request(f"{api}/storage/v1/object/{chemin}", data=contenu, method="POST",
            headers={"apikey": cle_locale, "Authorization": f"Bearer {cle_locale}", "x-upsert": "true",
                     "Content-Type": f["type"] or "application/octet-stream",
                     "cache-control": f["cache"] or "max-age=3600"})
        urllib.request.urlopen(envoi, timeout=300)
        octets += len(contenu)
    except urllib.error.HTTPError as erreur:
        echecs.append(f"{chemin} : {erreur.code} {erreur.read().decode()[:120]}")
    except Exception as erreur:
        echecs.append(f"{chemin} : {erreur}")
    if numero % 25 == 0:
        print(f"  {numero}/{len(fichiers)}…", flush=True)
print(f"  {len(fichiers) - len(echecs)} fichier(s) copiés sur {len(fichiers)}, {octets / 1048576:.1f} Mo")
if echecs:
    print("  ÉCHECS :\n  " + "\n  ".join(echecs[:20]))
    raise SystemExit(1)
PY

echo "=== 5. Adresses des photos : $ANCIENNE_ADRESSE → $NOUVELLE_ADRESSE"
locale -v ON_ERROR_STOP=1 <<SQL
do \$\$
declare c record; n bigint;
begin
  for c in
    select col.table_name, col.column_name, col.data_type
    from information_schema.columns col
    join information_schema.tables t using (table_schema, table_name)
    where col.table_schema = 'public' and t.table_type = 'BASE TABLE'
      and col.data_type in ('text', 'character varying', 'json', 'jsonb') and col.is_generated = 'NEVER'
  loop
    execute format('update public.%I set %I = replace(%I::text, %L, %L)::%s where %I::text like %L',
      c.table_name, c.column_name, c.column_name, '$ANCIENNE_ADRESSE', '$NOUVELLE_ADRESSE',
      c.data_type, c.column_name, '%$ANCIENNE_ADRESSE%');
    get diagnostics n = row_count;
    if n > 0 then raise notice '  %.% : % ligne(s)', c.table_name, c.column_name, n; end if;
  end loop;
end \$\$;
SQL

echo "=== 6. Comparaison cloud / serveur (nombre de lignes)"
COMPTAGE="select string_agg(format('select %L as t, count(*) as n from %s', t, t), ' union all ' order by t) from (
  select format('%I.%I', schemaname, tablename) as t from pg_tables where schemaname = 'public'
  union all select 'auth.users' union all select 'storage.objects' union all select 'storage.buckets') x"
cloud  -c "$(cloud -c "$COMPTAGE")" -F ' ' | sort > lignes_cloud.txt
locale -c "$(cloud -c "$COMPTAGE")" -F ' ' | sort > lignes_serveur.txt
paste -d' ' lignes_cloud.txt <(cut -d' ' -f2 lignes_serveur.txt) | awk '{ printf "  %-32s cloud %-6s serveur %-6s %s\n", $1, $2, $3, ($2 == $3 ? "ok" : "DIFFÉRENT") }'
RESTE=$(locale -c "select count(*) from (select 1 from public.photos where url like '%$ANCIENNE_ADRESSE%' union all select 1 from public.timeline_events where image_url like '%$ANCIENNE_ADRESSE%') x")
echo "  photos pointant encore vers le cloud : $RESTE"
if diff -q lignes_cloud.txt lignes_serveur.txt > /dev/null && [ "$RESTE" = 0 ] && [ ! -s erreurs.log ]; then
  echo "TRANSFERT_OK (détail dans $TRAVAIL)"
else
  echo "TRANSFERT À VÉRIFIER (détail dans $TRAVAIL)"; exit 1
fi
