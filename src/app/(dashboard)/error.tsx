'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error)
  }, [error])

  return (
    <div className="flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
             <CardHeader>
                <AlertTriangle className="mx-auto h-12 w-12 text-destructive" />
                <CardTitle className="mt-4 text-2xl">Ocorreu um Erro</CardTitle>
                <CardDescription>
                    Algo deu errado nesta seção. Por favor, tente recarregar.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Button
                onClick={
                    // Attempt to recover by trying to re-render the segment
                    () => reset()
                }
                >
                Tentar Novamente
                </Button>
            </CardContent>
        </Card>
    </div>
  )
}
