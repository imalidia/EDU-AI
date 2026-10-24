import { Database } from '../types/supabase';
import supabaseClient from '../app/services/supabaseClient';

// Auth helpers with proper typing
export const signInWithEmail = async (email: string, password: string) => {
  const { data, error } = await supabaseClient.auth.signInWithPassword({
    email,
    password,
  });
  return { data, error };
};

export const signUpWithEmail = async (email: string, password: string) => {
  const { data, error } = await supabaseClient.auth.signUp({
    email,
    password,
  });
  return { data, error };
};

export const signOut = async () => {
  const { error } = await supabaseClient.auth.signOut();
  return { error };
};

export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabaseClient.auth.getUser();
  return { user, error };
};

// Session management
export const getSession = async () => {
  const { data: { session }, error } = await supabaseClient.auth.getSession();
  return { session, error };
};

// Database operations
export const createNote = async (note: Database['public']['Tables']['notes']['Insert']) => {
  const { data, error } = await supabaseClient
    .from('notes')
    .insert(note)
    .select()
    .single();
  return { data, error };
};

export const getNotes = async (userId: string) => {
  const { data, error } = await supabaseClient
    .from('notes')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  return { data, error };
};

export const createFlashcard = async (flashcard: Database['public']['Tables']['flashcards']['Insert']) => {
  const { data, error } = await supabaseClient
    .from('flashcards')
    .insert(flashcard)
    .select()
    .single();
  return { data, error };
};

export const getFlashcards = async (userId: string) => {
  const { data, error } = await supabaseClient
    .from('flashcards')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  return { data, error };
};

export { supabaseClient }; 