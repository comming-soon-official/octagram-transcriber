import { pgTable, text, timestamp, integer } from 'drizzle-orm/pg-core'

export const users = pgTable('users', {
    id: text('id').notNull().primaryKey(),
    name: text('username').notNull(),
    createdAt: timestamp('created_at', {
        withTimezone: false
    })
})

export const meetings = pgTable('meetings', {
    id: text('id').notNull().primaryKey(),
    meetingId: text('meeting_id'),
    createdAt: timestamp('created_at', {
        withTimezone: false
    })
        .notNull()
        .defaultNow(),
    endedAt: timestamp('ended_at', {
        withTimezone: false
    }),
    users: text('users').array(), // Changed to array type
    transcriberOutput: text('output')
})

export const footages = pgTable('footages', {
    id: text('id').notNull().primaryKey(),
    file: text('file_url'),
    createdAt: timestamp('created_at', { withTimezone: false })
        .notNull()
        .defaultNow(),
    userId: text('user_id'),
    meetingId: text('meeting_id'),
    startTime: timestamp('start_time'),
    endTime: timestamp('end_time'),
    username: text('username'),
    chunkType: text('chunk_type')
})

export const merged_footages = pgTable('merged_footages', {
    id: text('id').notNull().primaryKey(),
    meetingId: text('meeting_id'),
    createdAt: timestamp('created_at', {
        withTimezone: false
    })
        .notNull()
        .defaultNow(),
    startedAt: timestamp('started_at', {
        withTimezone: false
    }),
    endedAt: timestamp('ended_at', {
        withTimezone: false
    }),
    username: text('username'),
    users: text('user_id'),
    file: text('file_url'),
    transcribeUrl: text('output'),
    transcription: text('transcription')
})

export const meetingSummaries = pgTable('meeting_summaries', {
    id: text('id').notNull().primaryKey(),
    meetingId: text('meeting_id').notNull(),
    summary: text('summary'),
    keyDiscussion: text('key_discussion').array(), // Changed to array type
    actionItems: text('action_items').array(), // Changed to array type
    createdAt: timestamp('created_at', {
        withTimezone: false
    })
        .notNull()
        .defaultNow()
})

export const userTranscripts = pgTable('user_transcripts', {
    id: text('id').notNull().primaryKey(),
    meetingId: text('meeting_id').notNull(),
    userId: text('user_id'),
    username: text('username').notNull(),
    transcripts: text('transcripts').array(), // Array of transcript entries
    chronologicalOrder: integer('chronological_order').array(), // Store indices for chronological ordering
    createdAt: timestamp('created_at', {
        withTimezone: false
    })
        .notNull()
        .defaultNow()
})
