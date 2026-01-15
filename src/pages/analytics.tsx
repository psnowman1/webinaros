import { PageHeader } from '@/components/layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Construction } from 'lucide-react'

export function AnalyticsPage() {
  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="Analytics"
        description="Track your webinar performance"
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Construction className="h-5 w-5" />
            Coming Soon
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Analytics dashboard is being built. It will show detailed metrics about your webinar performance,
            registrant behavior, conversion rates, and revenue tracking.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
