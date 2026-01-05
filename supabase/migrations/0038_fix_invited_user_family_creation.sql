-- Fix: Only create family for NEW users who don't have pending invites
-- Users joining via invite should NOT get a new family auto-created

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_family_id UUID;
  has_pending_invite BOOLEAN;
BEGIN
  -- Create profile
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO NOTHING;
  
  -- Check if this user has a pending family invite
  SELECT EXISTS(
    SELECT 1 FROM public.family_invites 
    WHERE email = NEW.email 
    AND status = 'pending'
  ) INTO has_pending_invite;
  
  -- Only create a new family if they DON'T have a pending invite
  IF NOT has_pending_invite THEN
    INSERT INTO public.families (name, created_by)
    VALUES ('My Family', NEW.id)
    RETURNING id INTO new_family_id;
    
    -- Add user as admin of their new family
    INSERT INTO public.family_members (family_id, user_id, role, accepted_at)
    VALUES (new_family_id, NEW.id, 'admin', NOW());
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = '';

-- Note: Users with pending invites will be added to the family 
-- when they click "Accept" in the UI (via acceptFamilyInvite function)
