/*
  # Fix administrative category and add base purchase

  1. Changes
    - Ensure administrative category is allowed in parts_costs table
    - Add the base motorcycle purchase cost (550€)
    - This represents the initial purchase of the wreck/base motorcycle

  2. Security
    - No changes to existing RLS policies
*/

-- First, ensure the constraint allows administrative category
ALTER TABLE parts_costs 
DROP CONSTRAINT IF EXISTS parts_costs_category_check;

ALTER TABLE parts_costs 
ADD CONSTRAINT parts_costs_category_check 
CHECK (category IN ('engine', 'bodywork', 'electrical', 'wheels', 'transmission', 'suspension', 'accessories', 'tools', 'administrative'));

-- Then insert the base motorcycle purchase cost
INSERT INTO parts_costs (
  part_name,
  category,
  condition,
  price,
  currency,
  supplier,
  purchase_date,
  notes
) VALUES (
  'Achat de l''épave Bultaco Sherpa 350',
  'administrative',
  'used',
  550.00,
  'EUR',
  'Particulier',
  '2024-08-01',
  'Achat de la moto de base - État épave avec moteur grippé'
) ON CONFLICT DO NOTHING;