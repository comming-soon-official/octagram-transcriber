import { eq } from 'drizzle-orm'
import { v4 } from 'uuid'

import { db, schema } from '../db'

export const initializeMeeting = async ({
    meeting_id
}: {
    meeting_id: string
}) => {
    // Check if meeting exists
    const existing = await db
        .select()
        .from(schema.meetings)
        .where(eq(schema.meetings.meetingId, meeting_id))
    if (existing.length > 0) {
        return existing[0]
    }
    // Insert new meeting as it does not exist
    return await db.insert(schema.meetings).values({
        id: v4(),
        createdAt: new Date(),
        meetingId: meeting_id
    })
}

export const endMeeting = async ({ meeting_id }: { meeting_id: string }) => {
    return await db
        .update(schema.meetings)
        .set({
            endedAt: new Date()
        })
        .where(eq(schema.meetings.meetingId, meeting_id))
}
