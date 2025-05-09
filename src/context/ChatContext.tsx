
import React, { createContext, useContext, useState, ReactNode } from 'react';

export type MessageType = {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
};

export type ChannelType = {
  id: string;
  name: string;
  description: string;
  messages: MessageType[];
};

type ChatContextType = {
  activeChannel: string;
  channels: ChannelType[];
  setActiveChannel: (channelId: string) => void;
  addMessage: (channelId: string, content: string, role: 'user' | 'assistant') => void;
};

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider = ({ children }: { children: ReactNode }) => {
  const [channels, setChannels] = useState<ChannelType[]>([
    {
      id: 'channel-1',
      name: 'Social Media',
      description: 'Generate content for social media campaigns',
      messages: [
        {
          id: 'msg-1-1',
          content: 'Welcome to the Social Media channel! Here you can get help with creating engaging posts, ads, and campaign ideas for platforms like Facebook, Instagram, Twitter, and LinkedIn.',
          role: 'assistant',
          timestamp: new Date()
        }
      ]
    },
    {
      id: 'channel-2',
      name: 'Blog Content',
      description: 'Create blog posts and articles',
      messages: [
        {
          id: 'msg-2-1',
          content: 'Welcome to the Blog Content channel! Here you can get help with drafting articles, blog posts, SEO optimization, and content planning for your website or publication.',
          role: 'assistant',
          timestamp: new Date()
        }
      ]
    },
    {
      id: 'channel-3',
      name: 'Email Marketing',
      description: 'Design email campaigns and newsletters',
      messages: [
        {
          id: 'msg-3-1',
          content: 'Welcome to the Email Marketing channel! Here you can get help with crafting newsletters, drip campaigns, subject lines, and other email marketing content that converts.',
          role: 'assistant',
          timestamp: new Date()
        }
      ]
    }
  ]);
  
  const [activeChannel, setActiveChannel] = useState<string>('channel-1');

  const addMessage = (channelId: string, content: string, role: 'user' | 'assistant') => {
    setChannels(prevChannels => 
      prevChannels.map(channel => {
        if (channel.id === channelId) {
          return {
            ...channel,
            messages: [
              ...channel.messages,
              {
                id: `msg-${Date.now()}`,
                content,
                role,
                timestamp: new Date()
              }
            ]
          };
        }
        return channel;
      })
    );
  };

  return (
    <ChatContext.Provider value={{ activeChannel, channels, setActiveChannel, addMessage }}>
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
