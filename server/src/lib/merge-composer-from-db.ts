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
): Promise<{ mergedFilePath: string; startTime: Date; endTime: Date }[]> {
    const chunks = await getAudioChunksFromDB(meetId, userId)
    if (chunks.length === 0) {
        throw new Error(
            'No audio chunks found for the provided meet id and user id'
        )
    }

    // Sort footages into matrix
    const matrix = sortFootages(chunks)
    console.log(matrix)

    try {
        const outputFiles = await processAudioMatrix(matrix)
        // Map each sequence to its own merged file and time range
        const mergedResults = matrix.map((sequence, index) => ({
            mergedFilePath: outputFiles[index],
            startTime: sequence[0].startTime,
            endTime: sequence[sequence.length - 1].endTime
        }))
        return mergedResults
    } catch (error) {
        throw new Error(`Failed to process audio matrix: ${error}`)
    }
}
