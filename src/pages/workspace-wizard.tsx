import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Building2,
  Globe,
  Palette,
  CheckCircle2,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAppStore } from '@/stores/app-store'
import { useAuth } from '@/contexts/auth-context'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import {
  TIMEZONES,
  INDUSTRIES,
  DEFAULT_TIMEZONE,
  DEFAULT_BRAND_COLOR,
  getTimezoneLabel,
} from '@/data/constants'

const steps = [
  { id: 1, title: 'Business Info', icon: Building2 },
  { id: 2, title: 'Timezone', icon: Globe },
  { id: 3, title: 'Branding', icon: Palette },
  { id: 4, title: 'Review', icon: CheckCircle2 },
]

interface WizardData {
  name: string
  industry: string
  website: string
  timezone: string
  brandColor: string
  logoUrl: string
}

export function WorkspaceWizardPage() {
  const navigate = useNavigate()
  const { addToast } = useAppStore()
  const { user, refreshWorkspaces, setCurrentWorkspaceId } = useAuth()
  const [isCreating, setIsCreating] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const [wizardData, setWizardData] = useState<WizardData>({
    name: '',
    industry: '',
    website: '',
    timezone: DEFAULT_TIMEZONE,
    brandColor: DEFAULT_BRAND_COLOR,
    logoUrl: '',
  })

  const updateField = (field: keyof WizardData, value: string) => {
    setWizardData((prev) => ({ ...prev, [field]: value }))
  }

  const canProceed = () => {
    if (currentStep === 1) {
      return wizardData.name.trim() !== ''
    }
    return true
  }

  const handleNext = () => {
    if (currentStep < 4) setCurrentStep(currentStep + 1)
  }

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1)
  }

  const handleCreate = async () => {
    if (!user) {
      console.error('handleCreate: No user found in auth context')
      addToast({
        title: 'Authentication Error',
        description: 'You must be logged in to create a workspace. Please refresh and try again.',
        variant: 'error',
      })
      return
    }

    setIsCreating(true)

    try {
      // Debug: Check if we have a valid session
      const { data: { session } } = await supabase.auth.getSession()
      console.log('Current session:', {
        hasSession: !!session,
        userId: session?.user?.id,
        accessToken: session?.access_token ? 'present' : 'missing',
      })

      if (!session) {
        console.error('No active session - cannot create workspace')
        addToast({
          title: 'Error',
          description: 'You must be logged in to create a workspace',
          variant: 'error'
        })
        return
      }

      // Create the workspace
      const { data: workspace, error: workspaceError } = await supabase
        .from('workspaces')
        .insert({
          name: wizardData.name,
          timezone: wizardData.timezone,
          created_by: user.id,
          industry: wizardData.industry || null,
          website: wizardData.website || null,
          brand_color: wizardData.brandColor,
          logo_url: wizardData.logoUrl || null,
        } as unknown as never)
        .select()
        .single()

      if (workspaceError || !workspace) {
        console.error('Workspace creation error:', workspaceError)
        addToast({
          title: 'Error',
          description: workspaceError?.message || 'Failed to create workspace',
          variant: 'error'
        })
        return
      }

      // Add current user as owner
      const workspaceData = workspace as { id: string }
      const { error: memberError } = await supabase
        .from('workspace_members')
        .insert({
          workspace_id: workspaceData.id,
          user_id: user.id,
          role: 'owner',
          accepted_at: new Date().toISOString(),
        } as unknown as never)

      if (memberError) {
        console.error('Member creation error:', memberError)
        addToast({
          title: 'Error',
          description: memberError?.message || 'Failed to add you to workspace',
          variant: 'error'
        })
        return
      }

      // Refresh workspaces and set as current
      await refreshWorkspaces()
      setCurrentWorkspaceId(workspaceData.id)

      addToast({ title: 'Workspace created successfully!', variant: 'success' })
      navigate('/')
    } catch (err) {
      console.error('Workspace creation failed:', err)
      addToast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to create workspace',
        variant: 'error'
      })
    } finally {
      setIsCreating(false)
    }
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold">Business Information</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Tell us about your business
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Workspace Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., Apex Trading Academy"
                  value={wizardData.name}
                  onChange={(e) => updateField('name', e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  This will be the name of your workspace
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="industry">Industry</Label>
                <Select value={wizardData.industry} onValueChange={(v) => updateField('industry', v)}>
                  <SelectTrigger id="industry">
                    <SelectValue placeholder="Select your industry" />
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
                <Label htmlFor="website">Website (optional)</Label>
                <Input
                  id="website"
                  placeholder="https://yourwebsite.com"
                  value={wizardData.website}
                  onChange={(e) => updateField('website', e.target.value)}
                />
              </div>
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold">Timezone Settings</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Set your default timezone for webinar scheduling
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="timezone">Default Timezone</Label>
                <Select value={wizardData.timezone} onValueChange={(v) => updateField('timezone', v)}>
                  <SelectTrigger id="timezone">
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
                <p className="text-xs text-muted-foreground">
                  All webinar times will default to this timezone
                </p>
              </div>
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold">Branding</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Customize your workspace appearance
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="brandColor">Brand Color</Label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    id="brandColor"
                    value={wizardData.brandColor}
                    onChange={(e) => updateField('brandColor', e.target.value)}
                    className="h-10 w-16 rounded-lg border border-input-border cursor-pointer"
                  />
                  <Input
                    value={wizardData.brandColor}
                    onChange={(e) => updateField('brandColor', e.target.value)}
                    className="w-32"
                    placeholder="#6366F1"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  This color will be used for registration pages and emails
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="logo">Logo URL (optional)</Label>
                <Input
                  id="logo"
                  placeholder="https://yoursite.com/logo.png"
                  value={wizardData.logoUrl}
                  onChange={(e) => updateField('logoUrl', e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Upload your logo later in workspace settings
                </p>
              </div>
            </div>
          </div>
        )

      case 4:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold">Review & Create</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Review your workspace settings before creating
              </p>
            </div>

            <div className="space-y-4 rounded-lg border border-border p-4">
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-sm text-muted-foreground">Workspace Name</span>
                <span className="text-sm font-medium">{wizardData.name || '-'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-sm text-muted-foreground">Industry</span>
                <span className="text-sm font-medium">{wizardData.industry || '-'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-sm text-muted-foreground">Website</span>
                <span className="text-sm font-medium">{wizardData.website || '-'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-sm text-muted-foreground">Timezone</span>
                <span className="text-sm font-medium">
                  {getTimezoneLabel(wizardData.timezone)}
                </span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-sm text-muted-foreground">Brand Color</span>
                <div className="flex items-center gap-2">
                  <div
                    className="h-5 w-5 rounded-full border border-border"
                    style={{ backgroundColor: wizardData.brandColor }}
                  />
                  <span className="text-sm font-medium">{wizardData.brandColor}</span>
                </div>
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-background-secondary">
      {/* Header */}
      <div className="bg-background pt-4 pb-2 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="h-8 w-8"
              aria-label="Go back"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-lg font-semibold">Create New Workspace</h1>
              <p className="text-xs text-muted-foreground">
                Step {currentStep} of {steps.length} — {steps[currentStep - 1].title}
              </p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="flex gap-1.5 mt-4 pb-4">
            {steps.map((step) => (
              <div
                key={step.id}
                className={cn(
                  'h-1.5 flex-1 rounded-full transition-colors',
                  step.id <= currentStep ? 'bg-primary' : 'bg-muted'
                )}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 sm:px-6 py-6">
        <div className="max-w-3xl mx-auto">
          {renderStep()}
        </div>
      </div>

      {/* Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-background px-4 sm:px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={handleBack}
            disabled={currentStep === 1}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>

          <div className="flex items-center gap-2">
            {currentStep < 4 ? (
              <Button
                onClick={handleNext}
                disabled={!canProceed()}
                className="gap-2"
              >
                Continue
                <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={handleCreate}
                disabled={!wizardData.name || isCreating}
                className="gap-2"
              >
                {isCreating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
                Create Workspace
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
