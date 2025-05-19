
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';

interface AIChatResponse {
  response: string;
  context?: any;
  recommendations?: any[];
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

      if (!data) {
        throw new Error('No response received from AI');
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

  return {
    sendMessageToAI,
    aiResponse,
    isLoading,
    error,
  };
};
