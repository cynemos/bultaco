/*
  # Create storage bucket for restoration photos

  1. Storage
    - Create `restoration-photos` bucket for photo uploads
    - Enable public access for photos
    - Set up policies for authenticated uploads

  2. Security
    - Allow public read access to photos
    - Allow authenticated users to upload photos
*/

-- Create storage bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('restoration-photos', 'restoration-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access
CREATE POLICY "Public read access for restoration photos"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'restoration-photos');

-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload restoration photos"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'restoration-photos');

-- Allow authenticated users to update their uploads
CREATE POLICY "Authenticated users can update restoration photos"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'restoration-photos');

-- Allow authenticated users to delete their uploads
CREATE POLICY "Authenticated users can delete restoration photos"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'restoration-photos');