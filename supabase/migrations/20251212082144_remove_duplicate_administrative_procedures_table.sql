/*
  # Remove duplicate administrative_procedures table

  1. Changes
    - Drop the old `administrative_procedures` table (duplicate of admin_procedures)
    - Keep `admin_procedures` which is the table currently in use
*/

DROP TABLE IF EXISTS administrative_procedures CASCADE;
