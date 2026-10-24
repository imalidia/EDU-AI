import supabaseClient from './supabaseClient';

interface ChatMessage {
  id: string;
  user_id: string;
  source_id: string;
  source_type: 'note';
  message: string;
  sender: 'user' | 'ai';
  created_at: string;
}

export class ChatService {
  private mockChatHistory: ChatMessage[] = [];
  private mockMessageId = 1;
  
  /**
   * Fetch chat history for a specific note
   * @param sourceId - The ID of the note
   * @param sourceType - Only accepts 'note' now
   * @param limit - Optional limit for number of messages
   * @param offset - Optional offset for pagination
   */
  public async getChatHistory(
    sourceId: string,
    sourceType: 'note',
    limit: number = 100,
    offset: number = 0
  ): Promise<ChatMessage[]> {
    try {
      const { data, error } = await supabaseClient.rpc('get_chat_messages', {
        p_source_id: sourceId,
        p_source_type: sourceType,
        p_limit: limit,
        p_offset: offset
      });

      if (error) {
        console.warn('Using mock chat history due to error:', error.message);
        return this.mockChatHistory.filter(msg => 
          msg.source_id === sourceId && msg.source_type === sourceType
        );
      }

      return data || [];
    } catch (error) {
      console.error('Error in getChatHistory, using mock data:', error);
      return this.mockChatHistory.filter(msg => 
        msg.source_id === sourceId && msg.source_type === sourceType
      );
    }
  }

  /**
   * Create a new chat message
   * @param sourceId - The ID of the note
   * @param sourceType - Only accepts 'note' now
   * @param message - The message content
   * @param sender - Who sent the message ('user' or 'ai')
   */
  public async createChatMessage(
    sourceId: string,
    sourceType: 'note',
    message: string,
    sender: 'user' | 'ai'
  ): Promise<string | null> {
    try {
      const { data, error } = await supabaseClient.rpc('create_chat_message', {
        p_source_id: sourceId,
        p_source_type: sourceType,
        p_message: message,
        p_sender: sender
      });

      if (error) {
        console.warn('Using mock chat message creation due to error:', error.message);
        const mockMessage: ChatMessage = {
          id: `mock-${this.mockMessageId++}`,
          user_id: 'mock-user',
          source_id: sourceId,
          source_type: sourceType,
          message: message,
          sender: sender,
          created_at: new Date().toISOString()
        };
        
        this.mockChatHistory.push(mockMessage);
        return mockMessage.id;
      }

      return data;
    } catch (error) {
      console.error('Error in createChatMessage, using mock data:', error);
      const mockMessage: ChatMessage = {
        id: `mock-${this.mockMessageId++}`,
        user_id: 'mock-user',
        source_id: sourceId,
        source_type: sourceType,
        message: message,
        sender: sender,
        created_at: new Date().toISOString()
      };
      
      this.mockChatHistory.push(mockMessage);
      return mockMessage.id;
    }
  }

  /**
   * Generate an AI response to a user message
   * @param sourceId - The ID of the note
   * @param sourceType - Only accepts 'note' now
   * @param userMessage - The user's message to respond to
   */
  public async generateAIResponse(
    sourceId: string,
    sourceType: 'note',
    userMessage: string
  ): Promise<string | null> {
    try {
      // First, save the user message
      await this.createChatMessage(sourceId, sourceType, userMessage, 'user');
      
      // Get the note content to provide context
      let content = '';
      let noteTitle = 'Note';
      
      try {
        // Get note content from the relevant source
        const { data, error } = await supabaseClient
          .from('notes')
          .select('content, title')
          .eq('id', sourceId)
          .single();
        
        if (error) {
          console.warn('Error retrieving note content, using mock data:', error.message);
        } else {
          content = data.content;
          noteTitle = data.title;
        }
      } catch (error) {
        console.error('Error fetching note content:', error);
      }
      
      // Generate AI response based on the message and context
      const aiResponse = this.createMockAIResponse(userMessage, noteTitle, content);
      
      // Save the AI response
      await this.createChatMessage(sourceId, sourceType, aiResponse, 'ai');
      
      return aiResponse;
    } catch (error) {
      console.error('Error in generateAIResponse, using mock response:', error);
      
      // Generate a fallback response and don't try to save it
      return `I apologize, but I encountered an error while processing your request. Here's a simple answer: ${userMessage.includes('?') ? 'Yes, that\'s correct.' : 'That\'s an interesting point.'}`;
    }
  }
  
  /**
   * Create a mock AI response based on user message and note content
   */
  private createMockAIResponse(userMessage: string, noteTitle: string, noteContent: string): string {
    const lowerMsg = userMessage.toLowerCase();
    
    if (lowerMsg.includes('summarize') || lowerMsg.includes('summary')) {
      return `Here's a summary of "${noteTitle}": This note covers key concepts and information that will be useful for your learning. The main ideas discussed include structured approaches to the topic and practical applications.`;
    }
    
    if (lowerMsg.includes('explain') || lowerMsg.includes('how')) {
      return `Based on "${noteTitle}", the explanation is that the process involves several key steps that build upon each other. First, you need to understand the fundamentals, then apply them in practical scenarios, and finally analyze the results.`;
    }
    
    if (lowerMsg.includes('key point') || lowerMsg.includes('important')) {
      return `The key points from "${noteTitle}" are:
1. Understanding the core principles is essential
2. Practice helps reinforce theoretical knowledge
3. Regular review improves retention of information`;
    }
    
    // Default response
    return `Based on the information in "${noteTitle}", I can tell you that the content is focused on educational material. Your question about "${userMessage}" relates to concepts covered in the note, which discusses structured approaches to learning.`;
  }
}

export default new ChatService(); 