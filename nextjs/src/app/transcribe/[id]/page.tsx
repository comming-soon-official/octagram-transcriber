'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useState } from 'react'

// Shared static meetings data (could be replaced with actual data fetching)
const meetings = [
    { id: '1', title: 'Team Standup', date: '2025-02-21', time: '09:00 AM' },
    { id: '2', title: 'Project Review', date: '2025-02-22', time: '02:00 PM' },
    { id: '3', title: 'Client Meeting', date: '2025-02-23', time: '11:00 AM' }
]

export default function MeetingDetails() {
    const { id } = useParams() as { id: string }
    const meeting = meetings.find((m) => m.id === id)

    const [isTranscribing, setIsTranscribing] = useState(false)
    const [transcription, setTranscription] = useState('')

    const startTranscription = async () => {
        if (!meeting) return
        setIsTranscribing(true)
        try {
            const response = await fetch(`/api/transcribe?id=${id}`, {
                method: 'POST'
            })
            const data = await response.json()
            setTranscription(data.transcription)
        } catch (error) {
            console.error('Error starting transcription:', error)
        } finally {
            setIsTranscribing(false)
        }
    }

    if (!meeting) {
        return (
            <main className="container mx-auto py-8">
                <p>Meeting not found</p>
                <Link href="/transcribe">
                    <button className="mt-4 px-4 py-2 bg-gray-500 text-white rounded">
                        Back
                    </button>
                </Link>
            </main>
        )
    }

    return (
        <main className="container mx-auto py-8">
            <div className="border rounded p-4 mb-4">
                <h1 className="text-2xl font-bold">{meeting.title}</h1>
                <p>Date: {meeting.date}</p>
                <p>Time: {meeting.time}</p>
            </div>
            <button
                onClick={startTranscription}
                disabled={isTranscribing}
                className="mb-4 px-4 py-2 bg-green-500 text-white rounded"
            >
                {isTranscribing ? 'Transcribing...' : 'Start Transcription'}
            </button>
            {transcription && (
                <div className="border-t pt-4">
                    <h2 className="text-xl font-semibold mb-2">
                        Transcription
                    </h2>
                    <p>{transcription}</p>
                </div>
            )}
            {/* ...existing code... */}
        </main>
    )
}
