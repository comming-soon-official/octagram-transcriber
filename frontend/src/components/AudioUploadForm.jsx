import { useState, useRef } from 'react'
import '../style.css'

function AudioUploadForm() {
  const [status, setStatus] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const [formData, setFormData] = useState({
    userId: '',
    meetingId: ''
  })
  
  const mediaRecorder = useRef(null)
  const chunksRef = useRef([])
  const intervalRef = useRef(null)

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const sendAudioChunk = async (audioBlob, chunkStartTime) => {
    try {
      const formPayload = new FormData()
      formPayload.append('file', audioBlob, 'audio-chunk.webm')
      formPayload.append('user_id', formData.userId)
      formPayload.append('meeting_id', formData.meetingId)
      formPayload.append('startTime', chunkStartTime.toISOString())
      formPayload.append('endTime', new Date().toISOString())

      const response = await fetch('http://localhost:5000/send/audio-chunks', {
        method: 'POST',
        body: formPayload
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
    } catch (error) {
      console.error('Error sending chunk:', error)
      setStatus(`Upload failed: ${error.message}`)
    }
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaRecorder.current = new MediaRecorder(stream)
      chunksRef.current = []
      let chunkStartTime = new Date()

      mediaRecorder.current.ondataavailable = (e) => {
        chunksRef.current.push(e.data)
      }

      mediaRecorder.current.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' })
        await sendAudioChunk(audioBlob, chunkStartTime)
        chunksRef.current = []
        chunkStartTime = new Date()
        
        if (isRecording) {
          mediaRecorder.current.start()
        }
      }

      setIsRecording(true)
      mediaRecorder.current.start()

      // Stop and send chunks every 5 seconds
      intervalRef.current = setInterval(() => {
        if (mediaRecorder.current.state === 'recording') {
          mediaRecorder.current.stop()
        }
      }, 5000)

      setStatus('Recording...')
    } catch (error) {
      console.error('Error starting recording:', error)
      setStatus(`Recording failed: ${error.message}`)
    }
  }

  const stopRecording = () => {
    setIsRecording(false)
    if (mediaRecorder.current) {
      mediaRecorder.current.stop()
      mediaRecorder.current.stream.getTracks().forEach(track => track.stop())
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }
    setStatus('Recording stopped')
  }

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
          {!isRecording ? (
            <button type="button" onClick={startRecording}>Start Recording</button>
          ) : (
            <button type="button" onClick={stopRecording}>Stop Recording</button>
          )}
        </div>
      </form>

      {status && (
        <div 
          className="status"
          style={{ color: status.includes('failed') ? 'red' : 'green' }}
        >
          {status}
        </div>
      )}
    </div>
  )
}

export default AudioUploadForm