import { GymPortalPage } from "@/components/public/gym-portal-page"
import { notFound } from "next/navigation"
import connectDB from "@/lib/mongodb"
import Gym from "@/lib/models/Gym"

// Este es el componente de la página principal del portal para un gimnasio específico, identificado por su slug.
export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  await connectDB()
  const gym = await Gym.findOne({ slug, status: { $ne: 'suspended' } })

  if (!gym) notFound()

    // El componente GymPortalPage se encarga de mostrar toda la información relevante del gimnasio 
    // identificado por el slug, incluyendo su nombre, ubicación, descripción, horarios, imágenes, planes, máquinas y 
    // productos disponibles, proporcionando una experiencia completa para los visitantes del portal.
    
  return <GymPortalPage slug={slug} gym={{
    name: gym.name,
    slug: gym.slug,
    location: gym.location,
    description: gym.description,
    email: gym.email,
    phone: gym.phone,
    hours: gym.hours,
    logo: gym.logo,
    coverImage: gym.coverImage,
    gallery: gym.gallery,
    plans: gym.plans,
    machines: gym.machines,
    products: gym.products,
  }} />
}
