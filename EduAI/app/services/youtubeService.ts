import { mockNotesData } from './mockData';

export interface YouTubeTranscriptionResult {
  transcript: string;
  videoId: string;
  videoTitle?: string;
  videoDuration?: number;
}

export interface YouTubeVideoInfo {
  title: string;
  channelTitle: string;
  thumbnailUrl: string;
  videoId: string;
  duration?: number;
}

// Extract YouTube ID from URL
export function extractYouTubeId(url: string): string | null {
  console.log('[youtubeService] YouTube functionality has been removed.');
  return null;
}

// Get YouTube video info
export async function getYouTubeVideoInfo(videoId: string): Promise<YouTubeVideoInfo | null> {
  console.log('[youtubeService] YouTube functionality has been removed.');
  return null;
}

// Create a YouTube processing job entry in the database
export async function createYouTubeProcessingJob(videoId: string, videoInfo: YouTubeVideoInfo | null, userId?: string): Promise<string | null> {
  console.log('[youtubeService] YouTube functionality has been removed.');
  return null;
}

// Transcribe YouTube video
export async function transcribeYouTubeVideo(videoId: string, jobId: string): Promise<YouTubeTranscriptionResult | null> {
  console.log('[youtubeService] YouTube functionality has been removed.');
  return null;
}

// Generate notes from transcription
export async function generateNotesFromTranscription(transcription: YouTubeTranscriptionResult): Promise<any> {
  console.log('[youtubeService] YouTube functionality has been removed.');
  return mockNotesData;
}

// Check job status
export async function checkJobStatus(jobId: string): Promise<{status: string, notes?: any, error?: string}> {
  console.log('[youtubeService] YouTube functionality has been removed.');
  return { status: 'completed', notes: mockNotesData };
} 