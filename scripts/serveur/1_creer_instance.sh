#!/bin/bash
# Étape 1 — Crée sur le serveur une instance Supabase réservée à Bultaco, à côté de celle de Lambretta.
# Sans sudo. À lancer une seule fois (relancer ne change rien si l'instance existe déjà).
#
# - Ports 54325 (API), 54326 (base), 54328 (Studio) : dans la plage 54320-54329 déjà fermée
#   au réseau par le service supabase-pare-feu. Seul nginx, sur le serveur, y accède.
# - Clés tirées au hasard (jwt_secret, publishable_key, secret_key) : sans cela, la CLI utilise
#   des clés d'administration par défaut, identiques sur toutes les installations et donc publiques.
# - Services inutiles à ce site désactivés (temps réel, fonctions Edge, journaux, courriels de test).
set -euo pipefail

MODELE=/home/cynemos/supabase/supabase/config.toml   # configuration de Lambretta, qui sert de modèle
DOSSIER=/home/cynemos/supabase-bultaco
CONFIG="$DOSSIER/supabase/config.toml"

if [ -f "$CONFIG" ]; then
  echo "Configuration déjà présente : $CONFIG (non modifiée)"
else
  mkdir -p "$DOSSIER/supabase"
  SECRET=$(openssl rand -hex 32)
  alea() { openssl rand -base64 48 | tr -dc 'A-Za-z0-9' | cut -c1-"$1"; }
  CLE_PUBLIQUE="$(alea 22)_$(alea 8)"
  CLE_ADMIN="$(alea 22)_$(alea 8)"
  ( umask 077; SECRET="$SECRET" CLE_PUBLIQUE="$CLE_PUBLIQUE" CLE_ADMIN="$CLE_ADMIN" python3 - "$MODELE" "$CONFIG" <<'PY'
import os, re, sys
source, cible = sys.argv[1], sys.argv[2]
secret = os.environ["SECRET"]
# section -> {clé: nouvelle valeur}
reglages = {
    "": {"project_id": '"bultaco"'},
    "api": {"port": "54325"},
    "db": {"port": "54326", "shadow_port": "54329"},
    "studio": {"port": "54328"},
    "realtime": {"enabled": "false"},
    "local_smtp": {"enabled": "false"},
    "storage.s3_protocol": {"enabled": "false"},
    "edge_runtime": {"enabled": "false"},
    "analytics": {"enabled": "false"},
    "auth": {
        "site_url": '"https://bultaco.cyneprod.org"',
        "additional_redirect_urls": '["https://bultaco.cyneprod.org"]',
        "enable_signup": "false",
    },
}
faits, section, sortie = set(), "", []
for ligne in open(source, encoding="utf-8").read().splitlines():
    titre = re.match(r"^\[([^\]]+)\]\s*$", ligne)
    if titre:
        section = titre.group(1)
        sortie.append(ligne)
        if section == "auth":
            sortie.append("# Clé de signature propre à cette instance (ne jamais la publier).")
            sortie.append(f'jwt_secret = "{secret}"')
            # Les clés « sb_… » ont elles aussi une valeur par défaut publique : on les remplace.
            sortie.append(f'publishable_key = "sb_publishable_{os.environ["CLE_PUBLIQUE"]}"')
            sortie.append(f'secret_key = "sb_secret_{os.environ["CLE_ADMIN"]}"')
        continue
    cle = re.match(r"^([a-z_]+)\s*=", ligne)
    if cle and cle.group(1) in reglages.get(section, {}):
        sortie.append(f"{cle.group(1)} = {reglages[section][cle.group(1)]}")
        faits.add((section, cle.group(1)))
        continue
    sortie.append(ligne)
manquants = [(s, c) for s, v in reglages.items() for c in v if (s, c) not in faits]
if manquants:
    sys.exit(f"Réglages introuvables dans le modèle : {manquants}")
open(cible, "w", encoding="utf-8").write("\n".join(sortie) + "\n")
PY
  )
  chmod 600 "$CONFIG"
  echo "Configuration créée : $CONFIG"
fi

cd "$DOSSIER"
if docker ps --format '{{.Names}}' | grep -q '^supabase_db_bultaco$'; then
  echo "Instance déjà démarrée."
else
  echo "Démarrage de l'instance (1 à 3 minutes)…"
  # La sortie de « supabase start » contient les clés : elle va dans un fichier privé, pas à l'écran.
  ( umask 077; supabase start > "$DOSSIER/demarrage.log" 2>&1 ) || { echo "ÉCHEC du démarrage :"; grep -viE 'key|secret|eyJ' "$DOSSIER/demarrage.log" | tail -20; exit 1; }
fi

echo "--- Conteneurs"
docker ps --format '{{.Names}}\t{{.Status}}\t{{.Ports}}' | grep '_bultaco' | sort
echo "INSTANCE_OK"
