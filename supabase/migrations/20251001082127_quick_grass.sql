/*
  # Add administrative category to parts costs

  1. Changes
    - Add 'administrative' to the category enum constraint
    - This allows tracking administrative costs like:
      - Carte grise FFVE
      - Assurance
      - Contrôle technique
      - Frais de dossier
      - Expertise
      - etc.

  2. Security
    - No changes to existing RLS policies
*/

-- Add administrative category to the existing constraint
ALTER TABLE parts_costs 
DROP CONSTRAINT IF EXISTS parts_costs_category_check;

ALTER TABLE parts_costs 
ADD CONSTRAINT parts_costs_category_check 
CHECK (category IN ('engine', 'bodywork', 'electrical', 'wheels', 'transmission', 'suspension', 'accessories', 'tools', 'administrative'));