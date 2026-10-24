import supabase from './supabaseClient';
import { Database } from '../../types/supabase';

// Notes
export const createNote = async (note: Database['public']['Tables']['notes']['Insert']) => {
  const { data, error } = await supabase
    .from('notes')
    .insert(note)
    .select()
    .single();
  return { data, error };
};

export const getNotes = async (userId: string) => {
  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  return { data, error };
};

export const updateNote = async (
  noteId: string,
  updates: Database['public']['Tables']['notes']['Update']
) => {
  const { data, error } = await supabase
    .from('notes')
    .update(updates)
    .eq('id', noteId)
    .select()
    .single();
  return { data, error };
};

export const deleteNote = async (noteId: string) => {
  const { error } = await supabase
    .from('notes')
    .delete()
    .eq('id', noteId);
  return { error };
};

// Flashcards
export const createFlashcard = async (
  flashcard: Database['public']['Tables']['flashcards']['Insert']
) => {
  const { data, error } = await supabase
    .from('flashcards')
    .insert(flashcard)
    .select()
    .single();
  return { data, error };
};

export const getFlashcards = async (userId: string) => {
  const { data, error } = await supabase
    .from('flashcards')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  return { data, error };
};

export const updateFlashcard = async (
  flashcardId: string,
  updates: Database['public']['Tables']['flashcards']['Update']
) => {
  const { data, error } = await supabase
    .from('flashcards')
    .update(updates)
    .eq('id', flashcardId)
    .select()
    .single();
  return { data, error };
};

export const deleteFlashcard = async (flashcardId: string) => {
  const { error } = await supabase
    .from('flashcards')
    .delete()
    .eq('id', flashcardId);
  return { error };
}; 