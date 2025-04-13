import { useState, useRef, useCallback, forwardRef, useImperativeHandle, useEffect } from "react";

const useLocal = true;

const baseURL = useLocal
    ? "http://localhost:8000"
    : "https://octagram-transcriber-production.up.railway.app";

// eslint-disable-next-line react/prop-types
const AudioRecorder = forwardRef(({ userId, meetingId }, ref) => {
    const [status, setStatus] = useState("");
    const isRecordingRef = useRef(false);
    const intervalRef = useRef(null);
    const mediaRecorder = useRef(null);
    const chunksRef = useRef([]);

    const sendAudioChunk = useCallback(
        async (audioBlob, chunkStartTime, chunkType) => {
            try {
                const formPayload = new FormData();
                formPayload.append("file", audioBlob, "audio-chunk.webm");
                formPayload.append("user_id", userId);
                formPayload.append("meeting_id", meetingId);
                formPayload.append("startTime", chunkStartTime.toISOString());
                formPayload.append("endTime", new Date().toISOString());
                formPayload.append("chunkType", chunkType);

                const response = await fetch(`${baseURL}/send/audio-chunks`, {
                    method: "POST",
                    body: formPayload
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
            } catch (error) {
                console.error("Error sending chunk:", error);
                setStatus(`Upload failed: ${error.message}`);
            }
        },
        [userId, meetingId, setStatus]
    );

    const startMeeting = useCallback(async () => {
        try {
            const response = await fetch(`${baseURL}/api/start-meeting`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ meeting_id: meetingId })
            });
            if (!response.ok) throw new Error("Failed to start meeting");
            setStatus("Meeting started");
        } catch (error) {
            setStatus(`Failed to start meeting: ${error.message}`);
        }
    }, [meetingId]);


    const startRecording = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: true
            });
            mediaRecorder.current = new MediaRecorder(stream, {
                mimeType: "audio/webm;codecs=opus" // Specify codec explicitly
            });
            chunksRef.current = [];
            let isFirstChunk = true;
            let chunkStartTime = new Date();

            mediaRecorder.current.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    // Only add non-empty chunks
                    chunksRef.current.push(e.data);
                }
            };

            intervalRef.current = setInterval(async () => {
                console.log("Interval => ", chunksRef.current)
                mediaRecorder.current.stop();

                // Wait for the data to be available
                if (chunksRef.current.length > 0) {
                    const audioBlob = new Blob(chunksRef.current, {
                        type: "audio/webm;codecs=opus"
                    });

                    chunksRef.current = [];
                    chunkStartTime = new Date();
                    isFirstChunk = false;
                    const chunkType = isFirstChunk ? "start" : "middle";
                    await sendAudioChunk(audioBlob, chunkStartTime, chunkType);
                }

            }, 1000);

            mediaRecorder.current.onstop = async () => {
                if (!isRecordingRef.current && chunksRef.current.length > 0) {
                    const audioBlob = new Blob(chunksRef.current, {
                        type: "audio/webm;codecs=opus"
                    });
                    chunksRef.current = [];
                    await sendAudioChunk(audioBlob, chunkStartTime, "end");
                }
            };

            isRecordingRef.current = true;
            mediaRecorder.current.start();
        } catch (error) {
            console.error("Error starting recording:", error);
        }
    }, [sendAudioChunk]);

    const stopRecording = useCallback(() => {
        isRecordingRef.current = false;
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
        if (mediaRecorder.current) {
            mediaRecorder.current.stop();
            mediaRecorder.current.stream.getTracks().forEach((track) => track.stop());
        }
    }, []);

    // Expose controls through ref
    useImperativeHandle(ref, () => ({
        start: startRecording,
        stop: stopRecording,
        isRecording: () => isRecordingRef.current,
        status
    }));

    useEffect(() => {
        startMeeting()
    }, [startMeeting])

    // Component doesn't render any UI
    return null;
});

AudioRecorder.displayName = 'AudioRecorder'

export default AudioRecorder;
