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
    transcribed: text('transcribed_url')
})
