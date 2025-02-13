import { promises as fs } from 'fs';
import { exec } from 'child_process';
import path from 'path';

import { db } from '../db';
import { footages } from '../db/schema';
import { and, eq } from 'drizzle-orm';

interface AudioChunk {
  timestamp: number;
  filepath: string;
}

// Fetch audio chunks from the database for the given meetId and userId
async function getAudioChunksFromDB(meetId: string, userId: string): Promise<AudioChunk[]> {
  // Adjusted the query by adding explicit type annotation for the parameter 'chunk'
  const chunks = await db.select().from(footages).where(and(eq(footages.meetingId, meetId), eq(footages.userId, userId)))
  
  // Map the result to our AudioChunk type. Assumes the DB columns are named 'timestamp' and 'filePath'
  const audioChunks: AudioChunk[] = chunks.map((chunk: any) => ({
    timestamp: chunk.timestamp,
    filepath: chunk.filePath
  }));

  // Sort the audio chunks by timestamp in ascending order
  audioChunks.sort((a, b) => a.timestamp - b.timestamp);
  return audioChunks;
}

// Merge the audio chunks fetched from the database into a single audio file
export async function mergeComposerFromDB(meetId: string, userId: string): Promise<string> {
  const chunks = await getAudioChunksFromDB(meetId, userId);
  if (chunks.length === 0) {
    throw new Error('No audio chunks found for the provided meet id and user id');
  }

  // Create a temporary file list for ffmpeg's concat demuxer
  const tempFileList = path.join(__dirname, `${meetId}-${userId}-filelist.txt`);
  const fileListContent = chunks.map(chunk => `file '${chunk.filepath}'`).join('\n');
  await fs.writeFile(tempFileList, fileListContent);

  // Define the output merged file path
  const outputMergedFile = path.join(__dirname, `${meetId}-${userId}-merged.mp3`);

  return new Promise((resolve, reject) => {
    // Execute ffmpeg command to merge the audio chunks
    const command = `ffmpeg -y -f concat -safe 0 -i "${tempFileList}" -c copy "${outputMergedFile}"`;
    exec(command, (error, stdout, stderr) => {
      if (error) {
        reject(error);
      } else {
        // Clean up temporary file list
        fs.unlink(tempFileList).catch(() => {});
        resolve(outputMergedFile);
      }
    });
  });
} 