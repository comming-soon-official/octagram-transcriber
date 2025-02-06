import React, { useCallback, useRef, useState } from 'react'

interface RecorderProps {
    userId?: string
    meetingId?: string
}

const Recorder: React.FC<RecorderProps> = ({
    userId = 'user_123',
    meetingId = 'meet_123456'
}) => {
    const [isRecording, setIsRecording] = useState(false)
    const [status, setStatus] = useState('')
    const mediaRecorder = useRef<MediaRecorder | null>(null)
    const chunksInterval = useRef<NodeJS.Timeout | null>(null)
    const audioChunks = useRef<Blob[]>([])
    const startTime = useRef<Date>(new Date())
    const isFirstChunk = useRef<boolean>(true)

    const sendAudioChunk = async (
        audioBlob: Blob,
        type: 'start' | 'middle' | 'end'
    ) => {
        const formData = new FormData()
        formData.append('file', audioBlob, 'audio.wav')
        formData.append('user_id', userId)
        formData.append('meeting_id', meetingId)
        formData.append('startTime', new Date(Date.now() - 5000).toISOString())
        formData.append('endTime', new Date().toISOString())
        formData.append('type', type)

        try {
            const response = await fetch(
                'http://localhost:5000/send/audio-chunks',
                {
                    method: 'POST',
                    body: formData
                }
            )
            if (!response.ok) throw new Error('Failed to send chunk')
            console.log(`Chunk sent successfully (${type})`)
        } catch (error) {
            console.error('Error sending chunk:', error)
        }
    }

    const processAndSendChunks = useCallback(() => {
        if (audioChunks.current.length === 0) return

        const audioBlob = new Blob(audioChunks.current, { type: 'audio/wav' })
        const chunkType = isFirstChunk.current ? 'start' : 'middle'
        sendAudioChunk(audioBlob, chunkType)
        isFirstChunk.current = false
        audioChunks.current = []
    }, [])

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: true
            })
            mediaRecorder.current = new MediaRecorder(stream)
            audioChunks.current = []
            startTime.current = new Date()
            setIsRecording(true)
            setStatus('Recording...')
            isFirstChunk.current = true

            mediaRecorder.current.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunks.current.push(event.data)
                }
            }

            mediaRecorder.current.start(5000) // Changed from 100 to 5000ms

            // Set up interval for sending chunks
            chunksInterval.current = setInterval(processAndSendChunks, 5000)
        } catch (error) {
            console.error('Error accessing microphone:', error)
            setStatus('Error accessing microphone')
        }
    }

    const stopRecording = () => {
        if (!mediaRecorder.current || !isRecording) return

        if (chunksInterval.current) {
            clearInterval(chunksInterval.current)
        }

        mediaRecorder.current.stop()
        mediaRecorder.current.stream
            .getTracks()
            .forEach((track) => track.stop())

        // Send final chunk
        if (audioChunks.current.length > 0) {
            const finalBlob = new Blob(audioChunks.current, {
                type: 'audio/wav'
            })
            sendAudioChunk(finalBlob, 'end')
            audioChunks.current = []
        }

        setIsRecording(false)
        setStatus('Recording stopped')
        isFirstChunk.current = true // Reset for next recording session
    }

    return (
        <div className="max-w-md mx-auto mt-12 p-6 border border-gray-300 rounded-lg">
            <div className="text-center mb-4">
                <h2 className="text-xl font-bold">Audio Recorder</h2>
                <p className="text-sm text-gray-600">Meeting ID: {meetingId}</p>
                <p className="text-sm text-gray-600">User ID: {userId}</p>
            </div>

            <div className="flex flex-col items-center gap-4">
                <button
                    className={`w-32 h-32 rounded-full ${
                        isRecording
                            ? 'bg-red-500 hover:bg-red-600'
                            : 'bg-blue-500 hover:bg-blue-600'
                    } text-white font-bold transition-colors`}
                    onClick={isRecording ? stopRecording : startRecording}
                >
                    {isRecording ? 'Stop' : 'Record'}
                </button>

                {status && <p className="text-sm text-gray-700">{status}</p>}
            </div>
        </div>
    )
}

export default Recorder
