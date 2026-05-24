import { renderHook, act } from '@testing-library/react-native';
import { useChat } from '../useChat';
import type { ChatCompletionClient, ChatCompletionRequest, ChatCompletionResponse } from '@shared/contracts/ChatCompletionClient';
import { ChatRateLimitError } from '@shared/contracts/ChatCompletionClient';

function makeClient(impl: (req: ChatCompletionRequest) => Promise<ChatCompletionResponse>): ChatCompletionClient {
  return { complete: impl };
}

describe('useChat', () => {
  it('starts with the welcome message', () => {
    const client = makeClient(() => Promise.resolve({ text: 'hi' }));
    const { result } = renderHook(() => useChat(client));
    expect(result.current.messages).toHaveLength(1);
    expect(result.current.messages[0].role).toBe('assistant');
  });

  it('adds user and assistant messages after sendMessage', async () => {
    const client = makeClient(() => Promise.resolve({ text: 'Stay safe!' }));
    const { result } = renderHook(() => useChat(client));

    await act(async () => {
      await result.current.sendMessage('Is Paris safe?');
    });

    expect(result.current.messages).toHaveLength(3);
    expect(result.current.messages[1].role).toBe('user');
    expect(result.current.messages[2].content).toBe('Stay safe!');
  });

  it('shows a user-friendly message on rate limit error', async () => {
    const client = makeClient(() => Promise.reject(new ChatRateLimitError('rate limited')));
    const { result } = renderHook(() => useChat(client));

    await act(async () => {
      await result.current.sendMessage('hello');
    });

    const last = result.current.messages[result.current.messages.length - 1];
    expect(last.role).toBe('assistant');
    expect(last.content).toMatch(/too many/i);
  });

  it('ignores empty messages', async () => {
    const client = makeClient(() => Promise.resolve({ text: 'hi' }));
    const { result } = renderHook(() => useChat(client));

    await act(async () => {
      await result.current.sendMessage('   ');
    });

    expect(result.current.messages).toHaveLength(1);
  });
});
