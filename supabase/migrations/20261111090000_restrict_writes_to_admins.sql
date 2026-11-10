/*
  # Réserver l'écriture aux administrateurs

  Problème corrigé
    Les politiques précédentes autorisaient toute écriture à n'importe quel
    utilisateur connecté (`auth.uid() IS NOT NULL` équivaut à `true` pour le
    rôle `authenticated`). Si l'inscription Supabase est ouverte, un inconnu
    pouvait créer un compte et modifier ou supprimer tout le contenu.

  Changements
    1. Table `public.admins` : liste des comptes autorisés à modifier le site.
    2. Fonction `public.is_admin()` : vrai si l'utilisateur courant est dans `admins`.
    3. Tables du site : lecture publique conservée, écriture réservée aux admins.
    4. `invoices` : lecture réservée aux admins (numéros, fournisseurs et liens
       Google Drive ne sont plus exposés publiquement).
    5. `settings` : le public ne lit que les réglages `is_public = true`.
    6. Stockage `restoration-photos` : envoi, modification, suppression et
       listage réservés aux admins. Les URL publiques des photos continuent
       de fonctionner (bucket public).

  ⚠️ APRÈS avoir appliqué cette migration, déclarez votre compte admin dans
  l'éditeur SQL de Supabase (en remplaçant l'adresse) :

      INSERT INTO public.admins (user_id)
      SELECT id FROM auth.users WHERE email = 'votre-adresse-admin@exemple.fr';

  Sans cette étape, plus personne ne peut modifier le contenu depuis l'admin.
*/

-- 1. Table des administrateurs
CREATE TABLE IF NOT EXISTS public.admins (
  user_id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admins_select_self" ON public.admins;
CREATE POLICY "admins_select_self" ON public.admins
  FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));
-- Aucune politique INSERT/UPDATE/DELETE : la liste ne se modifie que
-- depuis l'éditeur SQL (rôle postgres / service_role).

-- 2. Fonction de contrôle
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admins WHERE user_id = auth.uid()
  );
$$;

REVOKE ALL ON FUNCTION public.is_admin() FROM public;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated;

-- 3. Politiques des tables du site
DO $$
DECLARE
  t text;
  pol record;
BEGIN
  FOREACH t IN ARRAY ARRAY['invoices', 'parts_costs', 'photos', 'settings', 'technical_specs', 'timeline_events']
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);

    -- Supprime toutes les politiques existantes de la table
    FOR pol IN
      SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = t
    LOOP
      EXECUTE format('DROP POLICY %I ON public.%I', pol.policyname, t);
    END LOOP;

    -- Lecture
    IF t = 'invoices' THEN
      EXECUTE format(
        'CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING ((SELECT public.is_admin()))',
        t || '_select_admin', t);
    ELSIF t = 'settings' THEN
      EXECUTE format(
        'CREATE POLICY %I ON public.%I FOR SELECT TO public USING (is_public = true OR (SELECT public.is_admin()))',
        t || '_select', t);
    ELSE
      EXECUTE format(
        'CREATE POLICY %I ON public.%I FOR SELECT TO public USING (true)',
        t || '_select_public', t);
    END IF;

    -- Écriture réservée aux admins
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR INSERT TO authenticated WITH CHECK ((SELECT public.is_admin()))',
      t || '_insert_admin', t);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR UPDATE TO authenticated USING ((SELECT public.is_admin())) WITH CHECK ((SELECT public.is_admin()))',
      t || '_update_admin', t);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR DELETE TO authenticated USING ((SELECT public.is_admin()))',
      t || '_delete_admin', t);
  END LOOP;
END $$;

-- 4. Stockage des photos
DO $$
DECLARE
  pol record;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND (coalesce(qual, '') ILIKE '%restoration-photos%'
           OR coalesce(with_check, '') ILIKE '%restoration-photos%')
  LOOP
    EXECUTE format('DROP POLICY %I ON storage.objects', pol.policyname);
  END LOOP;
END $$;

CREATE POLICY "restoration_photos_select_admin" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'restoration-photos' AND (SELECT public.is_admin()));

CREATE POLICY "restoration_photos_insert_admin" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'restoration-photos' AND (SELECT public.is_admin()));

CREATE POLICY "restoration_photos_update_admin" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'restoration-photos' AND (SELECT public.is_admin()))
  WITH CHECK (bucket_id = 'restoration-photos' AND (SELECT public.is_admin()));

CREATE POLICY "restoration_photos_delete_admin" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'restoration-photos' AND (SELECT public.is_admin()));
