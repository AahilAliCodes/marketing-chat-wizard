
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';
import { saveChatHistory } from '@/services/ChatHistoryService';

interface AIChatResponse {
  response: string;
  context?: any;
}

export const useChatWithAI = () => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [historySaved, setHistorySaved] = useState<boolean | null>(null);
  const { toast } = useToast();

  const sendMessageToAI = async (websiteUrl: string, userMessage: string, campaignType?: string) => {
    setIsLoading(true);
    setError(null);
    setAiResponse(null);
    setHistorySaved(null);

    try {
      const { data, error } = await supabase.functions.invoke('chat-with-recommendations', {
        body: { websiteUrl, userMessage, campaignType },
      });

      if (error) {
        throw new Error(error.message || 'Failed to get response from AI');
      }

      const response = data as AIChatResponse;
      setAiResponse(response.response);
      
      // Save chat history for authenticated users
      try {
        const saved = await saveChatHistory(websiteUrl, userMessage, response.response);
        setHistorySaved(saved);
        console.log(`Chat history saved status: ${saved ? 'Success' : 'Failed'}`);
      } catch (historyError) {
        console.warn('Failed to save chat history:', historyError);
        setHistorySaved(false);
      }
      
      return response;
    } catch (err: any) {
      const errorMessage = err.message || 'Error communicating with AI';
      console.error('AI chat error:', errorMessage);
      setError(errorMessage);
      setHistorySaved(false);
      
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
    historySaved,
  };
};
