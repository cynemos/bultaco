/*
  # Create technical specifications table

  1. New Tables
    - `technical_specs`
      - `id` (uuid, primary key)
      - `category` (text) - engine, electrical, bodywork, performance
      - `part` (text) - nom de la pièce
      - `original_spec` (text) - spécification d'origine
      - `restored_spec` (text) - spécification après restauration
      - `action` (text) - action effectuée
      - `status` (text) - restored, replaced, upgraded
      - `notes` (text) - notes additionnelles
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `technical_specs` table
    - Add policy for public read access
    - Add policy for authenticated users to manage specs
*/

CREATE TABLE IF NOT EXISTS technical_specs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL CHECK (category IN ('engine', 'electrical', 'bodywork', 'performance')),
  part text NOT NULL,
  original_spec text,
  restored_spec text,
  action text NOT NULL,
  status text NOT NULL CHECK (status IN ('restored', 'replaced', 'upgraded')),
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE technical_specs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Technical specs are viewable by everyone"
  ON technical_specs
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can manage technical specs"
  ON technical_specs
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_technical_specs_category ON technical_specs(category);
CREATE INDEX IF NOT EXISTS idx_technical_specs_status ON technical_specs(status);