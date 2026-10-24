// Mock youtubeService.ts
// This is just a placeholder to prevent import errors

export interface YouTubeTranscriptionResult {
  id: string;
  user_id: string;
  video_id: string;
  url: string;
  title: string;
  transcription: string | null;
  notes: string | null;
  status: 'processing' | 'completed' | 'failed';
  created_at: string;
  updated_at: string | null;
  note_id: string | null;
}

export const extractYouTubeId = (url: string): string | null => {
  console.log('YouTube feature has been removed');
  return null;
};

export const getYouTubeVideoInfo = async (videoId: string) => {
  console.log('YouTube feature has been removed');
  return {
    title: 'Placeholder Video',
    author: 'EduAI',
    url: `https://www.youtube.com/watch?v=${videoId}`,
  };
};

export const transcribeYouTubeVideo = async (videoId: string, jobId: string, userId?: string): Promise<string> => {
  console.log('YouTube feature has been removed');
  return 'YouTube feature has been removed from the application.';
};

export const generateNotesFromTranscription = async (
  transcription: string,
  title: string
): Promise<string> => {
  console.log('YouTube feature has been removed');
  return 'YouTube feature has been removed from the application.';
};

export const createYouTubeProcessingJob = async (
  userId: string,
  videoId: string,
  videoInfo: any
): Promise<YouTubeTranscriptionResult> => {
  console.log('YouTube feature has been removed');
  return {
    id: 'mock-id',
    user_id: userId,
    video_id: videoId,
    url: `https://www.youtube.com/watch?v=${videoId}`,
    title: videoInfo?.title || 'Placeholder Video',
    transcription: null,
    notes: null,
    status: 'failed',
    created_at: new Date().toISOString(),
    updated_at: null,
    note_id: null,
  };
};

export const updateTranscriptionJob = async (
  jobId: string,
  updates: Partial<YouTubeTranscriptionResult>
): Promise<void> => {
  console.log('YouTube feature has been removed');
};

export const getTranscriptionJob = async (
  jobId: string
): Promise<YouTubeTranscriptionResult | null> => {
  console.log('YouTube feature has been removed');
  return null;
};

export const getUserTranscriptions = async (): Promise<YouTubeTranscriptionResult[]> => {
  console.log('YouTube feature has been removed');
  return [];
}; 