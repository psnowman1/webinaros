import { useParams, useNavigate } from 'react-router-dom'
import { PageHeader } from '@/components/layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Construction, ArrowLeft } from 'lucide-react'

export function WebinarFormPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title={id ? 'Edit Webinar' : 'Create Webinar'}
        description={id ? 'Update webinar details' : 'Create a new webinar'}
        action={
          <Button variant="outline" size="sm" onClick={() => navigate(id ? `/webinars/${id}` : '/webinars')}>
            <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
            Back
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Construction className="h-5 w-5" />
            Use the Wizard Instead
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            For creating new webinars, please use the webinar creation wizard which provides a
            step-by-step guided experience.
          </p>
          <Button onClick={() => navigate('/webinars/new')}>
            Go to Wizard
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
