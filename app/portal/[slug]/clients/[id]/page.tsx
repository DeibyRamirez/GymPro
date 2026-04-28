import { notFound, redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import connectDB from '@/lib/mongodb'
import Gym from '@/lib/models/Gym'
import User from '@/lib/models/User'
import { ClientDetailView } from '@/components/trainer/client-detail-view'

const JWT_SECRET = process.env.JWT_SECRET || 'tu-secret-key-cambiar-en-produccion'

export default async function Page({ params }: { params: Promise<{ slug: string; id: string }> }) {
  const { slug, id } = await params
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

  if (currentUser.role !== 'trainer' && currentUser.role !== 'admin' && currentUser.role !== 'superadmin') {
    redirect(`/portal/${slug}/dashboard`)
  }

  return <ClientDetailView clientId={id} />
}
