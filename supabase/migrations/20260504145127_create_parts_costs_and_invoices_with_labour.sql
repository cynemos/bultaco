/*
  # Create parts_costs and invoices tables

  ## New Tables

  ### invoices
  - `id` (uuid, primary key)
  - `invoice_number` (text, unique) - Numéro de facture
  - `supplier` (text) - Fournisseur
  - `total_amount` (numeric) - Montant total
  - `currency` (text, default EUR)
  - `invoice_date` (date)
  - `google_drive_url` (text, optional) - Lien vers la facture Google Drive
  - `description` (text, optional)
  - `created_at` (timestamp)

  ### parts_costs
  - `id` (uuid, primary key)
  - `part_name` (text) - Nom de la pièce ou prestation
  - `category` (text) - engine, bodywork, electrical, wheels, transmission, suspension, accessories, tools, administrative, labour
  - `condition` (text) - new, used, refurbished
  - `price` (numeric) - Prix
  - `currency` (text, default EUR)
  - `supplier` (text, optional)
  - `purchase_date` (date)
  - `invoice_id` (uuid, optional FK to invoices)
  - `notes` (text, optional)
  - `created_at` (timestamp)

  ## Important Notes
  - The `labour` category is separate from `administrative` (base purchase) and from parts
  - Labour costs ARE included in the restoration cost total
  - The `administrative` category is reserved for the base wreck purchase
  - RLS is enabled on both tables with public read and authenticated write policies
*/

CREATE TABLE IF NOT EXISTS invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number text UNIQUE NOT NULL,
  supplier text NOT NULL,
  total_amount numeric(10, 2) NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'EUR',
  invoice_date date NOT NULL,
  google_drive_url text,
  description text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Invoices are viewable by everyone"
  ON invoices FOR SELECT TO public
  USING (true);

CREATE POLICY "Authenticated users can insert invoices"
  ON invoices FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update invoices"
  ON invoices FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete invoices"
  ON invoices FOR DELETE TO authenticated
  USING (true);

CREATE INDEX IF NOT EXISTS idx_invoices_invoice_date ON invoices(invoice_date);
CREATE INDEX IF NOT EXISTS idx_invoices_supplier ON invoices(supplier);


CREATE TABLE IF NOT EXISTS parts_costs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  part_name text NOT NULL,
  category text NOT NULL CHECK (category IN (
    'engine', 'bodywork', 'electrical', 'wheels',
    'transmission', 'suspension', 'accessories',
    'tools', 'administrative', 'labour'
  )),
  condition text NOT NULL DEFAULT 'new' CHECK (condition IN ('new', 'used', 'refurbished')),
  price numeric(10, 2) NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'EUR',
  supplier text,
  purchase_date date NOT NULL DEFAULT CURRENT_DATE,
  invoice_id uuid REFERENCES invoices(id) ON DELETE SET NULL,
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE parts_costs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Parts costs are viewable by everyone"
  ON parts_costs FOR SELECT TO public
  USING (true);

CREATE POLICY "Authenticated users can insert parts costs"
  ON parts_costs FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update parts costs"
  ON parts_costs FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete parts costs"
  ON parts_costs FOR DELETE TO authenticated
  USING (true);

CREATE INDEX IF NOT EXISTS idx_parts_costs_category ON parts_costs(category);
CREATE INDEX IF NOT EXISTS idx_parts_costs_purchase_date ON parts_costs(purchase_date);
CREATE INDEX IF NOT EXISTS idx_parts_costs_invoice_id ON parts_costs(invoice_id);
