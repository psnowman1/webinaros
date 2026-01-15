import { useState } from 'react'
import { format, parseISO } from 'date-fns'
import { Check, ExternalLink, Loader2, Plus, TestTube2 } from 'lucide-react'
import { PageHeader } from '@/components/layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { LoadingState } from '@/components/ui/loading-state'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAppStore } from '@/stores/app-store'
import { useAuth } from '@/contexts/auth-context'
import { useIntegrations } from '@/hooks/use-supabase-data'
import { api } from '@/lib/api'
import type { Integration } from '@/types/database'

type IntegrationProvider = Integration['provider']

const providerLabels: Record<IntegrationProvider, string> = {
  zoom: 'Zoom',
  gohighlevel: 'GoHighLevel',
  stripe: 'Stripe',
  sendgrid: 'SendGrid',
  postmark: 'Postmark',
  twilio: 'Twilio',
  google_calendar: 'Google Calendar',
  outlook: 'Outlook',
  zapier: 'Zapier',
  make: 'Make',
}

const providerCategories: Record<IntegrationProvider, string> = {
  zoom: 'Webinar Platforms',
  gohighlevel: 'CRM',
  stripe: 'Payments',
  sendgrid: 'Email',
  postmark: 'Email',
  twilio: 'SMS',
  google_calendar: 'Calendar',
  outlook: 'Calendar',
  zapier: 'Automation',
  make: 'Automation',
}

const integrationConfigs: Record<string, { fields: { key: string; label: string; type: string; placeholder: string; description?: string }[]; helpUrl?: string; testable?: boolean }> = {
  zoom: {
    fields: [
      { key: 'accountId', label: 'Account ID', type: 'text', placeholder: 'Enter your Zoom Account ID', description: 'Found in Zoom App Marketplace > App Credentials' },
      { key: 'clientId', label: 'Client ID', type: 'text', placeholder: 'Enter your Zoom Client ID' },
      { key: 'clientSecret', label: 'Client Secret', type: 'password', placeholder: 'Enter your Zoom Client Secret' },
    ],
    helpUrl: 'https://marketplace.zoom.us/docs/guides/build/server-to-server-oauth-app/',
    testable: true,
  },
  gohighlevel: {
    fields: [
      { key: 'webhookUrl', label: 'Webhook URL', type: 'text', placeholder: 'https://services.leadconnectorhq.com/hooks/...', description: 'Optional: GHL webhook URL for sending registrations' },
      { key: 'apiKey', label: 'API Key (optional)', type: 'password', placeholder: 'Enter your GHL API Key' },
      { key: 'locationId', label: 'Location ID (optional)', type: 'text', placeholder: 'Enter your Location ID' },
    ],
    helpUrl: 'https://highlevel.com/docs',
    testable: true,
  },
  stripe: {
    fields: [
      { key: 'publishableKey', label: 'Publishable Key', type: 'text', placeholder: 'pk_...' },
      { key: 'secretKey', label: 'Secret Key', type: 'password', placeholder: 'sk_...' },
    ],
    helpUrl: 'https://stripe.com/docs/keys',
  },
  sendgrid: {
    fields: [
      { key: 'apiKey', label: 'API Key', type: 'password', placeholder: 'Enter your SendGrid API Key' },
    ],
    helpUrl: 'https://docs.sendgrid.com/ui/account-and-settings/api-keys',
  },
  postmark: {
    fields: [
      { key: 'serverToken', label: 'Server Token', type: 'password', placeholder: 'Enter your Server Token' },
    ],
    helpUrl: 'https://postmarkapp.com/developer/api/overview',
  },
  twilio: {
    fields: [
      { key: 'accountSid', label: 'Account SID', type: 'text', placeholder: 'Enter your Account SID' },
      { key: 'authToken', label: 'Auth Token', type: 'password', placeholder: 'Enter your Auth Token' },
      { key: 'phoneNumber', label: 'Phone Number', type: 'text', placeholder: '+1...' },
    ],
    helpUrl: 'https://www.twilio.com/docs/usage/api',
  },
  default: {
    fields: [
      { key: 'apiKey', label: 'API Key', type: 'password', placeholder: 'Enter your API Key' },
    ],
  },
}

const availableProviders: IntegrationProvider[] = ['zoom', 'gohighlevel', 'stripe', 'sendgrid', 'postmark', 'twilio']

export function IntegrationsPage() {
  const { integrations, isLoading, updateIntegration, createIntegration } = useIntegrations()
  const { addToast } = useAppStore()
  const { currentWorkspace } = useAuth()
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [newProvider, setNewProvider] = useState<IntegrationProvider | ''>('')
  const [configValues, setConfigValues] = useState<Record<string, string>>({})
  const [isTesting, setIsTesting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Group integrations by category
  const groupedIntegrations = integrations.reduce((acc, integration) => {
    const category = providerCategories[integration.provider] || 'Other'
    if (!acc[category]) {
      acc[category] = []
    }
    acc[category].push(integration)
    return acc
  }, {} as Record<string, Integration[]>)

  const handleOpenConfig = (integration: Integration) => {
    setSelectedIntegration(integration)
    // Load from credentials field (new) or settings (legacy)
    const credentials = (integration.credentials as Record<string, string>) || {}
    const settings = (integration.settings as Record<string, string>) || {}
    setConfigValues({ ...settings, ...credentials })
  }

  const handleSaveConfig = async () => {
    if (!selectedIntegration) return

    setIsSaving(true)
    const hasValues = Object.values(configValues).some((v) => v && v.trim())
    const { error } = await updateIntegration(selectedIntegration.id, {
      status: hasValues ? 'active' : 'inactive',
      credentials: configValues,
      settings: configValues, // Keep for backwards compat
    })

    setIsSaving(false)

    if (error) {
      addToast({
        title: 'Error',
        description: 'Failed to update integration',
        variant: 'error',
      })
    } else {
      addToast({
        title: hasValues ? 'Integration connected' : 'Integration disconnected',
        description: `${providerLabels[selectedIntegration.provider]} has been ${hasValues ? 'connected' : 'disconnected'}`,
        variant: 'success',
      })
      setSelectedIntegration(null)
      setConfigValues({})
    }
  }

  const handleTestConnection = async () => {
    if (!selectedIntegration || !currentWorkspace) return

    setIsTesting(true)

    try {
      // First save the credentials
      await updateIntegration(selectedIntegration.id, {
        credentials: configValues,
        settings: configValues,
      })

      // Then test the connection
      if (selectedIntegration.provider === 'zoom') {
        await api.testZoomConnection(currentWorkspace.id)
        addToast({
          title: 'Connection successful',
          description: 'Zoom credentials are valid',
          variant: 'success',
        })
      } else if (selectedIntegration.provider === 'gohighlevel') {
        await api.testGHLConnection(currentWorkspace.id)
        addToast({
          title: 'Connection successful',
          description: 'GHL configuration found',
          variant: 'success',
        })
      }
    } catch (error) {
      addToast({
        title: 'Connection failed',
        description: error instanceof Error ? error.message : 'Could not connect to the service',
        variant: 'error',
      })
    } finally {
      setIsTesting(false)
    }
  }

  const handleDisconnect = async () => {
    if (!selectedIntegration) return

    const { error } = await updateIntegration(selectedIntegration.id, {
      status: 'inactive',
      settings: {},
      api_key: null,
      api_secret: null,
    })

    if (error) {
      addToast({
        title: 'Error',
        description: 'Failed to disconnect integration',
        variant: 'error',
      })
    } else {
      addToast({
        title: 'Integration disconnected',
        description: `${providerLabels[selectedIntegration.provider]} has been disconnected`,
        variant: 'success',
      })
    }

    setSelectedIntegration(null)
    setConfigValues({})
  }

  const handleAddIntegration = async () => {
    if (!newProvider) return

    const { error } = await createIntegration({
      provider: newProvider,
      name: providerLabels[newProvider],
      status: 'inactive',
      settings: {},
    })

    if (error) {
      addToast({
        title: 'Error',
        description: 'Failed to add integration',
        variant: 'error',
      })
    } else {
      addToast({
        title: 'Integration added',
        description: `${providerLabels[newProvider]} has been added`,
        variant: 'success',
      })
    }

    setShowAddDialog(false)
    setNewProvider('')
  }

  const getConfig = (provider: IntegrationProvider) => {
    return integrationConfigs[provider] || integrationConfigs.default
  }

  // Get providers not yet added
  const existingProviders = integrations.map(i => i.provider)
  const availableToAdd = availableProviders.filter(p => !existingProviders.includes(p))

  if (isLoading) {
    return <LoadingState fullPage />
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="Integrations"
        description="Connect your favorite tools and platforms"
        action={
          availableToAdd.length > 0 && (
            <Button size="sm" onClick={() => setShowAddDialog(true)}>
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Add Integration
            </Button>
          )
        }
      />

      {integrations.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 border border-dashed rounded-lg">
          <p className="text-sm text-muted-foreground mb-4">No integrations configured yet</p>
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Add Your First Integration
          </Button>
        </div>
      ) : (
        <div className="space-y-6 sm:space-y-8">
          {Object.entries(groupedIntegrations).map(([category, categoryIntegrations]) => (
            <div key={category}>
              <h2 className="mb-3 sm:mb-4 text-sm sm:text-base font-semibold">{category}</h2>
              <div className="grid gap-2 sm:gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {categoryIntegrations.map((integration) => (
                  <Card
                    key={integration.id}
                    className="cursor-pointer transition-all hover:bg-card-hover hover:shadow-md"
                    onClick={() => handleOpenConfig(integration)}
                  >
                    <CardContent className="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3">
                      <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-muted text-sm sm:text-base font-bold shrink-0">
                        {integration.name[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs sm:text-sm font-medium truncate">{integration.name}</p>
                          {integration.status === 'active' && (
                            <Check className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-success shrink-0" />
                          )}
                        </div>
                        <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
                          {integration.status === 'active'
                            ? `Connected ${integration.last_used_at ? format(parseISO(integration.last_used_at), 'MMM d') : ''}`
                            : 'Not connected'}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Integration Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Integration</DialogTitle>
            <DialogDescription>
              Select an integration to add to your workspace
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <Label htmlFor="provider">Integration</Label>
            <Select value={newProvider} onValueChange={(v) => setNewProvider(v as IntegrationProvider)}>
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Select an integration" />
              </SelectTrigger>
              <SelectContent>
                {availableToAdd.map((provider) => (
                  <SelectItem key={provider} value={provider}>
                    {providerLabels[provider]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddIntegration} disabled={!newProvider}>
              Add
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Configure Integration Dialog */}
      <Dialog open={!!selectedIntegration} onOpenChange={() => setSelectedIntegration(null)}>
        {selectedIntegration && (
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {providerLabels[selectedIntegration.provider]}
                {selectedIntegration.status === 'active' && (
                  <Badge variant="success">Connected</Badge>
                )}
              </DialogTitle>
              <DialogDescription>
                Configure your {providerLabels[selectedIntegration.provider]} integration
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {getConfig(selectedIntegration.provider).fields.map((field) => (
                <div key={field.key} className="space-y-2">
                  <Label htmlFor={field.key}>{field.label}</Label>
                  <Input
                    id={field.key}
                    type={field.type}
                    placeholder={field.placeholder}
                    value={configValues[field.key] || ''}
                    onChange={(e) =>
                      setConfigValues((prev) => ({ ...prev, [field.key]: e.target.value }))
                    }
                  />
                  {field.description && (
                    <p className="text-xs text-muted-foreground">{field.description}</p>
                  )}
                </div>
              ))}

              {getConfig(selectedIntegration.provider).helpUrl && (
                <a
                  href={getConfig(selectedIntegration.provider).helpUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-sm text-primary hover:underline"
                >
                  <ExternalLink className="h-3 w-3" />
                  How to find these credentials
                </a>
              )}
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              {selectedIntegration.status === 'active' && (
                <Button variant="outline" onClick={handleDisconnect} className="mr-auto">
                  Disconnect
                </Button>
              )}
              {getConfig(selectedIntegration.provider).testable && (
                <Button
                  variant="outline"
                  onClick={handleTestConnection}
                  disabled={isTesting || isSaving}
                >
                  {isTesting ? (
                    <>
                      <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                      Testing...
                    </>
                  ) : (
                    <>
                      <TestTube2 className="mr-1.5 h-3.5 w-3.5" />
                      Test
                    </>
                  )}
                </Button>
              )}
              <Button variant="outline" onClick={() => setSelectedIntegration(null)}>
                Cancel
              </Button>
              <Button onClick={handleSaveConfig} disabled={isSaving || isTesting}>
                {isSaving ? (
                  <>
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  selectedIntegration.status === 'active' ? 'Update' : 'Connect'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </div>
  )
}
