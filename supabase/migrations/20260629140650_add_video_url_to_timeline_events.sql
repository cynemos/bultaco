/*
  # Add YouTube video support to timeline events

  1. Modified Tables
    - `timeline_events`
      - Add `video_url` (text, optional) - URL d'une vidéo YouTube à afficher dans l'étape de timeline

  2. Security
    - Aucun changement de sécurité : la table conserve ses politiques RLS existantes
      (lecture publique, gestion par les utilisateurs authentifiés).

  3. Notes
    - La colonne est optionnelle (nullable) pour ne pas casser les étapes existantes.
    - Le frontend extraira l'ID de la vidéo YouTube depuis l'URL pour l'intégrer en iframe.
*/

ALTER TABLE timeline_events
  ADD COLUMN IF NOT EXISTS video_url text;
