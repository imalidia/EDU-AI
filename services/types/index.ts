/**
 * YouTube Service Types
 */
export interface VideoInfo {
  videoId: string;
  title: string;
  author: {
    name: string;
    id: string;
  };
  lengthSeconds: string;
  isPrivate: boolean;
  isLiveContent: boolean;
}

export interface ProcessVideoResult {
  videoId: string;
  title: string;
  author: string;
  audioFilePath: string;
  videoInfo: VideoInfo;
}

/**
 * Transcription Service Types
 */
export interface TranscriptionResult {
  transcription: string;
  notes: EducationalNotes;
}

export interface EducationalNotes {
  title: string;
  summary: string;
  keyPoints: string[];
  sections: Section[];
  vocabulary?: Vocabulary[];
  reviewQuestions?: string[];
}

export interface Section {
  title: string;
  content: string;
}

export interface Vocabulary {
  term: string;
  definition: string;
}

/**
 * API Response Types
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface ExtractAudioResponse {
  videoId: string;
  title: string;
  author: string;
  audioPath: string;
}

export interface TranscribeNotesResponse {
  videoId: string;
  title: string;
  author: string;
  audioPath: string;
  transcription: string;
  notes: EducationalNotes;
} 