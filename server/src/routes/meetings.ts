import { eq } from 'drizzle-orm'
import express, { Request, Response } from 'express'
import { v4 } from 'uuid'

import { endMeeting, initializeMeeting } from '../controllers/meetings'
import { db } from '../db'
import { footages, meetings, merged_footages } from '../db/schema' // added meetings import
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
                        const { mergedFilePath, startTime, endTime } =
                            await mergeComposerFromDB(meeting_id, userId)
                        console.log(
                            `[${new Date().toISOString()}] MERGE AUDIO - Merged audio for user`,
                            {
                                meeting_id,
                                userId,
                                mergedFilePath,
                                startTime,
                                endTime
                            }
                        )
                        const result = await transcribeFile(mergedFilePath)
                        if ('jsonPath' in result) {
                            await db.insert(merged_footages).values({
                                id: v4(),
                                createdAt: new Date(),
                                startedAt: startTime,
                                endedAt: endTime,
                                users: userId,
                                meetingId: meeting_id,
                                transcribeUrl: result.jsonPath // updated to store jsonPath properly
                            })
                        } else {
                            throw new Error(
                                'Transcription failed: ' + result.error
                            )
                        }

                        console.log(
                            `[${new Date().toISOString()}] MERGE AUDIO - Inserted merged record to DB successfully`,
                            { meeting_id, userId }
                        )
                        return {
                            userId,
                            success: true,
                            mergedFilePath,
                            jsonResult: result.jsonPath
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
            const filePaths = mergedResults.map((res) => res.jsonResult)
            const summary = await summarizer(filePaths)
            db.update(meetings)
                .set({
                    transcriberOutput: summary
                })
                .where(eq(meetings.meetingId, meeting_id))

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
