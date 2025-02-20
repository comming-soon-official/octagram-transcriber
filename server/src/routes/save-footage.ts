import express, { Request, Response } from 'express'
import multer from 'multer'

import { addFootage } from '../controllers/save-footage'

export const router = express.Router()

const upload = multer({ storage: multer.memoryStorage() })

router.post(
    '/send/audio-chunks',
    upload.single('file'),
    async (req: Request, res: Response) => {
        console.log('📥 Received audio chunk request')
        try {
            if (!req.file) {
                console.error('❌ No file received in request')
                res.status(400).json({ error: 'Footage is missing' })
                return
            }

            const {
                user_id,
                meeting_id,
                startTime,
                endTime,
                chunkType,
                username
            } = req.body
            console.log('📋 Request payload:', {
                user_id,
                meeting_id,
                startTime,
                endTime,
                chunkType,
                username
            })

            await addFootage({
                user_id,
                meeting_id,
                username,
                startTime,
                endTime,
                file: req.file.buffer,
                chunkType
            })

            console.log('✅ Footage uploaded successfully')
            res.status(200).json({ message: 'Footage uploaded successfully' })
            return
        } catch (error) {
            console.error('❌ Error processing audio chunk:', error)
            res.status(500).json({
                error: error instanceof Error ? error.message : 'Unknown error'
            })
        }
    }
)
