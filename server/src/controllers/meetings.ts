import { eq } from 'drizzle-orm'
import { v4 } from 'uuid'

import { db, schema } from '../db'
import composer from '../lib/merge-composer/composer'

export const initializeMeeting = async ({
    meeting_id
}: {
    meeting_id: string
}) => {
    return await db.insert(schema.meetings).values({
        id: v4(),
        createdAt: new Date(),
        meetingId: meeting_id
    })
}

export const endMeeting = async ({ meeting_id }: { meeting_id: string }) => {
    await db
        .update(schema.meetings)
        .set({
            endedAt: new Date()
        })
        .where(eq(schema.meetings.meetingId, meeting_id))

    const results = await composer(meeting_id)
}
