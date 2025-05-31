
import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { getUserChannels, getFullChannel, saveChatChannel } from '@/services/ChatService';
import { ChannelType } from '@/types/chat';
import { defaultChannels } from '@/data/defaultChannels';

export const useChatOperations = () => {
  const [channels, setChannels] = useState<ChannelType[]>(defaultChannels);
  const [activeChannel, setActiveChannel] = useState<string>('channel-1');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { user, session } = useAuth();
  const { toast } = useToast();

  // Reset to default state when user signs out
  useEffect(() => {
    if (!user && !session) {
      setChannels(defaultChannels);
      setActiveChannel('channel-1');
      setIsLoading(false);
    }
  }, [user, session]);

  const loadUserChannels = async () => {
    // Only attempt to load if user is authenticated
    if (!user || !session) {
      console.log('User not authenticated, using default channels');
      setChannels(defaultChannels);
      setActiveChannel('channel-1');
      return;
    }
    
    setIsLoading(true);
    try {
      const userChannels = await getUserChannels();
      
      if (userChannels && userChannels.length > 0) {
        // Load all user channels with their messages
        const userChannelsWithMessages = await Promise.all(
          userChannels.map(async (channel) => {
            const fullChannel = await getFullChannel(channel.id);
            return fullChannel;
          })
        );
        
        // Filter out any null channels
        const validChannels = userChannelsWithMessages.filter(channel => channel !== null) as ChannelType[];
        
        if (validChannels.length > 0) {
          // Combine user channels with default channels
          setChannels([...validChannels, ...defaultChannels]);
          
          // Set the first user channel as active
          setActiveChannel(validChannels[0].id);
        } else {
          // No valid user channels, use defaults
          setChannels(defaultChannels);
          setActiveChannel('channel-1');
        }
      } else {
        // No user channels, use defaults
        setChannels(defaultChannels);
        setActiveChannel('channel-1');
      }
    } catch (error) {
      console.error('Error loading user channels:', error);
      // On error, fall back to default channels
      setChannels(defaultChannels);
      setActiveChannel('channel-1');
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
    if (!user || !session) {
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

  return {
    channels,
    activeChannel,
    isLoading,
    setActiveChannel,
    addMessage,
    loadUserChannels,
    saveCurrentChannel,
    createNewChannel
  };
};
