'use client'

import Link from 'next/link'
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

    return (
        <main className="container mx-auto py-8">
            <h1 className="text-3xl font-bold mb-8">Transcriber App</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {meetings.map((meeting) => (
                    <div key={meeting.id} className="flex flex-col gap-2">
                        <MeetingCard {...meeting} meetingId={meeting.id} />
                    </div>
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
