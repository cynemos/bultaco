/*
  # Remettre en ordre la table settings

  1. Certaines valeurs avaient été enregistrées deux fois encodées
     (ex. "\"Sherpa 350 T\"") : on les décode.
  2. Les paramètres lus par le site public (maintenance, galerie…) doivent être
     lisibles sans connexion : is_public = true, sauf l'e-mail et le téléphone
     dont la visibilité reste réglée depuis l'admin.
  3. Suppression de « enable_comments » : aucune fonction de commentaires
     n'existe sur le site.
*/

-- 1. Valeurs doublement encodées : "\"texte\"" -> "texte" (deux passes par sécurité)
UPDATE public.settings
SET value = (value #>> '{}')::jsonb
WHERE jsonb_typeof(value) = 'string'
  AND (value #>> '{}') LIKE '"%"';

UPDATE public.settings
SET value = (value #>> '{}')::jsonb
WHERE jsonb_typeof(value) = 'string'
  AND (value #>> '{}') LIKE '"%"';

-- 2. Paramètres utilisés par les pages publiques
UPDATE public.settings
SET is_public = true
WHERE key NOT IN ('owner_email', 'owner_phone');

-- 3. Paramètre sans fonction associée
DELETE FROM public.settings WHERE key = 'enable_comments';
