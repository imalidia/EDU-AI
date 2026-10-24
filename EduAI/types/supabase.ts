export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          display_name: string | null
          avatar_url: string | null
          created_at: string
          last_login: string | null
          streak_count: number
          streak_last_date: string | null
          preferences: Json | null
        }
        Insert: {
          id?: string
          email: string
          display_name?: string | null
          avatar_url?: string | null
          created_at?: string
          last_login?: string | null
          streak_count?: number
          streak_last_date?: string | null
          preferences?: Json | null
        }
        Update: {
          id?: string
          email?: string
          display_name?: string | null
          avatar_url?: string | null
          created_at?: string
          last_login?: string | null
          streak_count?: number
          streak_last_date?: string | null
          preferences?: Json | null
        }
      }
      notes: {
        Row: {
          id: string
          user_id: string
          title: string
          content: string
          source_type: 'youtube' | 'document' | 'manual'
          source_url: string | null
          tags: string[]
          created_at: string
          updated_at: string
          is_favorite: boolean
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          content: string
          source_type: 'youtube' | 'document' | 'manual'
          source_url?: string | null
          tags?: string[]
          created_at?: string
          updated_at?: string
          is_favorite?: boolean
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          content?: string
          source_type?: 'youtube' | 'document' | 'manual'
          source_url?: string | null
          tags?: string[]
          created_at?: string
          updated_at?: string
          is_favorite?: boolean
        }
      }
      youtube_transcriptions: {
        Row: {
          id: string
          user_id: string
          video_id: string
          url: string
          title: string
          transcription: string
          notes: string
          status: 'processing' | 'completed' | 'failed'
          created_at: string
          updated_at: string | null
          note_id: string | null
        }
        Insert: {
          id?: string
          user_id: string
          video_id: string
          url: string
          title: string
          transcription?: string
          notes?: string
          status?: 'processing' | 'completed' | 'failed'
          created_at?: string
          updated_at?: string | null
          note_id?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          video_id?: string
          url?: string
          title?: string
          transcription?: string
          notes?: string
          status?: 'processing' | 'completed' | 'failed'
          created_at?: string
          updated_at?: string | null
          note_id?: string | null
        }
      }
      chat_messages: {
        Row: {
          id: string
          user_id: string
          source_id: string
          source_type: 'youtube_transcription' | 'note'
          message: string
          sender: 'user' | 'ai'
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          source_id: string
          source_type: 'youtube_transcription' | 'note'
          message: string
          sender: 'user' | 'ai'
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          source_id?: string
          source_type?: 'youtube_transcription' | 'note'
          message?: string
          sender?: 'user' | 'ai'
          created_at?: string
        }
      }
      flashcards: {
        Row: {
          id: string
          user_id: string
          note_id: string | null
          question: string
          answer: string
          tags: string[]
          created_at: string
          updated_at: string
          last_review: string | null
          review_count: number
          difficulty_rating: number
        }
        Insert: {
          id?: string
          user_id: string
          note_id?: string | null
          question: string
          answer: string
          tags?: string[]
          created_at?: string
          updated_at?: string
          last_review?: string | null
          review_count?: number
          difficulty_rating?: number
        }
        Update: {
          id?: string
          user_id?: string
          note_id?: string | null
          question?: string
          answer?: string
          tags?: string[]
          created_at?: string
          updated_at?: string
          last_review?: string | null
          review_count?: number
          difficulty_rating?: number
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
} 