import { useState, useEffect } from 'react'
import { PageHeader } from '@/components/layout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useAuth } from '@/contexts/auth-context'
import { useAppStore } from '@/stores/app-store'
import { Loader2, User, Building2, Moon, Sun, Settings2, Pencil, Trash2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Workspace } from '@/types/database'
import { TIMEZONES, INDUSTRIES, getTimezoneLabel } from '@/data/constants'

interface EditWorkspaceData {
  name: string
  timezone: string
  industry: string
  website: string
  brandColor: string
}

export function SettingsPage() {
  const { profile, currentWorkspace, workspaces, refreshWorkspaces, setCurrentWorkspaceId } = useAuth()
  const { theme, toggleTheme, addToast } = useAppStore()
  const [isUpdating, setIsUpdating] = useState(false)
  const [fullName, setFullName] = useState(profile?.full_name || '')

  // Workspace management state
  const [editingWorkspace, setEditingWorkspace] = useState<Workspace | null>(null)
  const [editData, setEditData] = useState<EditWorkspaceData>({
    name: '',
    timezone: '',
    industry: '',
    website: '',
    brandColor: '',
  })
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isSavingWorkspace, setIsSavingWorkspace] = useState(false)

  // Delete confirmation state
  const [deletingWorkspace, setDeletingWorkspace] = useState<Workspace | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeletingWorkspace, setIsDeletingWorkspace] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')

  // Update fullName when profile changes
  useEffect(() => {
    if (profile?.full_name) {
      setFullName(profile.full_name)
    }
  }, [profile?.full_name])

  const handleUpdateProfile = async () => {
    if (!profile) return

    setIsUpdating(true)
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: fullName })
      .eq('id', profile.id)

    if (error) {
      addToast({
        title: 'Error',
        description: 'Failed to update profile',
        variant: 'error',
      })
    } else {
      addToast({
        title: 'Profile updated',
        description: 'Your profile has been updated',
        variant: 'success',
      })
    }
    setIsUpdating(false)
  }

  const openEditDialog = (workspace: Workspace) => {
    setEditingWorkspace(workspace)
    setEditData({
      name: workspace.name,
      timezone: workspace.timezone,
      industry: workspace.industry || '',
      website: workspace.website || '',
      brandColor: workspace.brand_color,
    })
    setIsEditDialogOpen(true)
  }

  const handleSaveWorkspace = async () => {
    if (!editingWorkspace) return

    setIsSavingWorkspace(true)

    const { error } = await supabase
      .from('workspaces')
      .update({
        name: editData.name,
        timezone: editData.timezone,
        industry: editData.industry || null,
        website: editData.website || null,
        brand_color: editData.brandColor,
      })
      .eq('id', editingWorkspace.id)

    if (error) {
      addToast({
        title: 'Error',
        description: 'Failed to update workspace',
        variant: 'error',
      })
    } else {
      addToast({
        title: 'Workspace updated',
        description: 'Workspace settings have been saved',
        variant: 'success',
      })
      await refreshWorkspaces()
      setIsEditDialogOpen(false)
      setEditingWorkspace(null)
    }

    setIsSavingWorkspace(false)
  }

  const openDeleteDialog = (workspace: Workspace) => {
    setDeletingWorkspace(workspace)
    setDeleteConfirmText('')
    setIsDeleteDialogOpen(true)
  }

  const handleDeleteWorkspace = async () => {
    if (!deletingWorkspace) return

    setIsDeletingWorkspace(true)

    // First delete workspace members
    const { error: memberError } = await supabase
      .from('workspace_members')
      .delete()
      .eq('workspace_id', deletingWorkspace.id)

    if (memberError) {
      addToast({
        title: 'Error',
        description: 'Failed to delete workspace members',
        variant: 'error',
      })
      setIsDeletingWorkspace(false)
      return
    }

    // Then delete the workspace
    const { error } = await supabase
      .from('workspaces')
      .delete()
      .eq('id', deletingWorkspace.id)

    if (error) {
      addToast({
        title: 'Error',
        description: 'Failed to delete workspace',
        variant: 'error',
      })
    } else {
      addToast({
        title: 'Workspace deleted',
        description: `"${deletingWorkspace.name}" has been deleted`,
        variant: 'success',
      })

      // If we deleted the current workspace, switch to another one
      if (currentWorkspace?.id === deletingWorkspace.id) {
        const remaining = workspaces.filter(w => w.id !== deletingWorkspace.id)
        if (remaining.length > 0) {
          setCurrentWorkspaceId(remaining[0].id)
        }
      }

      await refreshWorkspaces()
      setIsDeleteDialogOpen(false)
      setDeletingWorkspace(null)
    }

    setIsDeletingWorkspace(false)
  }

  const canDelete = deletingWorkspace && deleteConfirmText === deletingWorkspace.name

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="Settings"
        description="Manage your account and workspace settings"
      />

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList>
          <TabsTrigger value="profile" className="gap-2">
            <User className="h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="workspace" className="gap-2">
            <Building2 className="h-4 w-4" />
            Workspace
          </TabsTrigger>
          <TabsTrigger value="manage" className="gap-2">
            <Settings2 className="h-4 w-4" />
            Manage
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Update your personal information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter your full name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  value={profile?.email || ''}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  Email cannot be changed
                </p>
              </div>
              <Button onClick={handleUpdateProfile} disabled={isUpdating}>
                {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>Customize how WebinarOS looks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Theme</p>
                  <p className="text-sm text-muted-foreground">
                    Switch between light and dark mode
                  </p>
                </div>
                <Button variant="outline" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
                  {theme === 'light' ? (
                    <Moon className="h-4 w-4" />
                  ) : (
                    <Sun className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="workspace" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Current Workspace</CardTitle>
              <CardDescription>
                {currentWorkspace?.name || 'No workspace selected'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Workspace Name</Label>
                <Input
                  value={currentWorkspace?.name || ''}
                  disabled
                  className="bg-muted"
                />
              </div>
              <div className="space-y-2">
                <Label>Timezone</Label>
                <Input
                  value={currentWorkspace?.timezone || ''}
                  disabled
                  className="bg-muted"
                />
              </div>
              {currentWorkspace && (
                <Button
                  variant="outline"
                  onClick={() => openEditDialog(currentWorkspace)}
                  className="gap-2"
                >
                  <Pencil className="h-4 w-4" />
                  Edit Workspace
                </Button>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Your Workspaces</CardTitle>
              <CardDescription>
                You have access to {workspaces.length} workspace{workspaces.length !== 1 ? 's' : ''}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {workspaces.map((workspace) => (
                  <div
                    key={workspace.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{workspace.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {workspace.timezone}
                      </p>
                    </div>
                    {workspace.id === currentWorkspace?.id && (
                      <span className="text-xs text-primary font-medium">Current</span>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="manage" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Manage Workspaces</CardTitle>
              <CardDescription>
                Edit or delete your workspaces
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {workspaces.map((workspace) => (
                  <div
                    key={workspace.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div
                          className="h-8 w-8 rounded-lg flex items-center justify-center text-white text-sm font-semibold"
                          style={{ backgroundColor: workspace.brand_color }}
                        >
                          {workspace.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium">{workspace.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {getTimezoneLabel(workspace.timezone)}
                            {workspace.industry && ` • ${workspace.industry}`}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {workspace.id === currentWorkspace?.id && (
                        <span className="text-xs text-primary font-medium mr-2">Current</span>
                      )}
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => openEditDialog(workspace)}
                        aria-label={`Edit ${workspace.name}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => openDeleteDialog(workspace)}
                        className="text-destructive hover:text-destructive"
                        aria-label={`Delete ${workspace.name}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-destructive/50">
            <CardHeader>
              <CardTitle className="text-destructive">Danger Zone</CardTitle>
              <CardDescription>
                Irreversible actions for your workspaces
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Deleting a workspace will permanently remove all webinars, registrants,
                integrations, and data associated with it. This action cannot be undone.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Workspace Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Workspace</DialogTitle>
            <DialogDescription>
              Update your workspace settings
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Workspace Name</Label>
              <Input
                id="edit-name"
                value={editData.name}
                onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                placeholder="My Workspace"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-timezone">Timezone</Label>
              <Select
                value={editData.timezone}
                onValueChange={(v) => setEditData({ ...editData, timezone: v })}
              >
                <SelectTrigger id="edit-timezone">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIMEZONES.map((tz) => (
                    <SelectItem key={tz.value} value={tz.value}>
                      {tz.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-industry">Industry</Label>
              <Select
                value={editData.industry}
                onValueChange={(v) => setEditData({ ...editData, industry: v })}
              >
                <SelectTrigger id="edit-industry">
                  <SelectValue placeholder="Select industry" />
                </SelectTrigger>
                <SelectContent>
                  {INDUSTRIES.map((industry) => (
                    <SelectItem key={industry} value={industry}>
                      {industry}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-website">Website</Label>
              <Input
                id="edit-website"
                value={editData.website}
                onChange={(e) => setEditData({ ...editData, website: e.target.value })}
                placeholder="https://yourwebsite.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-brandColor">Brand Color</Label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  id="edit-brandColor"
                  value={editData.brandColor}
                  onChange={(e) => setEditData({ ...editData, brandColor: e.target.value })}
                  className="h-10 w-16 rounded-lg border border-input-border cursor-pointer"
                />
                <Input
                  value={editData.brandColor}
                  onChange={(e) => setEditData({ ...editData, brandColor: e.target.value })}
                  className="w-32"
                  placeholder="#6366F1"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveWorkspace} disabled={isSavingWorkspace || !editData.name.trim()}>
              {isSavingWorkspace && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-destructive">Delete Workspace</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete the workspace
              and all associated data including webinars, registrants, and integrations.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="text-sm text-destructive font-medium">
                You are about to delete: {deletingWorkspace?.name}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="delete-confirm">
                Type <span className="font-semibold">{deletingWorkspace?.name}</span> to confirm
              </Label>
              <Input
                id="delete-confirm"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="Enter workspace name"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteWorkspace}
              disabled={!canDelete || isDeletingWorkspace}
            >
              {isDeletingWorkspace && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete Workspace
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
