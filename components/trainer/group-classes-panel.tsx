"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { CalendarPlus, Pencil, Trash2, UserCheck, Users } from "lucide-react"
import { useCallback, useEffect, useMemo, useState } from "react"

type Client = { id: string; name: string }
type ClassEvent = {
  id: string
  title: string
  description?: string
  date: string
  capacity?: number
  bookedCount?: number
  invitedUserIds?: string[]
  confirmedUserIds?: string[]
  canEdit?: boolean
}

async function fetchPanelData(trainerId: string): Promise<{ clients: Client[]; classes: ClassEvent[] }> {
  const [clientsRes, classesRes] = await Promise.all([
    fetch(`/api/users?role=client&trainerId=${trainerId}`, { credentials: "include" }),
    fetch(`/api/calendar?type=class`, { credentials: "include" }),
  ])
  const clientsData = await clientsRes.json()
  const classesData = await classesRes.json()
  return {
    clients: (clientsData.users || []).map((u: { id?: string; _id?: string; name: string }) => ({
      id: u.id || u._id || "",
      name: u.name,
    })),
    classes: classesData.events || [],
  }
}

function CapacityField({
  id,
  value,
  onChange,
  invitedCount,
}: {
  id: string
  value: string
  onChange: (value: string) => void
  invitedCount?: number
}) {
  const capacityNum = Number(value) || 0
  const overInvited = invitedCount != null && invitedCount > capacityNum && capacityNum > 0

  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-sm font-medium">
        Cupo máximo del evento
      </Label>
      <div className="rounded-xl border bg-muted/20 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative sm:w-32 shrink-0">
            <UserCheck className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id={id}
              type="number"
              min={1}
              inputMode="numeric"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className="pl-9 text-center font-semibold tabular-nums"
              aria-describedby={`${id}-hint`}
            />
          </div>
          <div id={`${id}-hint`} className="space-y-1 text-xs leading-relaxed text-muted-foreground">
            <p>Personas que pueden <span className="font-medium text-foreground">confirmar asistencia</span> al evento.</p>

          </div>
        </div>
        {invitedCount != null && capacityNum > 0 && (
          <p className={`mt-3 text-xs ${overInvited ? "text-destructive" : "text-muted-foreground"}`}>
            {invitedCount} invitado{invitedCount !== 1 ? "s" : ""} seleccionado{invitedCount !== 1 ? "s" : ""} · cupo máximo {capacityNum}
            {overInvited && " — reduce invitados o aumenta el cupo"}
          </p>
        )}
      </div>
    </div>
  )
}

function EventFormFields({
  title,
  setTitle,
  date,
  setDate,
  description,
  setDescription,
  capacity,
  setCapacity,
  invitedCount,
  idPrefix,
}: {
  title: string
  setTitle: (v: string) => void
  date: string
  setDate: (v: string) => void
  description: string
  setDescription: (v: string) => void
  capacity: string
  setCapacity: (v: string) => void
  invitedCount?: number
  idPrefix: string
}) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-title`}>Nombre del evento</Label>
          <Input
            id={`${idPrefix}-title`}
            placeholder="Ej. Clase de yoga al aire libre"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-date`}>Fecha y hora</Label>
          <Input
            id={`${idPrefix}-date`}
            type="datetime-local"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
      </div>

      <CapacityField
        id={`${idPrefix}-capacity`}
        value={capacity}
        onChange={setCapacity}
        invitedCount={invitedCount}
      />

      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-description`}>Descripción <span className="font-normal text-muted-foreground">(opcional)</span></Label>
        <Textarea
          id={`${idPrefix}-description`}
          placeholder="Lugar, qué traer, reglas del evento..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
        />
      </div>
    </div>
  )
}

export function GroupClassesPanel({ trainerId }: { trainerId: string }) {
  const [clients, setClients] = useState<Client[]>([])
  const [classes, setClasses] = useState<ClassEvent[]>([])
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [date, setDate] = useState("")
  const [capacity, setCapacity] = useState("14")
  const [selectedClientIds, setSelectedClientIds] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState<ClassEvent | null>(null)

  const refreshPanel = useCallback(async () => {
    const data = await fetchPanelData(trainerId)
    setClients(data.clients)
    setClasses(data.classes)
  }, [trainerId])

  useEffect(() => {
    let cancelled = false
    fetchPanelData(trainerId).then((data) => {
      if (!cancelled) {
        setClients(data.clients)
        setClasses(data.classes)
      }
    })
    return () => {
      cancelled = true
    }
  }, [trainerId])

  const resetForm = () => {
    setTitle("")
    setDescription("")
    setDate("")
    setCapacity("14")
    setSelectedClientIds([])
    setEditingEvent(null)
  }

  const createClass = async () => {
    if (!title || !date || selectedClientIds.length === 0) return
    setSaving(true)
    try {
      const response = await fetch("/api/calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title,
          description,
          date: new Date(date).toISOString(),
          type: "class",
          capacity: Number(capacity),
          trainerId,
          invitedUserIds: selectedClientIds,
        }),
      })
      if (response.ok) {
        resetForm()
        await refreshPanel()
      }
    } finally {
      setSaving(false)
    }
  }

  const openEdit = (event: ClassEvent) => {
    setEditingEvent(event)
    setTitle(event.title)
    setDescription(event.description || "")
    setDate(new Date(event.date).toISOString().slice(0, 16))
    setCapacity(String(event.capacity || 14))
    setSelectedClientIds(event.invitedUserIds || [])
    setEditOpen(true)
  }

  const saveEdit = async () => {
    if (!editingEvent) return
    setSaving(true)
    try {
      const response = await fetch(`/api/calendar/${editingEvent.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title,
          description,
          date: new Date(date).toISOString(),
          capacity: Number(capacity),
          invitedUserIds: selectedClientIds,
        }),
      })
      if (response.ok) {
        setEditOpen(false)
        resetForm()
        await refreshPanel()
      }
    } finally {
      setSaving(false)
    }
  }

  const deleteClass = async (eventId: string) => {
    if (!confirm("¿Eliminar este evento?")) return
    await fetch(`/api/calendar/${eventId}`, { method: "DELETE", credentials: "include" })
    await refreshPanel()
  }

  const capacityNum = Number(capacity) || 0
  const isCapacityValid = capacityNum >= 1 && selectedClientIds.length <= capacityNum
  const canPublish = Boolean(title && date && selectedClientIds.length > 0 && isCapacityValid)

  const inviteSummary = useMemo(
    () => `${selectedClientIds.length} de ${capacityNum || "—"} cupos reservados para invitación directa`,
    [selectedClientIds.length, capacityNum],
  )

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarPlus className="h-4 w-4" /> Crear evento grupal
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Programa un evento, define el cupo máximo y envía invitaciones a tus clientes.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <EventFormFields
            idPrefix="create"
            title={title}
            setTitle={setTitle}
            date={date}
            setDate={setDate}
            description={description}
            setDescription={setDescription}
            capacity={capacity}
            setCapacity={setCapacity}
            invitedCount={selectedClientIds.length}
          />
          <Button onClick={createClass} disabled={saving || !canPublish}>
            {saving ? "Publicando..." : "Publicar evento"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-4 w-4" /> Invitar clientes
          </CardTitle>
          <p className="text-sm text-muted-foreground">{inviteSummary}</p>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {clients.map((client) => (
            <label key={client.id} className="flex items-center gap-3 rounded-lg border p-3">
              <Checkbox
                checked={selectedClientIds.includes(client.id)}
                onCheckedChange={(checked) => {
                  setSelectedClientIds((current) =>
                    checked ? [...current, client.id] : current.filter((id) => id !== client.id),
                  )
                }}
              />
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
                <Badge variant="secondary">Evento</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p>{new Date(item.date).toLocaleString("es-ES", { dateStyle: "medium", timeStyle: "short" })}</p>
              <p>
                Confirmados: {item.bookedCount || 0}/{item.capacity || 0}
              </p>
              <p className="text-muted-foreground">
                Invitados: {item.invitedUserIds?.length || 0}
              </p>
              {item.canEdit !== false && (
                <div className="flex gap-2 pt-1">
                  <Button variant="outline" size="sm" className="gap-1" onClick={() => openEdit(item)}>
                    <Pencil className="h-3.5 w-3.5" /> Editar
                  </Button>
                  <Button variant="destructive" size="sm" className="gap-1" onClick={() => deleteClass(item.id)}>
                    <Trash2 className="h-3.5 w-3.5" /> Eliminar
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar evento</DialogTitle>
            <DialogDescription>Actualiza datos, invitados o cupo máximo.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <EventFormFields
              idPrefix="edit"
              title={title}
              setTitle={setTitle}
              date={date}
              setDate={setDate}
              description={description}
              setDescription={setDescription}
              capacity={capacity}
              setCapacity={setCapacity}
              invitedCount={selectedClientIds.length}
            />
            <div className="space-y-2">
              <Label>Clientes invitados</Label>
              <div className="grid max-h-40 gap-2 overflow-y-auto rounded-lg border p-3">
                {clients.map((client) => (
                  <label key={client.id} className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={selectedClientIds.includes(client.id)}
                      onCheckedChange={(checked) => {
                        setSelectedClientIds((current) =>
                          checked ? [...current, client.id] : current.filter((id) => id !== client.id),
                        )
                      }}
                    />
                    {client.name}
                  </label>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancelar</Button>
            <Button
              onClick={saveEdit}
              disabled={saving || !title || !date || !isCapacityValid}
            >
              {saving ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
