const OBJECT_ID_HEX = /^[a-f0-9]{24}$/i

/** Extrae un ObjectId válido desde refs de Mongoose, strings o documentos embebidos. */
export function extractRefId(value: unknown): string | null {
  if (!value) return null

  if (typeof value === 'string') {
    return OBJECT_ID_HEX.test(value) ? value : null
  }

  if (typeof value === 'object') {
    const obj = value as { _id?: unknown; id?: unknown }
    if (obj._id != null) {
      const id = typeof obj._id === 'string' ? obj._id : String(obj._id)
      return OBJECT_ID_HEX.test(id) ? id : null
    }
    if (typeof obj.id === 'string' && OBJECT_ID_HEX.test(obj.id)) {
      return obj.id
    }
  }

  return null
}

export function getDocumentId(doc: { _id?: unknown; id?: unknown } | null | undefined): string | null {
  if (!doc) return null
  return extractRefId(doc._id) || extractRefId(doc.id) || extractRefId(doc)
}
