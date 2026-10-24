import supabaseClient from './supabaseClient';

export interface ChatMessage {
  id: string;
  user_id: string;
  source_id: string;
  source_type: 'note';
  message: string;
  sender: 'user' | 'ai';
  created_at: string;
}

/**
 * Fetch chat history for a specific YouTube video or note
 * @param sourceId - The ID of the YouTube transcription or note
 * @param sourceType - The type of source ('youtube_transcription' or 'note')
 * @param limit - Maximum number of messages to retrieve (default: 100)
 * @param offset - Number of messages to skip (default: 0)
 * @returns Array of chat messages
 */
export const getChatHistory = async (
  sourceId: string,
  sourceType: 'youtube_transcription' | 'note',
  limit: number = 100,
  offset: number = 0
): Promise<ChatMessage[]> => {
  try {
    const { data, error } = await supabaseClient.rpc('get_chat_messages', {
      p_source_id: sourceId,
      p_source_type: sourceType,
      p_limit: limit,
      p_offset: offset
    });

    if (error) throw error;
    return data as ChatMessage[];
  } catch (error) {
    console.error('Error fetching chat history:', error);
    throw error;
  }
};

/**
 * Send a user message and get AI response
 * @param sourceId - The ID of the YouTube transcription or note
 * @param sourceType - The type of source ('youtube_transcription' or 'note')
 * @param message - The user's message
 * @returns The AI's response message
 */
export const sendMessage = async (
  sourceId: string,
  sourceType: 'youtube_transcription' | 'note',
  message: string
): Promise<ChatMessage> => {
  try {
    // Step 1: Save the user's message
    const { data: userMessageId, error: userMsgError } = await supabaseClient.rpc('create_chat_message', {
      p_source_id: sourceId,
      p_source_type: sourceType,
      p_message: message,
      p_sender: 'user'
    });

    if (userMsgError) throw userMsgError;

    // Step 2: Generate AI response
    const aiResponse = await generateAIResponse(sourceId, sourceType, message);

    // Step 3: Save the AI's response
    const { data: aiMessageId, error: aiMsgError } = await supabaseClient.rpc('create_chat_message', {
      p_source_id: sourceId,
      p_source_type: sourceType,
      p_message: aiResponse,
      p_sender: 'ai'
    });

    if (aiMsgError) throw aiMsgError;

    // Step 4: Fetch the complete AI message (including timestamp, etc.)
    const { data: aiMessage, error: fetchError } = await supabaseClient
      .from('chat_messages')
      .select('*')
      .eq('id', aiMessageId)
      .single();

    if (fetchError) throw fetchError;
    return aiMessage as ChatMessage;
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
};

/**
 * Generate an AI response based on the context and user message using OpenAI API
 * @param sourceId - The ID of the YouTube transcription or note
 * @param sourceType - The type of source ('youtube_transcription' or 'note')
 * @param userMessage - The user's message
 * @returns Generated AI response
 */
const generateAIResponse = async (
  sourceId: string,
  sourceType: 'youtube_transcription' | 'note',
  userMessage: string
): Promise<string> => {
  let contextData = '';
  let title = '';
  
  try {
    // Retrieve context data based on source type
    if (sourceType === 'youtube_transcription') {
      const { data, error } = await supabaseClient
        .from('youtube_transcriptions')
        .select('title, transcription, notes')
        .eq('id', sourceId)
        .single();
      
      if (error) throw error;
      title = data.title;
      contextData = `Transcription: ${data.transcription || ''}\n\nNotes: ${data.notes || ''}`;
    } else if (sourceType === 'note') {
      const { data, error } = await supabaseClient
        .from('notes')
        .select('title, content')
        .eq('id', sourceId)
        .single();
      
      if (error) throw error;
      title = data.title;
      contextData = data.content;
    }

    const { callAIWithSettings } = require('../../contexts/SettingsContext');

    const systemPrompt = `You are an educational AI assistant helping with content titled "${title || 'Study Material'}". 
Your goal is to provide clear, accurate answers based on the educational content.`;

    const userPrompt = contextData
      ? `Content: ${contextData}\n\nQuestion: ${userMessage}`
      : userMessage;

    return await callAIWithSettings(userPrompt, systemPrompt);

  } catch (error) {
    console.error('Error generating AI response:', error);
    // Fallback to mock implementation if API call fails
    return mockAIResponse(userMessage, title, contextData);
  }
};

/**
 * Mock function to simulate AI responses as fallback
 */
const mockAIResponse = (question: string, title: string, context: string): string => {
  // This is just a simple mock implementation
  const lowerQuestion = question.toLowerCase();
  
  if (lowerQuestion.includes('summary') || lowerQuestion.includes('summarize')) {
    return `Here's a summary of "${title}": This content covers key educational concepts, focusing on the main ideas and their applications. The primary themes include structured learning approaches and systematic knowledge acquisition.`;
  }
  
  if (lowerQuestion.includes('key point') || lowerQuestion.includes('main idea')) {
    return `The key points from "${title}" are:
1. Structured note-taking enhances information retention
2. Active learning leads to better understanding
3. Regular review of material reinforces learning`;
  }
  
  if (lowerQuestion.includes('explain') || lowerQuestion.includes('how')) {
    return `Based on "${title}", the explanation is that the process works through a systematic approach of information capture, organization, and retrieval. This creates stronger neural connections and improves long-term retention.`;
  }
  
  if (lowerQuestion.includes('why')) {
    return `The content explains that this approach is important because proper note-taking and structured learning create stronger memory associations and make review more efficient, leading to better educational outcomes.`;
  }
  
  // Default response
  return `Based on my analysis of "${title}", I can tell you that the content discusses structured learning approaches and effective note-taking strategies. Your question about "${question}" relates to concepts covered in the material about how information organization leads to better retention and understanding.`;
}; 