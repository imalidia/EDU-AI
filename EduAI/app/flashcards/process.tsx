import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Button, Surface, ActivityIndicator, TextInput } from 'react-native-paper';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState } from 'react';
import { useSettings } from '../../contexts/SettingsContext';

export default function FlashcardsProcessScreen() {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState<string | null>(null);
  const [asking, setAsking] = useState(false);
  const { generateAnswer } = useSettings();

  const handleAsk = async () => {
    if (!question.trim() || asking) return;
    setAsking(true);
    try {
      const res = await generateAnswer(question.trim());
      setAnswer(res);
    } catch (e: any) {
      setAnswer(e?.message || 'Could not generate answer.');
    } finally {
      setAsking(false);
    }
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
        <Text style={styles.title}>Generating Flashcards</Text>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <Surface style={styles.processingCard}>
          <ActivityIndicator size={48} color="#10B981" style={styles.loader} />
          <Text style={styles.processingText}>
            Creating your flashcards...
          </Text>
          <Text style={styles.processingSubtext}>
            Our AI is analyzing your content and generating effective question-answer pairs
          </Text>
        </Surface>

        <Surface style={styles.chatContainer}>
          <Text style={styles.chatTitle}>
            Have a question while waiting?
          </Text>
          <Text style={styles.chatDescription}>
            Ask our AI about the flashcards being generated
          </Text>
          <View style={styles.chatInputContainer}>
            <TextInput
              mode="outlined"
              value={question}
              onChangeText={setQuestion}
              placeholder="Type your question..."
              style={styles.chatInput}
              outlineColor="#2D3B54"
              activeOutlineColor="#10B981"
              textColor="#FFFFFF"
              onSubmitEditing={handleAsk}
              right={
                <TextInput.Icon
                  icon={asking ? 'loading' : 'send'}
                  color="#10B981"
                  onPress={handleAsk}
                />
              }
            />
          </View>
          {answer && (
            <View style={{ marginTop: 16, padding: 12, backgroundColor: '#0A0F1C', borderRadius: 12, borderWidth: 1, borderColor: '#2D3B54' }}>
              <Text style={{ color: '#10B981', fontWeight: 'bold', marginBottom: 4 }}>AI Answer:</Text>
              <Text style={{ color: '#E2E8F0', lineHeight: 20 }}>{answer}</Text>
            </View>
          )}
        </Surface>
      </ScrollView>
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
    alignItems: 'center',
    padding: 20,
    paddingTop: 40,
  },
  backButton: {
    marginRight: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    gap: 24,
  },
  processingCard: {
    backgroundColor: '#141B2E',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#2D3B54',
    alignItems: 'center',
  },
  loader: {
    marginBottom: 16,
  },
  processingText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  processingSubtext: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
  },
  chatContainer: {
    backgroundColor: '#141B2E',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#2D3B54',
  },
  chatTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  chatDescription: {
    fontSize: 14,
    color: '#94A3B8',
    marginBottom: 16,
  },
  chatInputContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  chatInput: {
    flex: 1,
    backgroundColor: '#0A0F1C',
  },
}); 