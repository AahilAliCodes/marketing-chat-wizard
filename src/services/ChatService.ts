
import { supabase } from "@/integrations/supabase/client";
import { ChannelType, MessageType } from "@/types/chat";
import { v4 as uuidv4 } from 'uuid';

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
  const { data: userData, error: userError } = await supabase.auth.getUser();
  
  if (userError || !userData.user) {
    throw new Error('User not authenticated');
  }

  const { data: channels, error } = await supabase
    .from('user_chat_channels')
    .select('*')
    .eq('user_id', userData.user.id)
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('Error fetching channels:', error);
    throw error;
  }

  return channels;
};

export const getChannelMessages = async (channelId: string) => {
  const { data: messages, error } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('channel_id', channelId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching messages:', error);
    throw error;
  }

  return messages.map(msg => ({
    id: msg.id,
    content: msg.content,
    role: msg.role as 'user' | 'assistant',
    timestamp: new Date(msg.created_at)
  }));
};

export const getFullChannel = async (channelId: string): Promise<ChannelType> => {
  // Get the channel data
  const { data: channel, error: channelError } = await supabase
    .from('user_chat_channels')
    .select('*')
    .eq('id', channelId)
    .single();

  if (channelError) {
    console.error('Error fetching channel:', channelError);
    throw channelError;
  }

  // Get the messages for this channel
  const messages = await getChannelMessages(channelId);

  return {
    id: channel.id,
    name: channel.name,
    description: channel.description || '',
    messages: messages
  };
};

// Modified function to save a single message directly to the database
// Now accepts website_url and campaign_type parameters
export const saveMessage = async (channelId: string, message: MessageType, websiteUrl?: string, campaignType?: string) => {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  
  if (userError || !userData.user) {
    throw new Error('User not authenticated');
  }

  // Create the message object with additional fields if provided
  const messageObject: any = {
    id: message.id,
    channel_id: channelId,
    content: message.content,
    role: message.role,
    created_at: message.timestamp.toISOString(),
    user_id: userData.user.id
  };
  
  // Add optional fields if provided
  if (websiteUrl) {
    messageObject.website_url = websiteUrl;
  }
  
  if (campaignType) {
    messageObject.campaign_type = campaignType;
  }

  const { error: messageError } = await supabase
    .from('chat_messages')
    .insert(messageObject);

  if (messageError) {
    console.error('Error saving message:', messageError);
    throw messageError;
  }
  
  return true;
};

// Function to get user messages by website and campaign
export const getUserMessagesByWebsiteAndCampaign = async (websiteUrl: string, campaignType?: string) => {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  
  if (userError || !userData.user) {
    throw new Error('User not authenticated');
  }

  const query = supabase
    .from('chat_messages')
    .select('*')
    .eq('website_url', websiteUrl)
    .eq('user_id', userData.user.id);
  
  // Add campaign filter if provided
  if (campaignType) {
    query.eq('campaign_type', campaignType);
  }
  
  const { data: messages, error } = await query
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching messages:', error);
    throw error;
  }

  return messages.map(msg => ({
    id: msg.id,
    content: msg.content,
    role: msg.role as 'user' | 'assistant' | 'BLASTari',
    timestamp: new Date(msg.created_at)
  }));
};

// New function to create a channel and return its ID
export const createChannel = async (name: string, description: string) => {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  
  if (userError || !userData.user) {
    throw new Error('User not authenticated');
  }

  const channelId = uuidv4();
  
  const { data, error } = await supabase
    .from('user_chat_channels')
    .insert({
      id: channelId,
      name,
      description,
      user_id: userData.user.id
    })
    .select('id')
    .single();

  if (error) {
    console.error('Error creating channel:', error);
    throw error;
  }

  return data.id;
};
