"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Mail, Phone } from "lucide-react"

interface TrainerInfoCardProps {
  trainer: {
    id: string
    name: string
    email: string
    avatar?: string
    phone?: string
  }
}

export function TrainerInfoCard({ trainer }: TrainerInfoCardProps) {
  const handleContact = () => {
    if (trainer.email) {
      window.location.href = `mailto:${trainer.email}`
    }
  }

  const handleCall = () => {
    if (trainer.phone) {
      window.location.href = `tel:${trainer.phone}`
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tu Entrenador</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4">
          <Avatar className="h-20 w-20">
            <AvatarImage src={trainer.avatar || "/placeholder.svg"} alt={trainer.name} />
            <AvatarFallback className="bg-primary/10 text-primary text-xl">
              {trainer.name
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h3 className="text-xl font-semibold">{trainer.name}</h3>
            <p className="text-sm text-muted-foreground mt-1">Entrenador Certificado</p>
            {trainer.email && (
              <p className="text-xs text-muted-foreground mt-1">{trainer.email}</p>
            )}
            <div className="flex gap-2 mt-3">
              {trainer.email && (
                <Button size="sm" variant="outline" onClick={handleContact}>
                  <Mail className="h-4 w-4 mr-1" />
                  Contactar
                </Button>
              )}
              {trainer.phone && (
                <Button size="sm" variant="outline" onClick={handleCall}>
                  <Phone className="h-4 w-4 mr-1" />
                  Llamar
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
