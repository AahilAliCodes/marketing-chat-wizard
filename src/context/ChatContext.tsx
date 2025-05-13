
import React, { createContext, useContext, ReactNode } from 'react';
import { useChatOperations } from '@/hooks/useChatOperations';
import { ChannelType, MessageType } from '@/types/chat';

type ChatContextType = {
  activeChannel: string;
  channels: ChannelType[];
  setActiveChannel: (channelId: string) => void;
  addMessage: (channelId: string, content: string, role: 'user' | 'assistant') => void;
  loadUserChannels: () => Promise<void>;
  saveCurrentChannel: () => Promise<string | undefined>;
  createNewChannel: (name: string, description: string) => void;
  isLoading: boolean;
};

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider = ({ children }: { children: ReactNode }) => {
  const chatOps = useChatOperations();
  
  // The useEffect for loading user channels is now handled in useChatOperations
  
  return (
    <ChatContext.Provider value={chatOps}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};
