/*
  # Relier les photos et les dépenses aux étapes de la chronologie

  - photos.timeline_event_id       : étape à laquelle la photo se rapporte (facultatif)
  - parts_costs.timeline_event_id  : étape pour laquelle la pièce / la dépense a servi (facultatif)

  Si une étape est supprimée, les photos et dépenses restent, simplement détachées.
*/

ALTER TABLE public.photos
  ADD COLUMN IF NOT EXISTS timeline_event_id uuid REFERENCES public.timeline_events (id) ON DELETE SET NULL;

ALTER TABLE public.parts_costs
  ADD COLUMN IF NOT EXISTS timeline_event_id uuid REFERENCES public.timeline_events (id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_photos_timeline_event_id ON public.photos (timeline_event_id);
CREATE INDEX IF NOT EXISTS idx_parts_costs_timeline_event_id ON public.parts_costs (timeline_event_id);
