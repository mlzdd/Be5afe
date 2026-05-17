import { useState, useCallback } from 'react';
import {
  ChatCompletionClient,
  ChatRateLimitError,
  ChatAuthError,
  ChatTimeoutError,
} from '@shared/contracts/ChatCompletionClient';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const WELCOME_MESSAGE: ChatMessage = {
  id: 'welcome',
  role: 'assistant',
  content: "Hi! I'm your BE5 Travel Assistant. Ask me anything about travel safety, emergency procedures, or local information.",
  timestamp: new Date(),
};

function errorToUserMessage(err: unknown): string {
  if (err instanceof ChatRateLimitError) {
    return "I've received too many questions right now. Please try again in a moment.";
  }
  if (err instanceof ChatAuthError) {
    return "There's a configuration issue with the AI service. Please contact support.";
  }
  if (err instanceof ChatTimeoutError) {
    return "The request took too long. Please try a shorter question.";
  }
  return "I'm having trouble responding right now. Please try again in a moment.";
}

export function useChat(client: ChatCompletionClient, systemPrompt?: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
  const [isTyping, setIsTyping] = useState(false);

  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: trimmed,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsTyping(true);

    try {
      const response = await client.complete({ message: trimmed, systemPrompt });
      setMessages((prev) => [
        ...prev,
        { id: `assistant-${Date.now()}`, role: 'assistant', content: response.text, timestamp: new Date() },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { id: `assistant-${Date.now()}`, role: 'assistant', content: errorToUserMessage(err), timestamp: new Date() },
      ]);
    } finally {
      setIsTyping(false);
    }
  }, [client, systemPrompt]);

  return { messages, isTyping, sendMessage };
}
