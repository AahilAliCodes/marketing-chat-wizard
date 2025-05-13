
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';

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

  // Implementation of streamResponse function to properly handle streaming responses
  const streamResponse = async (websiteUrl: string, userMessage: string, campaignType?: string) => {
    setIsLoading(true);
    setError(null);
    setAiResponse(null);
    
    try {
      // In a real implementation, this would use streaming API
      // For now, we'll just call the regular function
      return await sendMessageToAI(websiteUrl, userMessage, campaignType);
    } catch (err: any) {
      const errorMessage = err.message || 'Error streaming response';
      console.error('Stream response error:', errorMessage);
      setError(errorMessage);
      
      toast({
        title: 'Stream Error',
        description: errorMessage,
        variant: 'destructive',
      });
      
      return null;
    } finally {
      setIsLoading(false);
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
