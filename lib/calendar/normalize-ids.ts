/** Normaliza referencias de usuario (ObjectId, string o documento poblado). */
export function normalizeUserIdRef(value: unknown): string {
  if (value == null) return ''
  if (typeof value === 'string') return value
  if (typeof value === 'object') {
    if ('_id' in value && (value as { _id: unknown })._id != null) {
      return String((value as { _id: unknown })._id)
    }
    if ('id' in value && (value as { id: unknown }).id != null) {
      return String((value as { id: unknown }).id)
    }
  }
  return String(value)
}

export function normalizeUserIdList(values: unknown[] | undefined): string[] {
  return (values || []).map(normalizeUserIdRef).filter(Boolean)
}

export function userIdListIncludes(values: unknown[] | undefined, userId: unknown): boolean {
  const target = normalizeUserIdRef(userId)
  return normalizeUserIdList(values).includes(target)
}
