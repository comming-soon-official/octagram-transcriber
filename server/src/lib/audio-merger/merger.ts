const ffmpeg = require('fluent-ffmpeg')
interface AudioMergerOptions {
    inputPaths: string[]
    outputPath: string
}

export async function mergeAudioFiles({
    inputPaths,
    outputPath
}: AudioMergerOptions): Promise<void> {
    return new Promise((resolve, reject) => {
        console.log('Starting audio merge process...')
        console.log(`Number of input files: ${inputPaths.length}`)

        if (!inputPaths.length) {
            console.error('Error: No input files provided')
            reject(new Error('No input files provided'))
            return
        }

        console.log('Input files:', inputPaths)
        console.log('Output path:', outputPath)

        let command = ffmpeg()

        // Add all input files
        inputPaths.forEach((path, index) => {
            console.log(`Adding input file ${index + 1}: ${path}`)
            command = command.addInput(path)
        })

        command
            .mergeToFile(outputPath, './temp')
            .outputOptions(['-c:a libmp3lame', '-q:a 2'])
            .on('progress', (progress: any) => {
                console.log(
                    `Processing: ${
                        progress.percent ? progress.percent.toFixed(1) : 0
                    }% done`
                )
            })
            .on('error', (err: any) => {
                console.error('Error during merge:', err.message)
                reject(new Error(`Error merging audio files: ${err.message}`))
            })
            .on('end', () => {
                console.log('Audio merge completed successfully')
                console.log('Output file created at:', outputPath)
                resolve()
            })
    })
}

// Usage example:
const options = {
    inputPaths: ['./1.mp3', './2.mp3', './3.mp3'],
    outputPath: 'merged.mp3'
}
mergeAudioFiles(options)
