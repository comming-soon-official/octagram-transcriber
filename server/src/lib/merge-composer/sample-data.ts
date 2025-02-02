export const sampleData = {
    meeting: {
        id: 'meet_123456',
        meetingId: 'zoom_98765',
        createdAt: '2024-01-20T10:00:00.000Z',
        endedAt: '2024-01-20T10:00:30.000Z',
        users: ['user_123', 'user_456'],
        transcriberOutput: 'Sample meeting transcript...'
    },
    user: {
        id: 'user_123',
        name: 'John Doe',
        createdAt: '2024-01-01T00:00:00.000Z'
    },
    footages: [
        {
            id: 'chunk_001',
            file: 'https://storage.example.com/meetings/meet_123456/chunk_001.wav',
            createdAt: '2024-01-20T10:00:00.000Z',
            userId: 'user_123',
            meetingId: 'meet_123456',
            startTime: '2024-01-20T10:00:00.000Z',
            endTime: '2024-01-20T10:00:05.000Z',
            type: 'start'
        },
        {
            id: 'chunk_002',
            file: 'https://storage.example.com/meetings/meet_123456/chunk_002.wav',
            createdAt: '2024-01-20T10:00:05.000Z',
            userId: 'user_123',
            meetingId: 'meet_123456',
            startTime: '2024-01-20T10:00:05.000Z',
            endTime: '2024-01-20T10:00:10.000Z',
            type: 'middle'
        },
        {
            id: 'chunk_003',
            file: 'https://storage.example.com/meetings/meet_123456/chunk_003.wav',
            createdAt: '2024-01-20T10:00:10.000Z',
            userId: 'user_123',
            meetingId: 'meet_123456',
            startTime: '2024-01-20T10:00:10.000Z',
            endTime: '2024-01-20T10:00:15.000Z',
            type: 'middle'
        },
        {
            id: 'chunk_004',
            file: 'https://storage.example.com/meetings/meet_123456/chunk_004.wav',
            createdAt: '2024-01-20T10:00:15.000Z',
            userId: 'user_123',
            meetingId: 'meet_123456',
            startTime: '2024-01-20T10:00:15.000Z',
            endTime: '2024-01-20T10:00:20.000Z',
            type: 'end'
        },
        {
            id: 'chunk_005',
            file: 'https://storage.example.com/meetings/meet_123456/chunk_005.wav',
            createdAt: '2024-01-20T10:00:20.000Z',
            userId: 'user_123',
            meetingId: 'meet_123456',
            startTime: '2024-01-20T10:00:20.000Z',
            endTime: '2024-01-20T10:00:25.000Z',
            type: 'start'
        },
        {
            id: 'chunk_006',
            file: 'https://storage.example.com/meetings/meet_123456/chunk_006.wav',
            createdAt: '2024-01-20T10:00:25.000Z',
            userId: 'user_123',
            meetingId: 'meet_123456',
            startTime: '2024-01-20T10:00:25.000Z',
            endTime: '2024-01-20T10:00:30.000Z',
            type: 'end'
        },
        {
            id: 'chunk_007',
            file: 'https://storage.example.com/meetings/meet_123456/chunk_007.wav',
            createdAt: '2024-01-20T10:00:30.000Z',
            userId: 'user_123',
            meetingId: 'meet_123456',
            startTime: '2024-01-20T10:00:30.000Z',
            endTime: '2024-01-20T10:00:35.000Z',
            type: 'start'
        },
        {
            id: 'chunk_008',
            file: 'https://storage.example.com/meetings/meet_123456/chunk_008.wav',
            createdAt: '2024-01-20T10:00:35.000Z',
            userId: 'user_123',
            meetingId: 'meet_123456',
            startTime: '2024-01-20T10:00:35.000Z',
            endTime: '2024-01-20T10:00:40.000Z',
            type: 'middle'
        },
        {
            id: 'chunk_009',
            file: 'https://storage.example.com/meetings/meet_123456/chunk_009.wav',
            createdAt: '2024-01-20T10:00:40.000Z',
            userId: 'user_123',
            meetingId: 'meet_123456',
            startTime: '2024-01-20T10:00:40.000Z',
            endTime: '2024-01-20T10:00:45.000Z',
            type: 'middle'
        },
        {
            id: 'chunk_010',
            file: 'https://storage.example.com/meetings/meet_123456/chunk_010.wav',
            createdAt: '2024-01-20T10:00:45.000Z',
            userId: 'user_123',
            meetingId: 'meet_123456',
            startTime: '2024-01-20T10:00:45.000Z',
            endTime: '2024-01-20T10:00:50.000Z',
            type: 'end'
        },
        {
            id: 'chunk_011',
            file: 'https://storage.example.com/meetings/meet_123456/chunk_011.wav',
            createdAt: '2024-01-20T10:00:50.000Z',
            userId: 'user_123',
            meetingId: 'meet_123456',
            startTime: '2024-01-20T10:00:50.000Z',
            endTime: '2024-01-20T10:00:55.000Z',
            type: 'start'
        },
        {
            id: 'chunk_012',
            file: 'https://storage.example.com/meetings/meet_123456/chunk_012.wav',
            createdAt: '2024-01-20T10:00:55.000Z',
            userId: 'user_123',
            meetingId: 'meet_123456',
            startTime: '2024-01-20T10:00:55.000Z',
            endTime: '2024-01-20T10:01:00.000Z',
            type: 'middle'
        }
    ]
}
