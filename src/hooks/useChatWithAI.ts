
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
      
      // If there are subreddit recommendations, store them
      if (response.recommendations && response.recommendations.length > 0) {
        await storeSubredditRecommendations(websiteUrl, response.recommendations);
      }
      
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

  const storeSubredditRecommendations = async (websiteUrl: string, recommendations: any[]) => {
    try {
      // First check if we already have recommendations for this website
      const { data: existingRecommendations } = await supabase
        .from('subreddit_recommendations')
        .select('subreddit')
        .eq('website_url', websiteUrl);
      
      // If we have existing recommendations, don't store again
      if (existingRecommendations && existingRecommendations.length > 0) {
        console.log('Subreddit recommendations already exist for this website');
        return;
      }
      
      // Format the recommendations to match the database schema
      const recommendationsToStore = recommendations.map(rec => ({
        website_url: websiteUrl,
        subreddit: rec.name,
        reason: rec.reason
      }));
      
      // Store the recommendations
      const { error } = await supabase
        .from('subreddit_recommendations')
        .insert(recommendationsToStore);
      
      if (error) {
        console.error('Error storing subreddit recommendations:', error);
        toast({
          title: 'Warning',
          description: 'Generated recommendations but failed to save them to the database',
          variant: 'default',
        });
      } else {
        console.log('Successfully stored subreddit recommendations');
      }
    } catch (err) {
      console.error('Error in storeSubredditRecommendations:', err);
    }
  };

  return {
    sendMessageToAI,
    aiResponse,
    isLoading,
    error,
  };
};
