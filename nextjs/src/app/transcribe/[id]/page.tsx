"use client";
import { Users } from "lucide-react";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MeetingTypes } from "@/types";
import { TranscriptButton } from "@/components/TranscriptButton";
import { formatDate } from "@/lib/utils";

interface TranscriptSegment {
  text: string;
  startTime: string;
  endTime: string;
}

interface ChronologicalEntry extends TranscriptSegment {
  username: string;
}

interface SummaryData {
  summary: string;
  keyDiscussion: string[];
  actionItems: string[];
}
export default function MeetingOverview() {
  const [summary, setSummary] = useState<SummaryData>({
    summary: "",
    keyDiscussion: [],
    actionItems: []
  });
  const { id } = useParams() as { id: string };
  console.log(id);
  const [transcribe, setTranscribe] = useState<ChronologicalEntry[]>();

  const [meetings, setMeetings] = useState<MeetingTypes[]>([]);
  const meeting = useMemo(
    () => meetings.find((m) => m.meetingId === id),
    [id, meetings]
  );
  console.log(meetings, meeting);

  const fetchMeetings = useCallback(async () => {
    try {
      const response = await fetch("/api/meetings");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (data.success) {
        setMeetings(data.meetings);
      }
    } catch (error) {
      console.error("Error fetching meetings:", error);
      setMeetings([]);
    }
  }, []);

  const fetchSummary = useCallback(async () => {
    if (!meeting) return;
    try {
      const response = await fetch(
        `https://octagram-transcriber-production.up.railway.app/api/meeting-summary/${meeting.meetingId}`
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.log(data.summary);

      setSummary(data.summary);

      // setSummary(data)
    } catch (error) {
      console.error("Summary error:", error);
    }
  }, [meeting]);

  const fetchUserTranscript = useCallback(async () => {
    if (!meeting) return;
    try {
      const response = await fetch(
        `https://octagram-transcriber-production.up.railway.app/api/meeting/${meeting.meetingId}/chronological`
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.log(data.chronologicalConversation);
      setTranscribe(data.chronologicalConversation);
      // setSummary(data.summary)

      // setSummary(data)
    } catch (error) {
      console.error("Summary error:", error);
    }
  }, [meeting]);

  useEffect(() => {
    fetchSummary();
    fetchUserTranscript();
  }, [fetchMeetings, fetchSummary, fetchUserTranscript]);

  useEffect(() => {
    fetchMeetings();
  }, [fetchMeetings]);

  return (
    <div className="container mx-auto py-6 max-w-6xl">
      {/* Meeting Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-2xl font-bold mb-2">
            {meeting?.meetingId}
            {/* Q1 2024 Product Planning */}
          </h1>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>{formatDate(meeting?.createdAt)}</span>
            {/* <span>Feb 20, 2024</span> */}
            <span>•</span>
            <span>
              {meeting?.createdAt && meeting?.endedAt
                ? `${new Intl.DateTimeFormat("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: true
                  }).format(
                    new Date(meeting.createdAt)
                  )} - ${new Intl.DateTimeFormat("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: true
                  }).format(new Date(meeting.endedAt))}`
                : "N/A"}
            </span>
            {/* <span>10:00 AM - 11:30 AM</span> */}
            <span>•</span>
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              {/* <span>8 Participants</span> */}
            </div>
          </div>
        </div>
        <TranscriptButton
          meetingId={meeting?.meetingId}
          disabled={summary.summary !== ""}
        />
      </div>

      <Tabs defaultValue="summary" className="space-y-4">
        <TabsList>
          <TabsTrigger value="summary">Summary</TabsTrigger>
          <TabsTrigger value="transcript">Transcript</TabsTrigger>
          {/* <TabsTrigger value="speakers">Speakers</TabsTrigger> */}
        </TabsList>

        {/* Summary Tab */}
        <TabsContent value="summary" className="space-y-6">
          {summary && (
            <Card>
              <CardHeader>
                <CardTitle>Meeting Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">{summary?.summary}</p>

                {summary.keyDiscussion.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="font-semibold">Key Decisions:</h3>
                    <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                      {summary.keyDiscussion.map((items) => (
                        <li key={items}>{items}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {summary.actionItems.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="font-semibold">Action Items:</h3>
                    <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                      {summary.actionItems.map((items) => (
                        <li key={items}>{items}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Transcript Tab */}
        <TabsContent value="transcript">
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-6">
                {transcribe?.map((item, index) => (
                  <div key={index} className="flex gap-4">
                    <Avatar className="h-8 w-8">
                      <AvatarImage
                        // src={item.avatar}
                        alt={item.username}
                      />
                      <AvatarFallback className="bg-gray-200">
                        {item.username
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{item.username}</span>

                        {item.startTime ? (
                          <span className="text-sm opacity-60">
                            {formatDate(item.startTime)}
                          </span>
                        ) : null}
                      </div>
                      <p className="text-muted-foreground">{item.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
