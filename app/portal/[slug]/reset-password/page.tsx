import { Suspense } from "react"
import PortalResetPasswordPageClient from "./reset-password-client"

export default function PortalResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center text-muted-foreground">
          Cargando...
        </div>
      }
    >
      <PortalResetPasswordPageClient />
    </Suspense>
  )
}
