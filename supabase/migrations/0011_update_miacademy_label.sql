-- Migration: Update MiAcademy resource label
-- Removes "(Daily)" from the label

UPDATE resources 
SET label = 'MiAcademy'
WHERE label = 'MiAcademy (Daily)';
