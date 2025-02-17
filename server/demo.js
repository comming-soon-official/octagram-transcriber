const fs = require('fs')
const axios = require('axios')
const OpenAI = require('openai')

const HF_API_TOKEN = process.env.HF_API
const OPENAI_API_KEY = process.env.OPENAI_KEY

const MODEL = 'openai/whisper-large-v3'

const openai = new OpenAI({ apiKey: OPENAI_API_KEY })

async function translateText(text) {
    try {
        const response = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [
                {
                    role: 'user',
                    content: `Translate the following text to English: "${text}"`
                }
            ]
        })
        return response.choices[0].message.content
    } catch (error) {
        console.error('Translation error:', error)
        throw error
    }
}

async function transcribeWithTimestamps(audioPath) {
    try {
        const audioData = fs.readFileSync(audioPath)
        const base64Audio = audioData.toString('base64')

        const response = await axios.post(
            `https://api-inference.huggingface.co/models/${MODEL}`,
            {
                inputs: base64Audio,
                parameters: {
                    return_timestamps: 'word'
                }
            },
            {
                headers: {
                    Authorization: `Bearer ${HF_API_TOKEN}`,
                    'Content-Type': 'application/json'
                }
            }
        )

        // Process and translate each chunk
        const processedChunks = await Promise.all(
            response.data.chunks.map(async (chunk) => ({
                start_time: chunk.timestamp[0],
                end_time: chunk.timestamp[1],
                original_text: chunk.text,
                translated_text: await translateText(chunk.text)
            }))
        )

        const result = {
            full_text: response.data.text,
            translated_full_text: await translateText(response.data.text),
            chunks: processedChunks
        }

        // Save to JSON file
        const outputPath =
            audioPath.replace(/\.[^/.]+$/, '') + '_transcript.json'
        fs.writeFileSync(outputPath, JSON.stringify(result, null, 2))

        return result
    } catch (error) {
        console.error(
            'Error:',
            error.response ? error.response.data : error.message
        )
        throw error
    }
}

// Usage
transcribeWithTimestamps('./tamilbw-2.mp3')
    .then((result) => {
        console.log('Transcription and translation completed!')
        console.log('Results saved to: tamilbw-2_transcript.json')
        console.log('\nSample of processed data:')
        console.log('Full text:', result.full_text)
        console.log('\nFirst few chunks:')
        result.chunks.slice(0, 3).forEach((chunk) => {
            console.log(`
Time: ${chunk.start_time} - ${chunk.end_time}
Original: ${chunk.original_text}
Translated: ${chunk.translated_text}
            `)
        })
    })
    .catch((error) => {
        console.error('Process failed:', error)
    })
