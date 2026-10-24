import supabaseClient from './supabaseClient';

/**
 * Service to initialize database tables and default data
 */
export class DatabaseInitService {
  private initialized = false;
  
  /**
   * Initialize all necessary database tables and structures
   */
  public async initialize() {
    if (this.initialized) {
      console.log('[DatabaseInit] Already initialized');
      return;
    }
    
    this.initialized = true;
    
    try {
      console.log('[DatabaseInit] Starting database initialization...');
      
      // Check if users table exists
      await this.ensureUsersTable();
      
      // Check if notes table exists
      await this.ensureNotesTable();
      
      // Check if flashcards table exists
      await this.ensureFlashcardsTable();
      
      console.log('[DatabaseInit] Database initialization completed successfully.');
    } catch (error) {
      console.error('[DatabaseInit] Error during database initialization:', error);
      console.log('[DatabaseInit] Using local storage fallback for data persistence');
    }
  }
  
  /**
   * Ensure the users table exists
   */
  private async ensureUsersTable() {
    try {
      const { error } = await supabaseClient.from('users').select('id').limit(1);
      
      if (error) {
        console.warn('[DatabaseInit] Error checking users table:', error.message);
        // Don't try to create table if there's an error other than table not existing
        if (error.message.includes('does not exist')) {
          await this.createUsersTable();
        }
      } else {
        console.log('[DatabaseInit] Users table exists');
      }
    } catch (error) {
      console.error('[DatabaseInit] Unexpected error checking users table:', error);
    }
  }
  
  /**
   * Create the users table
   */
  private async createUsersTable() {
    try {
      console.log('[DatabaseInit] Creating users table...');
      const { error } = await supabaseClient.rpc('create_users_table');
      
      if (error) {
        console.error('[DatabaseInit] Failed to create users table:', error.message);
      } else {
        console.log('[DatabaseInit] Users table created successfully');
      }
    } catch (error) {
      console.error('[DatabaseInit] Error in createUsersTable:', error);
    }
  }
  
  /**
   * Ensure the notes table exists
   */
  private async ensureNotesTable() {
    try {
      const { error } = await supabaseClient.from('notes').select('id').limit(1);
      
      if (error) {
        console.warn('[DatabaseInit] Error checking notes table:', error.message);
        // Don't try to create table if there's an error other than table not existing
        if (error.message.includes('does not exist')) {
          await this.createNotesTable();
        }
      } else {
        console.log('[DatabaseInit] Notes table exists');
      }
    } catch (error) {
      console.error('[DatabaseInit] Unexpected error checking notes table:', error);
    }
  }
  
  /**
   * Create the notes table
   */
  private async createNotesTable() {
    try {
      console.log('[DatabaseInit] Creating notes table...');
      const { error } = await supabaseClient.rpc('create_notes_table');
      
      if (error) {
        console.error('[DatabaseInit] Failed to create notes table:', error.message);
      } else {
        console.log('[DatabaseInit] Notes table created successfully');
      }
    } catch (error) {
      console.error('[DatabaseInit] Error in createNotesTable:', error);
    }
  }
  
  /**
   * Ensure the flashcards table exists
   */
  private async ensureFlashcardsTable() {
    try {
      const { error } = await supabaseClient.from('flashcards').select('id').limit(1);
      
      if (error) {
        console.warn('[DatabaseInit] Error checking flashcards table:', error.message);
        // Don't try to create table if there's an error other than table not existing
        if (error.message.includes('does not exist')) {
          await this.createFlashcardsTable();
        }
      } else {
        console.log('[DatabaseInit] Flashcards table exists');
      }
    } catch (error) {
      console.error('[DatabaseInit] Unexpected error checking flashcards table:', error);
    }
  }
  
  /**
   * Create the flashcards table
   */
  private async createFlashcardsTable() {
    try {
      console.log('[DatabaseInit] Creating flashcards table...');
      const { error } = await supabaseClient.rpc('create_flashcards_table');
      
      if (error) {
        console.error('[DatabaseInit] Failed to create flashcards table:', error.message);
      } else {
        console.log('[DatabaseInit] Flashcards table created successfully');
      }
    } catch (error) {
      console.error('[DatabaseInit] Error in createFlashcardsTable:', error);
    }
  }
}

// Export a singleton instance
export default new DatabaseInitService(); 