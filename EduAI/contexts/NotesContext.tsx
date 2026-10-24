import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import supabase, { getClientStorageMode } from '../app/services/supabaseClient';
import { useAuth } from './AuthContext';

export interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  headingColor: string;
  createdAt: string;
  userId?: string;
}

type NotesContextType = {
  notes: Note[];
  addNote: (note: Omit<Note, "id" | "createdAt" | "userId">) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  updateNote: (id: string, note: Partial<Omit<Note, "id" | "createdAt" | "userId">>) => Promise<void>;
  loading: boolean;
};

const NotesContext = createContext<NotesContextType>({
  notes: [],
  addNote: async () => {},
  deleteNote: async () => {},
  updateNote: async () => {},
  loading: true,
});

export function NotesProvider({ children }: { children: React.ReactNode }) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const initialized = useRef(false);
  const userId = useRef<string | undefined>(undefined);

  // Load notes when user changes
  useEffect(() => {
    // Only reload notes if user ID changes or on first load
    if (!initialized.current || userId.current !== user?.id) {
      initialized.current = true;
      userId.current = user?.id;
      loadNotes();
    }
  }, [user?.id]); // Only depend on user ID, not the entire user object

  // Load notes from AsyncStorage and Supabase
  const loadNotes = async () => {
    try {
      setLoading(true);
      
      // First load from local storage for immediate display
      const storedNotesStr = await AsyncStorage.getItem('notes');
      let localNotes: Note[] = [];
      
      if (storedNotesStr) {
        localNotes = JSON.parse(storedNotesStr);
        setNotes(localNotes);
      }
      
      // Then try to get from Supabase if user is logged in and in supabase mode
      if (user && getClientStorageMode() === 'supabase' && user.id !== 'local-dev-user') {
        const { data: remoteNotes, error } = await supabase
          .from('notes')
          .select('*')
          .eq('user_id', user.id);
          
        if (!error && remoteNotes && remoteNotes.length > 0) {
          // Transform from database format to app format
          const formattedNotes: Note[] = remoteNotes.map(note => ({
            id: note.id,
            title: note.title,
            content: note.content,
            tags: note.tags || [],
            headingColor: note.heading_color,
            createdAt: note.created_at,
            userId: note.user_id
          }));
          
          // Merge with local notes, keeping the latest versions
          const mergedNotes = mergeNotes(localNotes, formattedNotes);
          setNotes(mergedNotes);
          
          // Save merged notes back to AsyncStorage
          await AsyncStorage.setItem('notes', JSON.stringify(mergedNotes));
        }
      }
    } catch (error) {
      console.error('Failed to load notes:', error);
    } finally {
      setLoading(false);
    }
  };

  // Merge local and remote notes, keeping the newer versions
  const mergeNotes = (localNotes: Note[], remoteNotes: Note[]) => {
    const notesMap = new Map<string, Note>();
    
    // Add all local notes to the map
    localNotes.forEach(note => {
      notesMap.set(note.id, note);
    });
    
    // Add remote notes, preferring newer versions
    remoteNotes.forEach(remoteNote => {
      const localNote = notesMap.get(remoteNote.id);
      
      if (localNote) {
        const localDate = new Date(localNote.createdAt);
        const remoteDate = new Date(remoteNote.createdAt);
        
        if (remoteDate > localDate) {
          notesMap.set(remoteNote.id, remoteNote);
        }
      } else {
        notesMap.set(remoteNote.id, remoteNote);
      }
    });
    
    return Array.from(notesMap.values());
  };

  // Save to Supabase
  const saveToSupabase = async (note: Note) => {
    if (!user || getClientStorageMode() === 'local' || user.id === 'local-dev-user') return;
    
    try {
      // Format for Supabase
      const dbNote = {
        id: note.id,
        title: note.title,
        content: note.content,
        tags: note.tags,
        heading_color: note.headingColor,
        created_at: note.createdAt,
        user_id: user.id
      };
      
      // Upsert to Supabase
      await supabase
        .from('notes')
        .upsert(dbNote);
    } catch (error) {
      console.error('Failed to save note to Supabase:', error);
    }
  };

  // Delete from Supabase
  const deleteFromSupabase = async (id: string) => {
    if (!user || getClientStorageMode() === 'local' || user.id === 'local-dev-user') return;
    
    try {
      await supabase
        .from('notes')
        .delete()
        .eq('id', id);
    } catch (error) {
      console.error('Failed to delete note from Supabase:', error);
    }
  };

  // Add a note
  const addNote = async (noteData: Omit<Note, "id" | "createdAt" | "userId">) => {
    const newNote: Note = {
      ...noteData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      userId: user?.id
    };

    const updatedNotes = [...notes, newNote];
    setNotes(updatedNotes);
    
    // Save to AsyncStorage
    await AsyncStorage.setItem('notes', JSON.stringify(updatedNotes));
    
    // Save to Supabase if logged in
    if (user) {
      await saveToSupabase(newNote);
    }
  };

  // Delete a note
  const deleteNote = async (id: string) => {
    const updatedNotes = notes.filter(note => note.id !== id);
    setNotes(updatedNotes);
    
    // Update AsyncStorage
    await AsyncStorage.setItem('notes', JSON.stringify(updatedNotes));
    
    // Delete from Supabase if logged in
    if (user) {
      await deleteFromSupabase(id);
    }
  };

  // Update a note
  const updateNote = async (id: string, noteData: Partial<Omit<Note, "id" | "createdAt" | "userId">>) => {
    const updatedNotes = notes.map(note => 
      note.id === id ? { 
        ...note, 
        ...noteData,
        createdAt: new Date().toISOString(), // Update the timestamp for synchronization
      } : note
    );
    
    setNotes(updatedNotes);
    
    // Update AsyncStorage
    await AsyncStorage.setItem('notes', JSON.stringify(updatedNotes));
    
    // Update in Supabase if logged in
    if (user) {
      const updatedNote = updatedNotes.find(note => note.id === id);
      if (updatedNote) {
        await saveToSupabase(updatedNote);
      }
    }
  };

  return (
    <NotesContext.Provider value={{ notes, addNote, deleteNote, updateNote, loading }}>
      {children}
    </NotesContext.Provider>
  );
}

export const useNotes = () => useContext(NotesContext); 