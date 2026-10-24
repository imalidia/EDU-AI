import axios from 'axios';
import * as fs from 'fs';
import FormData from 'form-data';
import * as dotenv from 'dotenv';
import { TranscriptionResult } from '../types';

// Load environment variables
dotenv.config();

class TranscriptionService {
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.DEEPSEEK_API_KEY || '';
    if (!this.apiKey) {
      console.warn('WARNING: DEEPSEEK_API_KEY not set in environment variables');
    }
  }

  /**
   * Transcribe audio file using DeepSeek API
   * @param audioFilePath Path to the audio file
   * @returns Transcription text
   */
  public async transcribeAudio(audioFilePath: string): Promise<string> {
    try {
      // Check if file exists
      if (!fs.existsSync(audioFilePath)) {
        throw new Error(`Audio file not found: ${audioFilePath}`);
      }

      // Create form data
      const formData = new FormData();
      formData.append('file', fs.createReadStream(audioFilePath));
      formData.append('model', 'deepseek-whisper');
      
      // Send request to DeepSeek API
      const response = await axios.post(
        'https://api.deepseek.com/v1/audio/transcriptions',
        formData,
        {
          headers: {
            ...formData.getHeaders(),
            'Authorization': `Bearer ${this.apiKey}`,
          },
        }
      );

      // Return transcription text
      return response.data.text;
    } catch (error: any) {
      // Handle different error types
      if (error.response) {
        // API responded with error
        const status = error.response.status;
        if (status === 401) {
          throw new Error('Invalid DeepSeek API key');
        } else if (status === 429) {
          throw new Error('DeepSeek API rate limit exceeded');
        } else {
          throw new Error(`DeepSeek API error: ${error.response.data.error || 'Unknown error'}`);
        }
      } else if (error.request) {
        // No response received
        throw new Error('No response from DeepSeek API');
      } else {
        // Error in making the request
        throw new Error(`Error transcribing audio: ${error.message}`);
      }
    }
  }

  /**
   * Generate educational notes from transcription text
   * @param transcription The transcription text
   * @param title Optional title for context
   * @returns Structured educational notes
   */
  public async generateNotes(transcription: string, title?: string): Promise<any> {
    try {
      if (!transcription || transcription.trim() === '') {
        throw new Error('Transcription text is empty');
      }

      // Build prompt for educational notes generation
      const prompt = this.buildNotesPrompt(transcription, title);

      // Send request to DeepSeek API
      const response = await axios.post(
        'https://api.deepseek.com/v1/chat/completions',
        {
          model: 'deepseek-chat',
          messages: [
            {
              role: 'system',
              content: 'You are an educational assistant that creates well-structured study notes.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.2,
          response_format: { type: 'json_object' }
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`
          }
        }
      );

      // Parse the response
      const content = response.data.choices[0].message.content;
      return this.parseNotesResponse(content);
    } catch (error: any) {
      // Handle different error types
      if (error.response) {
        // API responded with error
        const status = error.response.status;
        if (status === 401) {
          throw new Error('Invalid DeepSeek API key');
        } else if (status === 429) {
          throw new Error('DeepSeek API rate limit exceeded');
        } else {
          throw new Error(`DeepSeek API error: ${error.response.data.error || 'Unknown error'}`);
        }
      } else if (error.request) {
        // No response received
        throw new Error('No response from DeepSeek API');
      } else {
        // Error in making the request
        throw new Error(`Error generating notes: ${error.message}`);
      }
    }
  }

  /**
   * Process audio file to transcription and then generate educational notes
   * @param audioFilePath Path to the audio file
   * @param title Optional title for context
   * @returns Transcription and notes
   */
  public async processAudioToNotes(audioFilePath: string, title?: string): Promise<TranscriptionResult> {
    try {
      // First transcribe the audio
      const transcription = await this.transcribeAudio(audioFilePath);
      
      // Then generate notes from the transcription
      const notes = await this.generateNotes(transcription, title);
      
      return {
        transcription,
        notes
      };
    } catch (error: any) {
      throw new Error(`Error processing audio to notes: ${error.message}`);
    }
  }

  /**
   * Build detailed prompt for notes generation
   * @private
   */
  private buildNotesPrompt(transcription: string, title?: string): string {
    return `
Create comprehensive educational notes from the following transcription ${title ? `of "${title}"` : ''}:

${transcription}

Format the notes as a JSON object with the following structure:
{
  "title": "A descriptive title for these notes",
  "summary": "A concise summary of the main topic (2-3 sentences)",
  "keyPoints": ["Key point 1", "Key point 2", ...],
  "sections": [
    {
      "title": "Section title",
      "content": "Detailed explanation of this section"
    },
    ...
  ],
  "vocabulary": [
    {
      "term": "Important term",
      "definition": "Definition of the term"
    },
    ...
  ],
  "reviewQuestions": [
    "Question 1?",
    "Question 2?",
    ...
  ]
}

Make sure the notes are:
1. Well-structured and organized logically
2. Comprehensive but concise
3. Include all important concepts from the transcription
4. Include 5-10 key points
5. Include 3-7 sections
6. Include at least 5 vocabulary terms if relevant
7. Include 3-5 review questions

Respond ONLY with valid JSON that matches the specified structure.
`;
  }

  /**
   * Parse the notes response from the AI
   * @private
   */
  private parseNotesResponse(response: string): any {
    try {
      // If the response is already a parsed object, return it
      if (typeof response === 'object') {
        return response;
      }

      // Try to parse the response as JSON
      return JSON.parse(response);
    } catch (error) {
      // If parsing fails, search for JSON in the response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          return JSON.parse(jsonMatch[0]);
        } catch {
          throw new Error('Failed to parse notes response');
        }
      } else {
        throw new Error('Failed to parse notes response');
      }
    }
  }
}

export default TranscriptionService; 