import { useNavigate } from 'react-router-dom'
import { PageHeader } from '@/components/layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Construction, ArrowLeft } from 'lucide-react'

export function EmailComposerPage() {
  const navigate = useNavigate()

  return (
    <div className="space-y-4 sm:space-y-6 p-4 md:p-6">
      <PageHeader
        title="Compose Email"
        description="Create and send emails"
        action={
          <Button variant="outline" size="sm" onClick={() => navigate('/emails')}>
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
            The email composer is being developed. You'll be able to create beautiful emails with a
            drag-and-drop editor, personalization tags, and send to specific segments.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
