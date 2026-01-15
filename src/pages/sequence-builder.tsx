import { useNavigate } from 'react-router-dom'
import { PageHeader } from '@/components/layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Construction, ArrowLeft } from 'lucide-react'

export function SequenceBuilderPage() {
  const navigate = useNavigate()

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="Sequence Builder"
        description="Build automated sequences"
        action={
          <Button variant="outline" size="sm" onClick={() => navigate('/sequences')}>
            <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
            Back
          </Button>
        }
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
            The visual sequence builder is being developed. You'll be able to drag and drop
            email, SMS, wait, and condition nodes to create powerful automation flows.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
