import { promises as fs } from 'fs'
import { exec } from 'child_process'
import path from 'path'

import { db } from '../db'
import { footages } from '../db/schema'
import { and, eq } from 'drizzle-orm'
import { sortFootages } from './merge-composer/sortfootages'
import { processAudioMatrix } from './merge-composer/audio-composer'

interface AudioChunk {
    timestamp: number
    filepath: string
}

// Fetch audio chunks from the database for the given meetId and userId
async function getAudioChunksFromDB(
    meetId: string,
    userId: string
) {
    // Adjusted the query by adding explicit type annotation for the parameter 'chunk'
    const chunks = await db
        .select()
        .from(footages)
        .where(and(eq(footages.meetingId, meetId), eq(footages.userId, userId)))

    return chunks
}

// Modify the mergeComposerFromDB function to use the new audio composer
export async function mergeComposerFromDB(
    meetId: string,
    userId: string
): Promise<string[]> {
    const chunks = await getAudioChunksFromDB(meetId, userId)
    if (chunks.length === 0) {
        throw new Error(
            'No audio chunks found for the provided meet id and user id'
        )
    }

    // Sort footages into matrix
    const matrix = sortFootages(chunks)

    try {
        // Process the audio matrix and get the result
        const outputFile = await processAudioMatrix(matrix)
        return outputFile
    } catch (error) {
        throw new Error(`Failed to process audio matrix: ${error}`)
    }
}
