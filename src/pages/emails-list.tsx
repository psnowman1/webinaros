import { PageHeader } from '@/components/layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Construction } from 'lucide-react'

export function EmailsListPage() {
  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="Emails"
        description="Manage your email templates"
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
            Email management is being built. You'll be able to create and manage email templates,
            schedule sends, and track open/click rates.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
