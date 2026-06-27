import { Suspense } from "react"
import ResetPasswordPageClient from "./reset-password-client"

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center text-muted-foreground">
          Cargando...
        </div>
      }
    >
      <ResetPasswordPageClient />
    </Suspense>
  )
}
