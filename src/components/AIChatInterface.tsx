
import React, { useState, useRef, useEffect } from 'react';
import { useChatWithAI } from '@/hooks/useChatWithAI';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNavigate } from 'react-router-dom';
import { ChatMessage as ChatMessageType } from './chat/types';
import ChatHeader from './chat/ChatHeader';
import ChatMessage from './chat/ChatMessage';
import ChatInputForm from './chat/ChatInputForm';
import UserActionForm from './chat/UserActionForm';
import AnimatedRocket from './chat/AnimatedRocket';
import { SessionManager } from '@/utils/sessionManager';
import { useAuth } from '@/context/AuthContext';

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

  useEffect(() => {
    const chatKey = getChatKey();
    
    // If channelId is provided, load the conversation from that channel
    if (channelId) {
      // Load messages for this specific channel
      // For now, we'll show a welcome message indicating this is a saved conversation
      setChatHistory([{
        id: 'saved-welcome',
        role: 'BLASTari',
        content: `Welcome back to your saved conversation! I'm ready to continue helping you with your marketing campaign for ${websiteUrl}. 🚀`,
        timestamp: new Date()
      }]);
    } else {
      // Try to load existing conversation from session storage
      const savedChat = SessionManager.getSessionData(chatKey);
      
      if (savedChat && savedChat.messages && savedChat.messages.length > 0) {
        // Convert timestamp strings back to Date objects
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
        
        // Save the initial conversation
        SessionManager.setSessionData(chatKey, {
          websiteUrl,
          campaignType,
          messages: [initialMessage],
          lastUpdated: new Date().toISOString()
        });
      }
    }
  }, [websiteUrl, campaignType, channelId]);

  // Save conversation whenever chat history changes
  useEffect(() => {
    if (chatHistory.length > 0 && !channelId) {
      const chatKey = getChatKey();
      SessionManager.setSessionData(chatKey, {
        websiteUrl,
        campaignType,
        messages: chatHistory,
        lastUpdated: new Date().toISOString()
      });
    }
  }, [chatHistory, websiteUrl, campaignType, channelId]);

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

  const handleActionSuccess = (actionType: string, data?: any) => {
    console.log(`Action ${actionType} completed successfully`, data);
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
        <UserActionForm
          websiteUrl={websiteUrl}
          campaignType={campaignType}
          chatHistory={chatHistory}
          onSuccess={handleActionSuccess}
        />
      </div>
    </div>
  );
};

export default AIChatInterface;
