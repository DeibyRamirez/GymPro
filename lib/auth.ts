export type UserRole = "admin" | "trainer" | "client"

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  avatar?: string
  trainerId?: string // Para clientes, ID del entrenador asignado
}

// Simulación de usuarios para demostración
export const mockUsers: User[] = [
  {
    id: "1",
    name: "Admin Principal",
    email: "admin@fitpro.com",
    role: "admin",
    avatar: "/admin-interface.png",
  },
  {
    id: "2",
    name: "Carlos Martínez",
    email: "carlos@fitpro.com",
    role: "trainer",
    avatar: "/athletic-trainer.png",
  },
  {
    id: "3",
    name: "Ana García",
    email: "ana@cliente.com",
    role: "client",
    trainerId: "2",
    avatar: "/diverse-clients-meeting.png",
  },
  {
    id: "4",
    name: "Luis Rodríguez",
    email: "luis@cliente.com",
    role: "client",
    trainerId: "2",
    avatar: "/diverse-clients-meeting.png",
  },
]

export function getUserByEmail(email: string): User | undefined {
  return mockUsers.find((user) => user.email === email)
}

export function getUserById(id: string): User | undefined {
  return mockUsers.find((user) => user.id === id)
}

export function getTrainerClients(trainerId: string): User[] {
  return mockUsers.filter((user) => user.role === "client" && user.trainerId === trainerId)
}
