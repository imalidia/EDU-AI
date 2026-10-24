import supabaseClient from './supabaseClient';
import { Alert } from 'react-native';

/**
 * Service to initialize and validate database schema
 */
export class DatabaseInitService {
  private initialized = false;

  /**
   * Initialize the database schema if needed
   */
  async initializeDatabase() {
    if (this.initialized) {
      console.log('[DatabaseInit] Database already initialized');
      return;
    }

    console.log('[DatabaseInit] Checking database tables...');
    try {
      // Check if the youtube_processing_jobs table exists
      await this.ensureYouTubeJobsTable();
      
      // Check if notes table exists
      await this.ensureNotesTable();
      
      this.initialized = true;
      console.log('[DatabaseInit] Database initialization complete');
    } catch (error) {
      console.error('[DatabaseInit] Failed to initialize database:', error);
      // Don't throw - let the app continue with possible degraded functionality
    }
  }

  /**
   * Ensure the youtube_processing_jobs table exists
   */
  private async ensureYouTubeJobsTable() {
    try {
      // Check if table exists by querying it
      const { error } = await supabaseClient
        .from('youtube_processing_jobs')
        .select('id')
        .limit(1);
      
      if (error) {
        console.warn('[DatabaseInit] Error checking youtube_processing_jobs table:', error);
        
        // If error is that the table doesn't exist, try to create it
        if (error.message.includes('does not exist')) {
          await this.createYouTubeJobsTable();
        }
      } else {
        console.log('[DatabaseInit] youtube_processing_jobs table exists');
      }
    } catch (error) {
      console.error('[DatabaseInit] Unexpected error checking youtube_processing_jobs table:', error);
      throw error;
    }
  }

  /**
   * Create the youtube_processing_jobs table
   */
  private async createYouTubeJobsTable() {
    console.log('[DatabaseInit] Creating youtube_processing_jobs table...');
    
    try {
      // Use RPC to create the table (requires proper permissions)
      const { error } = await supabaseClient.rpc('create_youtube_jobs_table');
      
      if (error) {
        console.error('[DatabaseInit] Failed to create youtube_processing_jobs table:', error);
        Alert.alert(
          'Database Setup Error',
          'Could not create required database tables. Some features may not work correctly.'
        );
      } else {
        console.log('[DatabaseInit] youtube_processing_jobs table created successfully');
      }
    } catch (error) {
      console.error('[DatabaseInit] Error in createYouTubeJobsTable:', error);
      throw error;
    }
  }

  /**
   * Ensure the notes table exists
   */
  private async ensureNotesTable() {
    try {
      // Check if table exists by querying it
      const { error } = await supabaseClient
        .from('notes')
        .select('id')
        .limit(1);
      
      if (error) {
        console.warn('[DatabaseInit] Error checking notes table:', error);
        
        // If error is that the table doesn't exist, try to create it
        if (error.message.includes('does not exist')) {
          await this.createNotesTable();
        }
      } else {
        console.log('[DatabaseInit] notes table exists');
      }
    } catch (error) {
      console.error('[DatabaseInit] Unexpected error checking notes table:', error);
      throw error;
    }
  }

  /**
   * Create the notes table
   */
  private async createNotesTable() {
    console.log('[DatabaseInit] Creating notes table...');
    
    try {
      // Use RPC to create the table (requires proper permissions)
      const { error } = await supabaseClient.rpc('create_notes_table');
      
      if (error) {
        console.error('[DatabaseInit] Failed to create notes table:', error);
        Alert.alert(
          'Database Setup Error',
          'Could not create required database tables. Some features may not work correctly.'
        );
      } else {
        console.log('[DatabaseInit] notes table created successfully');
      }
    } catch (error) {
      console.error('[DatabaseInit] Error in createNotesTable:', error);
      throw error;
    }
  }
}

// Create a singleton instance
const databaseInitService = new DatabaseInitService();

export default databaseInitService; 