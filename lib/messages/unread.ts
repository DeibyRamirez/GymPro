type MessageEntryLike = {
  senderId?: unknown
  receiverId?: unknown
  readAt?: Date | string | null
}

type MessageThreadLike = {
  content?: MessageEntryLike[]
  messages?: MessageEntryLike[]
}

function getEntries(thread: MessageThreadLike): MessageEntryLike[] {
  if (Array.isArray(thread.content)) return thread.content
  if (Array.isArray(thread.messages)) return thread.messages
  return []
}

export function countUnreadMessages(threads: MessageThreadLike[], userId: string): number {
  const userKey = String(userId)

  return threads.reduce((total, thread) => {
    const unreadInThread = getEntries(thread).filter(
      (entry) => String(entry.receiverId) === userKey && !entry.readAt,
    ).length
    return total + unreadInThread
  }, 0)
}

export function markThreadEntriesRead(
  entries: MessageEntryLike[],
  userId: string,
  readAt: Date = new Date(),
): MessageEntryLike[] {
  const userKey = String(userId)

  return entries.map((entry) =>
    String(entry.receiverId) === userKey && !entry.readAt
      ? { ...entry, readAt }
      : entry,
  )
}

export function threadHasUnreadForUser(thread: MessageThreadLike, userId: string): boolean {
  const userKey = String(userId)
  return getEntries(thread).some(
    (entry) => String(entry.receiverId) === userKey && !entry.readAt,
  )
}
