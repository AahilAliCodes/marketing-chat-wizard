
import { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { 
  getUserChannels, 
  getFullChannel, 
  saveChatChannel, 
  saveMessage, 
  createChannel 
} from '@/services/ChatService';
import { ChannelType, MessageType } from '@/types/chat';
import { defaultChannels } from '@/data/defaultChannels';

export const useChatOperations = () => {
  const [channels, setChannels] = useState<ChannelType[]>(defaultChannels);
  const [activeChannel, setActiveChannel] = useState<string>('channel-1');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const loadUserChannels = useCallback(async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const userChannels = await getUserChannels();
      
      if (userChannels && userChannels.length > 0) {
        // Load all user channels with their messages
        const userChannelsWithMessages = await Promise.all(
          userChannels.map(async (channel) => await getFullChannel(channel.id))
        );
        
        // Combine user channels with default channels
        setChannels([...userChannelsWithMessages, ...defaultChannels]);
        
        // Set the first user channel as active
        setActiveChannel(userChannelsWithMessages[0].id);
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
  }, [user, toast]);

  // Load user channels when the component mounts if the user is logged in
  useEffect(() => {
    if (user) {
      loadUserChannels();
    }
  }, [user, loadUserChannels]);

  const addMessage = useCallback(async (channelId: string, content: string, role: 'user' | 'assistant') => {
    const newMessage = {
      id: `msg-${uuidv4()}`,
      content,
      role,
      timestamp: new Date()
    };
    
    setChannels(prevChannels => 
      prevChannels.map(channel => {
        if (channel.id === channelId) {
          return {
            ...channel,
            messages: [
              ...channel.messages,
              newMessage
            ]
          };
        }
        return channel;
      })
    );

    // If the user is logged in and the channel isn't a default one, save the message
    if (user && !channelId.startsWith('channel-')) {
      try {
        await saveMessage(channelId, newMessage);
        console.log('Message saved to database successfully');
      } catch (error) {
        console.error('Error saving message:', error);
      }
    }
  }, [user]);

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

  const createNewChannel = useCallback(async (name: string, description: string) => {
    let newChannelId: string;
    
    // If the user is logged in, create the channel in the database first
    if (user) {
      try {
        newChannelId = await createChannel(name, description);
      } catch (error) {
        console.error('Error creating channel in database:', error);
        // Fall back to local channel creation if database fails
        newChannelId = `channel-${uuidv4()}`;
      }
    } else {
      // If user is not logged in, create a local channel
      newChannelId = `channel-${uuidv4()}`;
    }
    
    const welcomeMessage = {
      id: `msg-${uuidv4()}`,
      content: `Welcome to the ${name} channel! How can I help you with ${description.toLowerCase()}?`,
      role: 'assistant' as 'user' | 'assistant',
      timestamp: new Date()
    };
    
    const newChannel: ChannelType = {
      id: newChannelId,
      name,
      description,
      messages: [welcomeMessage]
    };

    setChannels(prev => [newChannel, ...prev]);
    setActiveChannel(newChannel.id);
    
    // If the user is logged in, save the welcome message to the database
    if (user && !newChannelId.startsWith('channel-')) {
      try {
        await saveMessage(newChannelId, welcomeMessage);
      } catch (error) {
        console.error('Error saving welcome message:', error);
      }
    }
  }, [user]);

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
