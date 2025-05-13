
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';
import { MessageType } from '@/types/chat';

interface AIChatResponse {
  response: string;
  context?: any;
}

export const useChatWithAI = () => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const sendMessageToAI = async (websiteUrl: string, userMessage: string, campaignType?: string) => {
    setIsLoading(true);
    setError(null);
    setAiResponse(null);

    try {
      const { data, error } = await supabase.functions.invoke('chat-with-recommendations', {
        body: { websiteUrl, userMessage, campaignType },
      });

      if (error) {
        throw new Error(error.message || 'Failed to get response from AI');
      }

      const response = data as AIChatResponse;
      setAiResponse(response.response);
      return response;
    } catch (err: any) {
      const errorMessage = err.message || 'Error communicating with AI';
      console.error('AI chat error:', errorMessage);
      setError(errorMessage);
      
      toast({
        title: 'AI Chat Error',
        description: errorMessage,
        variant: 'destructive',
      });
      
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Stream response function to handle breaking up responses into chunks
  const streamResponse = async (messages: MessageType[], onChunk: (chunk: string) => void, websiteUrl?: string, campaignType?: string) => {
    const lastUserMessage = messages.filter(m => m.role === 'user').pop();
    if (!lastUserMessage) return;

    try {
      // Use the sendMessageToAI function
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

  return {
    sendMessageToAI,
    streamResponse,
    aiResponse,
    isLoading,
    error,
  };
};
