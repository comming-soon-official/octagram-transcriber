import { pgTable, text, timestamp } from 'drizzle-orm/pg-core'

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
