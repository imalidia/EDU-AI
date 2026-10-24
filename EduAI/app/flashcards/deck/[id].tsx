import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, Animated, PanResponder, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Link, useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useFlashcards, Flashcard, Deck } from '../../../contexts/FlashcardsContext';
import { theme } from '../../../theme';
// Import Toast if available, or handle without it
let Toast: any;
try {
  Toast = require('react-native-toast-message');
} catch (e) {
  Toast = {
    show: (params: any) => console.log('Toast message:', params)
  };
}

// Constants
const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;
const SWIPE_THRESHOLD = 120;

// Card colors for customization
const CARD_COLORS = [
  '#3498db', '#2ecc71', '#f39c12', '#e74c3c', '#9b59b6', 
  '#1abc9c', '#d35400', '#c0392b', '#8e44ad', '#16a085'
];

export default function DeckScreen() {
  const { id, initialCardId } = useLocalSearchParams<{ id: string; initialCardId?: string }>();
  const {
    isLoading: isLoadingFlashcards,
    flashcards,
    decks,
    error: flashcardsError,
    updateFlashcard,
    getFlashcardsByDeck
  } = useFlashcards();
  
  const [deck, setDeck] = useState<Deck | null>(null);
  const [deckFlashcards, setDeckFlashcards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [cardFlipped, setCardFlipped] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
  const [cardsCompleted, setCardsCompleted] = useState(0);
  const [complete, setComplete] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Animation values
  const swipe = useRef(new Animated.ValueXY()).current;
  const rotate = swipe.x.interpolate({
    inputRange: [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
    outputRange: ['-10deg', '0deg', '10deg'],
    extrapolate: 'clamp',
  });

  // Get deck info
  useEffect(() => {
    if (id && decks) {
      const foundDeck = decks.find(d => d.id === id);
      if (foundDeck) {
        setDeck(foundDeck);
      }
    }
  }, [id, decks]);

  // Get the deck flashcards
  useEffect(() => {
    if (id) {
      const cards = getFlashcardsByDeck(id);
      setDeckFlashcards(cards);
      
      // If we have cards and no current index set, initialize the index
      if (cards.length > 0 && currentIndex === -1) {
        // If an initial card ID was provided, start with that card
        if (initialCardId) {
          const initialIndex = cards.findIndex(card => card.id === initialCardId);
          setCurrentIndex(initialIndex !== -1 ? initialIndex : 0);
        } else {
          setCurrentIndex(0);
        }
      }
      
      setLoading(false);
    }
  }, [id, flashcards, initialCardId]);

  // Update card position based on swipe gesture
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gesture) => {
        swipe.setValue({ x: gesture.dx, y: gesture.dy });
        
        // Calculate rotation based on horizontal movement
        if (gesture.dx > SWIPE_THRESHOLD) {
          setSwipeDirection('right');
        } else if (gesture.dx < -SWIPE_THRESHOLD) {
          setSwipeDirection('left');
        } else {
          setSwipeDirection(null);
        }
      },
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dx > SWIPE_THRESHOLD) {
          // Swipe right - "I knew this"
          swipeRight();
        } else if (gesture.dx < -SWIPE_THRESHOLD) {
          // Swipe left - "I didn't know this"
          swipeLeft();
        } else {
          // Reset position if not swiped far enough
          Animated.spring(swipe, {
            toValue: { x: 0, y: 0 },
            friction: 5,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  // Handle left swipe (didn't know)
  const swipeLeft = () => {
    if (currentIndex < 0 || currentIndex >= deckFlashcards.length) return;
    
    Animated.timing(swipe, {
      toValue: { x: -SCREEN_WIDTH * 1.5, y: 0 },
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      const currentCard = deckFlashcards[currentIndex];
      handleSwipe(currentCard, 'left');
      advanceToNextCard();
    });
  };

  // Handle right swipe (knew it)
  const swipeRight = () => {
    if (currentIndex < 0 || currentIndex >= deckFlashcards.length) return;
    
    Animated.timing(swipe, {
      toValue: { x: SCREEN_WIDTH * 1.5, y: 0 },
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      const currentCard = deckFlashcards[currentIndex];
      handleSwipe(currentCard, 'right');
      advanceToNextCard();
    });
  };

  // Advance to the next card
  const advanceToNextCard = () => {
    // Reset position for next card
    swipe.setValue({ x: 0, y: 0 });
    setCardFlipped(false);
    
    // Move to next card or finish
    if (currentIndex < deckFlashcards.length - 1) {
      setCurrentIndex(prevIndex => prevIndex + 1);
    } else {
      setComplete(true);
    }
  };

  // Update confidence level when a card is swiped
  const handleSwipe = async (card: Flashcard, direction: 'left' | 'right') => {
    try {
      const confidenceLevel = direction === 'right' 
        ? Math.min(5, (card.confidenceLevel || 1) + 1) 
        : Math.max(1, (card.confidenceLevel || 1) - 1);
      
      // Calculate next review date based on spaced repetition algorithm
      const daysToAdd = confidenceLevel === 5 ? 30 : 
                        confidenceLevel === 4 ? 14 : 
                        confidenceLevel === 3 ? 7 : 
                        confidenceLevel === 2 ? 3 : 1;
      
      const nextReviewDate = new Date();
      nextReviewDate.setDate(nextReviewDate.getDate() + daysToAdd);
      
      await updateFlashcard(card.id, {
        confidenceLevel,
        nextReviewDate: nextReviewDate.toISOString(),
      });
      
      // Update the counter
      setCardsCompleted(prev => prev + 1);
      
    } catch (error) {
      console.error('Error updating flashcard confidence level:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Could not update card. Please try again.',
      });
    }
  };

  // Flip the current card
  const flipCard = () => {
    setCardFlipped(!cardFlipped);
  };

  // Restart the deck
  const restartDeck = () => {
    setCurrentIndex(0);
    setCardsCompleted(0);
    setComplete(false);
    setCardFlipped(false);
    swipe.setValue({ x: 0, y: 0 });
  };

  // Loading state
  if (loading || !deck) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading flashcards...</Text>
      </View>
    );
  }

  // No flashcards state
  if (deckFlashcards.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Link href="../" asChild>
            <TouchableOpacity style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
          </Link>
          <Text style={styles.title}>{deck.title}</Text>
        </View>
        
        <View style={styles.emptyState}>
          <Ionicons name="card-outline" size={64} color="#3498db" />
          <Text style={styles.emptyStateText}>This deck has no flashcards yet</Text>
          <TouchableOpacity 
            style={styles.addCardButton}
            onPress={() => router.push(`/flashcards/create?deckId=${deck.id}`)}
          >
            <Text style={styles.addCardButtonText}>Add a Card</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Completion state
  if (complete) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Link href="../" asChild>
            <TouchableOpacity style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
          </Link>
          <Text style={styles.title}>{deck.title}</Text>
        </View>
        
        <View style={styles.completeContainer}>
          <Ionicons name="checkmark-circle-outline" size={80} color="#10B981" />
          <Text style={styles.completeTitle}>Deck Complete!</Text>
          <Text style={styles.completeText}>
            You reviewed {cardsCompleted} flashcards
          </Text>
          
          <View style={styles.completeActions}>
            <TouchableOpacity style={styles.primaryButton} onPress={restartDeck}>
              <Text style={styles.primaryButtonText}>Restart Deck</Text>
            </TouchableOpacity>
            
            <Link href="../" asChild>
              <TouchableOpacity style={styles.secondaryButton}>
                <Text style={styles.secondaryButtonText}>Back to Decks</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </View>
    );
  }

  // Get current card
  const currentCard = deckFlashcards[currentIndex];
  if (!currentCard) return null;
  
  // Create rotation and opacity based on swipe direction
  const cardStyle = {
    transform: [
      { translateX: swipe.x },
      { translateY: swipe.y },
      { rotate }
    ]
  };
  
  // Feedback overlays
  const rightOpacity = swipe.x.interpolate({
    inputRange: [0, SCREEN_WIDTH / 4],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });
  
  const leftOpacity = swipe.x.interpolate({
    inputRange: [-SCREEN_WIDTH / 4, 0],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Link href="../" asChild>
          <TouchableOpacity style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
        </Link>
        <Text style={styles.title}>{deck.title}</Text>
        <Text style={styles.counter}>{currentIndex + 1}/{deckFlashcards.length}</Text>
      </View>
      
      <View style={styles.cardContainer}>
        {/* Current Card */}
        <Animated.View 
          {...panResponder.panHandlers}
          style={[styles.card, cardStyle]}
        >
          <TouchableOpacity 
            style={[
              styles.cardContent, 
              { backgroundColor: CARD_COLORS[currentIndex % CARD_COLORS.length] }
            ]}
            onPress={flipCard}
            activeOpacity={0.9}
          >
            <Text style={styles.flipHint}>Tap to flip</Text>
            <Text style={styles.cardText}>
              {cardFlipped ? currentCard.answer : currentCard.question}
            </Text>
          </TouchableOpacity>
          
          {/* Right swipe overlay */}
          <Animated.View 
            style={[
              styles.overlay, 
              styles.rightOverlay, 
              { opacity: rightOpacity }
            ]}
          >
            <Ionicons name="checkmark-circle" size={80} color="#fff" />
            <Text style={styles.overlayText}>I know this</Text>
          </Animated.View>
          
          {/* Left swipe overlay */}
          <Animated.View 
            style={[
              styles.overlay, 
              styles.leftOverlay, 
              { opacity: leftOpacity }
            ]}
          >
            <Ionicons name="close-circle" size={80} color="#fff" />
            <Text style={styles.overlayText}>Still learning</Text>
          </Animated.View>
        </Animated.View>
      </View>
      
      <View style={styles.actionsContainer}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.leftButton]}
          onPress={swipeLeft}
        >
          <Ionicons name="close-circle-outline" size={30} color="red" />
          <Text style={styles.actionButtonText}>Don't Know</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, styles.rightButton]}
          onPress={swipeRight}
        >
          <Ionicons name="checkmark-circle-outline" size={30} color="green" />
          <Text style={styles.actionButtonText}>Got It</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0F1C', // Dark background
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
    backgroundColor: '#121A29', // Slightly lighter dark
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'center',
  },
  counter: {
    fontSize: 14,
    color: '#94A3B8',
    width: 48,
    textAlign: 'right',
  },
  backButton: {
    padding: 8,
  },
  cardContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  card: {
    width: SCREEN_WIDTH * 0.85,
    height: SCREEN_HEIGHT * 0.4,
    borderRadius: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  cardContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  flipHint: {
    position: 'absolute',
    bottom: 16,
    fontSize: 14,
  },
  cardText: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    paddingHorizontal: 20,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 8,
    borderRadius: 30,
  },
  leftButton: {
    backgroundColor: '#EF4444',
  },
  rightButton: {
    backgroundColor: '#10B981',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#FFFFFF',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  emptyStateText: {
    fontSize: 18,
    color: '#FFFFFF',
    marginVertical: 16,
  },
  addCardButton: {
    padding: 16,
    backgroundColor: '#10B981',
    borderRadius: 30,
  },
  addCardButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  completeContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  completeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 16,
  },
  completeText: {
    fontSize: 16,
    color: '#94A3B8',
    marginTop: 8,
    marginBottom: 24,
  },
  completeActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
  },
  primaryButton: {
    marginHorizontal: 8,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  secondaryButton: {
    marginHorizontal: 8,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rightOverlay: {
    backgroundColor: 'rgba(0, 255, 0, 0.5)',
  },
  leftOverlay: {
    backgroundColor: 'rgba(255, 0, 0, 0.5)',
  },
  overlayText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
}); 