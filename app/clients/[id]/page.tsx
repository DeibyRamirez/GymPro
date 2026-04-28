import { cookies } from 'next/headers'
import { notFound, redirect } from 'next/navigation'
import jwt from 'jsonwebtoken'
import connectDB from '@/lib/mongodb'
import User from '@/lib/models/User'
import { ClientDetailView } from '@/components/trainer/client-detail-view'

const JWT_SECRET = process.env.JWT_SECRET || 'tu-secret-key-cambiar-en-produccion'

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await connectDB()

  const token = (await cookies()).get('auth-token')?.value
  if (!token) redirect('/app')

  const decoded = jwt.verify(token, JWT_SECRET) as { userId: string }
  const currentUser = await User.findById(decoded.userId).select('-password')
  if (!currentUser || !currentUser.isActive) redirect('/app')

  if (!['admin', 'superadmin', 'trainer'].includes(currentUser.role)) redirect('/app')

  const target = await User.findById(id).select('-password')
  if (!target) notFound()

  if (currentUser.gymId && target.gymId && String(currentUser.gymId) !== String(target.gymId) && currentUser.role !== 'superadmin') {
    redirect('/app')
  }

  return <ClientDetailView clientId={id} />
}
