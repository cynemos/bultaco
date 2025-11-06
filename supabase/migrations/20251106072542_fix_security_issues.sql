/*
  # Fix Security Issues

  1. Foreign Key Index
    - Add index on parts_costs.invoice_id for foreign key performance

  2. Unused Indexes
    - Remove unused indexes on photos, timeline_events, technical_specs, invoices

  3. Duplicate RLS Policies
    - Remove conflicting policies and consolidate into single clear policies
    - Fix policy definitions for proper access control

  4. Function Search Path
    - Update trigger function to have immutable search_path

  IMPORTANT NOTES:
    - Removing unused indexes improves write performance
    - Consolidating policies prevents confusion and improves security
    - Adding foreign key index improves query performance
*/

-- Add index for foreign key
CREATE INDEX IF NOT EXISTS idx_parts_costs_invoice_id ON public.parts_costs(invoice_id);

-- Remove unused indexes
DROP INDEX IF EXISTS idx_photos_category;
DROP INDEX IF EXISTS idx_timeline_events_status;
DROP INDEX IF EXISTS idx_technical_specs_status;
DROP INDEX IF EXISTS idx_invoices_supplier;

-- Remove duplicate/conflicting policies and consolidate
DROP POLICY IF EXISTS "Authenticated users can manage invoices" ON public.invoices;
DROP POLICY IF EXISTS "Invoices are viewable by everyone" ON public.invoices;
DROP POLICY IF EXISTS "Authenticated users can manage parts costs" ON public.parts_costs;
DROP POLICY IF EXISTS "Parts costs are viewable by everyone" ON public.parts_costs;
DROP POLICY IF EXISTS "Authenticated users can manage photos" ON public.photos;
DROP POLICY IF EXISTS "Photos are viewable by everyone" ON public.photos;
DROP POLICY IF EXISTS "Authenticated users can manage settings" ON public.settings;
DROP POLICY IF EXISTS "Public can read public settings" ON public.settings;
DROP POLICY IF EXISTS "Authenticated users can manage technical specs" ON public.technical_specs;
DROP POLICY IF EXISTS "Technical specs are viewable by everyone" ON public.technical_specs;
DROP POLICY IF EXISTS "Public read" ON public.timeline_events;
DROP POLICY IF EXISTS "Timeline events are viewable by everyone" ON public.timeline_events;
DROP POLICY IF EXISTS "Auth delete" ON public.timeline_events;
DROP POLICY IF EXISTS "Auth insert" ON public.timeline_events;
DROP POLICY IF EXISTS "Auth update" ON public.timeline_events;
DROP POLICY IF EXISTS "Authenticated users can manage timeline events" ON public.timeline_events;

-- Create consolidated policies for invoices (admin/auth only)
CREATE POLICY "Invoices: authenticated can manage"
  ON public.invoices FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create consolidated policies for parts_costs (admin/auth only)
CREATE POLICY "Parts costs: authenticated can manage"
  ON public.parts_costs FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create consolidated policies for photos (admin/auth only)
CREATE POLICY "Photos: authenticated can manage"
  ON public.photos FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create consolidated policies for settings
CREATE POLICY "Settings: authenticated can manage all"
  ON public.settings FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Settings: public can read public"
  ON public.settings FOR SELECT
  TO anon
  USING (is_public = true);

-- Create consolidated policies for technical_specs (admin/auth only)
CREATE POLICY "Technical specs: authenticated can manage"
  ON public.technical_specs FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create consolidated policies for timeline_events
CREATE POLICY "Timeline events: public read"
  ON public.timeline_events FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Timeline events: authenticated manage"
  ON public.timeline_events FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Fix function search path mutability
CREATE OR REPLACE FUNCTION public.update_settings_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
