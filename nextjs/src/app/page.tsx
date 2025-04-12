// nextjs/src/app/transcribe/page.tsx
"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Clock, BarChart2, Mic } from "lucide-react";

import { MeetingCard } from "@/components/internal/meeting-card";
import { MeetingTypes, useUniversalStore } from "@/store/useUniversalStore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function MeetingsList() {
  const [meetings, setMeetings] = useState<MeetingTypes[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { write, setSelectedMeeting } = useUniversalStore();

  const fetchMeetings = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/meetings");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (data.success) {
        write({ meetings: data.meetings });
        setMeetings(data.meetings);
      }
    } catch (error) {
      console.error("Error fetching meetings:", error);
      setMeetings([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectMeeting = (meetingId: string) => {
    setSelectedMeeting(meetingId);
  };

  useEffect(() => {
    fetchMeetings();
  }, []);

  // Calculate dashboard metrics
  const totalMeetings = meetings.length;
  const transcribedMeetings = meetings.filter(
    (m) => m.transcriberOutput
  ).length;
  const pendingMeetings = totalMeetings - transcribedMeetings;
  const recentMeetings = [...meetings]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    .slice(0, 6);

  return (
    <div className="flex min-h-screen  bg-slate-50 justify-center">
      <main className="container flex-1 py-8">
        {/* Dashboard metrics */}
        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Total Meetings
              </CardTitle>
              <BarChart2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalMeetings}</div>
              <p className="text-xs text-muted-foreground">
                All recorded meetings
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Transcribed</CardTitle>
              <Mic className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{transcribedMeetings}</div>
              <p className="text-xs text-muted-foreground">
                Meetings with completed transcripts
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Pending Transcription
              </CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingMeetings}</div>
              <p className="text-xs text-muted-foreground">
                Meetings awaiting transcription
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Meetings Tabs and Content */}
        <Tabs defaultValue="recent" className="space-y-4">
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="recent">Recent Meetings</TabsTrigger>
              <TabsTrigger value="all">All Meetings</TabsTrigger>
              <TabsTrigger value="transcribed">Transcribed</TabsTrigger>
            </TabsList>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => fetchMeetings()}
                variant="outline"
                size="sm"
                disabled={isLoading}
              >
                Refresh
              </Button>
            </div>
          </div>

          <TabsContent value="recent" className="space-y-4">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <p className="text-muted-foreground">Loading...</p>
              </div>
            ) : recentMeetings.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {recentMeetings.map((meeting) => (
                  <div
                    key={meeting.id}
                    className="flex flex-col gap-2"
                    onClick={() => handleSelectMeeting(meeting.id)}
                  >
                    <MeetingCard
                      id={meeting.id}
                      meetingId={meeting.meetingId}
                      title={`Meeting ${meeting.meetingId}`}
                      date={new Date(meeting.createdAt).toLocaleDateString()}
                      time={new Date(meeting.createdAt).toLocaleTimeString()}
                      transcribed={meeting.transcriberOutput ?? ""}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12">
                <p className="text-muted-foreground mb-4">
                  No recent meetings found
                </p>
                <Link href="/transcribe/new">
                  <Button>Start New Transcription</Button>
                </Link>
              </div>
            )}
          </TabsContent>

          <TabsContent value="all" className="space-y-4">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <p className="text-muted-foreground">Loading...</p>
              </div>
            ) : meetings.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {meetings.map((meeting) => (
                  <div
                    key={meeting.id}
                    className="flex flex-col gap-2"
                    onClick={() => handleSelectMeeting(meeting.id)}
                  >
                    <MeetingCard
                      id={meeting.id}
                      meetingId={meeting.meetingId}
                      title={`Meeting ${meeting.meetingId}`}
                      date={new Date(meeting.createdAt).toLocaleDateString()}
                      time={new Date(meeting.createdAt).toLocaleTimeString()}
                      transcribed={meeting.transcriberOutput ?? ""}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12">
                <p className="text-muted-foreground mb-4">No meetings found</p>
                <Link href="/transcribe/new">
                  <Button>Start New Transcription</Button>
                </Link>
              </div>
            )}
          </TabsContent>

          <TabsContent value="transcribed" className="space-y-4">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <p className="text-muted-foreground">Loading...</p>
              </div>
            ) : meetings.filter((m) => m.transcriberOutput).length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {meetings
                  .filter((meeting) => meeting.transcriberOutput)
                  .map((meeting) => (
                    <div
                      key={meeting.id}
                      className="flex flex-col gap-2"
                      onClick={() => handleSelectMeeting(meeting.id)}
                    >
                      <MeetingCard
                        id={meeting.id}
                        meetingId={meeting.meetingId}
                        title={`Meeting ${meeting.meetingId}`}
                        date={new Date(meeting.createdAt).toLocaleDateString()}
                        time={new Date(meeting.createdAt).toLocaleTimeString()}
                        transcribed={meeting.transcriberOutput ?? ""}
                      />
                    </div>
                  ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12">
                <p className="text-muted-foreground mb-4">
                  No transcribed meetings found
                </p>
                <Link href="/transcribe/new">
                  <Button>Start New Transcription</Button>
                </Link>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
