
'use client'

import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle } from 'lucide-react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <html>
      <body>
         <div className="flex min-h-screen w-full items-center justify-center bg-background p-4">
            <Card className="w-full max-w-md text-center">
                 <CardHeader>
                    <AlertTriangle className="mx-auto h-12 w-12 text-destructive" />
                    <CardTitle className="mt-4 text-2xl">Ocorreu um Erro Inesperado</CardTitle>
                    <CardDescription>
                        Nossa equipe já foi notificada. Por favor, tente novamente.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Button onClick={() => reset()}>Tentar Novamente</Button>
                </CardContent>
            </Card>
        </div>
      </body>
    </html>
  )
}
