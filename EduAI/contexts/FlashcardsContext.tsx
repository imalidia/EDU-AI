import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import supabase, { getClientStorageMode } from '../app/services/supabaseClient';
import { useAuth } from './AuthContext';

export interface Flashcard {
  id: string;
  question: string;
  answer: string;
  deckId: string;
  nextReviewDate?: string;
  confidenceLevel?: number;
  createdAt: string;
  userId?: string;
  updatedAt?: string;
}

export interface Deck {
  id: string;
  title: string;
  description: string;
  tags: string[];
  createdAt: string;
  userId?: string;
  updatedAt?: string;
}

export interface FlashcardsContextType {
  flashcards: Flashcard[];
  decks: Deck[];
  isLoading: boolean;
  loading: boolean;
  error: string | null;
  createFlashcard: (flashcard: Omit<Flashcard, "id" | "userId" | "createdAt" | "updatedAt">) => Promise<string>;
  addFlashcard: (flashcard: Omit<Flashcard, "id" | "userId" | "createdAt" | "updatedAt">) => Promise<string>;
  createDeck: (deck: Omit<Deck, "id" | "userId" | "createdAt" | "updatedAt">) => Promise<string>;
  addDeck: (deck: Omit<Deck, "id" | "userId" | "createdAt" | "updatedAt">) => Promise<string>;
  deleteFlashcard: (id: string) => Promise<void>;
  deleteDeck: (id: string) => Promise<void>;
  updateFlashcard: (
    idOrFlashcard: string | Flashcard,
    updates?: Partial<Omit<Flashcard, "id" | "createdAt" | "userId">>
  ) => Promise<void>;
  updateDeck: (deck: Deck) => Promise<void>;
  getFlashcardsByDeck: (deckId: string) => Flashcard[];
}

export const FlashcardsContext = createContext<FlashcardsContextType>({
  flashcards: [],
  decks: [],
  isLoading: false,
  loading: false,
  error: null,
  createFlashcard: async () => '',
  addFlashcard: async () => '',
  createDeck: async () => '',
  addDeck: async () => '',
  deleteFlashcard: async () => {},
  deleteDeck: async () => {},
  updateFlashcard: async () => {},
  updateDeck: async () => {},
  getFlashcardsByDeck: () => [],
});

export function FlashcardsProvider({ children }: { children: React.ReactNode }) {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  
  // Add refs to track initialization and current user
  const initialized = useRef(false);
  const currentUserId = useRef<string | null>(null);

  // Load data when user changes
  useEffect(() => {
    // Only load data if user changed or on first render
    const userId = user?.id || null;
    if (!initialized.current || userId !== currentUserId.current) {
      initialized.current = true;
      currentUserId.current = userId;
      loadData();
    }
  }, [user]);

  // Load data from AsyncStorage and Supabase
  const loadData = async () => {
    try {
      setLoading(true);
      
      // First load from local storage for immediate display
      const storedDecksStr = await AsyncStorage.getItem('decks');
      const storedFlashcardsStr = await AsyncStorage.getItem('flashcards');
      
      let localDecks: Deck[] = [];
      let localFlashcards: Flashcard[] = [];
      
      if (storedDecksStr) {
        localDecks = JSON.parse(storedDecksStr);
        setDecks(localDecks);
      }
      
      if (storedFlashcardsStr) {
        localFlashcards = JSON.parse(storedFlashcardsStr);
        setFlashcards(localFlashcards);
      }
      
      // Then try to get from Supabase if user is logged in and in supabase mode
      if (user && getClientStorageMode() === 'supabase' && user.id !== 'local-dev-user') {
        // Get decks
        const { data: remoteDecks, error: decksError } = await supabase
          .from('decks')
          .select('*')
          .eq('user_id', user.id);
          
        if (!decksError && remoteDecks && remoteDecks.length > 0) {
          // Transform from database format to app format
          const formattedDecks: Deck[] = remoteDecks.map(deck => ({
            id: deck.id,
            title: deck.title,
            description: deck.description,
            tags: deck.tags || [],
            createdAt: deck.created_at,
            userId: deck.user_id
          }));
          
          // Merge with local decks
          const mergedDecks = mergeData(localDecks, formattedDecks);
          setDecks(mergedDecks);
          
          // Save merged decks back to AsyncStorage
          await AsyncStorage.setItem('decks', JSON.stringify(mergedDecks));
        }
        
        // Get flashcards
        const { data: remoteFlashcards, error: flashcardsError } = await supabase
          .from('flashcards')
          .select('*')
          .eq('user_id', user.id);
          
        if (!flashcardsError && remoteFlashcards && remoteFlashcards.length > 0) {
          // Transform from database format to app format
          const formattedFlashcards: Flashcard[] = remoteFlashcards.map(card => ({
            id: card.id,
            question: card.question,
            answer: card.answer,
            deckId: card.deck_id,
            nextReviewDate: card.next_review_date,
            confidenceLevel: card.confidence_level,
            createdAt: card.created_at,
            userId: card.user_id
          }));
          
          // Merge with local flashcards
          const mergedFlashcards = mergeData(localFlashcards, formattedFlashcards);
          setFlashcards(mergedFlashcards);
          
          // Save merged flashcards back to AsyncStorage
          await AsyncStorage.setItem('flashcards', JSON.stringify(mergedFlashcards));
        }
      }
    } catch (error) {
      console.error('Failed to load flashcards data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Merge local and remote data, keeping the newer versions
  const mergeData = <T extends { id: string, createdAt: string }>(localData: T[], remoteData: T[]): T[] => {
    const dataMap = new Map<string, T>();
    
    // Add all local data to the map
    localData.forEach(item => {
      dataMap.set(item.id, item);
    });
    
    // Add remote data, preferring newer versions
    remoteData.forEach(remoteItem => {
      const localItem = dataMap.get(remoteItem.id);
      
      if (localItem) {
        const localDate = new Date(localItem.createdAt);
        const remoteDate = new Date(remoteItem.createdAt);
        
        if (remoteDate > localDate) {
          dataMap.set(remoteItem.id, remoteItem);
        }
      } else {
        dataMap.set(remoteItem.id, remoteItem);
      }
    });
    
    return Array.from(dataMap.values());
  };

  // Save deck to Supabase
  const saveDeckToSupabase = async (deck: Deck) => {
    if (!user || getClientStorageMode() === 'local' || user.id === 'local-dev-user') return;
    
    try {
      // Format for Supabase
      const dbDeck = {
        id: deck.id,
        title: deck.title,
        description: deck.description,
        tags: deck.tags,
        created_at: deck.createdAt,
        user_id: user.id
      };
      
      // Upsert to Supabase
      await supabase
        .from('decks')
        .upsert(dbDeck);
    } catch (error) {
      console.error('Failed to save deck to Supabase:', error);
    }
  };

  // Save flashcard to Supabase
  const saveFlashcardToSupabase = async (flashcard: Flashcard) => {
    if (!user || getClientStorageMode() === 'local' || user.id === 'local-dev-user') return;
    
    try {
      // Format for Supabase
      const dbFlashcard = {
        id: flashcard.id,
        question: flashcard.question,
        answer: flashcard.answer,
        deck_id: flashcard.deckId,
        next_review_date: flashcard.nextReviewDate,
        confidence_level: flashcard.confidenceLevel,
        created_at: flashcard.createdAt,
        user_id: user.id
      };
      
      // Upsert to Supabase
      await supabase
        .from('flashcards')
        .upsert(dbFlashcard);
    } catch (error) {
      console.error('Failed to save flashcard to Supabase:', error);
    }
  };

  // Delete deck from Supabase
  const deleteDeckFromSupabase = async (id: string) => {
    if (!user || getClientStorageMode() === 'local' || user.id === 'local-dev-user') return;
    
    try {
      await supabase
        .from('decks')
        .delete()
        .eq('id', id);
    } catch (error) {
      console.error('Failed to delete deck from Supabase:', error);
    }
  };

  // Delete flashcard from Supabase
  const deleteFlashcardFromSupabase = async (id: string) => {
    if (!user || getClientStorageMode() === 'local' || user.id === 'local-dev-user') return;
    
    try {
      await supabase
        .from('flashcards')
        .delete()
        .eq('id', id);
    } catch (error) {
      console.error('Failed to delete flashcard from Supabase:', error);
    }
  };

  // Add a deck
  const addDeck = async (deckData: Omit<Deck, "id" | "createdAt" | "userId">) => {
    const deckId = Date.now().toString();
    
    const newDeck: Deck = {
      ...deckData,
      id: deckId,
      createdAt: new Date().toISOString(),
      userId: user?.id
    };

    const updatedDecks = [...decks, newDeck];
    setDecks(updatedDecks);
    
    // Save to AsyncStorage
    await AsyncStorage.setItem('decks', JSON.stringify(updatedDecks));
    
    // Save to Supabase if logged in
    if (user) {
      await saveDeckToSupabase(newDeck);
    }
    
    return deckId;
  };

  // Update a deck
  const updateDeck = async (deck: Deck) => {
    const updatedDecks = decks.map(d => 
      d.id === deck.id ? { 
        ...d, 
        ...deck,
        updatedAt: new Date().toISOString(),
      } : d
    );
    
    setDecks(updatedDecks);
    
    // Update AsyncStorage
    await AsyncStorage.setItem('decks', JSON.stringify(updatedDecks));
    
    // Update in Supabase if logged in
    if (user) {
      await saveDeckToSupabase(deck);
    }
  };

  // Delete a deck
  const deleteDeck = async (id: string) => {
    // Also delete all flashcards in this deck
    const updatedFlashcards = flashcards.filter(card => card.deckId !== id);
    setFlashcards(updatedFlashcards);
    await AsyncStorage.setItem('flashcards', JSON.stringify(updatedFlashcards));
    
    // Delete the deck
    const updatedDecks = decks.filter(deck => deck.id !== id);
    setDecks(updatedDecks);
    await AsyncStorage.setItem('decks', JSON.stringify(updatedDecks));
    
    // Delete from Supabase if logged in
    if (user) {
      // Delete all flashcards in this deck first
      await supabase
        .from('flashcards')
        .delete()
        .eq('deck_id', id);
        
      // Then delete the deck
      await deleteDeckFromSupabase(id);
    }
  };

  // Add a flashcard
  const addFlashcard = async (flashcardData: Omit<Flashcard, "id" | "createdAt" | "userId">) => {
    const newFlashcard: Flashcard = {
      ...flashcardData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      userId: user?.id
    };

    const updatedFlashcards = [...flashcards, newFlashcard];
    setFlashcards(updatedFlashcards);
    
    // Save to AsyncStorage
    await AsyncStorage.setItem('flashcards', JSON.stringify(updatedFlashcards));
    
    // Save to Supabase if logged in
    if (user) {
      await saveFlashcardToSupabase(newFlashcard);
    }
    
    return newFlashcard.id;
  };

  // Update a flashcard
  const updateFlashcard = async (
    idOrFlashcard: string | Flashcard,
    updates?: Partial<Omit<Flashcard, "id" | "createdAt" | "userId">>
  ): Promise<void> => {
    try {
      setLoading(true);
      
      const id = typeof idOrFlashcard === 'string' ? idOrFlashcard : idOrFlashcard.id;
      const updateFields = typeof idOrFlashcard === 'string' ? (updates || {}) : idOrFlashcard;

      // Find existing flashcard
      const existingCard = flashcards.find(f => f.id === id);
      
      if (!existingCard) {
        throw new Error(`Flashcard with ID ${id} not found`);
      }
      
      // Create updated flashcard
      const updatedFlashcard: Flashcard = {
        ...existingCard,
        ...updateFields,
        updatedAt: new Date().toISOString()
      };
      
      // Update in database if online
      if (user) {
        const { error } = await supabase
          .from('flashcards')
          .update({
            question: updatedFlashcard.question,
            answer: updatedFlashcard.answer,
            deck_id: updatedFlashcard.deckId,
            confidence_level: updatedFlashcard.confidenceLevel,
            next_review_date: updatedFlashcard.nextReviewDate,
            updated_at: updatedFlashcard.updatedAt,
          })
          .eq('id', id);
          
        if (error) {
          console.error('Error updating flashcard:', error);
        }
      }
      
      // Update local state
      setFlashcards(prevFlashcards => 
        prevFlashcards.map(f => f.id === id ? updatedFlashcard : f)
      );
      
      // Save to local storage for offline access
      const localFlashcards = await getLocalFlashcards();
      const updatedLocalFlashcards = localFlashcards.map(f => 
        f.id === id ? updatedFlashcard : f
      );
      await saveLocalFlashcards(updatedLocalFlashcards);
      
    } catch (error) {
      console.error('Error in updateFlashcard:', error);
      setError('Failed to update flashcard. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Delete a flashcard
  const deleteFlashcard = async (id: string) => {
    const updatedFlashcards = flashcards.filter(card => card.id !== id);
    setFlashcards(updatedFlashcards);
    
    // Update AsyncStorage
    await AsyncStorage.setItem('flashcards', JSON.stringify(updatedFlashcards));
    
    // Delete from Supabase if logged in
    if (user) {
      await deleteFlashcardFromSupabase(id);
    }
  };

  // Get flashcards by deck
  const getFlashcardsByDeck = (deckId: string): Flashcard[] => {
    return flashcards.filter(card => card.deckId === deckId);
  };

  // Helper functions for updateFlashcard
  const getLocalFlashcards = async (): Promise<Flashcard[]> => {
    try {
      const storedFlashcardsStr = await AsyncStorage.getItem('flashcards');
      return storedFlashcardsStr ? JSON.parse(storedFlashcardsStr) : [];
    } catch (error) {
      console.error('Error getting local flashcards:', error);
      return [];
    }
  };

  const saveLocalFlashcards = async (flashcards: Flashcard[]): Promise<void> => {
    try {
      await AsyncStorage.setItem('flashcards', JSON.stringify(flashcards));
    } catch (error) {
      console.error('Error saving local flashcards:', error);
    }
  };

  return (
    <FlashcardsContext.Provider
      value={{
        flashcards,
        decks,
        isLoading: loading,
        loading,
        error,
        createFlashcard: addFlashcard,
        addFlashcard,
        createDeck: addDeck,
        addDeck,
        deleteFlashcard,
        deleteDeck,
        updateFlashcard,
        updateDeck,
        getFlashcardsByDeck,
      }}
    >
      {children}
    </FlashcardsContext.Provider>
  );
}

export const useFlashcards = () => useContext(FlashcardsContext); 