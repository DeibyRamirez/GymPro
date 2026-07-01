import type { Metadata } from "next"
import { SaasLoginPage } from "@/components/public/saas-login-page"

export const metadata: Metadata = {
  title: "Iniciar sesión | Gym Pro",
  description:
    "Accede a Gym Pro para administrar tu gimnasio, entrenar clientes o consultar tu plan y progreso.",
}

export default function Page() {
  return <SaasLoginPage />
}
