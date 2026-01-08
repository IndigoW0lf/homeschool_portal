-- Add missing UPDATE policy for shop_purchases
-- Parents need to mark purchases as fulfilled

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'shop_purchases' 
    AND policyname = 'shop_purchases_update'
  ) THEN
    CREATE POLICY "shop_purchases_update" ON shop_purchases FOR UPDATE
      USING (kid_id IN (SELECT id FROM kids WHERE family_id IN (SELECT user_family_ids())))
      WITH CHECK (kid_id IN (SELECT id FROM kids WHERE family_id IN (SELECT user_family_ids())));
  END IF;
END $$;
