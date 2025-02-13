"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.footages = exports.meetings = exports.users = void 0;
var pg_core_1 = require("drizzle-orm/pg-core");
exports.users = (0, pg_core_1.pgTable)('users', {
    id: (0, pg_core_1.text)('id').notNull().primaryKey(),
    name: (0, pg_core_1.text)('username').notNull(),
    createdAt: (0, pg_core_1.timestamp)('created_at', {
        withTimezone: false
    })
});
exports.meetings = (0, pg_core_1.pgTable)('meetings', {
    id: (0, pg_core_1.text)('id').notNull().primaryKey(),
    meetingId: (0, pg_core_1.text)('meeting_id'),
    createdAt: (0, pg_core_1.timestamp)('created_at', {
        withTimezone: false
    })
        .notNull()
        .defaultNow(),
    endedAt: (0, pg_core_1.timestamp)('ended_at', {
        withTimezone: false
    }),
    users: (0, pg_core_1.text)('users').array(), // Changed to array type
    transcriberOutput: (0, pg_core_1.text)('output')
});
exports.footages = (0, pg_core_1.pgTable)('footages', {
    id: (0, pg_core_1.text)('id').notNull().primaryKey(),
    file: (0, pg_core_1.text)('file_url'),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: false })
        .notNull()
        .defaultNow(),
    userId: (0, pg_core_1.text)('user_id'),
    meetingId: (0, pg_core_1.text)('meeting_id'),
    startTime: (0, pg_core_1.timestamp)('start_time'),
    endTime: (0, pg_core_1.timestamp)('end_time'),
    type: (0, pg_core_1.text)('type', { enum: ['start', 'middle', 'end'] })
});
