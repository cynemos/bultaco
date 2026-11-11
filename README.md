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
