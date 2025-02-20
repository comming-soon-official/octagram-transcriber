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

    processedFootages.sort(
        (a, b) => a.startTime.getTime() - b.startTime.getTime()
    )

    const matrix: FootageMatrix[][] = []
    let currentSequence: FootageMatrix[] = []

    processedFootages.forEach((footage) => {
        const footageItem = {
            chunkType: footage.chunkType as 'start' | 'middle' | 'end',
            startTime: footage.startTime,
            endTime: footage.endTime,
            filepath: footage.file ?? '',
            username: footage.username ?? undefined // convert null to undefined
        }

        if (footage.chunkType === 'start') {
            if (currentSequence.length > 0) {
                matrix.push(currentSequence)
            }
            currentSequence = [footageItem]
        } else if (footage.chunkType === 'middle') {
            currentSequence.push(footageItem)
        } else if (footage.chunkType === 'end') {
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
