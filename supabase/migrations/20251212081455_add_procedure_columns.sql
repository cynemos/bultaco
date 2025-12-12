/*
  # Add missing columns to admin_procedures table

  1. Changes
    - Add `priority` column
    - Add `responsible` column
    - Add `due_date` column
    - Add `notes` column
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'admin_procedures' AND column_name = 'priority'
  ) THEN
    ALTER TABLE admin_procedures ADD COLUMN priority text DEFAULT 'medium';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'admin_procedures' AND column_name = 'responsible'
  ) THEN
    ALTER TABLE admin_procedures ADD COLUMN responsible text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'admin_procedures' AND column_name = 'due_date'
  ) THEN
    ALTER TABLE admin_procedures ADD COLUMN due_date date;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'admin_procedures' AND column_name = 'notes'
  ) THEN
    ALTER TABLE admin_procedures ADD COLUMN notes text;
  END IF;
END $$;
