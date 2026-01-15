import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, ChevronRight, ExternalLink, Video, Users, Mail, MessageSquare, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAppStore } from '@/stores/app-store'
import { cn } from '@/lib/utils'

interface OnboardingStepData {
  id: string
  title: string
  description: string
  icon: React.ElementType
  fields: { key: string; label: string; type: string; placeholder: string; helpText?: string }[]
  helpUrl?: string
  helpText?: string
}

const steps: OnboardingStepData[] = [
  {
    id: 'basics',
    title: 'Workspace Basics',
    description: 'Set up your workspace name and preferences',
    icon: Sparkles,
    fields: [
      { key: 'workspaceName', label: 'Workspace Name', type: 'text', placeholder: 'e.g., My Trading Academy' },
    ],
  },
  {
    id: 'zoom',
    title: 'Connect Zoom',
    description: 'Link your Zoom account for webinar hosting',
    icon: Video,
    fields: [
      { key: 'zoomClientId', label: 'Client ID', type: 'text', placeholder: 'Enter your Zoom Client ID' },
      { key: 'zoomClientSecret', label: 'Client Secret', type: 'password', placeholder: 'Enter your Zoom Client Secret' },
    ],
    helpUrl: 'https://marketplace.zoom.us/docs/guides/build/oauth-app',
    helpText: 'Create a Server-to-Server OAuth app in the Zoom Marketplace',
  },
  {
    id: 'ghl',
    title: 'Connect GoHighLevel',
    description: 'Sync registrants with your GHL account',
    icon: Users,
    fields: [
      { key: 'ghlApiKey', label: 'API Key', type: 'password', placeholder: 'Enter your GHL API Key' },
      { key: 'ghlLocationId', label: 'Location ID', type: 'text', placeholder: 'Enter your Location ID' },
    ],
    helpUrl: 'https://highlevel.com/docs',
    helpText: 'Find your API key in GHL Settings > API Keys',
  },
  {
    id: 'email',
    title: 'Email Platform',
    description: 'Connect your email marketing tool',
    icon: Mail,
    fields: [
      { key: 'emailSiteId', label: 'Site ID', type: 'text', placeholder: 'Your email platform Site ID' },
      { key: 'emailApiKey', label: 'API Key', type: 'password', placeholder: 'Your email platform API Key' },
    ],
    helpText: 'Supports Customer.io, ConvertKit, ActiveCampaign, and more',
  },
  {
    id: 'slack',
    title: 'Connect Slack',
    description: 'Get real-time notifications in Slack',
    icon: MessageSquare,
    fields: [
      { key: 'slackWebhookUrl', label: 'Webhook URL', type: 'text', placeholder: 'https://hooks.slack.com/...' },
    ],
    helpUrl: 'https://api.slack.com/messaging/webhooks',
    helpText: 'Create an incoming webhook in your Slack workspace',
  },
]

export function OnboardingPage() {
  const navigate = useNavigate()
  const { setOnboardingComplete, addToast } = useAppStore()
  const [currentStep, setCurrentStep] = useState(0)
  const [formData, setFormData] = useState<Record<string, string>>({})
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set())
  const [skippedSteps, setSkippedSteps] = useState<Set<string>>(new Set())

  const step = steps[currentStep]
  const isLastStep = currentStep === steps.length - 1
  const isFirstStep = currentStep === 0

  const handleChange = (key: string, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }))
  }

  const handleNext = () => {
    const hasValues = step.fields.some((field) => formData[field.key]?.trim())
    if (hasValues) {
      setCompletedSteps((prev) => new Set([...prev, step.id]))
    }

    if (isLastStep) {
      handleComplete()
    } else {
      setCurrentStep((prev) => prev + 1)
    }
  }

  const handleSkip = () => {
    setSkippedSteps((prev) => new Set([...prev, step.id]))
    if (isLastStep) {
      handleComplete()
    } else {
      setCurrentStep((prev) => prev + 1)
    }
  }

  const handleBack = () => {
    if (!isFirstStep) {
      setCurrentStep((prev) => prev - 1)
    }
  }

  const handleComplete = () => {
    setOnboardingComplete(true)
    addToast({
      title: 'Welcome to WebinarOS!',
      description: 'Your workspace is ready. Let\'s create your first webinar!',
      variant: 'success',
    })
    navigate('/')
  }

  const getStepStatus = (stepId: string, index: number) => {
    if (completedSteps.has(stepId)) return 'completed'
    if (skippedSteps.has(stepId)) return 'skipped'
    if (index === currentStep) return 'current'
    return 'pending'
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-4 py-12">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
            <span className="text-xl font-bold text-white">W</span>
          </div>
          <h1 className="text-2xl font-semibold">Welcome to WebinarOS</h1>
          <p className="mt-1 text-muted-foreground">
            Let's get your workspace set up in a few quick steps
          </p>
        </div>

        <div className="mb-8 flex items-center justify-center">
          {steps.map((s, index) => {
            const status = getStepStatus(s.id, index)
            return (
              <div key={s.id} className="flex items-center">
                <div
                  className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors',
                    status === 'completed' && 'border-success bg-success text-white',
                    status === 'skipped' && 'border-muted-foreground bg-muted',
                    status === 'current' && 'border-primary bg-primary text-white',
                    status === 'pending' && 'border-border'
                  )}
                >
                  {status === 'completed' ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <s.icon className="h-5 w-5" />
                  )}
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={cn(
                      'h-0.5 w-8 sm:w-12',
                      index < currentStep ? 'bg-success' : 'bg-border'
                    )}
                  />
                )}
              </div>
            )
          })}
        </div>

        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
              <step.icon className="h-6 w-6 text-primary" />
            </div>
            <CardTitle>{step.title}</CardTitle>
            <CardDescription>{step.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {step.fields.map((field) => (
              <div key={field.key} className="space-y-2">
                <Label htmlFor={field.key}>{field.label}</Label>
                <Input
                  id={field.key}
                  type={field.type}
                  placeholder={field.placeholder}
                  value={formData[field.key] || ''}
                  onChange={(e) => handleChange(field.key, e.target.value)}
                />
                {field.helpText && (
                  <p className="text-xs text-muted-foreground">{field.helpText}</p>
                )}
              </div>
            ))}

            {step.helpText && (
              <p className="text-sm text-muted-foreground">{step.helpText}</p>
            )}

            {step.helpUrl && (
              <a
                href={step.helpUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-sm text-primary hover:underline"
              >
                <ExternalLink className="h-3 w-3" />
                How to find these credentials
              </a>
            )}
          </CardContent>
        </Card>

        <div className="mt-6 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={handleBack}
            disabled={isFirstStep}
          >
            Back
          </Button>

          <div className="flex items-center gap-2">
            {!isFirstStep && (
              <Button variant="outline" onClick={handleSkip}>
                Skip for now
              </Button>
            )}
            <Button onClick={handleNext}>
              {isLastStep ? 'Complete Setup' : 'Continue'}
              {!isLastStep && <ChevronRight className="ml-1 h-4 w-4" />}
            </Button>
          </div>
        </div>

        {isLastStep && (
          <div className="mt-8">
            <Card className="bg-muted/50">
              <CardContent className="py-6">
                <h3 className="mb-4 font-medium">Setup Summary</h3>
                <div className="space-y-2">
                  {steps.map((s) => {
                    const status = completedSteps.has(s.id)
                      ? 'Connected'
                      : skippedSteps.has(s.id)
                      ? 'Skipped'
                      : 'Pending'
                    return (
                      <div key={s.id} className="flex items-center justify-between text-sm">
                        <span>{s.title}</span>
                        <span
                          className={cn(
                            status === 'Connected' && 'text-success',
                            status === 'Skipped' && 'text-muted-foreground',
                            status === 'Pending' && 'text-warning'
                          )}
                        >
                          {status}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
