import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import MealPlan from "@/lib/models/MealPlan";
import User from "@/lib/models/User";
import jwt from "jsonwebtoken";
import { logApiError, logApiRequest } from '@/lib/api-debug';

const JWT_SECRET = process.env.JWT_SECRET!;

// ✅ Middleware para verificar autenticación
async function verifyAuth(req: NextRequest) {
  const token =
    req.cookies.get("auth-token")?.value ||
    req.headers.get("authorization")?.replace("Bearer ", "");

  if (!token) throw new Error("Token no proporcionado");

  const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
  const user = await User.findById(decoded.userId);

  if (!user || !user.isActive) {
    throw new Error("Usuario no encontrado o inactivo");
  }

  return user;
}

// ✅ Obtener plan alimenticio
export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params; // 👈 IMPORTANTE
  try {
    await connectDB();
    const user = await verifyAuth(req);
    logApiRequest('/api/meal-plans/[id] GET', { userId: user._id.toString(), role: user.role, gymId: user.gymId?.toString() || null, mealPlanId: id });

    const mealPlan = await MealPlan.findById(id).populate("createdBy", "name email");

    if (!mealPlan) {
      return NextResponse.json({ error: "Plan alimenticio no encontrado" }, { status: 404 });
    }
    if (String(mealPlan.gymId || null) !== String(user.gymId || null)) {
      return NextResponse.json({ error: 'No tienes permisos para ver este plan' }, { status: 403 });
    }

    // Permisos
    if (
      user.role === "client" &&
      mealPlan.createdBy._id.toString() !== user._id.toString()
    ) {
      return NextResponse.json({ error: "No tienes permisos para ver este plan" }, { status: 403 });
    }

    return NextResponse.json({ mealPlan });
  } catch (error) {
    logApiError('/api/meal-plans/[id] GET', error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

// ✅ Actualizar plan alimenticio
export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params; // 👈 IMPORTANTE
  try {
    await connectDB();
    const user = await verifyAuth(req);
    logApiRequest('/api/meal-plans/[id] PUT', { userId: user._id.toString(), role: user.role, gymId: user.gymId?.toString() || null, mealPlanId: id });

    const mealPlan = await MealPlan.findById(id);
    if (!mealPlan) {
      return NextResponse.json({ error: "Plan alimenticio no encontrado" }, { status: 404 });
    }

    if (user.role !== "admin" && mealPlan.createdBy.toString() !== user._id.toString()) {
      return NextResponse.json({ error: "No tienes permisos para editar este plan" }, { status: 403 });
    }
    if (String(mealPlan.gymId || null) !== String(user.gymId || null)) {
      return NextResponse.json({ error: 'No tienes permisos para editar este plan' }, { status: 403 });
    }

    const data = await req.json();
    delete data.createdBy;

    const updatedMealPlan = await MealPlan.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    }).populate("createdBy", "name email");

    return NextResponse.json({
      message: "Plan alimenticio actualizado exitosamente",
      mealPlan: updatedMealPlan,
    });
  } catch (error) {
    logApiError('/api/meal-plans/[id] PUT', error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

// ✅ Eliminar plan alimenticio
export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params; // 👈 IMPORTANTE
  try {
    await connectDB();
    const user = await verifyAuth(req);
    logApiRequest('/api/meal-plans/[id] DELETE', { userId: user._id.toString(), role: user.role, gymId: user.gymId?.toString() || null, mealPlanId: id });

    const mealPlan = await MealPlan.findById(id);
    if (!mealPlan) {
      return NextResponse.json({ error: "Plan alimenticio no encontrado" }, { status: 404 });
    }

    if (user.role !== "admin" && mealPlan.createdBy.toString() !== user._id.toString()) {
      return NextResponse.json({ error: "No tienes permisos para eliminar este plan" }, { status: 403 });
    }
    if (String(mealPlan.gymId || null) !== String(user.gymId || null)) {
      return NextResponse.json({ error: 'No tienes permisos para eliminar este plan' }, { status: 403 });
    }

    await MealPlan.findByIdAndUpdate(id, { isActive: false });

    return NextResponse.json({ message: "Plan alimenticio eliminado exitosamente" });
  } catch (error) {
    logApiError('/api/meal-plans/[id] DELETE', error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
