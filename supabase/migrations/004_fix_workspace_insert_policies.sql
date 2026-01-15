-- Fix RLS policies for workspace and workspace_members to allow INSERT

-- WORKSPACES: Allow any authenticated user to create a workspace
DROP POLICY IF EXISTS "Members can view workspaces" ON workspaces;
DROP POLICY IF EXISTS "Owners can update workspaces" ON workspaces;
DROP POLICY IF EXISTS "Users can create workspaces" ON workspaces;

-- SELECT: Members can view their workspaces
CREATE POLICY "Members can view workspaces"
ON workspaces FOR SELECT
USING (public.user_has_workspace_access(id));

-- INSERT: Any authenticated user can create a workspace
CREATE POLICY "Users can create workspaces"
ON workspaces FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- UPDATE: Only owners/admins can update
CREATE POLICY "Owners can update workspaces"
ON workspaces FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM workspace_members
    WHERE workspace_id = id
    AND user_id = auth.uid()
    AND role IN ('owner', 'admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM workspace_members
    WHERE workspace_id = id
    AND user_id = auth.uid()
    AND role IN ('owner', 'admin')
  )
);

-- WORKSPACE_MEMBERS: Fix policies
DROP POLICY IF EXISTS "Members can view workspace members" ON workspace_members;
DROP POLICY IF EXISTS "Users can add themselves to workspace" ON workspace_members;
DROP POLICY IF EXISTS "Owners can manage workspace members" ON workspace_members;

-- SELECT: Members can view workspace members
CREATE POLICY "Members can view workspace members"
ON workspace_members FOR SELECT
USING (public.user_has_workspace_access(workspace_id));

-- INSERT: Users can add themselves (for initial workspace creation)
-- Or admins can add others
CREATE POLICY "Users can join workspaces"
ON workspace_members FOR INSERT
WITH CHECK (
  -- User is adding themselves
  user_id = auth.uid()
  OR
  -- Or user is an admin/owner of the workspace
  EXISTS (
    SELECT 1 FROM workspace_members wm
    WHERE wm.workspace_id = workspace_members.workspace_id
    AND wm.user_id = auth.uid()
    AND wm.role IN ('owner', 'admin')
  )
);

-- UPDATE: Owners can update member roles
CREATE POLICY "Owners can update members"
ON workspace_members FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM workspace_members wm
    WHERE wm.workspace_id = workspace_members.workspace_id
    AND wm.user_id = auth.uid()
    AND wm.role = 'owner'
  )
);

-- DELETE: Owners can remove members, or users can remove themselves
CREATE POLICY "Members can be removed"
ON workspace_members FOR DELETE
USING (
  user_id = auth.uid()
  OR
  EXISTS (
    SELECT 1 FROM workspace_members wm
    WHERE wm.workspace_id = workspace_members.workspace_id
    AND wm.user_id = auth.uid()
    AND wm.role = 'owner'
  )
);
