#!/bin/bash
# Demande les deux secrets du Supabase cloud de Bultaco (rien ne s'affiche pendant la saisie),
# les enregistre dans ~/.config/bultaco-migration (lisible par vous seul) et vérifie qu'ils fonctionnent.
# Lancer depuis le PC :   ssh -t lambretta '~/bultaco-migration/saisir_secrets.sh'
set -euo pipefail

FICHIER="$HOME/.config/bultaco-migration"
PROJET=khbfoeyprxslquxobwzh
POOLER=aws-1-eu-west-3.pooler.supabase.com

echo "1/2 — Mot de passe de la base (Supabase > Project Settings > Database)."
read -rsp "    Collez-le puis Entrée (rien ne s'affiche) : " MDP; echo
echo "2/2 — Clé service_role ou secret (Supabase > Project Settings > API Keys)."
read -rsp "    Collez-la puis Entrée (rien ne s'affiche) : " CLE; echo
[ -n "$MDP" ] && [ -n "$CLE" ] || { echo "Saisie vide : rien n'a été enregistré."; exit 1; }

# Le mot de passe est encodé pour pouvoir contenir des caractères spéciaux
MDP_ENCODE=$(MDP="$MDP" python3 -c 'import os, urllib.parse; print(urllib.parse.quote(os.environ["MDP"], safe=""))')
( umask 077; printf "CLOUD_DB_URL='postgresql://postgres.%s:%s@%s:5432/postgres'\nCLOUD_SERVICE_KEY='%s'\n" \
    "$PROJET" "$MDP_ENCODE" "$POOLER" "$CLE" > "$FICHIER" )
echo "Enregistré dans $FICHIER (mot de passe : ${#MDP} caractères, clé : ${#CLE} caractères)."

. "$FICHIER"; export CLOUD_DB_URL
echo "--- Vérification"
if docker exec -e CLOUD_DB_URL supabase_db_bultaco sh -c 'psql "$CLOUD_DB_URL" -Atc "select 1"' > /dev/null 2>&1 < /dev/null; then
  echo "base cloud : connexion réussie"
else
  echo "base cloud : ÉCHEC (mot de passe incorrect ?)"
fi
CODE=$(curl -s -o /dev/null -m 20 -w '%{http_code}' -H "apikey: $CLOUD_SERVICE_KEY" -H "Authorization: Bearer $CLOUD_SERVICE_KEY" "https://$PROJET.supabase.co/storage/v1/bucket")
[ "$CODE" = 200 ] && echo "clé d'administration : acceptée" || echo "clé d'administration : REFUSÉE (code $CODE)"
