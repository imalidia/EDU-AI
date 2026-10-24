import 'react-native-url-polyfill/auto';
import 'react-native-get-random-values';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Define your Supabase URL and anon key
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://placeholder-project.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

console.log('Initializing real Supabase client with URL:', supabaseUrl);

// Error tracking interceptor
const errorLogger = {
  fetch: async (url: string, options?: RequestInit) => {
    try {
      const response = await fetch(url, options);
      
      // If response isn't ok, log the error for debugging
      if (!response.ok) {
        const clonedResponse = response.clone();
        try {
          const text = await clonedResponse.text();
          console.error('Supabase API error:', {
            status: response.status,
            url,
            error: text.substring(0, 500)
          });
        } catch (parseError) {
          console.error('Error parsing error response:', parseError);
        }
      }
      
      return response;
    } catch (error) {
      console.error('Supabase fetch error:', error);
      throw error;
    }
  }
};

// Create the Supabase client
const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
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

console.log('Supabase client initialized');

// Export default
export default supabaseClient;

// Named export
export { supabaseClient }; 