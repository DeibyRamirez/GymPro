import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import type { Exercise } from "@/lib/data"
import { primaryImage } from "@/lib/images/constants"
import { Clock, Dumbbell, Repeat } from "lucide-react"
import Image from "next/image"

interface ExerciseCardProps {
  exercise: Exercise & { images?: string[] }
  index: number
}

const statItems = [
  { key: "sets", icon: Repeat, label: "Series" },
  { key: "reps", icon: Dumbbell, label: "Repeticiones" },
  { key: "rest", icon: Clock, label: "Descanso" },
] as const

export function ExerciseCard({ exercise, index }: ExerciseCardProps) {
  const imageSrc = primaryImage(exercise.images, exercise.image, "/placeholder.svg")

  return (
    <Card className="group overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg">
      <div className="relative border-b bg-gradient-to-br from-primary/8 via-muted/50 to-accent/8">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
        <div className="flex min-h-[220px] items-center justify-center p-5 sm:min-h-[280px] sm:p-6">
          <Image
            src={imageSrc}
            alt={exercise.name}
            width={960}
            height={720}
            className="max-h-52 w-full object-contain drop-shadow-md transition-transform duration-300 group-hover:scale-[1.02] sm:max-h-64"
          />
        </div>
        <div className="absolute left-4 top-4">
          <Badge className="gap-1.5 rounded-full border border-white/20 bg-background/85 px-3 py-1 text-xs font-bold shadow-sm backdrop-blur-md">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
              {index + 1}
            </span>
            Ejercicio
          </Badge>
        </div>
      </div>

      <CardContent className="space-y-4 p-5">
        <div className="space-y-2">
          <h3 className="text-xl font-bold tracking-tight text-balance">{exercise.name}</h3>
          {exercise.instructions ? (
            <p className="text-sm leading-relaxed text-muted-foreground line-clamp-4">{exercise.instructions}</p>
          ) : null}
        </div>

        <div className="grid grid-cols-3 gap-2">
          {statItems.map(({ key, icon: Icon, label }) => (
            <div
              key={key}
              className="rounded-xl border border-border/50 bg-muted/25 px-2 py-3 text-center transition-colors group-hover:bg-muted/40"
            >
              <Icon className="mx-auto mb-1.5 h-4 w-4 text-primary" />
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
              <p className="mt-0.5 text-sm font-bold tabular-nums">
                {key === "sets" ? exercise.sets : key === "reps" ? exercise.reps : exercise.rest}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
