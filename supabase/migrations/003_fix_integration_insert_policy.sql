-- Fix the integrations RLS policy to allow INSERT operations
-- The original "FOR ALL" policy only had USING but not WITH CHECK

-- Drop the existing policy
DROP POLICY IF EXISTS "Workspace access for integrations" ON integrations;

-- Create separate policies for each operation

-- SELECT policy
CREATE POLICY "Users can view integrations"
ON integrations FOR SELECT
USING (public.user_has_workspace_access(workspace_id));

-- INSERT policy
CREATE POLICY "Users can create integrations"
ON integrations FOR INSERT
WITH CHECK (public.user_has_workspace_access(workspace_id));

-- UPDATE policy
CREATE POLICY "Users can update integrations"
ON integrations FOR UPDATE
USING (public.user_has_workspace_access(workspace_id))
WITH CHECK (public.user_has_workspace_access(workspace_id));

-- DELETE policy
CREATE POLICY "Users can delete integrations"
ON integrations FOR DELETE
USING (public.user_has_workspace_access(workspace_id));
