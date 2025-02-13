export type FootageMatrix = {
    type: 'start' | 'middle' | 'end'
    startTime: Date
    endTime: Date
    filepath: string
    userId?: string
    meetingId?: string
}
