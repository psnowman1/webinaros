import { useState } from 'react'
import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import { Plus, Mail, MessageSquare, MoreHorizontal, Pencil, Trash2, Copy, Sparkles } from 'lucide-react'
import { PageHeader } from '@/components/layout'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ConfirmDialog, useConfirmDialog } from '@/components/ui/confirm-dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import { cn, generateId } from '@/lib/utils'
import type { EmailTemplate, SMSTemplate, MessageType } from '@/types'

const messageTypeLabels: Record<MessageType, string> = {
  confirmation: 'Registration Confirmation',
  '24hr_reminder': '24hr Reminder',
  '1hr_reminder': '1hr Reminder',
  starting_now: 'Starting Now',
  replay: 'Replay Available',
  no_show: 'No Show Follow-up',
  custom: 'Custom',
}

const messageTypeColors: Record<MessageType, string> = {
  confirmation: 'bg-green-500/10 text-green-500 border-green-500/20',
  '24hr_reminder': 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  '1hr_reminder': 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  starting_now: 'bg-red-500/10 text-red-500 border-red-500/20',
  replay: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
  no_show: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
  custom: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
}

// Mock data
const mockEmailTemplates: EmailTemplate[] = [
  {
    id: 'et-1',
    workspaceId: 'ws-1',
    name: 'Welcome Email',
    subject: 'You\'re Registered! {{firstName}}, here\'s your access',
    body: 'Hey {{firstName}},\n\nWelcome to the Apex Masterclass! Your spot is confirmed.\n\nSave this link: {{joinUrl}}\n\nSee you there!',
    type: 'confirmation',
    isActive: true,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
  },
  {
    id: 'et-2',
    workspaceId: 'ws-1',
    name: '24h Reminder',
    subject: '{{firstName}}, the Apex Masterclass is TOMORROW',
    body: 'Hey {{firstName}},\n\nQuick reminder - the Apex Masterclass is happening tomorrow!\n\nJoin here: {{joinUrl}}\n\nDon\'t miss it.',
    type: '24hr_reminder',
    isActive: true,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
  },
  {
    id: 'et-3',
    workspaceId: 'ws-1',
    name: '1h Reminder',
    subject: 'Starting in 1 hour - {{firstName}}, are you ready?',
    body: 'Hey {{firstName}},\n\nThe Apex Masterclass starts in ONE HOUR.\n\nGet your link ready: {{joinUrl}}\n\nSee you soon!',
    type: '1hr_reminder',
    isActive: true,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
  },
]

const mockSMSTemplates: SMSTemplate[] = [
  {
    id: 'st-1',
    workspaceId: 'ws-1',
    name: 'Confirmation SMS',
    message: 'Hey {{firstName}}! You\'re registered for the Apex Masterclass. Save this link: {{joinUrl}}',
    type: 'confirmation',
    isActive: true,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
  },
  {
    id: 'st-2',
    workspaceId: 'ws-1',
    name: '24h Reminder SMS',
    message: 'Hey {{firstName}}! Apex Masterclass is TOMORROW at 7pm EST. Don\'t miss it → {{joinUrl}}',
    type: '24hr_reminder',
    isActive: true,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
  },
  {
    id: 'st-3',
    workspaceId: 'ws-1',
    name: 'Starting Now SMS',
    message: '{{firstName}} - We\'re LIVE! Join the Apex Masterclass now: {{joinUrl}}',
    type: 'starting_now',
    isActive: true,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
  },
]

export function MessagingPage() {
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>(mockEmailTemplates)
  const [smsTemplates, setSMSTemplates] = useState<SMSTemplate[]>(mockSMSTemplates)
  const [showSMSDialog, setShowSMSDialog] = useState(false)
  const [editingSMS, setEditingSMS] = useState<SMSTemplate | null>(null)
  const { dialogProps, confirm } = useConfirmDialog()

  // SMS form state
  const [smsName, setSMSName] = useState('')
  const [smsMessage, setSMSMessage] = useState('')
  const [smsType, setSMSType] = useState<MessageType>('custom')

  const openSMSDialog = (template?: SMSTemplate) => {
    if (template) {
      setEditingSMS(template)
      setSMSName(template.name)
      setSMSMessage(template.message)
      setSMSType(template.type)
    } else {
      setEditingSMS(null)
      setSMSName('')
      setSMSMessage('')
      setSMSType('custom')
    }
    setShowSMSDialog(true)
  }

  const handleSaveSMS = () => {
    if (editingSMS) {
      setSMSTemplates(prev =>
        prev.map(t =>
          t.id === editingSMS.id
            ? { ...t, name: smsName, message: smsMessage, type: smsType, updatedAt: new Date() }
            : t
        )
      )
    } else {
      const newTemplate: SMSTemplate = {
        id: `st-${generateId()}`,
        workspaceId: 'ws-1',
        name: smsName,
        message: smsMessage,
        type: smsType,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      setSMSTemplates(prev => [...prev, newTemplate])
    }
    setShowSMSDialog(false)
  }

  const toggleEmailActive = (id: string) => {
    setEmailTemplates(prev =>
      prev.map(t => (t.id === id ? { ...t, isActive: !t.isActive } : t))
    )
  }

  const toggleSMSActive = (id: string) => {
    setSMSTemplates(prev =>
      prev.map(t => (t.id === id ? { ...t, isActive: !t.isActive } : t))
    )
  }

  const deleteEmail = async (id: string, name: string) => {
    const confirmed = await confirm({
      title: 'Delete Email Template',
      description: `Are you sure you want to delete "${name}"? This action cannot be undone.`,
      confirmText: 'Delete',
      variant: 'destructive',
    })

    if (confirmed) {
      setEmailTemplates(prev => prev.filter(t => t.id !== id))
    }
  }

  const deleteSMS = async (id: string, name: string) => {
    const confirmed = await confirm({
      title: 'Delete SMS Template',
      description: `Are you sure you want to delete "${name}"? This action cannot be undone.`,
      confirmText: 'Delete',
      variant: 'destructive',
    })

    if (confirmed) {
      setSMSTemplates(prev => prev.filter(t => t.id !== id))
    }
  }

  const duplicateEmail = (template: EmailTemplate) => {
    const newTemplate: EmailTemplate = {
      ...template,
      id: `et-${generateId()}`,
      name: `${template.name} (Copy)`,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    setEmailTemplates(prev => [...prev, newTemplate])
  }

  const duplicateSMS = (template: SMSTemplate) => {
    const newTemplate: SMSTemplate = {
      ...template,
      id: `st-${generateId()}`,
      name: `${template.name} (Copy)`,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    setSMSTemplates(prev => [...prev, newTemplate])
  }

  const smsCharCount = smsMessage.length
  const isSMSOverLimit = smsCharCount > 160

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="Email & SMS"
        description="Manage your email and SMS templates for automated messaging"
      />

      <Tabs defaultValue="email" className="space-y-4">
        <TabsList>
          <TabsTrigger value="email" className="gap-2">
            <Mail className="h-4 w-4" />
            Email Templates
          </TabsTrigger>
          <TabsTrigger value="sms" className="gap-2">
            <MessageSquare className="h-4 w-4" />
            SMS Templates
          </TabsTrigger>
        </TabsList>

        {/* Email Templates Tab */}
        <TabsContent value="email" className="space-y-4">
          <div className="flex justify-end">
            <Button size="sm" asChild>
              <Link to="/emails/new">
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                New Email Template
              </Link>
            </Button>
          </div>

          <div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead className="hidden sm:table-cell">Type</TableHead>
                  <TableHead className="hidden md:table-cell">Subject</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead className="hidden lg:table-cell">Updated</TableHead>
                  <TableHead className="w-[40px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {emailTemplates.map((template) => (
                  <TableRow key={template.id}>
                    <TableCell>
                      <span className="font-medium">{template.name}</span>
                      <p className="text-xs text-muted-foreground sm:hidden">
                        {messageTypeLabels[template.type]}
                      </p>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Badge variant="outline" className={cn('capitalize', messageTypeColors[template.type])}>
                        {messageTypeLabels[template.type]}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <span className="max-w-[200px] truncate text-sm text-muted-foreground">
                        {template.subject}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={template.isActive}
                        onCheckedChange={() => toggleEmailActive(template.id)}
                      />
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <span className="text-xs text-muted-foreground">
                        {format(template.updatedAt, 'MMM d, yyyy')}
                      </span>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7" aria-label="Email template actions">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link to={`/emails/new?template=${template.id}`}>
                              <Pencil className="mr-2 h-3.5 w-3.5" />
                              Edit
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => duplicateEmail(template)}>
                            <Copy className="mr-2 h-3.5 w-3.5" />
                            Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => deleteEmail(template.id, template.name)}
                            className="text-error focus:text-error"
                          >
                            <Trash2 className="mr-2 h-3.5 w-3.5" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* SMS Templates Tab */}
        <TabsContent value="sms" className="space-y-4">
          <div className="flex justify-end">
            <Button size="sm" onClick={() => openSMSDialog()}>
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              New SMS Template
            </Button>
          </div>

          <div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead className="hidden sm:table-cell">Type</TableHead>
                  <TableHead className="hidden md:table-cell">Message</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead className="hidden lg:table-cell">Updated</TableHead>
                  <TableHead className="w-[40px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {smsTemplates.map((template) => (
                  <TableRow key={template.id}>
                    <TableCell>
                      <span className="font-medium">{template.name}</span>
                      <p className="text-xs text-muted-foreground sm:hidden">
                        {messageTypeLabels[template.type]}
                      </p>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Badge variant="outline" className={cn('capitalize', messageTypeColors[template.type])}>
                        {messageTypeLabels[template.type]}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <span className="max-w-[200px] truncate text-sm text-muted-foreground">
                        {template.message}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={template.isActive}
                        onCheckedChange={() => toggleSMSActive(template.id)}
                      />
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <span className="text-xs text-muted-foreground">
                        {format(template.updatedAt, 'MMM d, yyyy')}
                      </span>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7" aria-label="SMS template actions">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openSMSDialog(template)}>
                            <Pencil className="mr-2 h-3.5 w-3.5" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => duplicateSMS(template)}>
                            <Copy className="mr-2 h-3.5 w-3.5" />
                            Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => deleteSMS(template.id, template.name)}
                            className="text-error focus:text-error"
                          >
                            <Trash2 className="mr-2 h-3.5 w-3.5" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      {/* SMS Template Dialog */}
      <Dialog open={showSMSDialog} onOpenChange={setShowSMSDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {editingSMS ? 'Edit SMS Template' : 'New SMS Template'}
            </DialogTitle>
            <DialogDescription>
              Create reusable SMS templates for your automated sequences
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs">Template Name</Label>
                <Input
                  value={smsName}
                  onChange={(e) => setSMSName(e.target.value)}
                  placeholder="e.g., Confirmation SMS"
                  className="h-9"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Type</Label>
                <Select value={smsType} onValueChange={(v) => setSMSType(v as MessageType)}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(messageTypeLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Message</Label>
                <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs text-primary">
                  <Sparkles className="h-3 w-3" />
                  AI Write
                </Button>
              </div>
              <Textarea
                value={smsMessage}
                onChange={(e) => setSMSMessage(e.target.value)}
                placeholder="Write your SMS message here..."
                rows={4}
                className="text-sm"
              />
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  Variables: {'{{firstName}}'}, {'{{joinUrl}}'}
                </p>
                <p className={cn('text-xs', isSMSOverLimit ? 'text-error' : 'text-muted-foreground')}>
                  {smsCharCount}/160 characters
                </p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSMSDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveSMS} disabled={!smsName || !smsMessage}>
              {editingSMS ? 'Save Changes' : 'Create Template'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog {...dialogProps} />
    </div>
  )
}
