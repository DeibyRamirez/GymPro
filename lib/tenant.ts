// Utilidades para resolver URLs y contexto de tenant desde el subdominio actual.

export function getRootHost(hostname?: string) {
  if (!hostname) return 'gympro.com'

  // En local o despliegues de preview mantenemos una ruta interna para que el flujo sea navegable.
  if (hostname.includes('localhost') || hostname.includes('127.0.0.1')) {
    return hostname
  }

  const parts = hostname.split('.')
  return parts.length > 2 ? parts.slice(1).join('.') : hostname
}

export function buildTenantUrl(slug: string, path = '/', hostname?: string) {
  const host = hostname || (typeof window !== 'undefined' ? window.location.hostname : '')

  // Si no hay dominio real, navegamos por una ruta interna equivalente.
  if (!host || host.includes('localhost') || host.includes('127.0.0.1')) {
    return `/portal/${slug}${path}`
  }

  const protocol = typeof window !== 'undefined' ? window.location.protocol : 'https:'
  const rootHost = getRootHost(host)
  return `${protocol}//${slug}.${rootHost}${path}`
}
