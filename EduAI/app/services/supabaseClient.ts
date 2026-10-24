import 'react-native-url-polyfill/auto';
import 'react-native-get-random-values';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const DEFAULT_SUPABASE_URL =
  process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://placeholder-project.supabase.co';
export const DEFAULT_SUPABASE_ANON_KEY =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

let currentStorageMode: 'local' | 'supabase' = 'local';
let currentUrl = DEFAULT_SUPABASE_URL;
let currentAnonKey = DEFAULT_SUPABASE_ANON_KEY;

export const getClientStorageMode = () => currentStorageMode;
export const setClientStorageMode = (mode: 'local' | 'supabase') => {
  currentStorageMode = mode;
};

// Error tracking interceptor
const errorLogger = {
  fetch: async (url: string, options?: RequestInit) => {
    try {
      const response = await fetch(url, options);
      if (!response.ok && currentStorageMode === 'supabase') {
        const clonedResponse = response.clone();
        try {
          const text = await clonedResponse.text();
          console.warn('Supabase API error:', {
            status: response.status,
            url,
            error: text.substring(0, 300),
          });
        } catch {
          // ignore parse error
        }
      }
      return response;
    } catch (error) {
      if (currentStorageMode === 'supabase') {
        console.warn('Supabase fetch error:', error);
      }
      throw error;
    }
  },
};

function buildClient(url: string, key: string): SupabaseClient {
  const safeUrl = url && url.startsWith('http') ? url.trim() : DEFAULT_SUPABASE_URL;
  const safeKey = key && key.trim().length > 0 ? key.trim() : DEFAULT_SUPABASE_ANON_KEY;
  return createClient(safeUrl, safeKey, {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
    global: {
      fetch: errorLogger.fetch as any,
    },
  });
}

let activeClient: SupabaseClient = buildClient(currentUrl, currentAnonKey);

export function reinitializeSupabase(url: string, anonKey: string): SupabaseClient {
  currentUrl = url.trim() || DEFAULT_SUPABASE_URL;
  currentAnonKey = anonKey.trim() || DEFAULT_SUPABASE_ANON_KEY;
  activeClient = buildClient(currentUrl, currentAnonKey);
  console.log('[Supabase] Reinitialized client with URL:', currentUrl);
  return activeClient;
}

export function getActiveSupabaseConfig() {
  return { url: currentUrl, anonKey: currentAnonKey, storageMode: currentStorageMode };
}

// Proxy so existing default imports always use the latest reinitialized client
const supabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop, receiver) {
    const value = Reflect.get(activeClient, prop, receiver);
    return typeof value === 'function' ? value.bind(activeClient) : value;
  },
});

export default supabaseClient;
export { supabaseClient };