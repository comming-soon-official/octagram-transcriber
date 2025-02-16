import ffmpeg from 'fluent-ffmpeg'
import { promises as fs } from 'fs'
import path from 'path'

import { FootageMatrix } from './types'

const TMP_DIR = path.join(process.cwd(), 'tmp')

async function ensureTmpDir() {
    await fs.mkdir(TMP_DIR, { recursive: true })
}

async function removeSilence(inputFile: string): Promise<string> {
    const outputFile = path.join(
        TMP_DIR,
        `nosilence_${Date.now()}_${path.basename(inputFile)}`
    )

    return new Promise((resolve, reject) => {
        ffmpeg(inputFile)
            .audioFilters(
                'silenceremove=start_periods=1:start_duration=1:start_threshold=-50dB:detection=peak,aformat=dblp,areverse,silenceremove=start_periods=1:start_duration=1:start_threshold=-50dB:detection=peak,aformat=dblp,areverse'
            )
            .save(outputFile)
            .on('end', () => resolve(outputFile))
            .on('error', reject)
    })
}

async function mergeAudioSequence(files: string[]): Promise<string> {
    const outputFile = path.join(TMP_DIR, `merged_${Date.now()}.wav`)
    const command = ffmpeg()

    files.forEach((file) => {
        command.input(file)
    })

    return new Promise((resolve, reject) => {
        command
            .mergeToFile(outputFile, TMP_DIR)
            .on('end', () => resolve(outputFile))
            .on('error', reject)
    })
}

async function processSequence(sequence: FootageMatrix[]): Promise<string> {
    // Process each file in the sequence to remove silence
    // const processedFiles = await Promise.all(
    //     sequence.map((footage) => removeSilence(footage.filepath))
    // )

    // Merge the processed files
    return await mergeAudioSequence(sequence.map((f) => f.filepath))
}

export async function processAudioMatrix(
    matrix: FootageMatrix[][]
): Promise<string[]> {
    await ensureTmpDir()

    try {
        // Process each sequence in parallel
        const finalFiles = await Promise.all(
            matrix.map((sequence) => processSequence(sequence))
        )

        return finalFiles
    } catch (error) {
        console.error('Error processing audio matrix:', error)
        throw error
    }
}
