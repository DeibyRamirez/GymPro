import { countUnreadMessages, markThreadEntriesRead, threadHasUnreadForUser } from '@/lib/messages/unread'

describe('messages unread helpers', () => {
  it('counts unread entries addressed to the user', () => {
    const count = countUnreadMessages(
      [
        {
          content: [
            { senderId: 'trainer-1', receiverId: 'client-1', readAt: null },
            { senderId: 'client-1', receiverId: 'trainer-1', readAt: null },
            { senderId: 'trainer-1', receiverId: 'client-1', readAt: new Date() },
          ],
        },
      ],
      'client-1',
    )

    expect(count).toBe(1)
  })

  it('marks only incoming entries as read', () => {
    const entries = markThreadEntriesRead(
      [
        { senderId: 'trainer-1', receiverId: 'client-1', readAt: null },
        { senderId: 'client-1', receiverId: 'trainer-1', readAt: null },
      ],
      'client-1',
      new Date('2026-06-01T10:00:00.000Z'),
    )

    expect(entries[0].readAt).toEqual(new Date('2026-06-01T10:00:00.000Z'))
    expect(entries[1].readAt).toBeNull()
  })

  it('detects unread threads for a user', () => {
    expect(
      threadHasUnreadForUser(
        { content: [{ senderId: 'a', receiverId: 'b', readAt: null }] },
        'b',
      ),
    ).toBe(true)
  })
})
