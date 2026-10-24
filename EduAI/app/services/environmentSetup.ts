import { Platform } from 'react-native';

/**
 * Environment variable validation and setup
 */
class EnvironmentSetup {
  public OPENAI_API_KEY: string;
  public YOUTUBE_API_KEY: string;
  public SUPABASE_URL: string;
  public SUPABASE_ANON_KEY: string;
  public IS_DEV: boolean;
  
  constructor() {
    this.OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY || '';
    this.YOUTUBE_API_KEY = process.env.EXPO_PUBLIC_YOUTUBE_API_KEY || '';
    this.SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
    this.SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';
    this.IS_DEV = process.env.NODE_ENV !== 'production';
    
    this.validateEnvironment();
  }
  
  private validateEnvironment() {
    console.log('Environment validation starting...');
    
    // Log platform info
    console.log(`Platform: ${Platform.OS} (${Platform.Version})`);
    
    // Check OpenAI API Key
    if (!this.OPENAI_API_KEY) {
      console.warn('⚠️ OPENAI_API_KEY is not set');
    } else {
      console.log('✓ OPENAI_API_KEY is set, length:', this.OPENAI_API_KEY.length);
      // Checking if the key format looks valid (starts with "sk-")
      if (!this.OPENAI_API_KEY.startsWith('sk-')) {
        console.warn('⚠️ OPENAI_API_KEY does not appear to be in the correct format (should start with "sk-")');
      }
    }
    
    // Check YouTube API Key
    if (!this.YOUTUBE_API_KEY) {
      console.warn('⚠️ YOUTUBE_API_KEY is not set');
    } else {
      console.log('✓ YOUTUBE_API_KEY is set');
    }
    
    // Check Supabase credentials
    if (!this.SUPABASE_URL) {
      console.warn('⚠️ SUPABASE_URL is not set');
    } else {
      console.log('✓ SUPABASE_URL is set');
    }
    
    if (!this.SUPABASE_ANON_KEY) {
      console.warn('⚠️ SUPABASE_ANON_KEY is not set');
    } else {
      console.log('✓ SUPABASE_ANON_KEY is set');
    }
    
    console.log('Environment validation complete');
  }
  
  /**
   * Get a redacted version of a key for logging
   * @param key The API key to redact
   * @returns A redacted version showing only the first and last few characters
   */
  public redactKey(key: string): string {
    if (!key) return 'undefined';
    if (key.length < 8) return '***';
    
    return `${key.substring(0, 3)}...${key.substring(key.length - 3)}`;
  }
}

// Create and export a singleton instance
const env = new EnvironmentSetup();
export default env; 