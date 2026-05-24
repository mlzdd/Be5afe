import React, { useMemo } from 'react';
import { useNavigation } from '@react-navigation/native';
import { createChatClient } from '@infra/ai/gemini';
import { ChatScreen } from '@modules/chat/ChatScreen';

export function ChatAppScreen() {
  const navigation = useNavigation();
  const client = useMemo(() => createChatClient(), []);
  return <ChatScreen client={client} onClose={() => navigation.goBack()} />;
}
