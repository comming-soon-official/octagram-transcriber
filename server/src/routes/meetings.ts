import express, { Request, Response } from 'express'

import { endMeeting, initializeMeeting } from '../controllers/meetings'

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
