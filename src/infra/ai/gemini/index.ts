import { GeminiClient } from './GeminiClient';
import { MockChatClient } from './MockChatClient';
import type { ChatCompletionClient } from '@shared/contracts/ChatCompletionClient';

const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY ?? '';

// Use real client when key is present, mock otherwise.
// In production builds the key must be set.
export function createChatClient(): ChatCompletionClient {
  if (apiKey) {
    return new GeminiClient({ apiKey });
  }
  if (__DEV__) {
    console.warn('EXPO_PUBLIC_GEMINI_API_KEY not set — using mock chat client');
    return new MockChatClient();
  }
  throw new Error('EXPO_PUBLIC_GEMINI_API_KEY is required in production');
}
