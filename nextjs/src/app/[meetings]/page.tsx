'use client'

import React, { useState } from 'react'

import { Button } from '@/components/ui/button'

const MeetingPage = ({ params }: { params: { meetings: string } }) => {
    const [loading, setLoading] = useState(false)
    const [transcription, setTranscription] = useState<string | null>(null)
    const [summary, setSummary] = useState<string | null>(null)

    const handleMergeAndTranscribe = async () => {
        setLoading(true)
        try {
            // First, trigger the merge
            const mergeResponse = await fetch(
                `/api/merge-audio/${params.meetings}`
            )
            if (!mergeResponse.ok) {
                throw new Error('Failed to merge audio')
            }

            // You can add transcription handling here once the merge is complete
            setTranscription('Transcription is being processed...')
            setSummary('Summary will be generated after transcription...')
        } catch (error) {
            console.error('Error:', error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-800">
                        Meeting Details
                    </h1>
                    <Button
                        onClick={handleMergeAndTranscribe}
                        disabled={loading}
                    >
                        {loading ? 'Processing...' : 'Start Processing'}
                    </Button>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                    {/* Transcription Section */}
                    <div className="bg-white rounded-lg shadow-md p-6"></div>
                    <h2 className="text-xl font-semibold mb-4 text-gray-700">
                        Transcription
                    </h2>
                    <div className="prose max-w-none">
                        {loading ? (
                            <p className="text-gray-600">Processing...</p>
                        ) : transcription ? (
                            <p className="text-gray-600">{transcription}</p>
                        ) : (
                            <p className="text-gray-600">
                                Click "Start Processing" to begin...
                            </p>
                        )}
                    </div>
                </div>

                {/* Summary Section */}
                <div className="bg-white rounded-lg shadow-md p-6"></div>
                <h2 className="text-xl font-semibold mb-4 text-gray-700">
                    Summary
                </h2>
                <div className="prose max-w-none">
                    {loading ? (
                        <p className="text-gray-600">Processing...</p>
                    ) : summary ? (
                        <p className="text-gray-600">{summary}</p>
                    ) : (
                        <p className="text-gray-600">
                            Summary will appear here...
                        </p>
                    )}
                </div>
            </div>
        </div>
    )
}

export default MeetingPage
