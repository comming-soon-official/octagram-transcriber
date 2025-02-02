import ffmpeg from 'fluent-ffmpeg'
import { join } from 'path'

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
    const silenceSegments: SilenceInfo[] = []

    return new Promise((resolve, reject) => {
        ffmpeg(audioFile)
            .audioFilters('silencedetect=noise=-30dB:d=0.5') // Detect silence below -30dB lasting 0.5s
            .on('stderr', (stderrLine: string) => {
                // Parse silence detection output
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
                    silenceSegments.push({
                        start: parseFloat(silenceStartMatch[1]),
                        end: parseFloat(silenceEndMatch[1]),
                        duration: parseFloat(silenceDurationMatch[1])
                    })
                }
            })
            .on('end', () => resolve(silenceSegments))
            .on('error', reject)
            .run()
    })
}

async function mergeAudioFiles(
    audio1: string,
    audio2: string,
    outputPath: string
): Promise<MergeResult> {
    const silence1 = await detectSilence(audio1)
    const silence2 = await detectSilence(audio2)

    const outputFile = join(outputPath, 'merged.wav')

    return new Promise((resolve, reject) => {
        ffmpeg()
            .input(audio1)
            .input(audio2)
            // Remove silence and concatenate
            .complexFilter(
                [
                    '[0:a]silenceremove=stop_periods=-1:stop_duration=0.5:stop_threshold=-30dB[a1]',
                    '[1:a]silenceremove=stop_periods=-1:stop_duration=0.5:stop_threshold=-30dB[a2]',
                    '[a1][a2]concat=n=2:v=0:a=1[out]'
                ],
                ['out']
            )
            .output(outputFile)
            .on('end', () => {
                resolve({
                    outputFile,
                    silenceSegments: [...silence1, ...silence2]
                })
            })
            .on('error', reject)
            .run()
    })
}

// Example usage:
async function main() {
    try {
        const result = await mergeAudioFiles(
            'path/to/audio1.wav',
            'path/to/audio2.wav',
            'path/to/output'
        )

        console.log('Merged audio saved to:', result.outputFile)
        console.log('Silence segments detected:')
        result.silenceSegments.forEach((segment, i) => {
            console.log(`Segment ${i + 1}:`)
            console.log(`  Start: ${segment.start}s`)
            console.log(`  End: ${segment.end}s`)
            console.log(`  Duration: ${segment.duration}s`)
        })
    } catch (error) {
        console.error('Error:', error)
    }
}

main()
