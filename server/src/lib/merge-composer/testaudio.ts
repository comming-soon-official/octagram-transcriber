const ffmpeg = require('fluent-ffmpeg')
const { join } = require('path')
const path = require('path')
const { existsSync } = require('fs')

interface SilenceInfo {
    start: number
    end: number
    duration: number
}

interface MergeResult {
    outputFile: string
    silenceSegments: SilenceInfo[]
}

async function detectSilence(audioFile: string): Promise<SilenceInfo[]> {
    console.log(`[detectSilence] Starting silence detection for ${audioFile}`)
    const silenceSegments: SilenceInfo[] = []

    return new Promise((resolve, reject) => {
        console.log(`[detectSilence] Initializing FFmpeg process`)
        ffmpeg(audioFile)
            .audioFilters('silencedetect=noise=-30dB:d=0.5')
            .output('pipe:') // Add null output to prevent the "No output specified" error
            .format('null')
            .on('start', (commandLine: any) => {
                console.log(`[detectSilence] FFmpeg command: ${commandLine}`)
            })
            .on('stderr', (stderrLine: string) => {
                console.log(`[detectSilence] FFmpeg stderr: ${stderrLine}`)

                const silenceStartMatch = stderrLine.match(
                    /silence_start: ([\d\.]+)/
                )
                const silenceEndMatch = stderrLine.match(
                    /silence_end: ([\d\.]+)/
                )
                const silenceDurationMatch = stderrLine.match(
                    /silence_duration: ([\d\.]+)/
                )

                if (
                    silenceStartMatch &&
                    silenceEndMatch &&
                    silenceDurationMatch
                ) {
                    const segment = {
                        start: parseFloat(silenceStartMatch[1]),
                        end: parseFloat(silenceEndMatch[1]),
                        duration: parseFloat(silenceDurationMatch[1])
                    }
                    console.log(
                        `[detectSilence] Found silence segment:`,
                        segment
                    )
                    silenceSegments.push(segment)
                }
            })
            .on('end', () => {
                console.log(
                    `[detectSilence] Completed silence detection, found ${silenceSegments.length} segments`
                )
                resolve(silenceSegments)
            })
            .on('error', (err: any) => {
                console.error(`[detectSilence] Error:`, err)
                reject(err)
            })
            .run()
    })
}

function validateAudioFile(filePath: string): boolean {
    if (!existsSync(filePath)) {
        throw new Error(`Audio file not found: ${filePath}`)
    }

    // Get absolute path
    const absolutePath = path.resolve(filePath)
    return true
}

async function mergeAudioFiles(
    audio1: string,
    audio2: string,
    outputPath: string
): Promise<MergeResult> {
    try {
        // Validate files first
        validateAudioFile(audio1)
        validateAudioFile(audio2)

        // Use absolute paths
        const audio1Path = path.resolve(audio1)
        const audio2Path = path.resolve(audio2)
        const outputAbsPath = path.resolve(outputPath)

        console.log(`[mergeAudioFiles] Starting merge operation`)
        console.log(`[mergeAudioFiles] Audio1: ${audio1Path}`)
        console.log(`[mergeAudioFiles] Audio2: ${audio2Path}`)
        console.log(`[mergeAudioFiles] Output path: ${outputAbsPath}`)

        console.log(`[mergeAudioFiles] Detecting silence in first audio file`)
        const silence1 = await detectSilence(audio1Path)
        console.log(`[mergeAudioFiles] Detecting silence in second audio file`)
        const silence2 = await detectSilence(audio2Path)

        const outputFile = join(outputAbsPath, 'merged.wav')
        console.log(`[mergeAudioFiles] Output file will be: ${outputFile}`)

        return new Promise((resolve, reject) => {
            console.log(`[mergeAudioFiles] Starting FFmpeg merge process`)
            ffmpeg()
                .input(audio1Path)
                .input(audio2Path)
                .on('start', (commandLine: any) => {
                    console.log(
                        `[mergeAudioFiles] FFmpeg command: ${commandLine}`
                    )
                })
                .complexFilter(
                    [
                        '[0:a]silenceremove=stop_periods=-1:stop_duration=0.5:stop_threshold=-30dB[a1]',
                        '[1:a]silenceremove=stop_periods=-1:stop_duration=0.5:stop_threshold=-30dB[a2]',
                        '[a1][a2]concat=n=2:v=0:a=1[out]'
                    ],
                    ['out']
                )
                .output(outputFile)
                .on('progress', (progress: any) => {
                    console.log(
                        `[mergeAudioFiles] Processing: ${JSON.stringify(
                            progress
                        )}`
                    )
                })
                .on('end', () => {
                    console.log(
                        `[mergeAudioFiles] Merge completed successfully`
                    )
                    resolve({
                        outputFile,
                        silenceSegments: [...silence1, ...silence2]
                    })
                })
                .on('error', (err: any) => {
                    console.error(`[mergeAudioFiles] Error during merge:`, err)
                    reject(err)
                })
                .run()
        })
    } catch (error) {
        console.error('Error in mergeAudioFiles:', error)
        throw error
    }
}

async function main() {
    console.log(`[main] Starting audio processing`)
    try {
        const result = await mergeAudioFiles('./1.wav', './2.wav', './')

        console.log(`[main] Merge completed successfully`)
        console.log(`[main] Merged audio saved to: ${result.outputFile}`)
        console.log(
            `[main] Silence segments detected: ${result.silenceSegments.length}`
        )
        result.silenceSegments.forEach((segment, i) => {
            console.log(`[main] Segment ${i + 1}:`)
            console.log(`[main]   Start: ${segment.start}s`)
            console.log(`[main]   End: ${segment.end}s`)
            console.log(`[main]   Duration: ${segment.duration}s`)
        })
    } catch (error) {
        console.error(`[main] Fatal error:`, error)
    }
}

main()
