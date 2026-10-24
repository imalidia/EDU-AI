import { View, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { Text, Button, Surface } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState, useRef } from 'react';

export default function FlashcardViewScreen() {
  const { id } = useLocalSearchParams();
  const [isFlipped, setIsFlipped] = useState(false);
  const flipAnim = useRef(new Animated.Value(0)).current;

  // Example flashcard data - replace with actual data from your database
  const flashcard = {
    front: 'What is Machine Learning?',
    back: 'Machine Learning is a subset of artificial intelligence that focuses on developing systems that can learn and improve from experience without being explicitly programmed.',
    date: 'Today',
    tags: ['AI', 'Technology'],
  };

  const flipCard = () => {
    setIsFlipped(!isFlipped);
    Animated.spring(flipAnim, {
      toValue: isFlipped ? 0 : 1,
      friction: 8,
      tension: 10,
      useNativeDriver: true,
    }).start();
  };

  const frontAnimatedStyle = {
    transform: [
      {
        rotateY: flipAnim.interpolate({
          inputRange: [0, 1],
          outputRange: ['0deg', '180deg'],
        }),
      },
    ],
  };

  const backAnimatedStyle = {
    transform: [
      {
        rotateY: flipAnim.interpolate({
          inputRange: [0, 1],
          outputRange: ['180deg', '360deg'],
        }),
      },
    ],
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Button
          icon="arrow-left"
          mode="text"
          textColor="#FFFFFF"
          onPress={() => router.back()}
          style={styles.backButton}
        >
          Back
        </Button>
        <View style={styles.headerActions}>
          <Button
            icon="pencil"
            mode="text"
            textColor="#FFFFFF"
            onPress={() => {/* Implement edit */}}
          >
            Edit
          </Button>
          <Button
            icon="share-variant"
            mode="text"
            textColor="#FFFFFF"
            onPress={() => {/* Implement share */}}
          >
            Share
          </Button>
        </View>
      </View>

      <View style={styles.content}>
        <TouchableOpacity
          activeOpacity={1}
          onPress={flipCard}
          style={styles.cardContainer}
        >
          <Animated.View style={[styles.card, styles.cardFront, frontAnimatedStyle]}>
            <Text style={styles.cardText}>{flashcard.front}</Text>
            <Text style={styles.flipHint}>Tap to flip</Text>
          </Animated.View>

          <Animated.View style={[styles.card, styles.cardBack, backAnimatedStyle]}>
            <Text style={styles.cardText}>{flashcard.back}</Text>
            <Text style={styles.flipHint}>Tap to flip back</Text>
          </Animated.View>
        </TouchableOpacity>

        <View style={styles.metadata}>
          <MaterialCommunityIcons
            name="clock-outline"
            size={16}
            color="#94A3B8"
          />
          <Text style={styles.date}>{flashcard.date}</Text>
        </View>

        <View style={styles.tagsContainer}>
          {flashcard.tags.map((tag) => (
            <Surface key={tag} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </Surface>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0F1C',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 40,
  },
  backButton: {
    marginRight: 'auto',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  cardContainer: {
    height: 400,
    position: 'relative',
    marginBottom: 20,
  },
  card: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#141B2E',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#2D3B54',
    justifyContent: 'center',
    alignItems: 'center',
    backfaceVisibility: 'hidden',
  },
  cardFront: {
    backgroundColor: '#141B2E',
  },
  cardBack: {
    backgroundColor: '#1A2234',
  },
  cardText: {
    color: '#FFFFFF',
    fontSize: 20,
    textAlign: 'center',
    lineHeight: 28,
  },
  flipHint: {
    position: 'absolute',
    bottom: 20,
    color: '#94A3B8',
    fontSize: 14,
  },
  metadata: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },
  date: {
    color: '#94A3B8',
    fontSize: 14,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  tagText: {
    color: '#10B981',
    fontSize: 12,
  },
  controlButton: {
    color: '#10B981',
    marginHorizontal: 20,
  },
}); 