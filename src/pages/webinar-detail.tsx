import { useParams, useNavigate, Link } from 'react-router-dom'
import { format, parseISO } from 'date-fns'
import { ArrowLeft, Edit, Trash2, Users, Crown, Eye, Target, Clock, Calendar } from 'lucide-react'
import { PageHeader } from '@/components/layout'
import { StatCard } from '@/components/features'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { LoadingState } from '@/components/ui/loading-state'
import { ConfirmDialog, useConfirmDialog } from '@/components/ui/confirm-dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useAppStore } from '@/stores/app-store'
import { useWebinar, useRegistrants, useDeleteWebinar } from '@/hooks/use-supabase-data'
import { formatPercent } from '@/lib/utils'

export function WebinarDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { addToast } = useAppStore()
  const { webinar, isLoading: webinarLoading } = useWebinar(id)
  const { registrants, isLoading: registrantsLoading } = useRegistrants(id)
  const { deleteWebinar } = useDeleteWebinar()
  const { dialogProps, confirm, setIsLoading } = useConfirmDialog()

  const isLoading = webinarLoading || registrantsLoading

  const handleDelete = async () => {
    if (!webinar) return

    const confirmed = await confirm({
      title: 'Delete Webinar',
      description: `Are you sure you want to delete "${webinar.title}"? This will also remove all registrant data associated with this webinar.`,
      confirmText: 'Delete',
      variant: 'destructive',
    })

    if (confirmed) {
      setIsLoading(true)
      const { error } = await deleteWebinar(webinar.id)
      setIsLoading(false)

      if (error) {
        addToast({ title: 'Error', description: 'Failed to delete webinar', variant: 'error' })
      } else {
        addToast({ title: 'Webinar deleted', description: `${webinar.title} has been deleted`, variant: 'success' })
        navigate('/webinars')
      }
    }
  }

  if (isLoading) {
    return <LoadingState fullPage />
  }

  if (!webinar) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Calendar className="h-12 w-12 text-muted-foreground/50 mb-4" />
        <p className="text-muted-foreground mb-4">Webinar not found</p>
        <Button asChild>
          <Link to="/webinars">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Webinars
          </Link>
        </Button>
      </div>
    )
  }

  // Calculate stats
  const totalRegistrants = registrants.length
  const vipCount = registrants.filter(r => r.is_vip).length
  const attendedCount = registrants.filter(r => r.status === 'attended').length
  const showRate = totalRegistrants > 0 ? (attendedCount / totalRegistrants) * 100 : 0
  const purchasedCount = registrants.filter(r => r.has_purchased).length
  const conversionRate = totalRegistrants > 0 ? (purchasedCount / totalRegistrants) * 100 : 0

  const scheduledDate = webinar.scheduled_at ? parseISO(webinar.scheduled_at) : new Date()

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title={webinar.title}
        description={`${format(scheduledDate, 'MMMM d, yyyy')} at ${format(scheduledDate, 'h:mm a')}`}
        action={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate('/webinars')}>
              <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
              Back
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate(`/webinars/${id}/edit`)}>
              <Edit className="mr-1.5 h-3.5 w-3.5" />
              Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDelete}
              className="text-error hover:text-error"
            >
              <Trash2 className="mr-1.5 h-3.5 w-3.5" />
              Delete
            </Button>
          </div>
        }
      />

      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Registrants"
          value={totalRegistrants.toLocaleString()}
          icon={Users}
        />
        <StatCard
          title="VIPs"
          value={vipCount.toLocaleString()}
          icon={Crown}
        />
        <StatCard
          title="Show Rate"
          value={formatPercent(showRate)}
          icon={Eye}
        />
        <StatCard
          title="Conversion Rate"
          value={formatPercent(conversionRate)}
          icon={Target}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {webinar.description && (
              <div>
                <p className="text-sm font-medium mb-1">Description</p>
                <p className="text-sm text-muted-foreground">{webinar.description}</p>
              </div>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-sm font-medium mb-1">Duration</p>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {webinar.duration_minutes} minutes
                </p>
              </div>
              <div>
                <p className="text-sm font-medium mb-1">Timezone</p>
                <p className="text-sm text-muted-foreground">{webinar.timezone}</p>
              </div>
            </div>
            {webinar.ghl_registration_webhook && (
              <div>
                <p className="text-sm font-medium mb-1">GHL Registration Webhook</p>
                <p className="text-sm text-muted-foreground font-mono break-all">
                  {webinar.ghl_registration_webhook}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Quick Stats</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Total Registrants</span>
              <span className="font-medium">{totalRegistrants}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">VIP Registrants</span>
              <span className="font-medium">{vipCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Attended</span>
              <span className="font-medium">{attendedCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Purchased</span>
              <span className="font-medium">{purchasedCount}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Registrants</CardTitle>
        </CardHeader>
        <CardContent>
          {registrants.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8">
              <Users className="h-8 w-8 text-muted-foreground/50" />
              <p className="mt-3 text-sm text-muted-foreground">No registrants yet</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead className="text-center">VIP</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Registered</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {registrants.slice(0, 20).map((reg) => (
                  <TableRow key={reg.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-7 w-7">
                          <AvatarFallback className="text-xs">
                            {(reg.first_name || 'U')[0]}{(reg.last_name || 'N')[0]}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">
                          {reg.first_name} {reg.last_name}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{reg.email}</TableCell>
                    <TableCell className="text-center">
                      {reg.is_vip && <Badge variant="vip">VIP</Badge>}
                    </TableCell>
                    <TableCell>
                      <Badge variant={reg.status === 'attended' ? 'success' : 'secondary'}>
                        {reg.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(parseISO(reg.registered_at), 'MMM d, yyyy')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          {registrants.length > 20 && (
            <p className="text-center text-sm text-muted-foreground mt-4">
              Showing first 20 of {registrants.length} registrants
            </p>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog {...dialogProps} />
    </div>
  )
}
