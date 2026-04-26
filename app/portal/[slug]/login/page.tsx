import { TenantAuthPage } from "@/components/auth/tenant-auth-page"

// Este es el componente de la página de login para un gimnasio específico, identificado por su slug.
export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  
  // El componente TenantAuthPage se encarga de manejar la lógica de autenticación para el gimnasio identificado por el slug, 
  // mostrando el formulario de login y gestionando el proceso de autenticación.
  return <TenantAuthPage mode="login" gymSlug={slug} />
}
