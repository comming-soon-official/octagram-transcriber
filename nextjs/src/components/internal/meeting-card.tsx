import { CalendarIcon, ClockIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle
} from '@/components/ui/card'

interface MeetingCardProps {
    id: string
    title: string
    date: string
    time: string
    onStartTranscription: (id: string) => void
}

export function MeetingCard({
    id,
    title,
    date,
    time,
    onStartTranscription
}: MeetingCardProps) {
    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle>{title}</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <CalendarIcon className="h-4 w-4" />
                    <span>{date}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-muted-foreground mt-2">
                    <ClockIcon className="h-4 w-4" />
                    <span>{time}</span>
                </div>
            </CardContent>
            <CardFooter>
                <Button onClick={() => onStartTranscription(id)}>
                    Start Transcription
                </Button>
            </CardFooter>
        </Card>
    )
}
