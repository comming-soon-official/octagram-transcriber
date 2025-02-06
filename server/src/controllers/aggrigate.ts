import { mkdir, writeFile } from 'fs/promises'
import path from 'path'
import { v4 } from 'uuid'

import { db, schema } from '../db'

type addFootageTypes = {
    user_id: string
    meeting_id: string
    startTime: string
    endTime: string
    file: Buffer
    type?: 'start' | 'middle' | 'end'
}
export const addFootage = async ({
    user_id,
    meeting_id,
    startTime,
    endTime,
    file,
    type
}: addFootageTypes) => {
    console.log('📁 Starting footage addition process')
    const fileUrl = await saveFile({
        user_id,
        meeting_id,
        startTime,
        endTime,
        file
    })
    console.log('💾 File saved successfully at:', fileUrl)

    const footageData = {
        id: v4(),
        file: fileUrl,
        meetingId: meeting_id,
        userId: user_id,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        type: type
    }
    console.log('📝 Preparing to insert footage data:', footageData)

    const result = await db.insert(schema.footages).values(footageData)
    console.log('✅ Footage data inserted successfully')
    return result
}
const saveFile = async ({
    user_id,
    meeting_id,
    startTime,
    endTime,
    file
}: addFootageTypes): Promise<string> => {
    console.log('📁 Starting file save process')

    if (!file) {
        console.error('❌ No file buffer provided')
        throw new Error('No file provided')
    }

    try {
        const sanitizedMeetingId = path
            .normalize(meeting_id)
            .replace(/^(\.\.(\/|\\|$))+/, '') // remove path traversal
            .replace(/['"]/g, '') // remove single and double quotes

        const sanitizedUserId = path
            .normalize(user_id)
            .replace(/^(\.\.(\/|\\|$))+/, '') // remove path traversal
            .replace(/['"]/g, '') // remove single and double quotes

        const baseDir = path.join(process.cwd(), 'uploads')
        console.log('📂 Base directory:', baseDir)

        const startTimeMs = JSON.stringify(startTime)
        const endTimeMs = JSON.stringify(endTime)
        // Get file extension from the incoming file type (default to .wav if not specified)
        const fileExtension = '.wav' // Since frontend is sending wav format
        const filename = `${startTimeMs}-${endTimeMs}${fileExtension}`

        const sanitizedFilename = path
            .normalize(filename)
            .replace(/^(\.\.(\/|\\|$))+/, '') // remove path traversal
            .replace(/['"]/g, '') // remove single and double quotes
        console.log('📄 Generated filename:', sanitizedFilename)

        const filePath = path.join(
            baseDir,
            sanitizedMeetingId,
            sanitizedUserId,
            sanitizedFilename
        )
        console.log('🔍 Full file path:', filePath)

        console.log('📁 Creating directories...')
        await mkdir(path.dirname(filePath), { recursive: true })

        console.log('💾 Writing file...')
        await writeFile(filePath, file)

        const relativePath = path.relative(process.cwd(), filePath)
        console.log('✅ File saved successfully. Relative path:', relativePath)
        return relativePath
    } catch (error) {
        console.error('❌ File save error:', error)
        throw new Error(
            `Failed to save file: ${
                error instanceof Error ? error.message : 'Unknown error'
            }`
        )
    }
}
