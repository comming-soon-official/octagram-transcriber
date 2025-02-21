// nextjs/src/app/transcribe/page.tsx
'use client'
import { useEffect, useState } from 'react'

import { MeetingCard } from '@/components/internal/meeting-card'
import { MeetingTypes, useUniversalStore } from '@/store/useUniversalStore'

export default function MeetingsList() {
    const [meetings, setMeetings] = useState<MeetingTypes[]>([])
    const { write, setSelectedMeeting } = useUniversalStore()
    const fetchMeetings = async () => {
        try {
            const response = await fetch('/api/meetings')
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`)
            }
            const data = await response.json()
            if (data.success) {
                write({ meetings: data.meetings })
                setMeetings(data.meetings)
            }
        } catch (error) {
            console.error('Error fetching meetings:', error)
            setMeetings([])
        }
    }

    const handleSelectMeeting = (meetingId: string) => {
        setSelectedMeeting(meetingId)
    }

    useEffect(() => {
        fetchMeetings()
    }, [])

    return (
        <main className="container mx-auto py-8">
            <h1 className="text-3xl font-bold mb-8">Transcriber App</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {meetings.map((meeting) => (
                    <div
                        key={meeting.id}
                        className="flex flex-col gap-2"
                        onClick={() => handleSelectMeeting(meeting.id)}
                    >
                        <MeetingCard
                            id={meeting.id}
                            meetingId={meeting.meetingId}
                            title={`Meeting ${meeting.meetingId}`}
                            date={new Date(
                                meeting.createdAt
                            ).toLocaleDateString()}
                            time={new Date(
                                meeting.createdAt
                            ).toLocaleTimeString()}
                            transcribed={meeting.transcriberOutput ?? ''}
                        />
                    </div>
                ))}
            </div>
        </main>
    )
}
