import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Text, Button, Surface, TextInput, Chip, ActivityIndicator } from 'react-native-paper';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSettings } from '../../contexts/SettingsContext';
import { useStreak } from '../../contexts/StreakContext';

export default function AppIndex() {
  const { settings, generateAnswer } = useSettings();
  const { currentStreak } = useStreak();
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState<string | null>(null);
  const [asking, setAsking] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleAskAI = async () => {
    if (!question.trim()) return;
    setAsking(true);
    setErrorMsg(null);
    try {
      const reply = await generateAnswer(question.trim());
      setAnswer(reply);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Could not generate answer. Check your API Key in Settings.');
    } finally {
      setAsking(false);
    }
  };

  const hasApiKey = !!settings.aiApiKey?.trim();

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Top Bar */}
        <View style={styles.topBar}>
          <View>
            <Text style={styles.title}>EduAI</Text>
            <Text style={styles.subtitle}>Your personal learning assistant</Text>
          </View>
          <Pressable style={styles.streakBadge} onPress={() => router.push('/streak')}>
            <MaterialCommunityIcons name="fire" size={22} color="#FF4500" />
            <Text style={styles.streakBadgeText}>{currentStreak}</Text>
          </Pressable>
        </View>

        {/* Status Chips */}
        <View style={styles.statusRow}>
          <Chip
            icon={settings.storageMode === 'local' ? 'database-outline' : 'cloud-check-outline'}
            style={styles.statusChip}
            textStyle={styles.statusChipText}
            onPress={() => router.push('/profile')}
          >
            Storage: {settings.storageMode === 'local' ? 'Local Storage' : 'Supabase'}
          </Chip>
          <Chip
            icon={hasApiKey ? 'key-check' : 'key-alert'}
            style={[styles.statusChip, hasApiKey ? styles.keyConnectedChip : styles.keyMissingChip]}
            textStyle={styles.statusChipText}
            onPress={() => router.push('/profile')}
          >
            AI: {hasApiKey ? settings.aiProvider.toUpperCase() : 'Connect API Key'}
          </Chip>
        </View>

        {/* Ask AI Box */}
        <Surface style={styles.aiCard}>
          <View style={styles.aiCardHeader}>
            <MaterialCommunityIcons name="robot-outline" size={22} color="#10B981" />
            <Text style={styles.aiCardTitle}>Ask AI Assistant</Text>
          </View>
          <TextInput
            mode="outlined"
            placeholder="Ask any study question to generate an answer..."
            value={question}
            onChangeText={setQuestion}
            multiline
            style={styles.questionInput}
            outlineColor="#2D3B54"
            activeOutlineColor="#10B981"
            textColor="#FFFFFF"
            placeholderTextColor="#94A3B8"
          />
          <View style={styles.aiActionRow}>
            {!hasApiKey && (
              <Button
                mode="text"
                compact
                textColor="#F59E0B"
                icon="key-plus"
                onPress={() => router.push('/profile')}
              >
                Set API Key
              </Button>
            )}
            <Button
              mode="contained"
              icon="creation"
              buttonColor="#10B981"
              onPress={handleAskAI}
              loading={asking}
              disabled={asking || !question.trim()}
              style={styles.generateBtn}
            >
              Generate Answer
            </Button>
          </View>

          {errorMsg && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{errorMsg}</Text>
              <Button mode="text" compact textColor="#10B981" onPress={() => router.push('/profile')}>
                Open API Key Settings
              </Button>
            </View>
          )}

          {answer && (
            <View style={styles.answerBox}>
              <Text style={styles.answerLabel}>AI Answer:</Text>
              <Text style={styles.answerText}>{answer}</Text>
            </View>
          )}
        </Surface>

        {/* Main Actions */}
        <View style={styles.buttonContainer}>
          <Button
            mode="contained"
            icon="notebook-outline"
            buttonColor="#10B981"
            style={styles.button}
            onPress={() => router.push('/library')}
          >
            My Notes & Library
          </Button>

          <Button
            mode="contained"
            icon="cards-outline"
            buttonColor="#2563EB"
            style={styles.button}
            onPress={() => router.push('/flashcards/create')}
          >
            AI Flashcard Generator
          </Button>

          <Button
            mode="contained"
            icon="file-pdf-box"
            buttonColor="#7C3AED"
            style={styles.button}
            onPress={() => router.push('/docs/upload')}
          >
            PDF to Notes
          </Button>

          <Button
            mode="outlined"
            icon="cog-outline"
            textColor="#FFFFFF"
            style={styles.settingsButton}
            onPress={() => router.push('/profile')}
          >
            API Key & Storage Settings (Supabase / Local)
          </Button>
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <Surface style={styles.bottomNav}>
        <Pressable style={styles.navItem}>
          <MaterialCommunityIcons name="home" size={24} color="#10B981" />
        </Pressable>
        <Pressable style={styles.navItem} onPress={() => router.push('/library')}>
          <MaterialCommunityIcons name="notebook-outline" size={24} color="#94A3B8" />
        </Pressable>
        <Pressable style={styles.navItem} onPress={() => router.push('/profile')}>
          <MaterialCommunityIcons name="account-cog-outline" size={24} color="#94A3B8" />
        </Pressable>
      </Surface>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#0A0F1C',
  },
  container: {
    padding: 20,
    paddingTop: 48,
    paddingBottom: 32,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 15,
    color: '#94A3B8',
    marginTop: 2,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#141B2E',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#2D3B54',
    gap: 4,
  },
  streakBadgeText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  statusRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  statusChip: {
    backgroundColor: '#141B2E',
    borderColor: '#2D3B54',
    borderWidth: 1,
  },
  keyConnectedChip: {
    borderColor: '#10B981',
  },
  keyMissingChip: {
    borderColor: '#F59E0B',
  },
  statusChipText: {
    color: '#FFFFFF',
    fontSize: 12,
  },
  aiCard: {
    backgroundColor: '#141B2E',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2D3B54',
    marginBottom: 24,
  },
  aiCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  aiCardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  questionInput: {
    backgroundColor: '#0A0F1C',
    marginBottom: 12,
    minHeight: 70,
  },
  aiActionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 8,
  },
  generateBtn: {
    borderRadius: 8,
  },
  errorBox: {
    marginTop: 12,
    padding: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  errorText: {
    color: '#FCA5A5',
    fontSize: 13,
  },
  answerBox: {
    marginTop: 14,
    padding: 14,
    borderRadius: 10,
    backgroundColor: '#0A0F1C',
    borderWidth: 1,
    borderColor: '#10B981',
  },
  answerLabel: {
    color: '#10B981',
    fontWeight: 'bold',
    marginBottom: 6,
    fontSize: 13,
  },
  answerText: {
    color: '#FFFFFF',
    fontSize: 14,
    lineHeight: 21,
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
  button: {
    width: '100%',
    paddingVertical: 6,
    borderRadius: 10,
  },
  settingsButton: {
    width: '100%',
    paddingVertical: 6,
    borderRadius: 10,
    borderColor: '#2D3B54',
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
});