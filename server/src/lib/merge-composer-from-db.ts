import { and, eq } from 'drizzle-orm'
import path from 'path'

import { db } from '../db'
import { footages } from '../db/schema'
import { processAudioMatrix } from './merge-composer/audio-composer'
import { sortFootages } from './merge-composer/footage'

// Fetch audio chunks from the database for the given meetId and userId
async function getAudioChunksFromDB(meetId: string, userId: string) {
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
): Promise<{ mergedFilePath: string; startTime: Date; endTime: Date }> {
    const chunks = await getAudioChunksFromDB(meetId, userId)
    if (chunks.length === 0) {
        throw new Error(
            'No audio chunks found for the provided meet id and user id'
        )
    }

    // Sort footages into matrix
    const matrix = sortFootages(chunks)

    // Extract startTime from first "start" chunk and endTime from last "end" chunk
    const startTime = matrix[0][0].startTime
    const lastSequence = matrix[matrix.length - 1]
    const endTime = lastSequence[lastSequence.length - 1].endTime

    try {
        // Process the audio matrix and get the result
        const outputFiles = await processAudioMatrix(matrix)
        const mergedFilePath = outputFiles[0]
        return { mergedFilePath, startTime, endTime }
    } catch (error) {
        throw new Error(`Failed to process audio matrix: ${error}`)
    }
}
