'use client'
import { Play, Users } from 'lucide-react'
import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useUniversalStore } from '@/store/useUniversalStore'

interface TranscriptSegment {
    text: string
    startTime: Date
    endTime: Date
}

interface ChronologicalEntry extends TranscriptSegment {
    username: string
}

interface SummaryData {
    summary: string
    keyDiscussion: string[]
    actionItems: string[]
}
export default function MeetingOverview() {
    const [summary, setSummary] = useState<SummaryData>({
        summary: '',
        keyDiscussion: [],
        actionItems: []
    })
    const { id } = useParams() as { id: string }

    const { meetings, selectedMeetingId } = useUniversalStore()
    const effectiveId = selectedMeetingId || id
    const meeting = meetings.find((m) => m.id === effectiveId)
    const [transcribe, setTranscribe] = useState<ChronologicalEntry[]>()

    const handleTranscribe = async () => {
        if (!meeting) return
        try {
            const response = await fetch(
                `https://octagram-transcriber-production.up.railway.app/api/merge-audio/${meeting.meetingId}`
            )
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`)
            }
            const data = await response.json()
            console.log(data)
        } catch (error) {
            console.error('Transcription error:', error)
        }
    }
    const fetchSummary = async () => {
        if (!meeting) return
        try {
            const response = await fetch(
                `https://octagram-transcriber-production.up.railway.app/api/meeting-summary/${meeting.meetingId}`
            )
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`)
            }
            const data = await response.json()
            console.log(data.summary)

            setSummary(data.summary)

            // setSummary(data)
        } catch (error) {
            console.error('Summary error:', error)
        }
    }

    const fetchUserTranscript = async () => {
        if (!meeting) return
        try {
            const response = await fetch(
                `https://octagram-transcriber-production.up.railway.app/api/meeting/${meeting.meetingId}/chronological`
            )
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`)
            }
            const data = await response.json()
            console.log(data.chronologicalConversation)
            setTranscribe(data.chronologicalConversation)
            // setSummary(data.summary)

            // setSummary(data)
        } catch (error) {
            console.error('Summary error:', error)
        }
    }

    useEffect(() => {
        fetchSummary()
        fetchUserTranscript()
    }, [])
    return (
        <div className="container mx-auto py-6 max-w-6xl">
            {/* Meeting Header */}
            <div className="flex justify-between items-start mb-8">
                <div>
                    <h1 className="text-2xl font-bold mb-2">
                        {meeting?.meetingId}
                        {/* Q1 2024 Product Planning */}
                    </h1>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{meeting?.createdAt}</span>
                        {/* <span>Feb 20, 2024</span> */}
                        <span>•</span>

                        <span>{`${meeting?.createdAt}-${meeting?.endedAt}`}</span>
                        {/* <span>10:00 AM - 11:30 AM</span> */}
                        <span>•</span>
                        <div className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            {/* <span>8 Participants</span> */}
                        </div>
                    </div>
                </div>
                <Button
                    variant="outline"
                    onClick={handleTranscribe}
                    disabled={summary.summary !== ''}
                >
                    <Play className="mr-2 h-4 w-4" />
                    Transcript
                </Button>
            </div>

            <Tabs defaultValue="summary" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="summary">Summary</TabsTrigger>
                    <TabsTrigger value="transcript">Transcript</TabsTrigger>
                    {/* <TabsTrigger value="speakers">Speakers</TabsTrigger> */}
                </TabsList>

                {/* Summary Tab */}
                <TabsContent value="summary" className="space-y-6">
                    {summary && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Meeting Summary</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <p className="text-muted-foreground">
                                    {summary?.summary}
                                </p>

                                {summary.keyDiscussion.length > 0 && (
                                    <div className="space-y-2">
                                        <h3 className="font-semibold">
                                            Key Decisions:
                                        </h3>
                                        <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                                            {summary.keyDiscussion.map(
                                                (items: any) => (
                                                    <li>{items}</li>
                                                )
                                            )}
                                        </ul>
                                    </div>
                                )}
                                {summary.actionItems.length > 0 && (
                                    <div className="space-y-2">
                                        <h3 className="font-semibold">
                                            Action Items:
                                        </h3>
                                        <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                                            {summary.actionItems.map(
                                                (items: any) => (
                                                    <li>{items}</li>
                                                )
                                            )}
                                        </ul>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}
                    {/* 
                    <Card>
                        <CardHeader>
                            <CardTitle>Timeline Overview</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {timelineItems.map((item, index) => (
                                    <div key={index} className="flex gap-4">
                                        <div className="w-24 text-sm text-muted-foreground">
                                            {item.time}
                                        </div>
                                        <div>
                                            <p className="font-medium">
                                                {item.topic}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                {item.description}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card> */}
                </TabsContent>

                {/* Transcript Tab */}
                <TabsContent value="transcript">
                    <Card>
                        <CardContent className="pt-6">
                            <div className="space-y-6">
                                {transcribe?.map((item, index) => (
                                    <div key={index} className="flex gap-4">
                                        <Avatar className="h-8 w-8">
                                            <AvatarImage
                                                // src={item.avatar}
                                                alt={item.username}
                                            />
                                            <AvatarFallback className="bg-gray-200">
                                                {item.username
                                                    .split(' ')
                                                    .map((n) => n[0])
                                                    .join('')}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 space-y-1">
                                            <div className="flex items-center gap-2">
                                                <span className="font-semibold">
                                                    {item.username}
                                                </span>
                                                <span className="text-sm opacity-60">
                                                    {new Intl.DateTimeFormat(
                                                        'en-US',
                                                        {
                                                            year: 'numeric',
                                                            month: 'short',
                                                            day: 'numeric',
                                                            hour: '2-digit',
                                                            minute: '2-digit',
                                                            hour12: true
                                                        }
                                                    ).format(
                                                        new Date(item.startTime)
                                                    )}{' '}
                                                </span>
                                            </div>
                                            <p className="text-muted-foreground">
                                                {item.text}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Speakers Tab */}
                <TabsContent value="speakers">
                    <Card>
                        <CardContent className="pt-6">
                            <div className="grid gap-6 md:grid-cols-2">
                                {speakers.map((speaker, index) => (
                                    <div
                                        key={index}
                                        className="flex items-start gap-4"
                                    >
                                        <Avatar className="h-10 w-10">
                                            <AvatarImage
                                                src={speaker.avatar}
                                                alt={speaker.name}
                                            />
                                            <AvatarFallback>
                                                {speaker.name
                                                    .split(' ')
                                                    .map((n) => n[0])
                                                    .join('')}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="space-y-1">
                                            <div className="font-medium">
                                                {speaker.name}
                                            </div>
                                            <div className="text-sm text-muted-foreground">
                                                {speaker.role}
                                            </div>
                                            <div className="flex gap-2 mt-1">
                                                <Badge variant="secondary">
                                                    {speaker.speakingTime}
                                                </Badge>
                                                <Badge variant="secondary">
                                                    {speaker.messageCount}{' '}
                                                    messages
                                                </Badge>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}

const timelineItems = [
    {
        time: '10:00 AM',
        topic: 'Meeting Start & Introduction',
        description: 'Overview of agenda and goals for the quarter'
    },
    {
        time: '10:15 AM',
        topic: 'Q1 Roadmap Review',
        description: 'Discussion of planned features and timeline'
    },
    {
        time: '10:45 AM',
        topic: 'Resource Allocation',
        description: 'Team capacity planning and hiring needs'
    },
    {
        time: '11:15 AM',
        topic: 'Action Items & Next Steps',
        description: 'Assignment of tasks and follow-up meetings'
    }
]

const transcriptItems = [
    {
        name: 'Sarah Chen',
        time: '10:00 AM',
        avatar: '/placeholder.svg',
        text: "Good morning everyone. Let's get started with our Q1 planning session. I'd like to begin by reviewing our key objectives for the quarter."
    },
    {
        name: 'Mike Johnson',
        time: '10:02 AM',
        avatar: '/placeholder.svg',
        text: "Before we dive in, I've prepared a brief overview of our current sprint completion rates and team velocity."
    },
    {
        name: 'Alex Rodriguez',
        time: '10:05 AM',
        avatar: '/placeholder.svg',
        text: 'I think we should also consider the impact of the new mobile app redesign on our existing resources.'
    },
    {
        name: 'Emily Wong',
        time: '10:08 AM',
        avatar: '/placeholder.svg',
        text: 'Agreed. The design team has already started working on the initial wireframes for the mobile app.'
    }
]

const speakers = [
    {
        name: 'Sarah Chen',
        role: 'Product Manager',
        avatar: '/placeholder.svg',
        speakingTime: '25 mins',
        messageCount: 15
    },
    {
        name: 'Mike Johnson',
        role: 'Engineering Lead',
        avatar: '/placeholder.svg',
        speakingTime: '18 mins',
        messageCount: 12
    },
    {
        name: 'Alex Rodriguez',
        role: 'Backend Developer',
        avatar: '/placeholder.svg',
        speakingTime: '15 mins',
        messageCount: 8
    },
    {
        name: 'Emily Wong',
        role: 'UX Designer',
        avatar: '/placeholder.svg',
        speakingTime: '12 mins',
        messageCount: 6
    }
]
