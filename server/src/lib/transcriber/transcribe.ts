import { exec } from 'child_process'
import * as fs from 'fs'
import OpenAI from 'openai'
import * as path from 'path'
import util from 'util'

const execPromise = util.promisify(exec)

const openai = new OpenAI({
    apiKey: process.env.OPENAI_KEY
})

function formatDateTimestamp(date: Date): string {
    return (
        date.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: '2-digit'
        }) +
        '-' +
        date.toTimeString().split(' ')[0]
    )
}

export async function splitAudio(
    inputPath: string,
    segmentDuration: number = 30
): Promise<string> {
    // Updated: create a unique temporary directory
    const tempDir = path.join(
        path.dirname(inputPath),
        `temp_segments_${Date.now()}_${Math.random().toString().slice(2, 7)}`
    )
    if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir)
    }

    const outputPattern = path.join(tempDir, 'segment_%03d.wav')
    await execPromise(
        `ffmpeg -i "${inputPath}" -f segment -segment_time ${segmentDuration} -c copy "${outputPattern}"`
    )

    return tempDir
}

interface APISegment {
    end: number
    text: string
    confidence?: number
    segments?: Array<{
        end: number
        text: string
        confidence?: number
    }>
}

interface TranscriptionResponse {
    text: string
    segments?: APISegment[]
}

export interface TranscribedSegment {
    index: number
    startTime: string
    endTime: string
    text: string
}

export async function transcribeAudioSegment(
    filePath: string,
    segmentIndex: number = 1,
    startTime: number = 0
): Promise<TranscribedSegment[]> {
    try {
        const response: TranscriptionResponse =
            await openai.audio.transcriptions.create({
                file: fs.createReadStream(filePath),
                model: 'whisper-1',
                response_format: 'verbose_json', // Changed to get detailed timing
                timestamp_granularities: ['segment'],
                language: 'en'
            })

        const segments: TranscribedSegment[] = (response.segments ?? []).map(
            (segment, idx) => {
                const segStart = new Date(startTime * 1000)
                const segEnd = new Date((startTime + segment.end) * 1000)

                return {
                    index: segmentIndex + idx,
                    startTime: formatDateTimestamp(segStart),
                    endTime: formatDateTimestamp(segEnd),
                    text: segment.text.trim()
                }
            }
        )

        return segments
    } catch (error: any) {
        console.error('Error transcribing segment:', error)
        throw error
    }
}

interface TranscribeFileSuccess {
    success: true
    jsonPath: string
    data: {
        metadata: {
            sourceFile: string
            transcriptionDate: string
            segmentCount: number
        }
        segments: TranscribedSegment[]
    }
}

interface TranscribeFileFailure {
    success: false
    error: string
}

export async function transcribeFile(
    inputFilePath: string,
    segmentDuration: number = 10
): Promise<TranscribeFileSuccess | TranscribeFileFailure> {
    try {
        const tempDir = await splitAudio(inputFilePath, segmentDuration)
        const segments: TranscribedSegment[] = []
        let segmentIndex = 1

        const files = fs
            .readdirSync(tempDir)
            .filter((file) => file.startsWith('segment_'))
            .sort()

        for (const file of files) {
            const filePath = path.join(tempDir, file)
            const startTime = (segmentIndex - 1) * segmentDuration
            const segmentResults = await transcribeAudioSegment(
                filePath,
                segmentIndex,
                startTime
            )
            segments.push(...segmentResults)
            segmentIndex += segmentResults.length
            // Removed individual file deletion: fs.unlinkSync(filePath)
        }

        // Updated: Remove the entire temporary directory recursively
        fs.rmSync(tempDir, { recursive: true, force: true })

        // Create output files
        const timestamp = formatDateTimestamp(new Date()).replace(/[/:]/g, '-')
        const baseFilename = path.basename(
            inputFilePath,
            path.extname(inputFilePath)
        )

        // Create JSON output
        const jsonOutput = {
            metadata: {
                sourceFile: inputFilePath,
                transcriptionDate: new Date().toISOString(),
                segmentCount: segments.length
            },
            segments: segments
        }

        const saveDir = 'uploads'
        if (!fs.existsSync(saveDir)) {
            fs.mkdirSync(saveDir)
        }

        // Save files
        const jsonPath = `${saveDir}/${baseFilename}_${timestamp}.json`

        fs.writeFileSync(jsonPath, JSON.stringify(jsonOutput, null, 2))

        return {
            success: true,

            jsonPath,
            data: jsonOutput
        }
    } catch (error: any) {
        console.error('Transcription failed:', error)
        return {
            success: false,
            error: error.message
        }
    }
}

// For use in other modules
export default {
    transcribeFile
}
