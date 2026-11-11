/*
  # Carnet d'entretien et documents

  1. Table `maintenance_entries` : vidanges, réglages, réparations, sorties…
     Lecture publique, écriture réservée aux admins.

  2. Table `documents` : notices, revue technique, carte grise, attestation FFVE…
     Chaque document est public ou privé (is_public).
     Lecture : publique pour les documents publics, tout pour les admins.

  3. Stockage `documents` (privé) pour les fichiers :
     - les admins gèrent tout ;
     - un visiteur ne peut lire que les fichiers des documents publics
       (lien temporaire signé, généré par le site).
*/

-- 1. Carnet d'entretien
CREATE TABLE IF NOT EXISTS public.maintenance_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL DEFAULT CURRENT_DATE,
  type text NOT NULL DEFAULT 'entretien'
    CHECK (type IN ('entretien', 'vidange', 'reglage', 'reparation', 'controle', 'sortie', 'autre')),
  title text NOT NULL,
  description text,
  mileage integer CHECK (mileage IS NULL OR mileage >= 0),
  cost numeric(10, 2),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.maintenance_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "maintenance_select_public" ON public.maintenance_entries;
CREATE POLICY "maintenance_select_public" ON public.maintenance_entries
  FOR SELECT TO public USING (true);
DROP POLICY IF EXISTS "maintenance_insert_admin" ON public.maintenance_entries;
CREATE POLICY "maintenance_insert_admin" ON public.maintenance_entries
  FOR INSERT TO authenticated WITH CHECK ((SELECT public.is_admin()));
DROP POLICY IF EXISTS "maintenance_update_admin" ON public.maintenance_entries;
CREATE POLICY "maintenance_update_admin" ON public.maintenance_entries
  FOR UPDATE TO authenticated USING ((SELECT public.is_admin())) WITH CHECK ((SELECT public.is_admin()));
DROP POLICY IF EXISTS "maintenance_delete_admin" ON public.maintenance_entries;
CREATE POLICY "maintenance_delete_admin" ON public.maintenance_entries
  FOR DELETE TO authenticated USING ((SELECT public.is_admin()));

CREATE INDEX IF NOT EXISTS idx_maintenance_entries_date ON public.maintenance_entries (date DESC);

-- 2. Documents
CREATE TABLE IF NOT EXISTS public.documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  category text NOT NULL DEFAULT 'autre'
    CHECK (category IN ('notice', 'technique', 'administratif', 'historique', 'autre')),
  description text,
  file_path text,       -- chemin dans le stockage « documents »
  file_name text,
  file_size integer,
  mime_type text,
  external_url text,    -- ou lien externe (Google Drive…)
  is_public boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (file_path IS NOT NULL OR external_url IS NOT NULL)
);

ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "documents_select" ON public.documents;
CREATE POLICY "documents_select" ON public.documents
  FOR SELECT TO public USING (is_public OR (SELECT public.is_admin()));
DROP POLICY IF EXISTS "documents_insert_admin" ON public.documents;
CREATE POLICY "documents_insert_admin" ON public.documents
  FOR INSERT TO authenticated WITH CHECK ((SELECT public.is_admin()));
DROP POLICY IF EXISTS "documents_update_admin" ON public.documents;
CREATE POLICY "documents_update_admin" ON public.documents
  FOR UPDATE TO authenticated USING ((SELECT public.is_admin())) WITH CHECK ((SELECT public.is_admin()));
DROP POLICY IF EXISTS "documents_delete_admin" ON public.documents;
CREATE POLICY "documents_delete_admin" ON public.documents
  FOR DELETE TO authenticated USING ((SELECT public.is_admin()));

-- 3. Stockage privé des fichiers
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('documents', 'documents', false, 52428800)  -- 50 Mo par fichier
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "documents_files_admin_all" ON storage.objects;
CREATE POLICY "documents_files_admin_all" ON storage.objects
  FOR ALL TO authenticated
  USING (bucket_id = 'documents' AND (SELECT public.is_admin()))
  WITH CHECK (bucket_id = 'documents' AND (SELECT public.is_admin()));

DROP POLICY IF EXISTS "documents_files_public_read" ON storage.objects;
CREATE POLICY "documents_files_public_read" ON storage.objects
  FOR SELECT TO public
  USING (
    bucket_id = 'documents'
    AND EXISTS (
      SELECT 1 FROM public.documents d
      WHERE d.file_path = storage.objects.name AND d.is_public
    )
  );
