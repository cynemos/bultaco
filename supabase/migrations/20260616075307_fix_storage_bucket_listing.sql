/*
  # Fix Storage Bucket Listing Issue

  For public buckets:
  - Direct URL access works WITHOUT any RLS policy on storage.objects
  - RLS policies on storage.objects only control LISTING via the API
  - A broad SELECT policy allows anyone to LIST all files in the bucket
  
  Solution: Remove the public SELECT policy to prevent listing while keeping
  direct URL access working (since the bucket is public).
*/

-- Remove policies that allow public listing of the bucket contents
DROP POLICY IF EXISTS "Public read access for restoration photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view restoration photos" ON storage.objects;
DROP POLICY IF EXISTS "Public can read individual restoration photos" ON storage.objects;

-- Allow only authenticated users to list/view objects via API
-- Public direct URL access still works because the bucket is public
CREATE POLICY "Authenticated users can list restoration photos"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'restoration-photos');