# Restauration Bultaco Sherpa

Site vitrine de la restauration d'une Bultaco Sherpa : galerie photo, avant/après,
chronologie (avec vidéos YouTube), fiche technique et suivi des coûts.
Une interface d'administration permet de gérer tout le contenu.

## Technologies

- React 18 + TypeScript + Vite
- Tailwind CSS, icônes lucide-react
- Supabase : base de données, authentification et stockage des photos

## Démarrage

```bash
npm install
npm run dev
```

Créer un fichier `.env` (non versionné) :

```
VITE_SUPABASE_URL=https://<projet>.supabase.co
VITE_SUPABASE_ANON_KEY=<clé anon>
```

## Administration et sécurité

- Seuls les comptes listés dans la table `public.admins` peuvent modifier le contenu
  (politiques RLS basées sur `public.is_admin()`).
- Pour déclarer un administrateur, dans l'éditeur SQL de Supabase :

  ```sql
  INSERT INTO public.admins (user_id)
  SELECT id FROM auth.users WHERE email = 'adresse-admin@exemple.fr';
  ```

- Laisser l'inscription désactivée dans Supabase
  (*Authentication → Providers → Email → Allow new users to sign up*).
- Les factures (`invoices`) ne sont lisibles que par les administrateurs.

## Hébergement sur le serveur personnel

Depuis la v1.11.0, le site tourne sur le serveur personnel : https://bultaco.cyneprod.org
(API Supabase : https://api-bultaco.cyneprod.org). Netlify et le Supabase cloud ne servent
plus que de secours.

Les scripts sont dans `scripts/serveur/` et se lancent sur le serveur :

- `1_creer_instance.sh` : crée l'instance Supabase de Bultaco, avec ses propres clés
  (la CLI Supabase utilise sinon des clés d'administration par défaut, publiques).
- `saisir_secrets.sh` puis `2_transferer_donnees.sh` : copie les comptes, les tables, les
  règles d'accès et les fichiers depuis le Supabase cloud, puis compare les deux.
- `3_deployer_site.sh` : installe le site, puis le met à jour **après chaque push sur
  `main`** (récupère `main`, compile, bascule en gardant la version précédente).
- `4_nginx_certificat.sh` : configuration nginx et certificat HTTPS (demande sudo).
- `sauvegarde_bultaco.sh` : sauvegarde quotidienne (base, fichiers, configuration) sur le
  serveur et sur le NAS ; à copier dans `~/bin/` et à planifier avec cron.

## Sauvegarde automatique

La tâche GitHub Actions **Sauvegarde** (`.github/workflows/backup.yml`) exporte la base
(JSON) et toutes les photos du stockage deux fois par semaine, et à la demande
(onglet *Actions → Sauvegarde → Run workflow*). L'archive se télécharge depuis la page
de l'exécution et reste disponible 90 jours. Ces accès réguliers évitent aussi la mise
en pause du projet Supabase gratuit.

Secrets à créer dans GitHub (*Settings → Secrets and variables → Actions*) :

- `SUPABASE_URL` : l'URL du projet
- `SUPABASE_SERVICE_ROLE_KEY` : la clé *service_role* (Supabase → Project Settings → API Keys).
  Ne jamais la mettre dans le site ni dans le dépôt.

## Images hébergées ailleurs

Admin → Paramètres → *Images hébergées ailleurs* liste les images qui ne sont pas dans
le stockage du site (servimg, Pexels…) et les rapatrie en un clic.
