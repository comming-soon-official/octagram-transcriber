import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'

interface TranscriptionModalProps {
    isOpen: boolean
    onClose: () => void
    transcription: string
    meetingTitle: string
}

export function TranscriptionModal({
    isOpen,
    onClose,
    transcription,
    meetingTitle
}: TranscriptionModalProps) {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[90vw] max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="text-2xl">
                        Transcription: {meetingTitle}
                    </DialogTitle>
                </DialogHeader>
                <ScrollArea className="flex-grow mt-4 border rounded-md p-4">
                    <p className="text-lg">{transcription}</p>
                </ScrollArea>
                <DialogFooter className="mt-4">
                    <Button onClick={onClose}>Close</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
