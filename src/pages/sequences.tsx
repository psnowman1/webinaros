import { PageHeader } from '@/components/layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Construction } from 'lucide-react'

export function SequencesPage() {
  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="Sequences"
        description="Automated email and SMS sequences"
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
            Sequence builder is being developed. You'll be able to create automated email and SMS
            sequences triggered by registrations, VIP status, attendance, and more.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
