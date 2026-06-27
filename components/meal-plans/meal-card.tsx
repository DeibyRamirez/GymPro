import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { primaryImage } from "@/lib/images/constants"
import type { Meal } from "@/lib/data"
import { Clock, Flame, UtensilsCrossed } from "lucide-react"
import Image from "next/image"

interface MealCardProps {
  meal: Meal & { images?: string[]; image?: string }
}

const macroStyles = [
  { key: "protein" as const, label: "Proteínas", short: "P", accent: "text-sky-600 dark:text-sky-400", bg: "bg-sky-500/10 border-sky-500/20" },
  { key: "carbs" as const, label: "Carbos", short: "C", accent: "text-amber-600 dark:text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
  { key: "fats" as const, label: "Grasas", short: "G", accent: "text-rose-600 dark:text-rose-400", bg: "bg-rose-500/10 border-rose-500/20" },
]

export function MealCard({ meal }: MealCardProps) {
  const imageSrc = primaryImage(meal.images, meal.image, "/placeholder.svg")
  const hasImage = imageSrc !== "/placeholder.svg"

  return (
    <Card className="group overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-accent/35 hover:shadow-lg">
      {hasImage ? (
        <div className="relative border-b bg-gradient-to-br from-accent/8 via-muted/50 to-orange-500/8">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/40 to-transparent" />
          <div className="flex min-h-[200px] items-center justify-center p-5 sm:min-h-[240px] sm:p-6">
            <Image
              src={imageSrc}
              alt={meal.name}
              width={960}
              height={720}
              className="max-h-48 w-full object-contain drop-shadow-md transition-transform duration-300 group-hover:scale-[1.02] sm:max-h-56"
            />
          </div>
          <div className="absolute right-4 top-4">
            <Badge className="gap-1 rounded-full border border-white/20 bg-background/85 px-3 py-1 text-xs font-semibold shadow-sm backdrop-blur-md">
              <Flame className="h-3 w-3 text-accent" />
              {meal.calories} kcal
            </Badge>
          </div>
        </div>
      ) : null}

      <CardContent className="space-y-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent/10 ring-1 ring-accent/20">
                <UtensilsCrossed className="h-4 w-4 text-accent" />
              </div>
              <Badge variant="outline" className="gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium">
                <Clock className="h-3 w-3" />
                {meal.time}
              </Badge>
            </div>
            <h3 className="text-xl font-bold tracking-tight text-balance">{meal.name}</h3>
          </div>
          {!hasImage ? (
            <Badge className="shrink-0 gap-1 rounded-full bg-accent/10 px-3 py-1.5 text-accent hover:bg-accent/10">
              <Flame className="h-3.5 w-3.5" />
              {meal.calories} kcal
            </Badge>
          ) : null}
        </div>

        <div className="rounded-xl border border-border/50 bg-muted/20 p-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Alimentos incluidos
          </p>
          <ul className="space-y-2">
            {meal.foods.map((food, index) => (
              <li key={`${meal.name}-${food}-${index}`} className="flex items-start gap-2.5 text-sm leading-snug">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                <span>{food}</span>
              </li>
            ))}
          </ul>
        </div>

        {meal.macros ? (
          <div className="grid grid-cols-3 gap-2">
            {macroStyles.map(({ key, label, short, accent, bg }) => (
              <div key={key} className={`rounded-xl border px-2 py-3 text-center ${bg}`}>
                <p className={`text-[10px] font-semibold uppercase tracking-wider ${accent}`}>{short}</p>
                <p className="mt-1 text-lg font-bold tabular-nums">{meal.macros?.[key]}g</p>
                <p className="mt-0.5 text-[10px] text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
