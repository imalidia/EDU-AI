import React, { useState, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  Modal, 
  TouchableOpacity,
  ScrollView,
  Keyboard,
  TouchableWithoutFeedback,
  Dimensions
} from 'react-native';
import { Text, Button, TextInput, Surface, Chip, IconButton } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '../../theme';
import { useFlashcards, Flashcard } from '../../contexts/FlashcardsContext';

interface CreateFlashcardModalProps {
  visible: boolean;
  onDismiss: () => void;
  deckId?: string;
  onSuccess?: () => void;
  flashcard?: Flashcard | null; // Properly typed flashcard prop
}

const CreateFlashcardModal: React.FC<CreateFlashcardModalProps> = ({
  visible,
  onDismiss,
  deckId,
  onSuccess,
  flashcard
}) => {
  const { decks, addFlashcard, addDeck, updateFlashcard } = useFlashcards();
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{question?: string; answer?: string; deck?: string}>({});
  const [selectedDeckId, setSelectedDeckId] = useState<string | undefined>(deckId);
  const [newDeckName, setNewDeckName] = useState('');
  const [creatingNewDeck, setCreatingNewDeck] = useState(false);
  const [flipCard, setFlipCard] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Reset form when modal is opened or flashcard changes
  useEffect(() => {
    if (visible) {
      if (flashcard) {
        // We're in edit mode
        setQuestion(flashcard.question || '');
        setAnswer(flashcard.answer || '');
        setSelectedDeckId(flashcard.deckId);
        setCreatingNewDeck(false);
        setIsEditing(true);
      } else {
        // We're in create mode
        setQuestion('');
        setAnswer('');
        setSelectedDeckId(deckId);
        setNewDeckName('');
        setCreatingNewDeck(false);
        setIsEditing(false);
      }
      setErrors({});
      setFlipCard(false);
    }
  }, [visible, deckId, flashcard]);

  const validateForm = (): boolean => {
    const newErrors: {question?: string; answer?: string; deck?: string} = {};
    
    if (!question.trim()) {
      newErrors.question = 'Question is required';
    }
    
    if (!answer.trim()) {
      newErrors.answer = 'Answer is required';
    }
    
    if (!selectedDeckId && !creatingNewDeck) {
      newErrors.deck = 'Please select a deck or create a new one';
    }
    
    if (creatingNewDeck && !newDeckName.trim()) {
      newErrors.deck = 'Deck name is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreateOrUpdateFlashcard = async () => {
    if (!validateForm()) return;
    
    setIsLoading(true);
    try {
      let targetDeckId = selectedDeckId;
      
      // Create new deck if needed
      if (creatingNewDeck && newDeckName.trim()) {
        targetDeckId = await addDeck({
          title: newDeckName.trim(),
          description: `Created on ${new Date().toLocaleDateString()}`,
          tags: []
        });
      }
      
      if (!targetDeckId) {
        setErrors({deck: 'No deck selected'});
        setIsLoading(false);
        return;
      }
      
      if (isEditing && flashcard) {
        // Update existing flashcard
        await updateFlashcard({
          ...flashcard,
          question: question.trim(),
          answer: answer.trim(),
          deckId: targetDeckId
        });
      } else {
        // Add new flashcard
        await addFlashcard({
          question: question.trim(),
          answer: answer.trim(),
          deckId: targetDeckId
        });
      }
      
      // Reset form and close modal
      setQuestion('');
      setAnswer('');
      setErrors({});
      setIsLoading(false);
      
      if (onSuccess) {
        onSuccess();
      }
      
      onDismiss();
    } catch (error) {
      console.error('Error with flashcard:', error);
      setIsLoading(false);
      setErrors({deck: 'Failed to save flashcard'});
    }
  };

  const toggleNewDeckCreation = () => {
    setCreatingNewDeck(!creatingNewDeck);
    if (!creatingNewDeck) {
      setSelectedDeckId(undefined);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onDismiss}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Surface style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Create Flashcard</Text>
                <IconButton
                  icon="close"
                  size={24}
                  onPress={onDismiss}
                  style={styles.closeButton}
                />
              </View>
              
              <ScrollView style={styles.scrollContent}>
                {/* Card Preview */}
                <TouchableOpacity 
                  style={styles.cardPreview}
                  onPress={() => setFlipCard(!flipCard)}
                  activeOpacity={0.8}
                >
                  <Surface style={[styles.card, flipCard && styles.cardFlipped]}>
                    <View style={styles.cardFace}>
                      <Text style={styles.cardFaceLabel}>Question</Text>
                      <Text style={styles.cardText}>
                        {question || 'Your question will appear here'}
                      </Text>
                      <Text style={styles.tapPrompt}>Tap to flip</Text>
                    </View>
                    
                    <View style={[styles.cardFace, styles.cardBack]}>
                      <Text style={styles.cardFaceLabel}>Answer</Text>
                      <Text style={styles.cardText}>
                        {answer || 'Your answer will appear here'}
                      </Text>
                      <Text style={styles.tapPrompt}>Tap to flip</Text>
                    </View>
                  </Surface>
                </TouchableOpacity>

                {/* Deck Selection */}
                <View style={styles.sectionContainer}>
                  <Text style={styles.sectionTitle}>Select Deck</Text>
                  
                  <View style={styles.chipContainer}>
                    {decks.map(deck => (
                      <Chip
                        key={deck.id}
                        selected={selectedDeckId === deck.id}
                        onPress={() => {
                          setSelectedDeckId(deck.id);
                          setCreatingNewDeck(false);
                          setErrors({...errors, deck: undefined});
                        }}
                        style={[
                          styles.deckChip,
                          selectedDeckId === deck.id && styles.selectedDeckChip
                        ]}
                      >
                        {deck.title}
                      </Chip>
                    ))}
                    
                    <Chip
                      icon="plus"
                      onPress={toggleNewDeckCreation}
                      selected={creatingNewDeck}
                      style={[
                        styles.deckChip,
                        creatingNewDeck && styles.selectedDeckChip
                      ]}
                    >
                      New Deck
                    </Chip>
                  </View>
                  
                  {creatingNewDeck && (
                    <TextInput
                      label="New Deck Name"
                      value={newDeckName}
                      onChangeText={text => {
                        setNewDeckName(text);
                        if (text.trim()) {
                          setErrors({...errors, deck: undefined});
                        }
                      }}
                      style={styles.textInput}
                      mode="outlined"
                      error={!!errors.deck}
                      autoFocus
                    />
                  )}
                  
                  {errors.deck && (
                    <Text style={styles.errorText}>{errors.deck}</Text>
                  )}
                </View>

                {/* Question Input */}
                <View style={styles.sectionContainer}>
                  <Text style={styles.sectionTitle}>Question</Text>
                  <TextInput
                    value={question}
                    onChangeText={text => {
                      setQuestion(text);
                      if (text.trim()) {
                        setErrors({...errors, question: undefined});
                      }
                    }}
                    placeholder="Enter your question here"
                    multiline
                    numberOfLines={2}
                    mode="outlined"
                    style={styles.textInput}
                    error={!!errors.question}
                  />
                  {errors.question && (
                    <Text style={styles.errorText}>{errors.question}</Text>
                  )}
                </View>
                
                {/* Answer Input */}
                <View style={styles.sectionContainer}>
                  <Text style={styles.sectionTitle}>Answer</Text>
                  <TextInput
                    value={answer}
                    onChangeText={text => {
                      setAnswer(text);
                      if (text.trim()) {
                        setErrors({...errors, answer: undefined});
                      }
                    }}
                    placeholder="Enter your answer here"
                    multiline
                    numberOfLines={3}
                    mode="outlined"
                    style={styles.textInput}
                    error={!!errors.answer}
                  />
                  {errors.answer && (
                    <Text style={styles.errorText}>{errors.answer}</Text>
                  )}
                </View>
              </ScrollView>
              
              <View style={styles.buttonContainer}>
                <Button
                  mode="outlined"
                  onPress={onDismiss}
                  style={styles.button}
                  labelStyle={styles.cancelButtonLabel}
                >
                  Cancel
                </Button>
                <Button
                  mode="contained"
                  onPress={handleCreateOrUpdateFlashcard}
                  style={styles.button}
                  loading={isLoading}
                  disabled={isLoading}
                >
                  {isEditing ? 'Update Flashcard' : 'Create Flashcard'}
                </Button>
              </View>
            </Surface>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: width * 0.9,
    maxHeight: height * 0.8,
    borderRadius: 12,
    overflow: 'hidden',
  },
  modalContent: {
    backgroundColor: theme.colors.background,
    borderRadius: 12,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.outline,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.onSurface,
  },
  closeButton: {
    margin: 0,
  },
  scrollContent: {
    maxHeight: height * 0.6,
  },
  sectionContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.outline,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: theme.colors.onSurface,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  deckChip: {
    margin: 4,
    backgroundColor: theme.colors.surfaceVariant,
  },
  selectedDeckChip: {
    backgroundColor: theme.colors.primaryContainer,
  },
  textInput: {
    backgroundColor: theme.colors.surface,
    marginBottom: 4,
  },
  errorText: {
    color: theme.colors.error,
    fontSize: 12,
    marginTop: 4,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 16,
    gap: 8,
  },
  button: {
    minWidth: 120,
  },
  cancelButtonLabel: {
    color: theme.colors.primary,
  },
  cardPreview: {
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.outline,
  },
  card: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    backgroundColor: theme.colors.primary,
    overflow: 'hidden',
    position: 'relative',
  },
  cardFlipped: {
    transform: [{ rotateY: '180deg' }],
  },
  cardFace: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backfaceVisibility: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  cardBack: {
    transform: [{ rotateY: '180deg' }],
    backgroundColor: theme.colors.secondaryContainer,
  },
  cardFaceLabel: {
    fontSize: 12,
    color: theme.colors.onPrimary,
    position: 'absolute',
    top: 8,
    left: 8,
  },
  cardText: {
    fontSize: 16,
    color: theme.colors.onPrimary,
    textAlign: 'center',
  },
  tapPrompt: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    position: 'absolute',
    bottom: 8,
  },
});

export default CreateFlashcardModal; 