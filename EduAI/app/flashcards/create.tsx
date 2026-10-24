import React, { useState } from 'react';
import { View, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, Keyboard, TouchableWithoutFeedback } from 'react-native';
import { Text, Button, TextInput, Chip, ActivityIndicator, Surface } from 'react-native-paper';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { theme } from '../../theme';
import { useSettings } from '../../contexts/SettingsContext';
import { useFlashcards } from '../../contexts/FlashcardsContext';

export default function FlashcardsCreateScreen() {
  const [text, setText] = useState('');
  const [deckTitle, setDeckTitle] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedSource, setSelectedSource] = useState<'text' | 'notes' | null>('text');
  const { generateFlashcardsFromText, settings } = useSettings();
  const { createDeck, createFlashcard } = useFlashcards();

  const handleCreate = async () => {
    if (!text.trim() && selectedSource === 'text') {
      setError('Please enter some text to generate flashcards');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const pairs = await generateFlashcardsFromText(text.trim(), 5);
      const title = deckTitle.trim() || `AI Deck (${new Date().toLocaleDateString()})`;
      const newDeck = await createDeck(title, `Generated from text using ${settings.aiApiKey ? settings.aiProvider.toUpperCase() : 'Smart Extractor'}`);
      for (const pair of pairs) {
        await createFlashcard({
          deck_id: newDeck.id,
          front: pair.question,
          back: pair.answer,
        });
      }
      setIsLoading(false);
      router.push(`/flashcards/deck/${newDeck.id}` as any);
    } catch (err: any) {
      setIsLoading(false);
      setError(err?.message || 'Failed to generate flashcards');
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" />
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color={theme.colors.onSurface} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Flashcards</Text>
          <View style={styles.placeholder} />
        </View>
        
        {/* Main Content */}
        <ScrollView style={styles.scrollContent} contentContainerStyle={styles.content}>
          <View style={styles.illustrationContainer}>
            <MaterialCommunityIcons 
              name="cards-outline" 
              size={64} 
              color="#2563EB" 
            />
            <Text style={styles.title}>AI Flashcard Generator</Text>
            <Text style={styles.subtitle}>
              Generate study flashcards using AI
            </Text>
          </View>
          
          <Surface style={styles.sourceCard}>
            <Text style={styles.sectionTitle}>Choose Source</Text>
            <View style={styles.chipContainer}>
              <Chip
                mode="outlined"
                selected={selectedSource === 'text'}
                onPress={() => setSelectedSource('text')}
                style={[
                  styles.chip,
                  selectedSource === 'text' && styles.selectedChip
                ]}
                textStyle={[
                  styles.chipText,
                  selectedSource === 'text' && styles.selectedChipText
                ]}
                showSelectedCheck={false}
                icon="text-box-outline"
              >
                Enter Text
              </Chip>
              
              <Chip
                mode="outlined"
                selected={selectedSource === 'notes'}
                onPress={() => setSelectedSource('notes')}
                style={[
                  styles.chip,
                  selectedSource === 'notes' && styles.selectedChip
                ]}
                textStyle={[
                  styles.chipText,
                  selectedSource === 'notes' && styles.selectedChipText
                ]}
                showSelectedCheck={false}
                icon="notebook-outline"
              >
                From My Notes
              </Chip>
            </View>
          </Surface>
          
          {selectedSource === 'text' ? (
            <Surface style={styles.inputCard}>
              <Text style={styles.sectionTitle}>Enter Text</Text>
              <TextInput
                mode="outlined"
                value={text}
                onChangeText={(value) => {
                  setText(value);
                  setError(null);
                }}
                placeholder="Paste or type text to generate flashcards from..."
                multiline
                numberOfLines={6}
                style={styles.textInput}
                outlineColor={theme.colors.outline}
                activeOutlineColor="#2563EB"
                error={!!error}
                disabled={isLoading}
              />
              
              {error && (
                <Text style={styles.errorText}>{error}</Text>
              )}
            </Surface>
          ) : selectedSource === 'notes' ? (
            <Surface style={styles.inputCard}>
              <Text style={styles.sectionTitle}>Select from Your Notes</Text>
              <TouchableOpacity 
                style={styles.noteSelector}
                onPress={() => router.push('/library' as any)}
                disabled={isLoading}
              >
                <MaterialCommunityIcons 
                  name="notebook-outline" 
                  size={24} 
                  color="#2563EB" 
                />
                <Text style={styles.noteSelectorText}>
                  Browse your saved notes
                </Text>
                <MaterialCommunityIcons 
                  name="chevron-right" 
                  size={24} 
                  color={theme.colors.onSurfaceVariant} 
                />
              </TouchableOpacity>
            </Surface>
          ) : null}
          
          <Button
            mode="contained"
            style={styles.createButton}
            labelStyle={styles.buttonLabel}
            onPress={handleCreate}
            loading={isLoading}
            disabled={isLoading || (selectedSource === 'text' && !text.trim())}
            icon={isLoading ? undefined : "cards"}
            buttonColor="#2563EB"
          >
            {isLoading ? "Generating..." : "Generate Flashcards"}
          </Button>
        </ScrollView>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.outline,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.onSurface,
  },
  placeholder: {
    width: 40,
  },
  scrollContent: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  illustrationContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.onSurface,
    marginTop: 16,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
    marginBottom: 16,
  },
  sourceCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.outline,
    borderWidth: 1,
  },
  inputCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.outline,
    borderWidth: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.onSurface,
    marginBottom: 12,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  chip: {
    backgroundColor: 'transparent',
    borderColor: theme.colors.outline,
  },
  selectedChip: {
    backgroundColor: '#2563EB20',
    borderColor: '#2563EB',
  },
  chipText: {
    color: theme.colors.onSurface,
  },
  selectedChipText: {
    color: '#2563EB',
  },
  textInput: {
    backgroundColor: theme.colors.background,
    minHeight: 120,
  },
  noteSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: theme.colors.outline,
    borderRadius: 8,
    backgroundColor: theme.colors.background,
  },
  noteSelectorText: {
    flex: 1,
    marginLeft: 12,
    color: theme.colors.onSurface,
    fontSize: 14,
  },
  errorText: {
    color: theme.colors.error,
    fontSize: 14,
    marginTop: 8,
  },
  createButton: {
    marginTop: 8,
    borderRadius: 8,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    paddingVertical: 4,
  },
}); 