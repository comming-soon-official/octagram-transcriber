import { footages } from '../../db/schema'
import { FootageMatrix } from './types'

type Footage = typeof footages.$inferSelect

export function sortFootages(footageList: Footage[]): FootageMatrix[][] {
    // Convert string dates to Date objects for testing with sample data
    const processedFootages = footageList.map((footage) => ({
        ...footage,
        startTime:
            footage.startTime instanceof Date
                ? footage.startTime
                : footage.startTime
                ? new Date(footage.startTime)
                : new Date(),
        endTime:
            footage.endTime instanceof Date
                ? footage.endTime
                : footage.endTime
                ? new Date(footage.endTime)
                : new Date()
    }))

    const sortedFootages = [...processedFootages].sort((a, b) =>
        a.startTime && b.startTime
            ? a.startTime.getTime() - b.startTime.getTime()
            : 0
    )

    const matrix: FootageMatrix[][] = []
    let currentSequence: FootageMatrix[] = []

    sortedFootages.forEach((footage) => {
        const footageItem = {
            type: footage.type as 'start' | 'middle' | 'end',
            startTime: footage.startTime,
            endTime: footage.endTime,
            filepath: footage.file ?? ''
        }

        if (footage.type === 'start') {
            if (currentSequence.length > 0) {
                matrix.push(currentSequence)
            }
            currentSequence = [footageItem]
        } else if (footage.type === 'middle') {
            currentSequence.push(footageItem)
        } else if (footage.type === 'end') {
            currentSequence.push(footageItem)
            matrix.push(currentSequence)
            currentSequence = []
        }
    })

    // Push any remaining sequence
    if (currentSequence.length > 0) {
        matrix.push(currentSequence)
    }

    // Log the matrix for debugging
    console.log('Footage Matrix:', matrix)
    console.log('Total sequences:', matrix.length)

    return matrix
}

// Add this block for testing
// if (require.main === module) {
//     console.log('Testing sortFootages with sample data...')
//     const transformedFootages = sampleData.footages.map((f) => ({
//         ...f,
//         createdAt: new Date(f.createdAt),
//         startTime: new Date(f.startTime),
//         endTime: new Date(f.endTime),
//         userId: f.userId || null,
//         meetingId: f.meetingId || null,
//         type: f.type as 'start' | 'middle' | 'end'
//     }))
//     const result = sortFootages(transformedFootages)
//     console.log('Result:', JSON.stringify(result, null, 2))
// }
