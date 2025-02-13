import express, { Request, Response } from 'express'

import { endMeeting, initializeMeeting } from '../controllers/meetings'
import { mergeComposerFromDB } from '../lib/merge-composer-from-db'
import { db } from '../db'
import { footages } from '../db/schema'
import { eq } from 'drizzle-orm'

export const router = express.Router()

router.get('/api/start-meeting', async (req: Request, res: Response) => {
    const { meeting_id } = req.body
    await initializeMeeting({ meeting_id })
    res.send({ success: true })
})

router.get('/api/end-meeting', async (req: Request, res: Response) => {
    const { meeting_id } = req.body
    await endMeeting({ meeting_id })
    res.send({ success: true })
})

router.get(
    '/api/merge-audio/:meeting_id',
    async (req: Request, res: Response) => {
        const { meeting_id } = req.params

        try {
            if (!meeting_id) {
                res.status(400).json({
                    error: 'meeting_id is required'
                })
                return
            }

            const footageRecords = await db.select().from(footages).where(eq(footages.meetingId, meeting_id))
            
            const mergedResults = await Promise.all(
                footageRecords.map(async (footage) => {
                    if(!footage || !footage.userId) return;

                    try {
                        const mergedFilePath = await mergeComposerFromDB(
                            meeting_id,
                            footage.userId
                        )
                        return {
                            userId: footage.userId,
                            success: true,
                            mergedFilePath
                        }
                    } catch (error) {
                        return {
                            userId: footage.userId,
                            success: false,
                            error: error instanceof Error ? error.message : 'Unknown error occurred'
                        }
                    }
                })
            )

            res.status(200).json({
                success: true,
                results: mergedResults
            })
        } catch (error) {
            console.error('Error merging audio:', error)
            res.status(500).json({
                error: error instanceof Error ? error.message : 'Unknown error occurred'
            })
        }
    }
)
