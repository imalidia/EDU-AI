import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  DEFAULT_SUPABASE_URL,
  DEFAULT_SUPABASE_ANON_KEY,
  reinitializeSupabase,
  setClientStorageMode,
} from '../app/services/supabaseClient';

export type StorageMode = 'local' | 'supabase';
export type AIProvider = 'openai' | 'deepseek' | 'gemini';

export interface AppSettings {
  storageMode: StorageMode;
  supabaseUrl: string;
  supabaseAnonKey: string;
  aiProvider: AIProvider;
  aiApiKey: string;
}

const SETTINGS_STORAGE_KEY = 'eduai_app_settings_v1';

const defaultSettings: AppSettings = {
  storageMode: 'local',
  supabaseUrl: '',
  supabaseAnonKey: '',
  aiProvider: 'openai',
  aiApiKey: '',
};

export async function getStoredAppSettings(): Promise<AppSettings> {
  try {
    const raw = await AsyncStorage.getItem(SETTINGS_STORAGE_KEY);
    if (raw) {
      return { ...defaultSettings, ...JSON.parse(raw) };
    }
  } catch (error) {
    console.warn('[SettingsContext] Failed to read settings:', error);
  }
  return defaultSettings;
}

export async function callAIWithSettings(
  prompt: string,
  systemPrompt: string = 'You are a helpful educational AI assistant inside EduAI.'
): Promise<string> {
  const settings = await getStoredAppSettings();
  const apiKey = settings.aiApiKey?.trim();

  if (!apiKey) {
    throw new Error('No AI API key configured. Please add your API key in Profile > Settings.');
  }

  // Auto-detect Gemini keys starting with AIza even if provider wasn't switched
  const provider: AIProvider = apiKey.startsWith('AIza') ? 'gemini' : settings.aiProvider;

  if (provider === 'gemini') {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${encodeURIComponent(
        apiKey
      )}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 1200 },
        }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Gemini API Error (${response.status}): ${errText.substring(0, 200)}`);
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      throw new Error('Empty response from Gemini API');
    }
    return text.trim();
  }

  const endpoint =
    provider === 'deepseek'
      ? 'https://api.deepseek.com/chat/completions'
      : 'https://api.openai.com/v1/chat/completions';
  const model = provider === 'deepseek' ? 'deepseek-chat' : 'gpt-4o-mini';

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 1200,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`${provider.toUpperCase()} API Error (${response.status}): ${errText.substring(0, 200)}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content?.trim() || 'No response generated.';
}

interface SettingsContextType {
  settings: AppSettings;
  isLoaded: boolean;
  switchStorageMode: (mode: StorageMode) => Promise<void>;
  saveSupabaseConfig: (url: string, anonKey: string, enableSupabase?: boolean) => Promise<void>;
  saveAIConfig: (provider: AIProvider, apiKey: string) => Promise<void>;
  generateAnswer: (prompt: string, systemPrompt?: string) => Promise<string>;
  generateFlashcardsFromText: (text: string) => Promise<Array<{ question: string; answer: string }>>;
}

const SettingsContext = createContext<SettingsContextType>({
  settings: defaultSettings,
  isLoaded: false,
  switchStorageMode: async () => {},
  saveSupabaseConfig: async () => {},
  saveAIConfig: async () => {},
  generateAnswer: async () => '',
  generateFlashcardsFromText: async () => [],
});

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      const loaded = await getStoredAppSettings();
      setSettings(loaded);
      setClientStorageMode(loaded.storageMode);
      if (loaded.supabaseUrl && loaded.supabaseAnonKey) {
        reinitializeSupabase(loaded.supabaseUrl, loaded.supabaseAnonKey);
      }
      setIsLoaded(true);
    })();
  }, []);

  const persistSettings = async (next: AppSettings) => {
    setSettings(next);
    setClientStorageMode(next.storageMode);
    await AsyncStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(next));
  };

  const switchStorageMode = async (mode: StorageMode) => {
    const next: AppSettings = { ...settings, storageMode: mode };
    await persistSettings(next);
  };

  const saveSupabaseConfig = async (
    url: string,
    anonKey: string,
    enableSupabase: boolean = true
  ) => {
    const cleanUrl = url.trim() || DEFAULT_SUPABASE_URL;
    const cleanKey = anonKey.trim() || DEFAULT_SUPABASE_ANON_KEY;
    reinitializeSupabase(cleanUrl, cleanKey);
    const next: AppSettings = {
      ...settings,
      supabaseUrl: cleanUrl,
      supabaseAnonKey: cleanKey,
      storageMode: enableSupabase ? 'supabase' : settings.storageMode,
    };
    await persistSettings(next);
  };

  const saveAIConfig = async (provider: AIProvider, apiKey: string) => {
    const next: AppSettings = {
      ...settings,
      aiProvider: provider,
      aiApiKey: apiKey.trim(),
    };
    await persistSettings(next);
  };

  const generateAnswer = async (prompt: string, systemPrompt?: string): Promise<string> => {
    return callAIWithSettings(prompt, systemPrompt);
  };

  const generateFlashcardsFromText = async (
    text: string
  ): Promise<Array<{ question: string; answer: string }>> => {
    const hasKey = !!settings.aiApiKey?.trim();
    if (hasKey) {
      const systemPrompt =
        'You are an educational flashcard generator. Respond ONLY with a valid JSON array of 5 to 8 flashcard objects, each having "question" and "answer" string properties. Do not include markdown code fences.';
      const raw = await callAIWithSettings(
        `Generate study flashcards from the following text:\n\n${text}`,
        systemPrompt
      );
      const cleaned = raw.replace(/```json|```/g, '').trim();
      const match = cleaned.match(/\[[\s\S]*\]/);
      const parsed = JSON.parse(match ? match[0] : cleaned);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed
          .filter((item) => item && item.question && item.answer)
          .map((item) => ({
            question: String(item.question).trim(),
            answer: String(item.answer).trim(),
          }));
      }
    }

    // Fallback local extraction when no API key is connected
    const sentences = text
      .split(/[.!?\n]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 20);

    if (sentences.length === 0) {
      return [
        {
          question: `What is the main topic of "${text.slice(0, 40)}"?`,
          answer: text.trim() || 'Key concept from study notes.',
        },
      ];
    }

    return sentences.slice(0, 5).map((sentence, idx) => ({
      question: `Key Concept #${idx + 1}: Explain the following point from your study material`,
      answer: sentence,
    }));
  };

  return (
    <SettingsContext.Provider
      value={{
        settings,
        isLoaded,
        switchStorageMode,
        saveSupabaseConfig,
        saveAIConfig,
        generateAnswer,
        generateFlashcardsFromText,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export const useSettings = () => useContext(SettingsContext);
