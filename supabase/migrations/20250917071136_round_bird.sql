/*
  # Create settings table

  1. New Tables
    - `settings`
      - `id` (uuid, primary key)
      - `key` (text, unique)
      - `value` (jsonb)
      - `category` (text)
      - `description` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `settings` table
    - Add policy for authenticated users to manage settings
    - Add policy for public users to read public settings
*/

CREATE TABLE IF NOT EXISTS settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value jsonb NOT NULL,
  category text NOT NULL DEFAULT 'general',
  description text,
  is_public boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Authenticated users can manage settings"
  ON settings
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public can read public settings"
  ON settings
  FOR SELECT
  TO public
  USING (is_public = true);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_settings_key ON settings (key);
CREATE INDEX IF NOT EXISTS idx_settings_category ON settings (category);

-- Insert default settings
INSERT INTO settings (key, value, category, description, is_public) VALUES
  ('site_title', '"Bultaco Sherpa 350"', 'general', 'Titre du site', true),
  ('site_description', '"Documentation complète de la restauration d''une légende du trial espagnol"', 'general', 'Description du site', true),
  ('project_start_date', '"2024-08-01"', 'project', 'Date de début du projet', true),
  ('bike_year', '"1976"', 'bike', 'Année de la moto', true),
  ('bike_model', '"Sherpa 350"', 'bike', 'Modèle de la moto', true),
  ('owner_name', '"Christophe Nectoux"', 'contact', 'Nom du propriétaire', true),
  ('owner_email', '"cnectoux@free.fr"', 'contact', 'Email du propriétaire', true),
  ('owner_phone', '"+33 6 14 21 61 46"', 'contact', 'Téléphone du propriétaire', true),
  ('gallery_items_per_page', '12', 'display', 'Nombre d''éléments par page dans la galerie', false),
  ('enable_comments', 'false', 'features', 'Activer les commentaires', false),
  ('maintenance_mode', 'false', 'system', 'Mode maintenance', false)
ON CONFLICT (key) DO NOTHING;

-- Update trigger
CREATE OR REPLACE FUNCTION update_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER settings_updated_at
  BEFORE UPDATE ON settings
  FOR EACH ROW
  EXECUTE FUNCTION update_settings_updated_at();