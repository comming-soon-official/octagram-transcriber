import * as fs from 'fs'
import { OpenAI } from 'openai'
import { formatTranscriptForDisplay, organizeTranscriptByUser } from './user-summary'

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
            // Use seg.username if provided; fallback to extracting "user <number>"
            const match = seg.text.match(/user\s*(\d+)/i)
            const speaker =
                seg.username || (match ? `User ${match[1]}` : 'Unknown')
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

async function structuredSummarizeWithOpenAI(
    groupedTranscripts: Record<string, string>
): Promise<{
    summary: string;
    keyDiscussion: string[];
    actionItems: string[];
}> {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_KEY })

    let prompt = `Analyze the following meeting transcript and provide a structured response with these specific sections:
1. Overall Summary: A concise summary of the entire meeting
2. Key Discussion Points: List the main topics discussed and important decisions made (each point as a separate item)
3. Action Items: List specific tasks, assignments, or follow-up items mentioned (each item as a separate item)

Meeting Transcript:
`
    for (const speaker in groupedTranscripts) {
        prompt += `${speaker}:\n${groupedTranscripts[speaker]}\n\n`
    }

    try {
        const completion = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [{ 
                role: 'user', 
                content: prompt,
            }],
            functions: [
                {
                    name: 'processMeetingSummary',
                    description: 'Process and structure the meeting summary',
                    parameters: {
                        type: 'object',
                        properties: {
                            summary: {
                                type: 'string',
                                description: 'Overall summary of the meeting'
                            },
                            keyDiscussion: {
                                type: 'array',
                                items: {
                                    type: 'string'
                                },
                                description: 'Array of key discussion points and decisions'
                            },
                            actionItems: {
                                type: 'array',
                                items: {
                                    type: 'string'
                                },
                                description: 'Array of action items and follow-up tasks'
                            }
                        },
                        required: ['summary', 'keyDiscussion', 'actionItems']
                    }
                }
            ],
            function_call: { name: 'processMeetingSummary' }
        })

        const functionCall = completion.choices[0].message?.function_call
        if (functionCall?.arguments) {
            const result = JSON.parse(functionCall.arguments)
            return {
                summary: result.summary,
                keyDiscussion: result.keyDiscussion,
                actionItems: result.actionItems
            }
        }

        throw new Error('Failed to generate structured summary')
    } catch (error) {
        console.error('Error calling OpenAI API:', error)
        return {
            summary: 'Error generating summary.',
            keyDiscussion: [],
            actionItems: []
        }
    }
}

export async function summarizer(filesPaths: string[]) {
    try {
        // Read and merge transcripts
        const transcriptsArrays = await Promise.all(
            filesPaths.map((filePath) =>
                Promise.resolve(readTranscript(filePath))
            )
        )
        const mergedTranscript = transcriptsArrays.flat()
        
        // Get both user-wise organization and chronological conversation
        const {
            userWiseTranscripts,
            chronologicalConversation
        } = organizeTranscriptByUser(mergedTranscript)

        // Format the transcripts for readable output
        const formattedTranscripts = formatTranscriptForDisplay(
            userWiseTranscripts,
            chronologicalConversation
        )

        // Group text by speaker for structured summary
        const groupedTranscripts = groupBySpeaker(mergedTranscript)
        // Generate structured meeting summary
        const structuredSummary = await structuredSummarizeWithOpenAI(groupedTranscripts)

        return {
            ...structuredSummary,
            userWiseTranscripts,
            chronologicalConversation,
            formattedOutput: formattedTranscripts
        }
    } catch (error) {
        console.error('Error processing transcripts:', error)
        throw error
    }
}
