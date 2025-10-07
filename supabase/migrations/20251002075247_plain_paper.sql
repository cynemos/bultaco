/*
  # Add base motorcycle purchase cost

  1. Changes
    - Insert the base motorcycle purchase cost (550€) as a special entry
    - This represents the initial purchase of the wreck/base motorcycle
    - Category: administrative (for the purchase transaction)
    - This will be included in all cost calculations

  2. Security
    - No changes to existing RLS policies
*/

-- Insert the base motorcycle purchase cost
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