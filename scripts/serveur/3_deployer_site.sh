#!/bin/bash
# Étape 3, puis à chaque mise à jour — Installe ou met à jour le site Bultaco sur le serveur.
# Sans sudo. Remplace le déploiement automatique de Netlify : après un push sur GitHub,
# lancer   ssh lambretta '~/apps/bultaco/scripts/serveur/3_deployer_site.sh'
#
# Récupère la branche main, compile dans un dossier à part, puis bascule : le site n'est jamais
# servi à moitié compilé, et la version précédente est gardée (dist.vX.Y.Z-date).
set -euo pipefail

DEPOT=https://github.com/cynemos/bultaco.git
SITE=/home/cynemos/apps/bultaco
INSTANCE=/home/cynemos/supabase-bultaco
API_PUBLIQUE=https://api-bultaco.cyneprod.org
GARDER=3   # anciennes versions conservées

# node est installé par nvm (nvm ne supporte pas « set -u », d'où la parenthèse)
if [ -s "$HOME/.nvm/nvm.sh" ]; then set +u; . "$HOME/.nvm/nvm.sh"; set -u; fi

if [ -d "$SITE/.git" ]; then
  git -C "$SITE" fetch --quiet origin main
  git -C "$SITE" merge --ff-only origin/main
else
  git clone --quiet --branch main "$DEPOT" "$SITE"
fi
cd "$SITE"

if [ ! -f .env ]; then
  CLE=$( (cd "$INSTANCE" && supabase status -o env 2>/dev/null) | grep '^ANON_KEY=' | cut -d'"' -f2)
  [ -n "$CLE" ] || { echo "Instance Supabase Bultaco non démarrée (étape 1)."; exit 1; }
  ( umask 077; printf 'VITE_SUPABASE_URL=%s\nVITE_SUPABASE_ANON_KEY=%s\n' "$API_PUBLIQUE" "$CLE" > .env )
  echo "Fichier .env créé."
fi

npm ci --no-audit --no-fund --silent
rm -rf dist-new
node_modules/.bin/vite build --outDir dist-new > /dev/null
[ -s dist-new/index.html ] || { echo "ÉCHEC de la compilation : l'ancien site reste en place."; exit 1; }

VERSION=$(node -p "require('./package.json').version")
[ -d dist ] && mv dist "dist.v$(cat dist/.version 2>/dev/null || echo ancienne)-$(date +%Y%m%d-%H%M%S)"
echo "$VERSION" > dist-new/.version
mv dist-new dist
{ ls -1d dist.v* 2>/dev/null || true; } | sort -t- -k2 | head -n -"$GARDER" | xargs -r rm -rf
echo "SITE_OK : version $VERSION en place dans $SITE/dist"
