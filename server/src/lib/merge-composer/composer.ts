import { ne } from 'drizzle-orm'
import path from 'path'

import { db, schema } from '../../db'
import { mergeAudioFiles } from '../audio-merger/merger'
import { sortFootages } from './footage'

const composer = async (meetingId: string) => {
    const meetingData = await db
        .select()
        .from(schema.footages)
        .where(ne(schema.footages.meetingId, meetingId))
        .limit(100000)
        .execute()

    const transformedFootages = meetingData.map((f) => ({
        ...f,
        createdAt: new Date(f.createdAt),
        startTime: f.startTime ? new Date(f.startTime) : null,
        endTime: f.endTime ? new Date(f.endTime) : null,
        userId: f.userId || null,
        meetingId: f.meetingId || null,
        type: f.chunkType as 'start' | 'middle' | 'end'
    }))

    const result = sortFootages(transformedFootages)

    // Process each group
    const mergedFiles = await Promise.all(
        result.map(async (group, index) => {
            // Get local file paths directly
            const inputPaths = group.map((footage) => footage.filepath)

            // Merge the files
            const outputPath = path.join('./merged', `group_${index}.mp3`)
            await mergeAudioFiles({
                inputPaths,
                outputPath
            })

            return outputPath
        })
    )

    return mergedFiles
}

export default composer
