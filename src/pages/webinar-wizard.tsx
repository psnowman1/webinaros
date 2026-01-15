import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { Check, ChevronRight, ChevronLeft, Loader2 } from 'lucide-react'
import { PageHeader } from '@/components/layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAppStore } from '@/stores/app-store'
import { useAuth } from '@/contexts/auth-context'
import { useCreateWebinar, useIntegrations } from '@/hooks/use-supabase-data'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'
import { TIMEZONES, DEFAULT_TIMEZONE, getTimezoneLabel } from '@/data/constants'

const steps = [
  { id: 'basics', title: 'Basic Info', description: 'Name and description' },
  { id: 'schedule', title: 'Schedule', description: 'Date, time, and duration' },
  { id: 'integrations', title: 'Integrations', description: 'Connect your tools' },
  { id: 'review', title: 'Review', description: 'Confirm and create' },
]

export function WebinarWizardPage() {
  const navigate = useNavigate()
  const { addToast } = useAppStore()
  const { currentWorkspace } = useAuth()
  const { createWebinar, isLoading: creating } = useCreateWebinar()
  const { integrations } = useIntegrations()

  const [currentStep, setCurrentStep] = useState(0)
  const [createZoomWebinar, setCreateZoomWebinar] = useState(true)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    scheduledDate: format(new Date(), 'yyyy-MM-dd'),
    scheduledTime: '10:00',
    timezone: DEFAULT_TIMEZONE,
    duration: '60',
    type: 'live' as const,
    ghlRegistrationWebhook: '',
    ghlAttendanceWebhook: '',
  })

  const updateForm = (key: string, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }))
  }

  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return formData.title.trim().length > 0
      case 1:
        return formData.scheduledDate && formData.scheduledTime
      case 2:
        return true // Integrations are optional
      case 3:
        return true
      default:
        return false
    }
  }

  const handleCreate = async () => {
    if (!currentWorkspace) return

    const scheduledAt = new Date(`${formData.scheduledDate}T${formData.scheduledTime}:00`)
    const zoomConnected = zoomIntegration?.status === 'active'

    let zoomData: {
      zoomWebinarId?: string
      zoomJoinUrl?: string
      zoomStartUrl?: string
      zoomRegistrationUrl?: string
    } = {}

    // Create Zoom webinar if option is enabled and Zoom is connected
    if (createZoomWebinar && zoomConnected) {
      try {
        const response = await api.createZoomWebinar(currentWorkspace.id, {
          topic: formData.title,
          startTime: scheduledAt.toISOString(),
          duration: parseInt(formData.duration),
          timezone: formData.timezone,
          agenda: formData.description || undefined,
        })

        zoomData = {
          zoomWebinarId: response.data.id,
          zoomJoinUrl: response.data.joinUrl,
          zoomStartUrl: response.data.startUrl,
          zoomRegistrationUrl: response.data.registrationUrl,
        }

        addToast({
          title: 'Zoom webinar created',
          description: 'Your Zoom webinar has been scheduled',
          variant: 'success',
        })
      } catch (error) {
        addToast({
          title: 'Zoom error',
          description: error instanceof Error ? error.message : 'Failed to create Zoom webinar',
          variant: 'error',
        })
        // Continue creating the local webinar even if Zoom fails
      }
    }

    const { data, error } = await createWebinar({
      title: formData.title,
      description: formData.description || null,
      scheduled_at: scheduledAt.toISOString(),
      timezone: formData.timezone,
      duration_minutes: parseInt(formData.duration),
      type: formData.type,
      status: 'scheduled',
      ghl_registration_webhook: formData.ghlRegistrationWebhook || null,
      ghl_attendance_webhook: formData.ghlAttendanceWebhook || null,
      zoom_meeting_id: zoomData.zoomWebinarId || null,
      zoom_join_url: zoomData.zoomJoinUrl || null,
      zoom_start_url: zoomData.zoomStartUrl || null,
    })

    if (error) {
      addToast({
        title: 'Error',
        description: 'Failed to create webinar',
        variant: 'error',
      })
    } else if (data) {
      addToast({
        title: 'Webinar created',
        description: `${formData.title} has been created`,
        variant: 'success',
      })
      navigate(`/webinars/${data.id}`)
    }
  }

  const zoomIntegration = integrations.find(i => i.provider === 'zoom')

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="Create Webinar"
        description="Set up a new webinar step by step"
      />

      {/* Progress Steps */}
      <div className="flex items-center justify-between px-2">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full border-2 text-sm font-medium',
                  index < currentStep
                    ? 'border-primary bg-primary text-white'
                    : index === currentStep
                    ? 'border-primary text-primary'
                    : 'border-muted text-muted-foreground'
                )}
              >
                {index < currentStep ? <Check className="h-4 w-4" /> : index + 1}
              </div>
              <span className="mt-1 text-[10px] sm:text-xs text-center max-w-[60px] sm:max-w-[80px]">
                {step.title}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div
                className={cn(
                  'h-0.5 w-8 sm:w-16 mx-2',
                  index < currentStep ? 'bg-primary' : 'bg-muted'
                )}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <Card>
        <CardHeader>
          <CardTitle>{steps[currentStep].title}</CardTitle>
          <CardDescription>{steps[currentStep].description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {currentStep === 0 && (
            <>
              <div className="space-y-2">
                <Label htmlFor="title">Webinar Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => updateForm('title', e.target.value)}
                  placeholder="e.g., How to Scale Your Business"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => updateForm('description', e.target.value)}
                  placeholder="What will attendees learn?"
                  rows={4}
                />
              </div>
            </>
          )}

          {currentStep === 1 && (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="date">Date *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.scheduledDate}
                    onChange={(e) => updateForm('scheduledDate', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="time">Time *</Label>
                  <Input
                    id="time"
                    type="time"
                    value={formData.scheduledTime}
                    onChange={(e) => updateForm('scheduledTime', e.target.value)}
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select
                    value={formData.timezone}
                    onValueChange={(v) => updateForm('timezone', v)}
                  >
                    <SelectTrigger>
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
                  <Label htmlFor="duration">Duration (minutes)</Label>
                  <Select
                    value={formData.duration}
                    onValueChange={(v) => updateForm('duration', v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30">30 minutes</SelectItem>
                      <SelectItem value="45">45 minutes</SelectItem>
                      <SelectItem value="60">60 minutes</SelectItem>
                      <SelectItem value="90">90 minutes</SelectItem>
                      <SelectItem value="120">2 hours</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </>
          )}

          {currentStep === 2 && (
            <>
              <div className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Zoom</p>
                      <p className="text-sm text-muted-foreground">
                        {zoomIntegration?.status === 'active' ? 'Connected' : 'Not connected'}
                      </p>
                    </div>
                    {zoomIntegration?.status !== 'active' ? (
                      <Button variant="outline" size="sm" onClick={() => navigate('/integrations')}>
                        Connect
                      </Button>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="createZoom"
                          checked={createZoomWebinar}
                          onCheckedChange={(checked) => setCreateZoomWebinar(checked === true)}
                        />
                        <Label htmlFor="createZoom" className="text-sm cursor-pointer">
                          Create Zoom webinar
                        </Label>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ghlRegistrationWebhook">GHL Registration Webhook URL (optional)</Label>
                  <Input
                    id="ghlRegistrationWebhook"
                    value={formData.ghlRegistrationWebhook}
                    onChange={(e) => updateForm('ghlRegistrationWebhook', e.target.value)}
                    placeholder="https://services.leadconnectorhq.com/hooks/..."
                  />
                  <p className="text-xs text-muted-foreground">
                    Override the default GHL webhook for this specific webinar
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ghlAttendanceWebhook">GHL Attendance Webhook URL (optional)</Label>
                  <Input
                    id="ghlAttendanceWebhook"
                    value={formData.ghlAttendanceWebhook}
                    onChange={(e) => updateForm('ghlAttendanceWebhook', e.target.value)}
                    placeholder="https://services.leadconnectorhq.com/hooks/..."
                  />
                  <p className="text-xs text-muted-foreground">
                    We'll notify this webhook when attendance status changes
                  </p>
                </div>
              </div>
            </>
          )}

          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">Title</p>
                  <p className="font-medium">{formData.title}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Date & Time</p>
                  <p className="font-medium">
                    {format(new Date(`${formData.scheduledDate}T${formData.scheduledTime}`), 'PPP')} at{' '}
                    {format(new Date(`${formData.scheduledDate}T${formData.scheduledTime}`), 'p')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Timezone</p>
                  <p className="font-medium">{getTimezoneLabel(formData.timezone)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Duration</p>
                  <p className="font-medium">{formData.duration} minutes</p>
                </div>
              </div>
              {formData.description && (
                <div>
                  <p className="text-sm text-muted-foreground">Description</p>
                  <p className="font-medium">{formData.description}</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => setCurrentStep(prev => prev - 1)}
          disabled={currentStep === 0}
        >
          <ChevronLeft className="mr-1 h-4 w-4" />
          Back
        </Button>

        {currentStep < steps.length - 1 ? (
          <Button
            onClick={() => setCurrentStep(prev => prev + 1)}
            disabled={!canProceed()}
          >
            Next
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        ) : (
          <Button onClick={handleCreate} disabled={creating}>
            {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Webinar
          </Button>
        )}
      </div>
    </div>
  )
}
