export interface ChatCompletionRequest {
  message: string;
  systemPrompt?: string;
  timeoutMs?: number;
  maxRetries?: number;
}

export interface ChatCompletionResponse {
  text: string;
}

// Typed domain errors — callers never see vendor error codes
export class ChatNetworkError extends Error {
  readonly type = 'network' as const;
}
export class ChatRateLimitError extends Error {
  readonly type = 'rate_limit' as const;
}
export class ChatAuthError extends Error {
  readonly type = 'auth' as const;
}
export class ChatTimeoutError extends Error {
  readonly type = 'timeout' as const;
}

export type ChatError =
  | ChatNetworkError
  | ChatRateLimitError
  | ChatAuthError
  | ChatTimeoutError;

export interface ChatCompletionClient {
  complete(request: ChatCompletionRequest): Promise<ChatCompletionResponse>;
}
