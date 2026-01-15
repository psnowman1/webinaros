import { useState } from 'react'
import { Link } from 'react-router-dom'
import { format, subDays, isWithinInterval, parseISO } from 'date-fns'
import { Users, Crown, Eye, Target, Plus, Video, Mail, ArrowRight, Calendar, DollarSign } from 'lucide-react'
import { PageHeader } from '@/components/layout'
import { StatCard } from '@/components/features'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { DateRangePicker, type DateRange } from '@/components/ui/date-range-picker'
import { LoadingState } from '@/components/ui/loading-state'
import { useWebinars, useRegistrants } from '@/hooks/use-supabase-data'
import { formatCurrency, formatPercent } from '@/lib/utils'

export function DashboardPage() {
  const { webinars, isLoading: webinarsLoading } = useWebinars()
  const { registrants, isLoading: registrantsLoading } = useRegistrants()
  const [dateRange, setDateRange] = useState<DateRange | null>({
    start: subDays(new Date(), 30),
    end: new Date(),
  })

  const isLoading = webinarsLoading || registrantsLoading

  const filteredRegistrants = dateRange
    ? registrants.filter(r => {
        const regDate = parseISO(r.registered_at)
        return isWithinInterval(regDate, dateRange)
      })
    : registrants

  const upcomingWebinars = webinars
    .filter(w => w.status === 'scheduled' && w.scheduled_at)
    .sort((a, b) => new Date(a.scheduled_at!).getTime() - new Date(b.scheduled_at!).getTime())

  const recentRegistrations = [...filteredRegistrants]
    .sort((a, b) => new Date(b.registered_at).getTime() - new Date(a.registered_at).getTime())
    .slice(0, 5)

  // Calculate stats from real data
  const totalRegistrants = filteredRegistrants.length
  const vipCount = filteredRegistrants.filter(r => r.is_vip).length
  const attendedCount = filteredRegistrants.filter(r => r.status === 'attended').length
  const purchasedCount = filteredRegistrants.filter(r => r.has_purchased).length
  const totalRevenue = filteredRegistrants.reduce((sum, r) => sum + (r.purchase_amount || 0), 0)

  const showRate = totalRegistrants > 0 ? (attendedCount / totalRegistrants) * 100 : 0
  const conversionRate = totalRegistrants > 0 ? (purchasedCount / totalRegistrants) * 100 : 0

  const getDateRangeLabel = () => {
    if (!dateRange) return 'all time'
    const daysDiff = Math.round((dateRange.end.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24))
    if (daysDiff <= 1) return 'today'
    if (daysDiff <= 7) return 'last 7 days'
    if (daysDiff <= 30) return 'last 30 days'
    if (daysDiff <= 90) return 'last 90 days'
    return 'selected period'
  }

  if (isLoading) {
    return <LoadingState fullPage />
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <PageHeader
          title="Dashboard"
          description="Overview of your webinar performance"
        />
        <DateRangePicker
          value={dateRange}
          onChange={setDateRange}
        />
      </div>

      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-5">
        <StatCard
          title="Total Registrants"
          value={totalRegistrants.toLocaleString()}
          change={0}
          changeLabel={getDateRangeLabel()}
          icon={Users}
        />
        <StatCard
          title="VIPs"
          value={vipCount.toLocaleString()}
          change={0}
          changeLabel={getDateRangeLabel()}
          icon={Crown}
        />
        <StatCard
          title="Show Rate"
          value={formatPercent(showRate)}
          change={0}
          changeLabel="vs last 30 days"
          icon={Eye}
        />
        <StatCard
          title="Conversion Rate"
          value={formatPercent(conversionRate)}
          change={0}
          changeLabel="vs last 30 days"
          icon={Target}
        />
        <StatCard
          title="Revenue"
          value={formatCurrency(totalRevenue)}
          change={0}
          changeLabel={getDateRangeLabel()}
          icon={DollarSign}
        />
      </div>

      <div className="grid gap-3 sm:gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm sm:text-base font-medium">
              Upcoming Webinars
            </CardTitle>
            <Button variant="ghost" size="sm" asChild className="text-xs h-7 px-2">
              <Link to="/webinars">View all</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {webinars.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8">
                <Calendar className="h-8 w-8 text-muted-foreground/50" />
                <p className="mt-3 text-sm text-muted-foreground">No webinars yet</p>
                <Button asChild size="sm" className="mt-3">
                  <Link to="/webinars/new">
                    <Plus className="mr-1.5 h-3.5 w-3.5" />
                    Create Webinar
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {webinars
                  .filter(w => w.scheduled_at)
                  .sort((a, b) => new Date(a.scheduled_at!).getTime() - new Date(b.scheduled_at!).getTime())
                  .slice(0, 5)
                  .map((webinar) => {
                    const scheduledDate = webinar.scheduled_at ? parseISO(webinar.scheduled_at) : new Date()
                    return (
                      <Link
                        key={webinar.id}
                        to={`/webinars/${webinar.id}`}
                        className="flex items-center gap-3 p-2 -mx-2 rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex flex-col items-center justify-center w-12 h-12 rounded-lg bg-primary/10 shrink-0">
                          <span className="text-xs font-medium text-primary">
                            {format(scheduledDate, 'MMM')}
                          </span>
                          <span className="text-lg font-bold text-primary leading-none">
                            {format(scheduledDate, 'd')}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{webinar.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(scheduledDate, 'h:mm a')} · {webinar.registrant_count} registrants
                          </p>
                        </div>
                        <Badge
                          variant={
                            webinar.status === 'scheduled'
                              ? 'default'
                              : webinar.status === 'live'
                              ? 'destructive'
                              : 'secondary'
                          }
                          className="shrink-0"
                        >
                          {webinar.status}
                        </Badge>
                        <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                      </Link>
                    )
                  })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm sm:text-base font-medium">
              Recent Registrations
            </CardTitle>
            <Button variant="ghost" size="sm" asChild className="text-xs h-7 px-2">
              <Link to="/webinars">View all</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {recentRegistrations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8">
                <Users className="h-8 w-8 text-muted-foreground/50" />
                <p className="mt-3 text-sm text-muted-foreground">No registrations yet</p>
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {recentRegistrations.map((reg) => {
                  const webinar = webinars.find(w => w.id === reg.webinar_id)
                  const initials = `${(reg.first_name || 'U')[0]}${(reg.last_name || 'N')[0]}`
                  return (
                    <div key={reg.id} className="flex items-center gap-2 sm:gap-3">
                      <Avatar className="h-7 w-7 sm:h-8 sm:w-8 shrink-0">
                        <AvatarFallback className="text-[10px] sm:text-xs">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs sm:text-sm font-medium truncate">
                            {reg.first_name} {reg.last_name}
                          </p>
                          {reg.is_vip && <Badge variant="vip" className="shrink-0">VIP</Badge>}
                        </div>
                        <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
                          {webinar?.title || 'Unknown webinar'}
                        </p>
                      </div>
                      <p className="text-[10px] sm:text-xs text-muted-foreground shrink-0">
                        {format(parseISO(reg.registered_at), 'MMM d')}
                      </p>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2 sm:pb-3">
          <CardTitle className="text-sm sm:text-base font-medium">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 sm:gap-3 grid-cols-2 lg:grid-cols-4">
            <Button variant="outline" className="h-auto justify-start gap-2 sm:gap-3 p-2.5 sm:p-3" asChild>
              <Link to="/webinars/new">
                <Video className="h-4 w-4 sm:h-5 sm:w-5 text-primary shrink-0" />
                <div className="text-left min-w-0">
                  <p className="text-xs sm:text-sm font-medium truncate">Create Webinar</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground truncate hidden sm:block">Schedule a new event</p>
                </div>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto justify-start gap-2 sm:gap-3 p-2.5 sm:p-3" asChild>
              <Link to="/emails/new">
                <Mail className="h-4 w-4 sm:h-5 sm:w-5 text-primary shrink-0" />
                <div className="text-left min-w-0">
                  <p className="text-xs sm:text-sm font-medium truncate">Compose Email</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground truncate hidden sm:block">Send to registrants</p>
                </div>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto justify-start gap-2 sm:gap-3 p-2.5 sm:p-3" asChild>
              <Link to="/analytics">
                <Target className="h-4 w-4 sm:h-5 sm:w-5 text-primary shrink-0" />
                <div className="text-left min-w-0">
                  <p className="text-xs sm:text-sm font-medium truncate">View Analytics</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground truncate hidden sm:block">Track performance</p>
                </div>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto justify-start gap-2 sm:gap-3 p-2.5 sm:p-3" asChild>
              <Link to="/integrations">
                <Users className="h-4 w-4 sm:h-5 sm:w-5 text-primary shrink-0" />
                <div className="text-left min-w-0">
                  <p className="text-xs sm:text-sm font-medium truncate">Integrations</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground truncate hidden sm:block">Connect your tools</p>
                </div>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm sm:text-base font-medium">Upcoming Webinars</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xl sm:text-2xl font-bold">{upcomingWebinars.length}</p>
          <p className="mt-0.5 sm:mt-1 text-[10px] sm:text-xs text-muted-foreground">
            Scheduled webinars awaiting
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
