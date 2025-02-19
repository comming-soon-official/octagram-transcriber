'use client'

import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table'

interface Meeting {
    id: string
    meetingId: string
    createdAt: string
    endedAt: string | null
    transcriberOutput: string | null
}

export default function Dashboard() {
    const [meetings, setMeetings] = useState<Meeting[]>([])
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        fetchMeetings()
    }, [])

    const fetchMeetings = async () => {
        try {
            const response = await fetch('/api/meetings')
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`)
            }
            const data = await response.json()
            if (data.success) {
                setMeetings(data.meetings)
            }
        } catch (error) {
            console.error('Error fetching meetings:', error)
            setMeetings([])
        }
    }

    const handleTranscribe = async (meetingId: string) => {
        setLoading(true)
        try {
            const response = await fetch(`/api/merge-audio/${meetingId}`)
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`)
            }
            await fetchMeetings()
        } catch (error) {
            console.error('Transcription error:', error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="container mx-auto py-10">
            <Card>
                <CardContent className="p-6">
                    <h2 className="text-2xl font-bold mb-6">
                        Meetings Dashboard
                    </h2>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Meeting ID</TableHead>
                                <TableHead>Created At</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {meetings.map((meeting) => (
                                <TableRow key={meeting.id}>
                                    <TableCell>{meeting.meetingId}</TableCell>
                                    <TableCell>
                                        {new Date(
                                            meeting.createdAt
                                        ).toLocaleString()}
                                    </TableCell>
                                    <TableCell>
                                        {meeting.endedAt ? 'Ended' : 'Active'}
                                    </TableCell>
                                    <TableCell>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            disabled={
                                                loading ||
                                                !meeting.endedAt ||
                                                Boolean(
                                                    meeting.transcriberOutput
                                                )
                                            }
                                            onClick={() =>
                                                handleTranscribe(
                                                    meeting.meetingId
                                                )
                                            }
                                        >
                                            {meeting.transcriberOutput
                                                ? 'Transcribed'
                                                : 'Transcribe'}
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
