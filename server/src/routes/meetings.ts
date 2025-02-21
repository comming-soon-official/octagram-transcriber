import { desc, eq } from 'drizzle-orm'
import express, { Request, Response } from 'express'
import { v4 } from 'uuid'

import { endMeeting, initializeMeeting } from '../controllers/meetings'
import { db } from '../db'
import {
    footages,
    meetings,
    merged_footages,
    meetingSummaries,
    userTranscripts
} from '../db/schema' // added meetings import
import { mergeComposerFromDB } from '../lib/merge-composer-from-db'
import { summarizer } from '../lib/transcriber/summary'
import { transcribeFile } from '../lib/transcriber/transcribe'

export const router = express.Router()

router.post('/api/start-meeting', async (req: Request, res: Response) => {
    const { meeting_id } = req.body
    await initializeMeeting({ meeting_id })
    res.send({ success: true })
})

router.post('/api/end-meeting', async (req: Request, res: Response) => {
    const { meeting_id } = req.body
    await endMeeting({ meeting_id })
    res.send({ success: true })
})

router.post('/api/get-transcript', async (req: Request, res: Response) => {
    // Retrieve meeting_id from request body

    const { meeting_id } = req.body
    console.log(meeting_id)

    // Query merged_footages by meeting_id sorted from new to old based on createdAt
    const footageRecords = await db
        .select()
        .from(merged_footages)
        .where(eq(merged_footages.meetingId, meeting_id))
        .orderBy(desc(merged_footages.createdAt))
    // Send result as response
    res.send({ success: true, footages: footageRecords })
})

router.get(
    '/api/merge-audio/:meeting_id',
    async (req: Request, res: Response) => {
        const { meeting_id } = req.params
        console.log(
            `[${new Date().toISOString()}] MERGE AUDIO - Request received`,
            { meeting_id }
        )

        try {
            if (!meeting_id) {
                console.error(
                    `[${new Date().toISOString()}] MERGE AUDIO - Missing meeting_id`
                )
                res.status(400).json({
                    error: 'meeting_id is required'
                })
                return
            }

            const footageRecords = await db
                .select()
                .from(footages)
                .where(eq(footages.meetingId, meeting_id))
            console.log(
                `[${new Date().toISOString()}] MERGE AUDIO - Retrieved footage records`,
                { meeting_id, count: footageRecords.length }
            )

            // Group footage records by unique userId
            const userIds = Array.from(
                new Set(
                    footageRecords.filter((f) => f.userId).map((f) => f.userId)
                )
            ).filter((id): id is string => id !== null)

            const mergedResults = await Promise.all(
                userIds.map(async (userId) => {
                    try {
                        // Get merged results for all sequences for this user
                        const mergedSequences = await mergeComposerFromDB(
                            meeting_id,
                            userId
                        )
                        const processedResults = await Promise.all(
                            mergedSequences.map(async (seq) => {
                                // Pass the username to transcribeFile
                                const result = await transcribeFile(
                                    seq.mergedFilePath,
                                    60,
                                    seq.username,
                                    seq.startTime,
                                    seq.endTime
                                )
                                if ('jsonPath' in result) {
                                    await db.insert(merged_footages).values({
                                        id: v4(),
                                        createdAt: new Date(),
                                        startedAt: seq.startTime,
                                        endedAt: seq.endTime,
                                        users: userId,
                                        username: seq.username, // new field with username
                                        meetingId: meeting_id,
                                        transcribeUrl: result.jsonPath,
                                        transcription: JSON.stringify(
                                            result.data
                                        )
                                    })
                                    return {
                                        mergedFilePath: seq.mergedFilePath,
                                        jsonResult: result.jsonPath,
                                        startTime: seq.startTime,
                                        endTime: seq.endTime,
                                        username: seq.username // passed along for consistency
                                    }
                                } else {
                                    throw new Error(
                                        'Transcription failed: ' + result.error
                                    )
                                }
                            })
                        )
                        console.log(
                            `[${new Date().toISOString()}] MERGE AUDIO - Processed all sequences for user`,
                            { meeting_id, userId }
                        )
                        return {
                            userId,
                            success: true,
                            results: processedResults
                        }
                    } catch (error) {
                        console.error(
                            `[${new Date().toISOString()}] MERGE AUDIO - Error processing user`,
                            {
                                meeting_id,
                                userId,
                                error:
                                    error instanceof Error
                                        ? error.message
                                        : 'Unknown error occurred'
                            }
                        )
                        return {
                            userId,
                            success: false,
                            error:
                                error instanceof Error
                                    ? error.message
                                    : 'Unknown error occurred'
                        }
                    }
                })
            )

            console.log(
                `[${new Date().toISOString()}] MERGE AUDIO - Completed merging process`,
                { meeting_id, usersProcessed: userIds.length }
            )
            // Flatten all jsonResult file paths for summarization
            const filePaths = mergedResults
                .filter((r) => r.success)
                .flatMap((r) => r.results?.map((r: any) => r.jsonResult) ?? [])
            const structuredSummary = await summarizer(filePaths)
            await db
                .update(meetings)
                .set({
                    transcriberOutput: structuredSummary.summary
                })
                .where(eq(meetings.meetingId, meeting_id))

            await db.insert(meetingSummaries).values({
                id: v4(),
                meetingId: meeting_id,
                summary: structuredSummary.summary,
                keyDiscussion: structuredSummary.keyDiscussion,
                actionItems: structuredSummary.actionItems,
                createdAt: new Date()
            })

            // Save user transcripts
            await Promise.all(
                Object.entries(structuredSummary.userWiseTranscripts).map(
                    async ([username, transcripts]) => {
                        return await db.insert(userTranscripts).values({
                            id: v4(),
                            meetingId: meeting_id,
                            username,
                            transcripts: transcripts.map((t) =>
                                JSON.stringify(t)
                            ),
                            chronologicalOrder:
                                structuredSummary.chronologicalConversation
                                    .map((entry, index) =>
                                        entry.username === username
                                            ? index
                                            : null
                                    )
                                    .filter(
                                        (index): index is number =>
                                            index !== null
                                    ),
                            createdAt: new Date()
                        })
                    }
                )
            )

            res.status(200).json({
                success: true,
                results: mergedResults
            })
        } catch (error) {
            console.error(
                `[${new Date().toISOString()}] MERGE AUDIO - General error`,
                {
                    meeting_id,
                    error: error instanceof Error ? error.message : error
                }
            )
            res.status(500).json({
                error:
                    error instanceof Error
                        ? error.message
                        : 'Unknown error occurred'
            })
        }
    }
)

// New route to list meetings
router.get('/api/meetings', async (req: Request, res: Response) => {
    try {
        // Querying meetings from the database
        const meetingRecords = await db.select().from(meetings)
        res.json({ success: true, meetings: meetingRecords })
    } catch (error) {
        res.status(500).json({
            error:
                error instanceof Error
                    ? error.message
                    : 'Unknown error occurred'
        })
    }
})

router.get(
    '/api/meeting-summary/:meeting_id',
    async (req: Request, res: Response) => {
        try {
            const { meeting_id } = req.params

            const summaries = await db
                .select()
                .from(meetingSummaries)
                .where(eq(meetingSummaries.meetingId, meeting_id))
                .orderBy(desc(meetingSummaries.createdAt))
                .limit(1)

            if (summaries.length === 0) {
                res.status(404).json({
                    success: false,
                    error: 'No summary found for this meeting'
                })
                return
            }

            res.json({
                success: true,
                summary: summaries[0]
            })
        } catch (error) {
            console.error('Error fetching meeting summary:', error)
            res.status(500).json({
                success: false,
                error:
                    error instanceof Error
                        ? error.message
                        : 'Unknown error occurred'
            })
        }
    }
)

// Get chronological conversation for a meeting
router.get(
    '/api/meeting/:meeting_id/chronological',
    async (req: Request, res: Response) => {
        try {
            const { meeting_id } = req.params

            const userTranscriptRecords = await db
                .select()
                .from(userTranscripts)
                .where(eq(userTranscripts.meetingId, meeting_id))

            if (!userTranscriptRecords.length) {
                res.status(404).json({
                    success: false,
                    error: 'No transcripts found for this meeting'
                })
                return
            }

            // Reconstruct chronological conversation
            const chronologicalConversation = userTranscriptRecords
                .flatMap((record) => {
                    const transcripts = (record.transcripts || [])
                        .map((t) => (t ? JSON.parse(t) : null))
                        .filter(Boolean)
                    return (record.chronologicalOrder || []).map((index) => ({
                        index,
                        username: record.username,
                        ...transcripts[index]
                    }))
                })
                .sort((a, b) => a.index - b.index)
                .map(({ index, ...rest }) => rest) // Remove the index from final output

            res.json({
                success: true,
                chronologicalConversation
            })
        } catch (error) {
            console.error('Error retrieving chronological conversation:', error)
            res.status(500).json({
                success: false,
                error:
                    error instanceof Error
                        ? error.message
                        : 'Unknown error occurred'
            })
        }
    }
)
