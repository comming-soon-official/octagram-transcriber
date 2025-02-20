import { useState, useRef, useCallback } from 'react'
import '../style.css'

function AudioUploadForm() {
    const [status, setStatus] = useState('')
    const isRecordingRef = useRef(false)
    const [formData, setFormData] = useState({
        userId: '',
        meetingId: ''
    })

    const intervalRef = useRef(null)
    const mediaRecorder = useRef(null)
    const chunksRef = useRef([])

    const handleInputChange = useCallback((e) => {
        const { name, value } = e.target
        setFormData((prev) => ({
            ...prev,
            [name]: value
        }))
    }, [])

    const sendAudioChunk = useCallback(
        async (audioBlob, chunkStartTime, chunkType) => {
            try {
                const formPayload = new FormData()
                formPayload.append('file', audioBlob, 'audio-chunk.webm')
                formPayload.append('user_id', formData.userId)
                formPayload.append('meeting_id', formData.meetingId)
                formPayload.append('startTime', chunkStartTime.toISOString())
                formPayload.append('endTime', new Date().toISOString())
                formPayload.append('chunkType', chunkType)

                const response = await fetch(
                    'http://localhost:8000/send/audio-chunks',
                    {
                        method: 'POST',
                        body: formPayload
                    }
                )

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`)
                }
            } catch (error) {
                console.error('Error sending chunk:', error)
                setStatus(`Upload failed: ${error.message}`)
            }
        },
        [formData, setStatus]
    )

    const startMeeting = async () => {
        try {
            const response = await fetch(
                'http://localhost:8000/api/start-meeting',
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ meeting_id: formData.meetingId })
                }
            )
            if (!response.ok) throw new Error('Failed to start meeting')
            setStatus('Meeting started')
            startRecording()
        } catch (error) {
            setStatus(`Failed to start meeting: ${error.message}`)
        }
    }

    const endMeeting = async () => {
        try {
            stopRecording()
            const response = await fetch(
                'http://localhost:8000/api/end-meeting',
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ meeting_id: formData.meetingId })
                }
            )
            if (!response.ok) throw new Error('Failed to end meeting')
            setStatus('Meeting ended')
        } catch (error) {
            setStatus(`Failed to end meeting: ${error.message}`)
        }
    }

    const startRecording = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: true
            })
            mediaRecorder.current = new MediaRecorder(stream, {
                mimeType: 'audio/webm;codecs=opus' // Specify codec explicitly
            })
            chunksRef.current = []
            let isFirstChunk = true
            let chunkStartTime = new Date()

            mediaRecorder.current.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    // Only add non-empty chunks
                    chunksRef.current.push(e.data)
                }
            }

            intervalRef.current = setInterval(async () => {
                if (
                    mediaRecorder.current &&
                    mediaRecorder.current.state === 'recording'
                ) {
                    mediaRecorder.current.stop()

                    // Wait for the data to be available
                    await new Promise((resolve) => {
                        mediaRecorder.current.onstop = async () => {
                            if (chunksRef.current.length > 0) {
                                const audioBlob = new Blob(chunksRef.current, {
                                    type: 'audio/webm;codecs=opus'
                                })
                                const chunkType = isFirstChunk
                                    ? 'start'
                                    : 'middle'
                                await sendAudioChunk(
                                    audioBlob,
                                    chunkStartTime,
                                    chunkType
                                )
                            }

                            chunksRef.current = []
                            chunkStartTime = new Date()
                            isFirstChunk = false

                            // Start recording the next chunk
                            if (isRecordingRef.current) {
                                mediaRecorder.current.start()
                            }
                            resolve()
                        }
                    })
                }
            }, 5000)

            mediaRecorder.current.onstop = async () => {
                if (!isRecordingRef.current && chunksRef.current.length > 0) {
                    const audioBlob = new Blob(chunksRef.current, {
                        type: 'audio/webm;codecs=opus'
                    })
                    await sendAudioChunk(audioBlob, chunkStartTime, 'end')
                    chunksRef.current = []
                }
            }

            isRecordingRef.current = true
            mediaRecorder.current.start()
            setStatus('Recording...')
        } catch (error) {
            console.error('Error starting recording:', error)
            setStatus(`Recording failed: ${error.message}`)
        }
    }, [sendAudioChunk, setStatus])

    const stopRecording = useCallback(() => {
        isRecordingRef.current = false
        if (intervalRef.current) {
            clearInterval(intervalRef.current)
            intervalRef.current = null
        }
        if (mediaRecorder.current) {
            mediaRecorder.current.stop()
            mediaRecorder.current.stream
                .getTracks()
                .forEach((track) => track.stop())
        }
        setStatus('Recording stopped')
    }, [setStatus])

    console.log('Is recording => ', isRecordingRef.current)

    return (
        <div className="upload-form">
            <form onSubmit={(e) => e.preventDefault()}>
                <div>
                    <label htmlFor="userId">User ID:</label>
                    <input
                        type="text"
                        id="userId"
                        name="userId"
                        value={formData.userId}
                        onChange={handleInputChange}
                        required
                    />
                </div>

                <div>
                    <label htmlFor="meetingId">Meeting ID:</label>
                    <input
                        type="text"
                        id="meetingId"
                        name="meetingId"
                        value={formData.meetingId}
                        onChange={handleInputChange}
                        required
                    />
                </div>

                <div>
                    {!isRecordingRef.current ? (
                        <button type="button" onClick={startMeeting}>
                            Start Meeting
                        </button>
                    ) : (
                        <button type="button" onClick={endMeeting}>
                            End Meeting
                        </button>
                    )}
                </div>
            </form>

            {status && (
                <div
                    className="status"
                    style={{
                        color: status.includes('failed') ? 'red' : 'green'
                    }}
                >
                    {status}
                </div>
            )}
        </div>
    )
}

export default AudioUploadForm
