import React, { useState, useRef, useEffect } from 'react';
import { useChatWithAI } from '@/hooks/useChatWithAI';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNavigate } from 'react-router-dom';
import { ChatMessage as ChatMessageType } from './chat/types';
import ChatHeader from './chat/ChatHeader';
import ChatMessage from './chat/ChatMessage';
import ChatInputForm from './chat/ChatInputForm';
import ShareChat from './chat/ShareChat';
import AnimatedRocket from './chat/AnimatedRocket';
import { loadChatHistory } from '@/services/ChatHistoryService';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface AIChatInterfaceProps {
  websiteUrl: string;
  campaignType?: string;
}

const AIChatInterface: React.FC<AIChatInterfaceProps> = ({ websiteUrl, campaignType }) => {
  const [chatHistory, setChatHistory] = useState<ChatMessageType[]>([]);
  const { sendMessageToAI, isLoading } = useChatWithAI();
  const bottomRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  useEffect(() => {
    // Generate welcome message based on campaign type
    let welcomeMessage = `Hi there! I'm your marketing assistant for ${websiteUrl} — here to help you craft campaigns, boost visibility, and grow your brand one step at a time. Let's make something amazing together! 🚀`;
    
    setChatHistory([{
      id: 'welcome',
      role: 'BLASTari',
      content: welcomeMessage,
      timestamp: new Date()
    }]);
  }, [websiteUrl, campaignType]);

  // Load chat history for authenticated users
  useEffect(() => {
    const fetchChatHistory = async () => {
      if (user && websiteUrl) {
        setIsLoadingHistory(true);
        try {
          const history = await loadChatHistory(websiteUrl);
          
          if (history.length > 0) {
            // Convert history items to chat messages
            const historyMessages: ChatMessageType[] = [];
            
            // Keep the welcome message at the top
            historyMessages.push({
              id: 'welcome',
              role: 'BLASTari',
              content: `Hi there! I'm your marketing assistant for ${websiteUrl} — here to help you craft campaigns, boost visibility, and grow your brand one step at a time. Let's make something amazing together! 🚀`,
              timestamp: new Date()
            });
            
            // Add past conversations
            history.forEach((item, index) => {
              // Add user message
              historyMessages.push({
                id: `history-user-${index}`,
                role: 'user',
                content: item.user_prompt,
                timestamp: item.created_at
              });
              
              // Add AI response
              historyMessages.push({
                id: `history-ai-${index}`,
                role: 'assistant',
                content: item.ai_response,
                timestamp: item.created_at
              });
            });
            
            setChatHistory(historyMessages);
            toast({
              title: "Chat History Loaded",
              description: `Loaded ${history.length} previous conversations for ${websiteUrl}`,
            });
          }
        } catch (error) {
          console.error('Failed to load chat history:', error);
          toast({
            title: "Error Loading History",
            description: "Failed to load your previous conversations",
            variant: 'destructive',
          });
        } finally {
          setIsLoadingHistory(false);
        }
      }
    };
    
    fetchChatHistory();
  }, [user, websiteUrl, toast]);

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
      <ChatHeader websiteUrl={websiteUrl} campaignType={campaignType} />
      
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
          {(isLoading || isLoadingHistory) && <AnimatedRocket />}
        </div>
      </ScrollArea>
      
      <div className="flex flex-col gap-3">
        <ChatInputForm
          onSubmit={handleSubmit}
          isLoading={isLoading}
          websiteUrl={websiteUrl}
          campaignType={campaignType}
        />
        <ShareChat
          websiteUrl={websiteUrl}
          campaignType={campaignType}
          chatHistory={chatHistory}
        />
      </div>
    </div>
  );
};

export default AIChatInterface;
