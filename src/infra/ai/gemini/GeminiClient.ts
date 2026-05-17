import {
  ChatCompletionClient,
  ChatCompletionRequest,
  ChatCompletionResponse,
  ChatNetworkError,
  ChatRateLimitError,
  ChatAuthError,
  ChatTimeoutError,
  type ChatError,
} from '@shared/contracts/ChatCompletionClient';

const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models';
const DEFAULT_MODEL = 'gemini-2.5-flash';
const DEFAULT_MAX_TOKENS = 500;
const DEFAULT_TIMEOUT_MS = 10_000;

export interface GeminiClientConfig {
  apiKey: string;
  model?: string;
  maxTokens?: number;
}

export class GeminiClient implements ChatCompletionClient {
  private readonly apiKey: string;
  private readonly model: string;
  private readonly maxTokens: number;

  constructor(config: GeminiClientConfig) {
    this.apiKey = config.apiKey;
    this.model = config.model ?? DEFAULT_MODEL;
    this.maxTokens = config.maxTokens ?? DEFAULT_MAX_TOKENS;
  }

  async complete(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    const { message, systemPrompt, timeoutMs = DEFAULT_TIMEOUT_MS, maxRetries = 1 } = request;

    const prompt = systemPrompt ? `${systemPrompt}\n\nUser: ${message}` : message;
    const url = `${API_URL}/${this.model}:generateContent?key=${this.apiKey}`;

    const body = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.7, maxOutputTokens: this.maxTokens },
    };

    return this.fetchWithRetry(url, body, timeoutMs, maxRetries);
  }

  private async fetchWithRetry(
    url: string,
    body: object,
    timeoutMs: number,
    retriesLeft: number
  ): Promise<ChatCompletionResponse> {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);

      let response: Response;
      try {
        response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timer);
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        this.throwVendorError(response.status, JSON.stringify(errorData));
      }

      const data = await response.json();
      const text: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

      if (!text.trim()) {
        throw new ChatNetworkError('Empty response from Gemini');
      }

      return { text: text.trim() };
    } catch (err) {
      if (err instanceof ChatRateLimitError || err instanceof ChatAuthError) {
        throw err; // Don't retry auth/rate limit errors
      }
      if (retriesLeft > 0) {
        await new Promise((r) => setTimeout(r, 1000));
        return this.fetchWithRetry(url, body, timeoutMs, retriesLeft - 1);
      }
      throw this.translateError(err);
    }
  }

  private throwVendorError(status: number, body: string): never {
    if (status === 429) throw new ChatRateLimitError('Gemini rate limit exceeded');
    if (status === 401 || status === 403) throw new ChatAuthError(`Gemini auth error: ${status}`);
    throw new ChatNetworkError(`Gemini API error ${status}: ${body}`);
  }

  private translateError(err: unknown): ChatError {
    if (
      err instanceof ChatNetworkError ||
      err instanceof ChatRateLimitError ||
      err instanceof ChatAuthError ||
      err instanceof ChatTimeoutError
    ) {
      return err;
    }
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes('aborted') || message.includes('timeout')) {
      return new ChatTimeoutError('Request timed out');
    }
    return new ChatNetworkError(message);
  }
}
