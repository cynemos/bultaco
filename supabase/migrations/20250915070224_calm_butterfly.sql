/*
  # Create timeline events table

  1. New Tables
    - `timeline_events`
      - `id` (uuid, primary key)
      - `date` (date, event date)
      - `title` (text, event title)
      - `description` (text, event description)
      - `status` (text, event status: completed, in-progress, pending)
      - `category` (text, event category)
      - `image_url` (text, optional image URL)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `timeline_events` table
    - Add policy for authenticated users to manage events
    - Add policy for public read access
*/

CREATE TABLE IF NOT EXISTS timeline_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL,
  title text NOT NULL,
  description text DEFAULT '',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('completed', 'in-progress', 'pending')),
  category text DEFAULT '',
  image_url text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE timeline_events ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Timeline events are viewable by everyone"
  ON timeline_events
  FOR SELECT
  TO public
  USING (true);

-- Allow authenticated users to manage timeline events
CREATE POLICY "Authenticated users can manage timeline events"
  ON timeline_events
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);