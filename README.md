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
