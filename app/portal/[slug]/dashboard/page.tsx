import { notFound, redirect } from "next/navigation"
import connectDB from "@/lib/mongodb"
import Gym from "@/lib/models/Gym"
import User from "@/lib/models/User"
import jwt from "jsonwebtoken"
import { cookies } from "next/headers"
import { AppHeader } from "@/components/layout/app-header"
import { ClientDashboard } from "@/components/client/client-dashboard"
import { TrainerDashboard } from "@/components/trainer/trainer-dashboard"

const JWT_SECRET = process.env.JWT_SECRET || 'tu-secret-key-cambiar-en-produccion'

// Este es el componente de la página del dashboard para un gimnasio específico, identificado por su slug.
// El componente realiza varias tareas:
// 1. Conecta a la base de datos y busca el gimnasio por su slug. Si no se encuentra o está suspendido, muestra una página de "No encontrado".
// 2. Verifica si el usuario tiene un token de autenticación válido. Si no lo tiene, redirige a la página de login del gimnasio.
// 3. Decodifica el token para obtener la información del usuario actual y verifica su estado y permisos.
// 4. Dependiendo del rol del usuario (entrenador, cliente o administrador), renderiza el dashboard correspondiente o muestra un mensaje de acceso no disponible.
export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  await connectDB()

  const gym = await Gym.findOne({ slug, status: { $ne: 'suspended' } })
  if (!gym) notFound()

  const token = (await cookies()).get('auth-token')?.value
  if (!token) redirect(`/portal/${slug}/login`)

  const decoded = jwt.verify(token, JWT_SECRET) as { userId: string }
  const currentUser = await User.findById(decoded.userId).select('-password')
  if (!currentUser || !currentUser.isActive) redirect(`/portal/${slug}/login`)

  if (currentUser.gymId && currentUser.gymId.toString() !== gym._id.toString() && currentUser.role !== 'superadmin') {
    redirect(`/portal/${slug}/login`)
  }

  if (currentUser.role === 'trainer') {
    return <div className="min-h-screen bg-background"><TrainerDashboard trainerId={currentUser._id.toString()} /></div>
  }

  if (currentUser.role === 'client') {
    return <div className="min-h-screen bg-background"><ClientDashboard client={{
      id: currentUser._id.toString(),
      name: currentUser.name,
      email: currentUser.email,
      role: currentUser.role,
      avatar: currentUser.avatar,
      trainerId: currentUser.trainerId?.toString(),
      gymId: currentUser.gymId?.toString(),
      gymSlug: gym.slug,
      gymName: gym.name,
    }} /></div>
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader user={{
        id: currentUser._id.toString(),
        name: currentUser.name,
        email: currentUser.email,
        role: currentUser.role,
        avatar: currentUser.avatar,
        trainerId: currentUser.trainerId?.toString(),
        gymId: currentUser.gymId?.toString(),
        gymSlug: gym.slug,
        gymName: gym.name,
      }} onLogout={() => {}} />
      <main className="w-full max-w-[1800px] mx-auto px-4 py-6 lg:px-6 2xl:px-8">Acceso no disponible para este rol.</main>
    </div>
  )
}
