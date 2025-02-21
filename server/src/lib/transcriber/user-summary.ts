interface UserTranscriptEntry {
    text: string;
    startTime: Date;
    endTime: Date;
    timestamp: number; // for sorting
}

interface UserWiseTranscript {
    [username: string]: UserTranscriptEntry[];
}

interface ConversationEntry {
    username: string;
    text: string;
    startTime: Date;
    endTime: Date;
}

interface TranscriptEntry {
    speaker: string
    text: string
    startTime: string
    endTime: string
}

export function organizeTranscriptByUser(transcriptEntries: TranscriptEntry[]): {
    userWiseTranscripts: UserWiseTranscript;
    chronologicalConversation: ConversationEntry[];
} {
    // First, organize entries by user
    const userWiseTranscripts: UserWiseTranscript = {}
    
    // Process and organize each entry
    transcriptEntries.forEach(entry => {
        const startTime = new Date(entry.startTime)
        const endTime = new Date(entry.endTime)
        
        const transcriptEntry: UserTranscriptEntry = {
            text: entry.text,
            startTime,
            endTime,
            timestamp: startTime.getTime()
        }

        if (!userWiseTranscripts[entry.speaker]) {
            userWiseTranscripts[entry.speaker] = []
        }
        userWiseTranscripts[entry.speaker].push(transcriptEntry)
    })

    // Sort each user's entries by timestamp
    Object.values(userWiseTranscripts).forEach(entries => {
        entries.sort((a, b) => a.timestamp - b.timestamp)
    })

    // Create chronological conversation flow
    const chronologicalConversation: ConversationEntry[] = transcriptEntries
        .map(entry => ({
            username: entry.speaker,
            text: entry.text,
            startTime: new Date(entry.startTime),
            endTime: new Date(entry.endTime)
        }))
        .sort((a, b) => a.startTime.getTime() - b.startTime.getTime())

    return {
        userWiseTranscripts,
        chronologicalConversation
    }
}

export function formatTranscriptForDisplay(
    userWiseTranscripts: UserWiseTranscript,
    chronologicalConversation: ConversationEntry[]
): {
    userWise: string;
    chronological: string;
} {
    // Format user-wise transcripts
    const userWise = Object.entries(userWiseTranscripts)
        .map(([username, entries]) => {
            const userEntries = entries
                .map(entry => {
                    const timeStr = entry.startTime.toLocaleTimeString()
                    return `[${timeStr}] ${entry.text}`
                })
                .join('\n')
            return `=== ${username}'s Contributions ===\n${userEntries}\n`
        })
        .join('\n')

    // Format chronological conversation
    const chronological = chronologicalConversation
        .map(entry => {
            const timeStr = entry.startTime.toLocaleTimeString()
            return `[${timeStr}] ${entry.username}: ${entry.text}`
        })
        .join('\n')

    return {
        userWise,
        chronological
    }
} 