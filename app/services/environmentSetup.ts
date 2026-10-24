// Environment setup service
import { Platform } from 'react-native';

/**
 * Service to manage environment variables and setup
 */
export class EnvironmentSetupService {
  public OPENAI_API_KEY: string;
  public SUPABASE_URL: string;
  public SUPABASE_ANON_KEY: string;

  constructor() {
    // Initialize environment variables
    this.OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY || '';
    this.SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
    this.SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

    // Debug variables in dev mode
    if (__DEV__) {
      this.logEnvironmentInfo();
    }
  }

  /**
   * Log environment info
   */
  private logEnvironmentInfo() {
    console.log('=== Environment Info ===');
    console.log('Platform:', Platform.OS);
    console.log('Dev mode:', __DEV__ ? 'enabled' : 'disabled');
    
    // Check OpenAI API Key
    if (!this.OPENAI_API_KEY) {
      console.warn('⚠️ OPENAI_API_KEY is not set');
    } else {
      console.log('✓ OPENAI_API_KEY is set');
    }
    
    // Check Supabase environment variables
    if (!this.SUPABASE_URL || !this.SUPABASE_ANON_KEY) {
      console.warn('⚠️ Supabase configuration is incomplete');
    } else {
      console.log('✓ Supabase configuration is complete');
    }

    console.log('=== End Environment Info ===');
  }
}

export default new EnvironmentSetupService(); 