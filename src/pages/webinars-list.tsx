import { useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { format, parseISO } from 'date-fns'
import { Plus, Search, MoreHorizontal, Edit, Trash2, Eye, Calendar } from 'lucide-react'
import { PageHeader } from '@/components/layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAppStore } from '@/stores/app-store'
import { useWebinars, useDeleteWebinar } from '@/hooks/use-supabase-data'

type StatusFilter = 'all' | 'draft' | 'scheduled' | 'live' | 'completed'

export function WebinarsListPage() {
  const navigate = useNavigate()
  const { webinars, isLoading, refetch } = useWebinars()
  const { deleteWebinar } = useDeleteWebinar()
  const { addToast } = useAppStore()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const { dialogProps, confirm, setIsLoading } = useConfirmDialog()

  const filteredWebinars = useMemo(() => {
    return webinars.filter((webinar) => {
      const matchesSearch = webinar.title.toLowerCase().includes(search.toLowerCase())
      const matchesStatus = statusFilter === 'all' || webinar.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [webinars, search, statusFilter])

  const handleDelete = async (id: string, title: string) => {
    const confirmed = await confirm({
      title: 'Delete Webinar',
      description: `Are you sure you want to delete "${title}"? This action cannot be undone.`,
      confirmText: 'Delete',
      variant: 'destructive',
    })

    if (confirmed) {
      setIsLoading(true)
      const { error } = await deleteWebinar(id)
      setIsLoading(false)

      if (error) {
        addToast({ title: 'Error', description: 'Failed to delete webinar', variant: 'error' })
      } else {
        addToast({ title: 'Webinar deleted', description: `${title} has been deleted`, variant: 'success' })
        refetch()
      }
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge variant="secondary">Draft</Badge>
      case 'scheduled':
        return <Badge variant="default">Scheduled</Badge>
      case 'live':
        return <Badge variant="success">Live</Badge>
      case 'completed':
        return <Badge variant="outline">Completed</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  if (isLoading) {
    return <LoadingState fullPage />
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="Webinars"
        description="Manage all your webinars in one place"
        action={
          <Button asChild size="sm">
            <Link to="/webinars/new">
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              <span className="hidden sm:inline">Create Webinar</span>
              <span className="sm:hidden">New</span>
            </Link>
          </Button>
        }
      />

      <div className="flex flex-col gap-2 sm:gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-full sm:max-w-sm">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search webinars..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-8 text-sm"
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(value) => setStatusFilter(value as StatusFilter)}
        >
          <SelectTrigger className="w-full sm:w-[140px] h-8 text-sm">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="scheduled">Scheduled</SelectItem>
            <SelectItem value="live">Live</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        {filteredWebinars.length === 0 && webinars.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 border border-dashed rounded-lg">
            <Calendar className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-sm text-muted-foreground mb-4">No webinars yet</p>
            <Button asChild>
              <Link to="/webinars/new">
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                Create Your First Webinar
              </Link>
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead className="hidden sm:table-cell">Date</TableHead>
                <TableHead className="text-center hidden md:table-cell">Registrants</TableHead>
                <TableHead className="text-center hidden md:table-cell">VIPs</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[40px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredWebinars.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-20 text-center">
                    <p className="text-xs sm:text-sm text-muted-foreground">No webinars found</p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredWebinars.map((webinar) => {
                  const scheduledDate = webinar.scheduled_at ? parseISO(webinar.scheduled_at) : new Date()
                  return (
                    <TableRow
                      key={webinar.id}
                      className="cursor-pointer"
                      onClick={() => navigate(`/webinars/${webinar.id}`)}
                    >
                      <TableCell>
                        <div className="min-w-0">
                          <p className="text-xs sm:text-sm font-medium truncate">{webinar.title}</p>
                          <p className="text-[10px] sm:text-xs text-muted-foreground sm:hidden">
                            {format(scheduledDate, 'MMM d')} · {webinar.registrant_count} reg
                          </p>
                          <p className="text-[10px] sm:text-xs text-muted-foreground hidden sm:block md:hidden">
                            {format(scheduledDate, 'MMM d, yyyy')}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <div>
                          <p className="text-xs sm:text-sm">{format(scheduledDate, 'MMM d, yyyy')}</p>
                          <p className="text-[10px] sm:text-xs text-muted-foreground">
                            {format(scheduledDate, 'h:mm a')}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="text-center hidden md:table-cell text-sm">{webinar.registrant_count}</TableCell>
                      <TableCell className="text-center hidden md:table-cell text-sm">{webinar.vip_count}</TableCell>
                      <TableCell>{getStatusBadge(webinar.status)}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon" className="h-7 w-7" aria-label="Webinar actions">
                              <MoreHorizontal className="h-3.5 w-3.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation()
                                navigate(`/webinars/${webinar.id}`)
                              }}
                            >
                              <Eye className="mr-2 h-3.5 w-3.5" />
                              View
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation()
                                navigate(`/webinars/${webinar.id}/edit`)
                              }}
                            >
                              <Edit className="mr-2 h-3.5 w-3.5" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-error"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDelete(webinar.id, webinar.title)
                              }}
                            >
                              <Trash2 className="mr-2 h-3.5 w-3.5" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        )}
      </div>

      <ConfirmDialog {...dialogProps} />
    </div>
  )
}
