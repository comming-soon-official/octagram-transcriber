'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useState } from 'react'

import { MeetingCard } from '@/components/internal/meeting-card'
import TooltipWrapper from '@/components/internal/tooltipwrapper'
import { Button } from '@/components/ui/button'
import { useUniversalStore } from '@/store/useUniversalStore'

export default function MeetingDetails() {
    const { id } = useParams() as { id: string }
    const { meetings, selectedMeetingId } = useUniversalStore()
    const effectiveId = selectedMeetingId || id
    const meeting = meetings.find((m) => m.id === effectiveId)

    const [isTranscribing, setIsTranscribing] = useState(false)
    const [transcription, setTranscription] = useState('')
    const [transcriptData, setTranscriptData] = useState<
        {
            transcript: Transcript
            username: string
        }[]
    >([])

    const handleTranscribe = async () => {
        if (!meeting) return
        setIsTranscribing(true)
        try {
            const response = await fetch(
                `/api/merge-audio/${meeting.meetingId}`
            )
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`)
            }
            const data = await response.json()
            setTranscription(data.transcription)
        } catch (error) {
            console.error('Transcription error:', error)
        } finally {
            setIsTranscribing(false)
        }
    }

    const fetchTranscript = async () => {
        if (!meeting) return
        try {
            const response = await fetch(
                'http://localhost:8000/api/get-transcript',
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ meeting_id: meeting.meetingId })
                }
            )
            const data = await response.json()
            console.log(data)

            const transcriptArray = data.footages.map((items: any) => ({
                transcript: JSON.parse(items.transcription) as Transcript,
                username: items.username
            }))
            console.log(transcriptArray)

            setTranscriptData(transcriptArray)
        } catch (error) {
            console.error('Error fetching transcript:', error)
        }
    }

    // Compute the actual transcription from stored output or state
    const displayTranscription = meeting?.transcriberOutput || transcription

    if (!meeting) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh]">
                <p className="text-xl font-medium text-gray-600 mb-4">
                    Meeting not found
                </p>
                <Link href="/transcribe">
                    <Button variant="default">Back to Meetings</Button>
                </Link>
            </div>
        )
    }

    return (
        <main className="max-w-7xl mx-auto px-4 py-8">
            <MeetingCard
                id={meeting.id}
                meetingId={meeting.meetingId}
                title={`Meeting ${meeting.meetingId}`}
                date={new Date(meeting.createdAt).toLocaleDateString()}
                time={new Date(meeting.createdAt).toLocaleTimeString()}
                // transcribed={meeting.transcriberOutput ?? ''}
            />

            <div className="flex gap-4 mt-6">
                <Button
                    onClick={handleTranscribe}
                    disabled={isTranscribing || Boolean(displayTranscription)}
                    variant="default"
                >
                    {isTranscribing
                        ? 'Transcribing...'
                        : 'Transcribe (Merge Audio)'}
                </Button>
                <Button
                    disabled={Boolean(transcriptData[0]?.username)}
                    onClick={fetchTranscript}
                >
                    Load Transcript Footages
                </Button>
            </div>

            {displayTranscription && (
                <div className="mt-8 p-6 bg-white rounded-lg shadow-sm">
                    <h2 className="text-xl font-semibold mb-4">
                        Transcription
                    </h2>
                    <p className="text-gray-700">{displayTranscription}</p>
                </div>
            )}

            {transcriptData.length > 0 && (
                <div className="mt-8">
                    {transcriptData.map((transcriptItem, index) => (
                        <div
                            key={index}
                            className="bg-white rounded-lg shadow-sm p-6 mb-4"
                        >
                            <div className="text-xl font-semibold mb-4">
                                Breakdown
                            </div>
                            <div className="mb-4">
                                <h3 className="text-lg font-semibold">
                                    {transcriptItem.username}
                                </h3>
                                <p className="text-sm text-gray-500">
                                    {
                                        transcriptItem.transcript?.metadata
                                            .transcriptionDate
                                    }{' '}
                                    •{' '}
                                    {
                                        transcriptItem.transcript?.metadata
                                            .segmentCount
                                    }{' '}
                                    segments
                                </p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {transcriptItem.transcript?.segments.map(
                                    (segment, segIndex) => (
                                        <TranscriptSegment
                                            key={segIndex}
                                            startTime={segment.startTime}
                                            endTime={segment.endTime}
                                            text={segment.text}
                                        />
                                    )
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </main>
    )
}

export interface TranscriptMetadata {
    sourceFile: string
    transcriptionDate: string
    segmentCount: number
}

export interface TranscriptSegment {
    index: number
    startTime: string
    endTime: string
    text: string
    username: string
}

export interface Transcript {
    metadata: TranscriptMetadata
    segments: TranscriptSegment[]
}

interface TranscriptSegmentProps {
    startTime: string
    endTime: string
    text: string
}

export const TranscriptSegment = ({
    startTime,
    endTime,
    text
}: TranscriptSegmentProps) => {
    const formatTime = (timeStr: string): string => timeStr.slice(-8)

    return (
        <div className="inline-block m-1">
            <TooltipWrapper
                content={`${formatTime(startTime)}-${formatTime(endTime)}`}
            >
                <span className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors duration-200">
                    {text}
                </span>
            </TooltipWrapper>
        </div>
    )
}
