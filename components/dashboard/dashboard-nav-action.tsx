"use client"

import type { ElementType } from "react"

interface DashboardNavActionProps {
  icon: ElementType
  label: string
  onClick: () => void
  accent: string
  active?: boolean
}

export function DashboardNavAction({
  icon: Icon,
  label,
  onClick,
  accent,
  active,
}: DashboardNavActionProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group flex flex-col items-center gap-2 rounded-2xl border px-5 py-4 backdrop-blur-sm transition-all hover:border-primary/40 hover:bg-card hover:shadow-md ${
        active ? "border-primary/40 bg-card shadow-sm" : "bg-card/60"
      }`}
    >
      <div
        className={`flex h-10 w-10 items-center justify-center rounded-xl transition-transform group-hover:scale-110 ${accent}`}
      >
        <Icon className="h-5 w-5" />
      </div>
      <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground">
        {label}
      </span>
    </button>
  )
}
