
import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import ChatInput from './ChatInput';
import ChatMessage from './ChatMessage';
import { useChatWithAI } from '@/hooks/useChatWithAI';
import { useToast } from '@/hooks/use-toast';
import { MessageType } from '@/types/chat';
import { v4 as uuidv4 } from 'uuid';
import { saveMessageDirectly } from '@/services/ChatService';
import { supabase } from '@/integrations/supabase/client';

interface AIChatInterfaceProps {
  websiteUrl?: string;
  campaignType?: string;
}

const AIChatInterface: React.FC<AIChatInterfaceProps> = ({
  websiteUrl,
  campaignType
}) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { sendMessageToAI, isLoading } = useChatWithAI();
  
  // Function to save a message to Supabase
  const saveMessage = async (message: MessageType) => {
    if (user) {
      try {
        await saveMessageDirectly(message);
      } catch (error) {
        console.error("Error saving message:", error);
      }
    }
  };
  
  useEffect(() => {
    // Add welcome message when component mounts
    const welcomeMessage = {
      id: `msg-${uuidv4()}`,
      content: campaignType 
        ? `Welcome! I'm your marketing assistant for ${campaignType}. How can I help you with your campaign${websiteUrl ? ` for ${websiteUrl}` : ''}?`
        : `Welcome! I'm your marketing assistant. How can I help you today${websiteUrl ? ` with ${websiteUrl}` : ''}?`,
      role: 'assistant' as 'user' | 'assistant',
      timestamp: new Date()
    };
    
    setMessages([welcomeMessage]);
    
    // Save welcome message if user is logged in
    if (user) {
      saveMessage(welcomeMessage);
    }
  }, [user, campaignType, websiteUrl]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Stream response function to simulate streaming AI response
  const streamResponse = async (messages: MessageType[], onChunk: (chunk: string) => void, websiteUrl?: string, campaignType?: string) => {
    const lastUserMessage = messages.filter(m => m.role === 'user').pop();
    if (!lastUserMessage) return;

    try {
      // Use the existing sendMessageToAI function
      const response = await sendMessageToAI(websiteUrl || '', lastUserMessage.content, campaignType);
      
      if (!response) {
        throw new Error('Failed to get AI response');
      }
      
      // Simulate streaming by breaking response into chunks
      const chunks = response.response.match(/.{1,10}/g) || [];
      
      // Send each chunk with a small delay to simulate streaming
      for (const chunk of chunks) {
        onChunk(chunk);
        // Small delay between chunks
        await new Promise(resolve => setTimeout(resolve, 20));
      }
      
      return response;
    } catch (error) {
      console.error('Error in streamResponse:', error);
      throw error;
    }
  };

  const handleSendMessage = async (content: string) => {
    if (!content.trim()) return;

    // Create and add user message
    const userMessage: MessageType = {
      id: `msg-${uuidv4()}`,
      content,
      role: 'user',
      timestamp: new Date()
    };

    setMessages(prevMessages => [...prevMessages, userMessage]);
    
    // Save user message if logged in
    if (user) {
      saveMessage(userMessage);
    }
    
    setIsProcessing(true);

    try {
      // Prepare assistant message
      const assistantMessage: MessageType = {
        id: `msg-${uuidv4()}`,
        content: '',
        role: 'assistant',
        timestamp: new Date()
      };

      // Start with empty content
      setMessages(prevMessages => [...prevMessages, assistantMessage]);

      // Stream the response
      await streamResponse(
        [...messages, userMessage],
        (chunk: string) => {
          setMessages(prevMessages => {
            const lastMessage = {...prevMessages[prevMessages.length - 1]};
            lastMessage.content += chunk;
            return [...prevMessages.slice(0, -1), lastMessage];
          });
          scrollToBottom();
        },
        websiteUrl,
        campaignType
      );
      
      // Save complete assistant message if logged in
      if (user) {
        setMessages(prevMessages => {
          const lastMessage = prevMessages[prevMessages.length - 1];
          saveMessage(lastMessage);
          return prevMessages;
        });
      }

    } catch (error) {
      console.error('Error streaming response:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to get a response. Please try again."
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRetry = async () => {
    if (messages.length < 2) return;
    
    // Get all messages except the last one (assistant's response)
    const messagesToKeep = messages.slice(0, -1);
    
    // Update the state to remove the last message
    setMessages(messagesToKeep);
    
    // Use the last user message
    const lastUserMessageIndex = messagesToKeep.map(m => m.role).lastIndexOf('user');
    if (lastUserMessageIndex >= 0) {
      const lastUserMessage = messagesToKeep[lastUserMessageIndex];
      await handleSendMessage(lastUserMessage.content);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <ChatMessage key={message.id || index} message={message} />
        ))}
        <div ref={messagesEndRef} />
      </div>
      
      <div className="border-t p-4">
        <ChatInput
          onSendMessage={handleSendMessage}
          onRetry={handleRetry}
          disabled={isProcessing}
          showRetry={messages.length > 0 && messages[messages.length - 1].role === 'assistant'}
        />
      </div>
    </div>
  );
};

export default AIChatInterface;
