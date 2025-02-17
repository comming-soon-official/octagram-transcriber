import { exec } from 'child_process'
import fs from 'fs'
import OpenAI from 'openai'
import path from 'path'
import util from 'util'

const execPromise = util.promisify(exec)

interface TranscriptionSegment {
    index: number
    startTime: string
    endTime: string
    text: string
    confidence: number
}

interface TranscriptionOutput {
    metadata: {
        sourceFile: string
        transcriptionDate: string
        segmentCount: number
    }
    segments: TranscriptionSegment[]
}

interface TranscriptionResult {
    success: boolean
    srtPath?: string
    jsonPath?: string
    data?: TranscriptionOutput
    error?: string
}

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

async function splitAudio(
    inputPath: string,
    segmentDuration: number = 30
): Promise<string> {
    const tempDir = path.join(path.dirname(inputPath), 'temp_segments')
    if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir)
    }

    const outputPattern = path.join(tempDir, 'segment_%03d.wav')
    await execPromise(
        `ffmpeg -i "${inputPath}" -f segment -segment_time ${segmentDuration} -c copy "${outputPattern}"`
    )

    return tempDir
}

async function transcribeAudioSegment(
    filePath: string,
    segmentIndex: number = 1,
    startTime: number = 0
): Promise<TranscriptionSegment[]> {
    try {
        const response = await openai.audio.transcriptions.create({
            file: fs.createReadStream(filePath),
            model: 'whisper-1',
            response_format: 'verbose_json',
            language: 'en'
        })

        const segments = (response.segments || []).map(
            (segment: any, idx: number) => {
                const segStart = new Date(startTime * 1000)
                const segEnd = new Date((startTime + segment.end) * 1000)

                return {
                    index: segmentIndex + idx,
                    startTime: formatDateTimestamp(segStart),
                    endTime: formatDateTimestamp(segEnd),
                    text: segment.text.trim(),
                    confidence: segment.confidence
                }
            }
        )

        return segments
    } catch (error) {
        console.error('Error transcribing segment:', error)
        throw error
    }
}

async function transcribeFile(
    inputFilePath: string,
    segmentDuration: number = 30
): Promise<TranscriptionResult> {
    try {
        const tempDir = await splitAudio(inputFilePath, segmentDuration)
        const segments: TranscriptionSegment[] = []
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
            fs.unlinkSync(filePath)
        }

        fs.rmdirSync(tempDir)

        const timestamp = formatDateTimestamp(new Date()).replace(/[/:]/g, '-')
        const baseFilename = path.basename(
            inputFilePath,
            path.extname(inputFilePath)
        )

        const jsonOutput: TranscriptionOutput = {
            metadata: {
                sourceFile: inputFilePath,
                transcriptionDate: new Date().toISOString(),
                segmentCount: segments.length
            },
            segments: segments
        }

        const srtOutput = segments
            .map(
                (seg) =>
                    `${seg.index}\n${seg.startTime} --> ${seg.endTime}\n${seg.text}\n`
            )
            .join('\n')

        const jsonPath = `${baseFilename}_${timestamp}.json`
        const srtPath = `${baseFilename}_${timestamp}.srt`

        fs.writeFileSync(jsonPath, JSON.stringify(jsonOutput, null, 2))
        fs.writeFileSync(srtPath, srtOutput)

        return {
            success: true,
            srtPath,
            jsonPath,
            data: jsonOutput
        }
    } catch (error) {
        console.error('Transcription failed:', error)
        return {
            success: false,
            error: error instanceof Error ? error.message : String(error)
        }
    }
}

// Example usage
// transcribeFile('./2minzeetamil.mp3')

export { transcribeFile }
