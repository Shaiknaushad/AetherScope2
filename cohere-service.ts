import { CohereClient } from 'cohere-ai';

// Load environment variables
import * as dotenv from 'dotenv';
dotenv.config();

const cohere = new CohereClient({
  token: process.env.COHERE_API_KEY,
});

export interface ExtractedTriplet {
  subject: string;
  predicate: string;
  object: string;
  confidence: number;
}

export interface TripletExtractionResult {
  triplets: ExtractedTriplet[];
  summary: string;
  agent: string;
}

export async function extractTripletsFromText(text: string): Promise<TripletExtractionResult> {
  try {
    // Validate the API key is available
    if (!process.env.COHERE_API_KEY?.trim()) {
      throw new Error('Cohere API key not configured');
    }

    const prompt = `
You are an expert knowledge graph extractor. Analyze the following log file content and extract meaningful triplets (subject-predicate-object relationships) from it.

Log content:
${text.substring(0, 4000)} ${text.length > 4000 ? '...(truncated)' : ''}

Please provide:
1. A list of triplets in the format: subject | predicate | object
2. A brief summary of what this log represents
3. An appropriate agent name for this data source

Format your response as JSON:
{
  "triplets": [
    {"subject": "example", "predicate": "relationship", "object": "target", "confidence": 0.9}
  ],
  "summary": "Brief description of the log content",
  "agent": "LogAnalyzer"
}

Extract only meaningful, factual relationships. Focus on entities, actions, and their relationships.
`;

    console.log('Making Cohere API request...');
    const response = await cohere.generate({
      model: 'command',
      prompt: prompt,
      maxTokens: 1000,
      temperature: 0.3,
    });

    const generatedText = response.generations[0]?.text || '';
    console.log('Cohere response received:', generatedText.substring(0, 200));
    
    // Try to parse the JSON response
    try {
      // Clean the response to extract JSON
      const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
      const jsonText = jsonMatch ? jsonMatch[0] : generatedText;
      const parsed = JSON.parse(jsonText);
      
      return {
        triplets: parsed.triplets || [],
        summary: parsed.summary || 'Log analysis summary',
        agent: parsed.agent || 'CohereExtractor'
      };
    } catch (parseError) {
      console.error('JSON parsing failed:', parseError);
      // If JSON parsing fails, create a basic response
      return {
        triplets: [{
          subject: 'log_file',
          predicate: 'contains',
          object: 'system_events',
          confidence: 0.8
        }],
        summary: 'Log file processed - JSON parsing failed',
        agent: 'CohereExtractor'
      };
    }
  } catch (error) {
    console.error('Error extracting triplets:', error);
    throw new Error(`Failed to extract triplets from text: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function generateSummary(text: string): Promise<string> {
  try {
    const response = await cohere.generate({
      model: 'command',
      prompt: `Provide a brief, one-sentence summary of the following log content:\n\n${text}`,
      maxTokens: 100,
      temperature: 0.2,
    });

    return response.generations[0]?.text?.trim() || 'Log file summary';
  } catch (error) {
    console.error('Error generating summary:', error);
    return 'Log file summary';
  }
}