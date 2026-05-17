-- WARNING: This will permanently drop the medical_history column and its data.
-- Make sure you have backed up your database or exported the column before running.

ALTER TABLE public.profiles
  DROP COLUMN IF EXISTS medical_history;
