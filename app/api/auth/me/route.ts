import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';

const JWT_SECRET = process.env.JWT_SECRET || 'tu-secret-key-cambiar-en-produccion';

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const token = req.cookies.get('auth-token')?.value || req.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    const user = await User.findById(decoded.userId).select('-password');

    if (!user || !user.isActive) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    return NextResponse.json({
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        trainerId: user.trainerId?.toString(),
      },
    });
  } catch {
    return NextResponse.json({ user: null }, { status: 401 });
  }
}
