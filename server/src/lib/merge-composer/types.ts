export type FootageMatrix = {
    chunkType: 'start' | 'middle' | 'end'
    startTime: Date
    endTime: Date
    filepath: string
    userId?: string
    username?: string
    meetingId?: string
}
