document.getElementById('uploadForm').addEventListener('submit', async (e) => {
    e.preventDefault()

    const statusDiv = document.getElementById('status')
    try {
        const formData = new FormData()

        // Get file and form fields
        const audioFile = document.getElementById('audioFile').files[0]
        const userId = document.getElementById('userId').value
        const meetingId = document.getElementById('meetingId').value
        const startTime = document.getElementById('startTime').value
        const endTime = document.getElementById('endTime').value

        // Append all data to FormData
        formData.append('file', audioFile)
        formData.append('user_id', userId)
        formData.append('meeting_id', meetingId)
        formData.append('startTime', startTime)
        formData.append('endTime', endTime)

        statusDiv.textContent = 'Uploading...'

        const response = await fetch(
            'http://localhost:5000/send/audio-chunks',
            {
                method: 'POST',
                body: formData
            }
        )

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
        }

        const result = await response.json()
        statusDiv.textContent = 'Upload successful!'
        statusDiv.style.color = 'green'
    } catch (error) {
        console.error('Error:', error)
        statusDiv.textContent = `Upload failed: ${error.message}`
        statusDiv.style.color = 'red'
    }
})
