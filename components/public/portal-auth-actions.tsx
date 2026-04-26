"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export function PortalAuthActions({ slug }: { slug: string }) {
  const [target, setTarget] = useState(`/portal/${slug}/login`)
  const [label, setLabel] = useState('Ir al dashboard')

  useEffect(() => {
    const load = async () => {
      try {
        const response = await fetch('/api/auth/me', { credentials: 'include' })
        if (response.ok) {
          setTarget(`/portal/${slug}/dashboard`)
          setLabel('Ir al dashboard')
        }
      } catch {
        setTarget(`/portal/${slug}/login`)
        setLabel('Ingresar')
      }
    }

    load()
  }, [slug])

  return (
    <Button asChild size="sm" variant="outline">
      <Link href={target}>{label}</Link>
    </Button>
  )
}
