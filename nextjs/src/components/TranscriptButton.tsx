"use client";

import { Play } from "lucide-react";
import { useCallback, useState } from "react";

import { Button } from "@/components/ui/button";

interface TranscriptButtonProps {
  meetingId?: string;
  disabled?: boolean;
}

export function TranscriptButton({
  meetingId,
  disabled: disabledProp
}: TranscriptButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const handleTranscribe = useCallback(async () => {
    if (!meetingId || isLoading) return;
    setIsLoading(true);
    try {
      const response = await fetch(
        `https://octagram-transcriber-production.up.railway.app/api/merge-audio/${meetingId}`
      );
      if (!response.ok) {
        const errorData = await response.json(); // Try to get more specific error message from backend
        const errorMessage =
          errorData?.message || `HTTP error! status: ${response.status}`;
        throw new Error(errorMessage);
      }
      const data = await response.json();
      console.log(data);
    } catch (error) {
      console.error("Transcription error:", error);
    } finally {
      setIsLoading(false);
    }
  }, [meetingId, isLoading]);

  return (
    <Button
      variant="outline"
      onClick={handleTranscribe}
      disabled={disabledProp || isLoading}
    >
      <Play className="mr-2 h-4 w-4 animate-spin-on-loading" />
      {isLoading ? "Transcribing..." : "Transcript"}
    </Button>
  );
}
