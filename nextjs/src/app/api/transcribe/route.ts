import { NextResponse } from 'next/server'

export async function POST(request: Request) {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    // Simulate a delay for transcription process

    const transcription = `
    Meeting Transcription for Meeting ID: ${id}

    [00:00] John: Good morning everyone, let's get started with our meeting.

    [00:05] Sarah: Morning John, I have the latest project updates ready.

    [00:10] John: Great, Sarah. Please go ahead and share those updates with the team.

    [00:15] Sarah: We've made significant progress on the user interface redesign. The new dashboard is now 80% complete, and we're on track to finish by the end of this week.

    [00:30] Mike: That's fantastic news! Have we received any feedback from the focus group on the new design?

    [00:35] Sarah: Yes, we have. Overall, the response has been very positive. Users particularly liked the improved navigation and the new data visualization features.

    [00:45] John: Excellent. Mike, how are we doing on the backend improvements?

    [00:50] Mike: We're making good progress. The new API endpoints are all set up, and we're currently working on optimizing database queries. We should see a significant performance boost once this is implemented.

    [01:05] John: That's great to hear. Any challenges or roadblocks we should be aware of?

    [01:10] Mike: We did encounter a minor issue with data synchronization between the mobile and web apps, but we've identified the problem and are working on a fix. It shouldn't impact our timeline.

    [01:25] John: Alright, keep me posted on that. Sarah, any updates on the marketing campaign for the new features?

    [01:30] Sarah: Yes, I've been working closely with the marketing team. We've drafted the announcement blog post and prepared social media content. We're just waiting for the final screenshots of the new UI before we can finalize everything.

    [01:45] John: Perfect. It sounds like we're on track. Let's schedule another check-in for next week to ensure we're still on target for the launch. Great work, everyone!

    [02:00] All: Thanks, John!

    [02:05] John: Meeting adjourned.
  `

    return NextResponse.json({ transcription })
}
