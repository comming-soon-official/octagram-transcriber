import { create } from 'zustand'

export type universalStoreType = {
    meetings: MeetingTypes[]
    selectedMeetingId: string | null
    setSelectedMeeting: (id: string | null) => void
    write: (state: Partial<universalStoreType>) => void
}
export const useUniversalStore = create<universalStoreType>((set) => ({
    meetings: [],
    selectedMeetingId: null,

    setSelectedMeeting: (id) => set(() => ({ selectedMeetingId: id })),
    write: (state) => set(state)
}))

export type MeetingTypes = {
    id: string
    meetingId: string
    createdAt: string
    endedAt: string | null
    transcriberOutput: string | null
}
