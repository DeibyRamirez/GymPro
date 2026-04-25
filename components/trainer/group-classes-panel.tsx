"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { CalendarPlus, Users } from "lucide-react"

type Client = { id: string; name: string }
type ClassEvent = { id: string; title: string; date: string; capacity?: number; bookedCount?: number; attendanceCode?: string; userId?: { id?: string; name?: string } }

export function GroupClassesPanel({ trainerId }: { trainerId: string }) {
  const [clients, setClients] = useState<Client[]>([])
  const [classes, setClasses] = useState<ClassEvent[]>([])
  const [title, setTitle] = useState("")
  const [date, setDate] = useState("")
  const [capacity, setCapacity] = useState("10")
  const [attendanceCode, setAttendanceCode] = useState("")
  const [selectedClientIds, setSelectedClientIds] = useState<string[]>([])

  const load = async () => {
    const [clientsRes, classesRes] = await Promise.all([
      fetch(`/api/users?role=client&trainerId=${trainerId}`, { credentials: 'include' }),
      fetch(`/api/calendar?type=class`, { credentials: 'include' }),
    ])
    const clientsData = await clientsRes.json()
    const classesData = await classesRes.json()
    setClients(clientsData.users || [])
    setClasses(classesData.events || [])
  }

  useEffect(() => { load() }, [trainerId])

  const createClass = async () => {
    await Promise.all(selectedClientIds.map((clientId) => fetch('/api/calendar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        title,
        date,
        type: 'class',
        capacity: Number(capacity),
        attendanceCode,
        userId: clientId,
        trainerId,
      }),
    })))
    await load()
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><CalendarPlus className="h-4 w-4" /> Crear Clase Grupal</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-4">
          <Input placeholder="Nombre de la clase" value={title} onChange={(e) => setTitle(e.target.value)} />
          <Input type="datetime-local" value={date} onChange={(e) => setDate(e.target.value)} />
          <Input type="number" min={1} value={capacity} onChange={(e) => setCapacity(e.target.value)} />
          <Button onClick={createClass}>Publicar</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Users className="h-4 w-4" /> Clientes Asignados</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {clients.map((client) => (
            <label key={client.id} className="flex items-center gap-3 rounded-lg border p-3">
              <Checkbox checked={selectedClientIds.includes(client.id)} onCheckedChange={(checked) => {
                setSelectedClientIds((current) => checked ? [...current, client.id] : current.filter((id) => id !== client.id))
              }} />
              <span className="text-sm font-medium">{client.name}</span>
            </label>
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {classes.map((item) => (
          <Card key={item.id}>
            <CardHeader>
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-base">{item.title}</CardTitle>
                <Badge variant="secondary">Clase</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>{new Date(item.date).toLocaleString()}</p>
              <p>Cupos: {item.bookedCount || 0}/{item.capacity || 0}</p>
              <p className="text-muted-foreground">Código: {item.attendanceCode || 'N/A'}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
