import React, { useMemo } from 'react';
import { useNavigation } from '@react-navigation/native';
import { MockChatClient } from '@infra/ai/gemini/MockChatClient';
import { ChatScreen } from '@modules/chat/ChatScreen';

const client = new MockChatClient();

export function ChatAppScreen() {
  const navigation = useNavigation();
  return <ChatScreen client={client} onClose={() => navigation.goBack()} />;
}
