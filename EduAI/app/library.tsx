import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Pressable, ActivityIndicator, Platform, Alert } from 'react-native';
import { Text, Surface, Searchbar, SegmentedButtons, Chip, IconButton, FAB } from 'react-native-paper';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNotes, Note } from '../contexts/NotesContext';
import { useFlashcards, Flashcard, Deck } from '../contexts/FlashcardsContext';
import CreateFlashcardModal from './components/CreateFlashcardModal';
import FlashcardListItem from './components/FlashcardListItem';

export default function LibraryScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [section, setSection] = useState('notes');
  const { notes, loading: notesLoading, deleteNote } = useNotes();
  const { decks, flashcards, loading: flashcardsLoading, deleteFlashcard } = useFlashcards();
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [editingFlashcard, setEditingFlashcard] = useState<Flashcard | null>(null);

  const navigateTo = (path: string) => {
    router.push(path as any);
  };

  // Filter notes based on search query
  const filteredNotes = searchQuery
    ? notes.filter(note => 
        note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : notes;

  // Filter flashcards based on search query
  const filteredFlashcards = searchQuery
    ? flashcards.filter(card => 
        card.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        card.answer.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : flashcards;

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  // Handle note deletion with confirmation
  const handleDeleteNote = (id: string) => {
    // Show confirmation dialog
    if (Platform.OS === 'web') {
      const confirmed = window.confirm('Are you sure you want to delete this note?');
      if (confirmed) {
        deleteNote(id);
      }
    } else {
      Alert.alert(
        'Delete Note',
        'Are you sure you want to delete this note?',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Delete',
            onPress: () => deleteNote(id),
            style: 'destructive',
          },
        ]
      );
    }
  };

  // Handle flashcard deletion with confirmation
  const handleDeleteFlashcard = (id: string) => {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm('Are you sure you want to delete this flashcard?');
      if (confirmed) {
        deleteFlashcard(id);
      }
    } else {
      Alert.alert(
        'Delete Flashcard',
        'Are you sure you want to delete this flashcard?',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Delete',
            onPress: () => deleteFlashcard(id),
            style: 'destructive',
          },
        ]
      );
    }
  };

  // Find the deck for a flashcard
  const findDeckForFlashcard = (flashcard: Flashcard): Deck | undefined => {
    return decks.find(deck => deck.id === flashcard.deckId);
  };

  // Handle pressing on a flashcard
  const handleFlashcardPress = (flashcard: Flashcard) => {
    const deck = findDeckForFlashcard(flashcard);
    if (deck) {
      router.push({
        pathname: `/flashcards/deck/${deck.id}`,
        params: { initialCardId: flashcard.id }
      } as any);
    }
  };

  // Handle editing a flashcard
  const handleEditFlashcard = (flashcard: Flashcard) => {
    setEditingFlashcard(flashcard);
    setCreateModalVisible(true);
  };

  const renderNoteItem = (note: Note) => (
    <Surface
      key={note.id}
      style={[styles.noteCard, { borderLeftColor: note.headingColor, borderLeftWidth: 5 }]}
    >
      <Pressable
        style={styles.noteCardPressable}
        android_ripple={{ color: 'rgba(0, 0, 0, 0.1)' }}
      >
        <View style={styles.noteCardContent}>
          <Text style={styles.noteTitle}>{note.title}</Text>
          <Text style={styles.notePreview} numberOfLines={2}>{note.content}</Text>
          
          {note.tags.length > 0 && (
            <View style={styles.tagContainer}>
              {note.tags.slice(0, 3).map(tag => (
                <Chip key={tag} style={styles.tagChip} textStyle={styles.tagChipText}>
                  {tag}
                </Chip>
              ))}
              {note.tags.length > 3 && (
                <Text style={styles.moreTagsText}>+{note.tags.length - 3}</Text>
              )}
            </View>
          )}
          
          <Text style={styles.noteDate}>
            {formatDate(note.createdAt)}
          </Text>
        </View>
        
        <View style={styles.noteActions}>
          <IconButton
            icon="pencil-outline"
            size={20}
            iconColor="#94A3B8"
            onPress={() => navigateTo(`/notes/edit/${note.id}`)}
          />
          <IconButton
            icon="delete-outline"
            size={20}
            iconColor="#EF4444"
            onPress={() => handleDeleteNote(note.id)}
          />
        </View>
      </Pressable>
    </Surface>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Library</Text>
        <Searchbar
          placeholder="Search"
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
          inputStyle={styles.searchInput}
          iconColor="#94A3B8"
          placeholderTextColor="#94A3B8"
        />
      </View>

      <SegmentedButtons
        value={section}
        onValueChange={setSection}
        buttons={[
          { value: 'notes', label: 'Notes' },
          { value: 'flashcards', label: 'Flashcards' },
        ]}
        style={styles.segmentedButtons}
      />

      <ScrollView style={styles.content}>
        {/* Notes Section */}
        {section === 'notes' && (
          <>
            {notesLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#10B981" />
                <Text style={styles.loadingText}>Loading notes...</Text>
              </View>
            ) : filteredNotes.length === 0 ? (
              <View style={styles.emptyStateContainer}>
                <MaterialCommunityIcons name="notebook-outline" size={64} color="#2D3B54" />
                <Text style={styles.emptyStateText}>No notes found</Text>
                <Text style={styles.emptyStateSubtext}>
                  {searchQuery ? 'Try a different search term' : 'Create notes using the + button'}
                </Text>
              </View>
            ) : (
              <View style={styles.notesContainer}>
                {filteredNotes.map(renderNoteItem)}
              </View>
            )}
          </>
        )}

        {/* Flashcards Section */}
        {section === 'flashcards' && (
          <>
            {flashcardsLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#10B981" />
                <Text style={styles.loadingText}>Loading flashcards...</Text>
              </View>
            ) : filteredFlashcards.length === 0 ? (
              <View style={styles.emptyStateContainer}>
                <MaterialCommunityIcons name="cards-outline" size={64} color="#2D3B54" />
                <Text style={styles.emptyStateText}>No flashcards found</Text>
                <Text style={styles.emptyStateSubtext}>
                  {searchQuery 
                    ? 'Try a different search term' 
                    : 'Create flashcards using the + button'}
                </Text>
              </View>
            ) : (
              <View style={styles.flashcardsContainer}>
                {filteredFlashcards.map(flashcard => (
                  <FlashcardListItem
                    key={flashcard.id}
                    flashcard={flashcard}
                    deck={findDeckForFlashcard(flashcard)}
                    onPress={handleFlashcardPress}
                    onEdit={handleEditFlashcard}
                    onDelete={handleDeleteFlashcard}
                  />
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* Bottom Navigation */}
      <Surface style={styles.bottomNav}>
        <Pressable style={styles.navItem} onPress={() => navigateTo('/')}>
          <MaterialCommunityIcons name="home-outline" size={24} color="#94A3B8" />
        </Pressable>
        <Pressable style={styles.navItem}>
          <MaterialCommunityIcons name="notebook-outline" size={24} color="#10B981" />
        </Pressable>
        <Pressable style={styles.navItem} onPress={() => navigateTo('/profile')}>
          <MaterialCommunityIcons name="account-outline" size={24} color="#94A3B8" />
        </Pressable>
      </Surface>

      {/* FAB for creating new items */}
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => {
          if (section === 'notes') {
            navigateTo('/notes/create');
          } else {
            setEditingFlashcard(null);
            setCreateModalVisible(true);
          }
        }}
      />

      {/* Create Flashcard Modal */}
      <CreateFlashcardModal
        visible={createModalVisible}
        onDismiss={() => {
          setCreateModalVisible(false);
          setEditingFlashcard(null);
        }}
        onSuccess={() => {
          console.log('Flashcard created successfully');
          setEditingFlashcard(null);
        }}
        flashcard={editingFlashcard}
        deckId={editingFlashcard?.deckId}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0F1C',
  },
  header: {
    padding: 16,
    paddingTop: 48,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  searchBar: {
    backgroundColor: '#141B2E',
    borderRadius: 12,
    elevation: 0,
  },
  searchInput: {
    color: '#FFFFFF',
  },
  segmentedButtons: {
    marginHorizontal: 16,
    backgroundColor: '#141B2E',
    borderRadius: 12,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 100,
  },
  loadingText: {
    fontSize: 16,
    color: '#FFFFFF',
    marginTop: 16,
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 100,
  },
  emptyStateText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 16,
    color: '#94A3B8',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  notesContainer: {
    gap: 16,
    marginBottom: 16,
  },
  flashcardsContainer: {
    gap: 16,
    marginBottom: 16,
  },
  noteCard: {
    backgroundColor: '#141B2E',
    borderRadius: 12,
    overflow: 'hidden',
    borderLeftWidth: 5,
  },
  noteCardPressable: {
    flexDirection: 'row',
    flex: 1,
    padding: 16,
    justifyContent: 'space-between',
  },
  noteCardContent: {
    flex: 1,
  },
  noteTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  notePreview: {
    fontSize: 14,
    color: '#94A3B8',
    marginBottom: 8,
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
    gap: 8,
  },
  tagChip: {
    backgroundColor: '#2D3B54',
    height: 24,
  },
  tagChipText: {
    fontSize: 12,
    color: '#94A3B8',
  },
  moreTagsText: {
    fontSize: 12,
    color: '#94A3B8',
    alignSelf: 'center',
  },
  noteDate: {
    fontSize: 12,
    color: '#64748B',
  },
  noteActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#141B2E',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#2D3B54',
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 80,
    backgroundColor: '#10B981',
  },
}); 