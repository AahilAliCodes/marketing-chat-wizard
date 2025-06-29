
import { supabase } from "@/integrations/supabase/client";
import { ChannelType, MessageType } from "@/types/chat";

export const saveChatChannel = async (channel: ChannelType) => {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  
  if (userError || !userData.user) {
    throw new Error('User not authenticated');
  }

  // First, create or update the channel
  const { data: channelData, error: channelError } = await supabase
    .from('user_chat_channels')
    .upsert({
      id: channel.id,
      name: channel.name,
      description: channel.description,
      user_id: userData.user.id
    }, {
      onConflict: 'id'
    })
    .select('id')
    .single();

  if (channelError) {
    console.error('Error saving channel:', channelError);
    throw channelError;
  }

  const channelId = channelData?.id || channel.id;

  // Then, save all messages for the channel
  const messagesForInsert = channel.messages.map(msg => ({
    channel_id: channelId,
    content: msg.content,
    role: msg.role,
    created_at: msg.timestamp.toISOString()
  }));

  if (messagesForInsert.length > 0) {
    const { error: messagesError } = await supabase
      .from('chat_messages')
      .insert(messagesForInsert);

    if (messagesError) {
      console.error('Error saving messages:', messagesError);
      throw messagesError;
    }
  }

  return channelId;
};

export const getUserChannels = async () => {
  try {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    
    if (userError || !userData.user) {
      console.log('No authenticated user, skipping channel fetch');
      return [];
    }

    const { data: channels, error } = await supabase
      .from('user_chat_channels')
      .select('*')
      .eq('user_id', userData.user.id)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching channels:', error);
      return [];
    }

    return channels || [];
  } catch (error) {
    console.error('Error in getUserChannels:', error);
    return [];
  }
};

export const getChannelMessages = async (channelId: string) => {
  try {
    const { data: messages, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('channel_id', channelId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching messages:', error);
      return [];
    }

    return messages?.map(msg => ({
      id: msg.id,
      content: msg.content,
      role: msg.role as 'user' | 'assistant',
      timestamp: new Date(msg.created_at)
    })) || [];
  } catch (error) {
    console.error('Error in getChannelMessages:', error);
    return [];
  }
};

export const getFullChannel = async (channelId: string): Promise<ChannelType | null> => {
  try {
    // Get the channel data
    const { data: channel, error: channelError } = await supabase
      .from('user_chat_channels')
      .select('*')
      .eq('id', channelId)
      .single();

    if (channelError) {
      console.error('Error fetching channel:', channelError);
      return null;
    }

    // Get the messages for this channel
    const messages = await getChannelMessages(channelId);

    return {
      id: channel.id,
      name: channel.name,
      description: channel.description || '',
      messages: messages
    };
  } catch (error) {
    console.error('Error in getFullChannel:', error);
    return null;
  }
};
