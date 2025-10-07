/*
  # Create photos table

  1. New Tables
    - `photos`
      - `id` (uuid, primary key)
      - `url` (text, photo URL)
      - `title` (text, photo title)
      - `description` (text, photo description)
      - `category` (text, photo category)
      - `date` (date, photo date)
      - `tags` (text array, photo tags)
      - `is_before_photo` (boolean, mark as before photo)
      - `is_after_photo` (boolean, mark as after photo)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `photos` table
    - Add policy for authenticated users to manage photos
    - Add policy for public read access
*/

CREATE TABLE IF NOT EXISTS photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  url text NOT NULL,
  title text NOT NULL,
  description text DEFAULT '',
  category text NOT NULL,
  date date NOT NULL DEFAULT CURRENT_DATE,
  tags text[] DEFAULT '{}',
  is_before_photo boolean DEFAULT false,
  is_after_photo boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE photos ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Photos are viewable by everyone"
  ON photos
  FOR SELECT
  TO public
  USING (true);

-- Allow authenticated users to manage photos
CREATE POLICY "Authenticated users can manage photos"
  ON photos
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);