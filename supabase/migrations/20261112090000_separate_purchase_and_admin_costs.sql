/*
  # Séparer l'achat de la moto, la main d'œuvre et les frais administratifs

  Catégories de `parts_costs` après cette migration :
    - `purchase`       : achat de la moto (prix d'achat de l'épave)
    - `labour`         : main d'œuvre (usinage, prestations d'atelier…)
    - `administrative` : frais administratifs (assurance, FFVE, carte grise…)
    - les autres       : pièces (engine, bodywork, electrical, wheels,
                         transmission, suspension, accessories, tools)

  Avant, `administrative` servait à la fois pour l'achat de l'épave et pour les
  démarches. La ligne d'achat existante est déplacée dans `purchase`.
*/

-- 1. Remplace la contrainte sur les catégories, quel que soit son nom actuel
DO $$
DECLARE
  c record;
BEGIN
  FOR c IN
    SELECT con.conname
    FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
    WHERE nsp.nspname = 'public'
      AND rel.relname = 'parts_costs'
      AND con.contype = 'c'
      AND pg_get_constraintdef(con.oid) ILIKE '%category%'
  LOOP
    EXECUTE format('ALTER TABLE public.parts_costs DROP CONSTRAINT %I', c.conname);
  END LOOP;
END $$;

ALTER TABLE public.parts_costs
  ADD CONSTRAINT parts_costs_category_check CHECK (category IN (
    'engine', 'bodywork', 'electrical', 'wheels', 'transmission',
    'suspension', 'accessories', 'tools',
    'labour', 'administrative', 'purchase'
  ));

-- 2. L'achat de l'épave passe dans la nouvelle catégorie « purchase »
UPDATE public.parts_costs
SET category = 'purchase'
WHERE category = 'administrative'
  AND part_name ILIKE '%achat%';
