import React, { useState, useRef, useEffect } from 'react';
import { useChatWithAI } from '@/hooks/useChatWithAI';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNavigate } from 'react-router-dom';
import { ChatMessage as ChatMessageType } from './chat/types';
import ChatHeader from './chat/ChatHeader';
import ChatMessage from './chat/ChatMessage';
import ChatInputForm from './chat/ChatInputForm';
import FeedbackForm from './chat/FeedbackForm';
import AnimatedRocket from './chat/AnimatedRocket';
import { SessionManager } from '@/utils/sessionManager';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';

interface AIChatInterfaceProps {
  websiteUrl: string;
  campaignType?: string;
  channelId?: string;
}

const AIChatInterface: React.FC<AIChatInterfaceProps> = ({ websiteUrl, campaignType, channelId }) => {
  const [chatHistory, setChatHistory] = useState<ChatMessageType[]>([]);
  const { sendMessageToAI, isLoading } = useChatWithAI();
  const bottomRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  // Generate a unique chat key for this conversation
  const getChatKey = () => {
    if (channelId) return `channel_${channelId}`;
    return `chat_${websiteUrl}_${campaignType || 'default'}`;
  };

  // Load messages from database channel
  const loadChannelMessages = async (channelId: string) => {
    try {
      const { data: messages, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('channel_id', channelId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error loading channel messages:', error);
        return [];
      }

      return messages?.map(msg => ({
        id: msg.id,
        role: msg.role as 'user' | 'assistant' | 'BLASTari',
        content: msg.content,
        timestamp: new Date(msg.created_at)
      })) || [];
    } catch (error) {
      console.error('Error loading channel messages:', error);
      return [];
    }
  };

  // Save chat to database if user is authenticated
  const saveChatToDatabase = async (messages: ChatMessageType[]) => {
    if (!user) return;

    try {
      // Generate a unique ID for the channel
      const channelId = uuidv4();
      
      // Create a new channel for this conversation
      const { data: channel, error: channelError } = await supabase
        .from('user_chat_channels')
        .insert({
          id: channelId,
          user_id: user.id,
          name: `Chat for ${websiteUrl}`,
          description: campaignType || 'General conversation'
        })
        .select()
        .single();

      if (channelError) throw channelError;

      // Save all messages to the database
      const chatMessagesToSave = messages.map(msg => ({
        channel_id: channelId,
        role: msg.role,
        content: msg.content,
        user_id: user.id,
        website_url: websiteUrl,
        campaign_type: campaignType
      }));

      const { error: messagesError } = await supabase
        .from('chat_messages')
        .insert(chatMessagesToSave);

      if (messagesError) throw messagesError;

      console.log('Chat saved to database successfully');
    } catch (error) {
      console.error('Error saving chat to database:', error);
    }
  };

  useEffect(() => {
    const chatKey = getChatKey();
    
    const initializeChat = async () => {
      // Clear chats for other websites when initializing a new chat
      if (!channelId) {
        SessionManager.clearOtherWebsiteChats(websiteUrl);
      }

      if (channelId) {
        // Handle different types of channel IDs
        if (channelId.startsWith('session_')) {
          // Session-based conversation
          const sessionKey = channelId.replace('session_', '');
          try {
            const chatData = JSON.parse(localStorage.getItem(sessionKey) || '{}');
            if (chatData.messages && chatData.messages.length > 0) {
              const restoredMessages = chatData.messages.map((msg: any) => ({
                ...msg,
                timestamp: new Date(msg.timestamp)
              }));
              setChatHistory(restoredMessages);
            } else {
              // Show welcome message for empty session conversation
              setChatHistory([{
                id: 'session-welcome',
                role: 'BLASTari',
                content: `Welcome back to your conversation! I'm ready to continue helping you with your marketing campaign for ${websiteUrl}. 🚀`,
                timestamp: new Date()
              }]);
            }
          } catch (error) {
            console.error('Error loading session conversation:', error);
            setChatHistory([{
              id: 'error-welcome',
              role: 'BLASTari',
              content: `Welcome! I'm ready to help you with your marketing campaign for ${websiteUrl}. 🚀`,
              timestamp: new Date()
            }]);
          }
        } else {
          // Database channel conversation
          const messages = await loadChannelMessages(channelId);
          if (messages.length > 0) {
            setChatHistory(messages);
          } else {
            // Show welcome message for empty database conversation
            setChatHistory([{
              id: 'channel-welcome',
              role: 'BLASTari',
              content: `Welcome back to your saved conversation! I'm ready to continue helping you with your marketing campaign for ${websiteUrl}. 🚀`,
              timestamp: new Date()
            }]);
          }
        }
      } else {
        // Regular conversation - try to load existing or create new
        const savedChat = SessionManager.getSessionData(chatKey);
        
        if (savedChat && savedChat.messages && savedChat.messages.length > 0 && savedChat.websiteUrl === websiteUrl) {
          const restoredMessages = savedChat.messages.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          }));
          setChatHistory(restoredMessages);
        } else {
          // Generate welcome message based on campaign type
          let welcomeMessage = `Hi there! I'm your marketing assistant for ${websiteUrl} — here to help you craft campaigns, boost visibility, and grow your brand one step at a time. Let's make something amazing together! 🚀`;
          
          const initialMessage = {
            id: 'welcome',
            role: 'BLASTari' as const,
            content: welcomeMessage,
            timestamp: new Date()
          };
          
          setChatHistory([initialMessage]);
          
          // Save the initial conversation in session storage
          SessionManager.setSessionData(chatKey, {
            websiteUrl,
            campaignType,
            messages: [initialMessage],
            lastUpdated: new Date().toISOString()
          });
        }
      }
    };

    initializeChat();
  }, [websiteUrl, campaignType, channelId]);

  // Save conversation whenever chat history changes
  useEffect(() => {
    if (chatHistory.length > 0 && !channelId) {
      const chatKey = getChatKey();
      
      // Save to session storage for immediate persistence
      SessionManager.setSessionData(chatKey, {
        websiteUrl,
        campaignType,
        messages: chatHistory,
        lastUpdated: new Date().toISOString()
      });

      // If user is authenticated, automatically save to database
      if (user && chatHistory.length > 1) { // Only save if there's actual conversation beyond welcome message
        saveChatToDatabase(chatHistory);
      }
    }
  }, [chatHistory, websiteUrl, campaignType, channelId, user]);

  const handleSubmit = async (userMessage: string) => {
    if (!userMessage.trim() || isLoading) return;

    // Add user message to chat
    const newUserMessage: ChatMessageType = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: userMessage,
      timestamp: new Date()
    };
    
    setChatHistory(prev => [...prev, newUserMessage]);

    // Get AI response
    const response = await sendMessageToAI(websiteUrl, userMessage, campaignType);
    
    if (response) {
      const aiMessage: ChatMessageType = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: response.response,
        timestamp: new Date()
      };
      
      setChatHistory(prev => [...prev, aiMessage]);
    }
  };

  // Scroll to bottom when chat history changes
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  const handlePlayClick = (userMessageIndex: number) => {
    // Send user message and assistant response to the Runs page
    navigate('/runs', {
      state: {
        messageContent: chatHistory[userMessageIndex].content, // user message
        messageRole: 'user',
        previousMessage: chatHistory[userMessageIndex + 1].content // assistant response
      }
    });
  };

  return (
    <div className="flex flex-col h-full">
      <ChatHeader 
        websiteUrl={websiteUrl} 
        campaignType={campaignType}
        isChannelConversation={!!channelId}
      />
      
      <ScrollArea className="flex-1 pr-4 mb-6 overflow-y-auto relative">
        <div className="space-y-4">
          {chatHistory.map((message, idx) => {
            // Only show play button for assistant messages, and only if previous message was from user
            const showPlayButton = message.role === 'assistant' && idx > 0 && chatHistory[idx - 1].role === 'user';
            return (
              <ChatMessage 
                key={message.id} 
                message={message} 
                showPlayButton={showPlayButton}
                onPlayClick={() => handlePlayClick(idx - 1)}
              />
            );
          })}
          <div ref={bottomRef} />
          {isLoading && <AnimatedRocket />}
        </div>
      </ScrollArea>
      
      <div className="flex flex-col gap-3">
        <ChatInputForm
          onSubmit={handleSubmit}
          isLoading={isLoading}
          websiteUrl={websiteUrl}
          campaignType={campaignType}
        />
        <FeedbackForm websiteUrl={websiteUrl} />
      </div>
    </div>
  );
};

export default AIChatInterface;
