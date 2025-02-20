'use client'

import { useState } from 'react'

import { MeetingCard } from '@/components/internal/meeting-card'
import { TranscriptionModal } from '@/components/internal/transcription-modal'

const meetings = [
    { id: '1', title: 'Team Standup', date: '2025-02-21', time: '09:00 AM' },
    { id: '2', title: 'Project Review', date: '2025-02-22', time: '02:00 PM' },
    { id: '3', title: 'Client Meeting', date: '2025-02-23', time: '11:00 AM' }
]

export default function Home() {
    const [isTranscribing, setIsTranscribing] = useState(false)
    const [showModal, setShowModal] = useState(false)
    const [transcription, setTranscription] = useState('')
    const [currentMeeting, setCurrentMeeting] = useState<
        (typeof meetings)[0] | null
    >(null)

    const startTranscription = async (id: string) => {
        setIsTranscribing(true)
        const meeting = meetings.find((m) => m.id === id)
        if (!meeting) return

        setCurrentMeeting(meeting)

        try {
            const response = await fetch(`/api/transcribe?id=${id}`, {
                method: 'POST'
            })
            const data = await response.json()
            setTranscription(data.transcription)
            setShowModal(true)
        } catch (error) {
            console.error('Error starting transcription:', error)
        } finally {
            setIsTranscribing(false)
        }
    }

    return (
        <main className="container mx-auto py-8">
            <h1 className="text-3xl font-bold mb-8">Transcriber App</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {meetings.map((meeting) => (
                    <MeetingCard
                        key={meeting.id}
                        {...meeting}
                        onStartTranscription={startTranscription}
                    />
                ))}
            </div>
            {currentMeeting && (
                <TranscriptionModal
                    isOpen={showModal}
                    onClose={() => setShowModal(false)}
                    transcription={transcription}
                    meetingTitle={currentMeeting.title}
                />
            )}
        </main>
    )
}
