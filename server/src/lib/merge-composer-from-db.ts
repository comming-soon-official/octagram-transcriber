import { promises as fs } from 'fs'
import { exec } from 'child_process'
import path from 'path'

import { db } from '../db'
import { footages } from '../db/schema'
import { and, eq } from 'drizzle-orm'

interface AudioChunk {
    timestamp: number
    filepath: string
}

// Fetch audio chunks from the database for the given meetId and userId
async function getAudioChunksFromDB(
    meetId: string,
    userId: string
): Promise<AudioChunk[]> {
    // Adjusted the query by adding explicit type annotation for the parameter 'chunk'
    const chunks = await db
        .select()
        .from(footages)
        .where(and(eq(footages.meetingId, meetId), eq(footages.userId, userId)))
    console.log(chunks)

    // Map the result to our AudioChunk type. Assumes the DB columns are named 'timestamp' and 'filePath'
    const audioChunks: AudioChunk[] = chunks.map((chunk) => ({
        timestamp: chunk.startTime?.getTime()!,
        filepath: chunk.file!
    }))

    // Sort the audio chunks by timestamp in ascending order
    audioChunks.sort((a, b) => a.timestamp - b.timestamp)
    return audioChunks
}

// Merge the audio chunks fetched from the database into a single audio file
export async function mergeComposerFromDB(
    meetId: string,
    userId: string
): Promise<string> {
    const chunks = await getAudioChunksFromDB(meetId, userId)
    if (chunks.length === 0) {
        throw new Error(
            'No audio chunks found for the provided meet id and user id'
        )
    }

    // Create a temporary file list for ffmpeg's concat demuxer
    const tempFileList = path.join(
        process.cwd(),
        `${meetId}-${userId}-filelist.txt`
    )

    // Verify each file exists and is readable before adding to the list
    const validChunks = await Promise.all(
        chunks.map(async (chunk) => {
            try {
                await fs.access(chunk.filepath)
                return chunk
            } catch (err) {
                console.warn(`File not accessible: ${chunk.filepath}`)
                return null
            }
        })
    ).then((chunks) => chunks.filter(Boolean))

    if (validChunks.length === 0) {
        throw new Error('No valid audio chunks found')
    }

    // Use absolute paths and proper escaping for the file list
    const fileListContent = validChunks
        .map(
            (chunk) =>
                `file '${path.resolve(chunk!.filepath).replace(/'/g, "'\\''")}'`
        )
        .join('\n')

    await fs.writeFile(tempFileList, fileListContent)

    // Define the output merged file path
    const outputMergedFile = path.join(
        process.cwd(),
        `${meetId}-${userId}-merged.mkv`
    )

    return new Promise((resolve, reject) => {
        // Add -strict experimental flag and specify the codec explicitly
        const command = `ffmpeg -y -f concat -safe 0 -i "${tempFileList.replace(
            /"/g,
            '\\"'
        )}" -c:v copy -c:a copy -strict experimental "${outputMergedFile.replace(
            /"/g,
            '\\"'
        )}"`
        console.log('Executing command:', command)

        const ffmpeg = exec(command, (error, stdout, stderr) => {
            // Clean up temporary file list regardless of success/failure

            if (error) {
                console.error('FFmpeg stderr:', stderr)
                reject(new Error(`FFmpeg error: ${stderr}`))
            } else {
                resolve(outputMergedFile)
            }
        })

        ffmpeg.on('exit', () => {
            fs.unlink(tempFileList).catch((err) => {
                console.warn('Failed to clean up temp file:', err)
            })
        })
    })
}
