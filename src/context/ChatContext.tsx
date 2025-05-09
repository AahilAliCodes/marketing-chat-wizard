
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from './AuthContext';
import { getUserChannels, getFullChannel, saveChatChannel } from '@/services/ChatService';
import { useToast } from '@/hooks/use-toast';

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
  loadUserChannels: () => Promise<void>;
  saveCurrentChannel: () => Promise<string | undefined>;
  createNewChannel: (name: string, description: string) => void;
  isLoading: boolean;
};

const defaultChannels: ChannelType[] = [
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
];

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider = ({ children }: { children: ReactNode }) => {
  const [channels, setChannels] = useState<ChannelType[]>(defaultChannels);
  const [activeChannel, setActiveChannel] = useState<string>('channel-1');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { user } = useAuth();
  const { toast } = useToast();

  // Load user channels when they log in
  useEffect(() => {
    if (user) {
      loadUserChannels();
    }
  }, [user]);

  const loadUserChannels = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const userChannels = await getUserChannels();
      
      if (userChannels && userChannels.length > 0) {
        // Load the first channel with its messages
        const fullChannel = await getFullChannel(userChannels[0].id);
        
        // Create a new array with the user's saved channels + default channels
        const updatedChannels = [...defaultChannels];
        
        // Add the first channel with full messages
        updatedChannels.unshift(fullChannel);
        
        setChannels(updatedChannels);
        setActiveChannel(fullChannel.id);
      }
    } catch (error) {
      console.error('Error loading user channels:', error);
      toast({
        variant: "destructive",
        title: "Error loading channels",
        description: "There was a problem loading your saved chats."
      });
    } finally {
      setIsLoading(false);
    }
  };

  const addMessage = (channelId: string, content: string, role: 'user' | 'assistant') => {
    setChannels(prevChannels => 
      prevChannels.map(channel => {
        if (channel.id === channelId) {
          return {
            ...channel,
            messages: [
              ...channel.messages,
              {
                id: `msg-${uuidv4()}`,
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

  const saveCurrentChannel = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to save chats"
      });
      return undefined;
    }

    const currentChannel = channels.find(c => c.id === activeChannel);
    if (!currentChannel) return undefined;

    setIsLoading(true);
    try {
      const channelId = await saveChatChannel(currentChannel);
      toast({
        title: "Chat saved",
        description: "Your chat has been saved successfully"
      });
      return channelId;
    } catch (error) {
      console.error('Error saving channel:', error);
      toast({
        variant: "destructive",
        title: "Error saving chat",
        description: "There was a problem saving your chat"
      });
      return undefined;
    } finally {
      setIsLoading(false);
    }
  };

  const createNewChannel = (name: string, description: string) => {
    const newChannel: ChannelType = {
      id: `channel-${uuidv4()}`,
      name,
      description,
      messages: [
        {
          id: `msg-${uuidv4()}`,
          content: `Welcome to the ${name} channel! How can I help you with ${description.toLowerCase()}?`,
          role: 'assistant',
          timestamp: new Date()
        }
      ]
    };

    setChannels(prev => [newChannel, ...prev]);
    setActiveChannel(newChannel.id);
  };

  return (
    <ChatContext.Provider value={{ 
      activeChannel, 
      channels, 
      setActiveChannel, 
      addMessage,
      loadUserChannels,
      saveCurrentChannel,
      createNewChannel,
      isLoading
    }}>
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
