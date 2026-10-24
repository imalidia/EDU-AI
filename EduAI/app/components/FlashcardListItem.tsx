import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Text, Surface, IconButton } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Flashcard, Deck } from '../../contexts/FlashcardsContext';
import { theme } from '../../theme';

interface FlashcardListItemProps {
  flashcard: Flashcard;
  deck?: Deck;
  onPress: (flashcard: Flashcard) => void;
  onEdit: (flashcard: Flashcard) => void;
  onDelete: (id: string) => void;
}

const FlashcardListItem: React.FC<FlashcardListItemProps> = ({
  flashcard,
  deck,
  onPress,
  onEdit,
  onDelete
}) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  return (
    <Surface style={styles.container}>
      <Pressable
        style={styles.pressable}
        android_ripple={{ color: 'rgba(0, 0, 0, 0.1)' }}
        onPress={() => onPress(flashcard)}
      >
        <View style={styles.content}>
          <View style={styles.questionContainer}>
            <MaterialCommunityIcons 
              name="help-circle-outline" 
              size={16} 
              color={theme.colors.primary} 
              style={styles.icon}
            />
            <Text 
              style={styles.question}
              numberOfLines={2}
              ellipsizeMode="tail"
            >
              {flashcard.question}
            </Text>
          </View>
          
          <View style={styles.answerContainer}>
            <MaterialCommunityIcons 
              name="check-circle-outline" 
              size={16} 
              color={theme.colors.secondary} 
              style={styles.icon}
            />
            <Text 
              style={styles.answer}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {flashcard.answer}
            </Text>
          </View>
          
          {deck && (
            <Text style={styles.deckName}>
              Deck: {deck.title}
            </Text>
          )}
          
          <Text style={styles.date}>
            Created: {formatDate(flashcard.createdAt)}
          </Text>
        </View>
        
        <View style={styles.actions}>
          <IconButton
            icon="pencil-outline"
            size={20}
            iconColor={theme.colors.onSurfaceVariant}
            onPress={() => onEdit(flashcard)}
          />
          <IconButton
            icon="delete-outline"
            size={20}
            iconColor={theme.colors.error}
            onPress={() => onDelete(flashcard.id)}
          />
        </View>
      </Pressable>
    </Surface>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    elevation: 1,
  },
  pressable: {
    flexDirection: 'row',
    padding: 12,
  },
  content: {
    flex: 1,
  },
  questionContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  answerContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  icon: {
    marginRight: 8,
    marginTop: 2,
  },
  question: {
    flex: 1,
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.onSurface,
  },
  answer: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.onSurface,
  },
  deckName: {
    fontSize: 12,
    color: theme.colors.primary,
    marginBottom: 4,
  },
  date: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
  },
  actions: {
    flexDirection: 'column',
    justifyContent: 'center',
  },
});

export default FlashcardListItem; 