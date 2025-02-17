const OpenAI = require('openai')
const fs = require('fs')
const path = require('path')
const { exec } = require('child_process')
const util = require('util')
const execPromise = util.promisify(exec)

const openai = new OpenAI({
    apiKey: process.env.OPENAI_KEY
})

function formatDateTimestamp(date) {
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

async function splitAudio(inputPath, segmentDuration = 30) {
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
    filePath,
    segmentIndex = 1,
    startTime = 0
) {
    try {
        const response = await openai.audio.transcriptions.create({
            file: fs.createReadStream(filePath),
            model: 'whisper-1',
            response_format: 'verbose_json', // Changed to get detailed timing
            language: 'en'
        })

        const segments = response.segments.map((segment, idx) => {
            const segStart = new Date(startTime * 1000)
            const segEnd = new Date((startTime + segment.end) * 1000)

            return {
                index: segmentIndex + idx,
                startTime: formatDateTimestamp(segStart),
                endTime: formatDateTimestamp(segEnd),
                text: segment.text.trim(),
                confidence: segment.confidence
            }
        })

        return segments
    } catch (error) {
        console.error('Error transcribing segment:', error)
        throw error
    }
}

async function transcribeFile(inputFilePath, segmentDuration = 10) {
    try {
        const tempDir = await splitAudio(inputFilePath, segmentDuration)
        const segments = []
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
            fs.unlinkSync(filePath) // Clean up segment file
        }

        fs.rmdirSync(tempDir) // Clean up temp directory

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

        // Create SRT output
        const srtOutput = segments
            .map(
                (seg) =>
                    `${seg.index}\n${seg.startTime} --> ${seg.endTime}\n${seg.text}\n`
            )
            .join('\n')

        // Save files
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
            error: error.message
        }
    }
}

transcribeFile('./2minzeetamil.mp3')

module.exports = {
    transcribeFile
}
