import * as fs from 'fs'
import { OpenAI } from 'openai'

interface TranscriptEntry {
    speaker: string
    text: string
    startTime: string
    endTime: string
}

function readTranscript(filePath: string): TranscriptEntry[] {
    try {
        const fileContent = fs.readFileSync(filePath, 'utf8')
        // Check if file content appears to be JSON
        if (
            !fileContent.trim().startsWith('{') &&
            !fileContent.trim().startsWith('[')
        ) {
            throw new Error(
                `File does not contain valid JSON: ${fileContent.slice(
                    0,
                    50
                )}...`
            )
        }
        const data = JSON.parse(fileContent)
        // Parse segments from sample JSON structure
        return data.segments.map((seg: any) => {
            // Extract speaker by matching "user <number>"
            const match = seg.text.match(/user\s*(\d+)/i)
            const speaker = match ? `User ${match[1]}` : 'Unknown'
            return {
                speaker,
                text: seg.text,
                startTime: seg.startTime,
                endTime: seg.endTime
            }
        })
    } catch (error) {
        console.error(`Error reading ${filePath}:`, error)
        return []
    }
}

function groupBySpeaker(transcript: TranscriptEntry[]): Record<string, string> {
    return transcript.reduce((acc, entry) => {
        const segmentInfo = `[${entry.startTime} - ${entry.endTime}]: ${entry.text}`
        // Append segments per speaker with timestamps
        if (acc[entry.speaker]) {
            acc[entry.speaker] += '\n' + segmentInfo
        } else {
            acc[entry.speaker] = segmentInfo
        }
        return acc
    }, {} as Record<string, string>)
}

async function summarizeWithOpenAI(
    groupedTranscripts: Record<string, string>
): Promise<string> {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_KEY })

    let prompt =
        'Summarize the following meeting by explaining what each speaker discussed at the given times:\n\n'
    for (const speaker in groupedTranscripts) {
        prompt += `${speaker}:\n${groupedTranscripts[speaker]}\n\n`
    }

    try {
        const completion = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [{ role: 'user', content: prompt }]
        })
        return completion.choices[0].message?.content || 'No summary generated.'
    } catch (error) {
        console.error('Error calling OpenAI API:', error)
        return 'Error generating summary.'
    }
}

export async function summarizer(filesPaths: any) {
    // if (Array(filesPaths)) return

    try {
        // Read and merge transcripts
        const transcriptsArrays = await Promise.all(
            filesPaths.map((filePath: any) =>
                Promise.resolve(readTranscript(filePath))
            )
        )
        const mergedTranscript = transcriptsArrays.flat()
        // Group text by speaker
        const groupedTranscripts = groupBySpeaker(mergedTranscript)
        // Generate meeting summary
        const summary = await summarizeWithOpenAI(groupedTranscripts)

        console.log('Meeting Summary:')
        console.log(summary)
        return summary
    } catch (error) {
        console.error('Error processing transcripts:', error)
    }
}
