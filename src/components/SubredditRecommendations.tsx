
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ExternalLink, RefreshCw } from 'lucide-react';

interface SubredditRecommendation {
  id: string;
  subreddit: string;
  reason?: string;
  postTitle?: string;
  postContent?: string;
}

interface SubredditRecommendationsProps {
  websiteUrl: string;
}

const SubredditRecommendations: React.FC<SubredditRecommendationsProps> = ({ websiteUrl }) => {
  const [recommendations, setRecommendations] = useState<SubredditRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isRegenerating, setIsRegenerating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchSubreddits = async (forceRegenerate = false) => {
    if (!websiteUrl) return;
    
    setIsLoading(!forceRegenerate);
    if (forceRegenerate) setIsRegenerating(true);
    setError(null);
    
    try {
      // Only check existing recommendations if we're not forcing regeneration
      if (!forceRegenerate) {
        // First check if we have recommendations for this website
        const { data: existingRecommendations, error: fetchError } = await supabase
          .from('subreddit_recommendations')
          .select('*')
          .eq('website_url', websiteUrl)
          .limit(5);
            
        if (fetchError) {
          throw new Error(fetchError.message);
        }
        
        if (existingRecommendations && existingRecommendations.length > 0) {
          console.log('Found existing subreddit recommendations:', existingRecommendations);
          setRecommendations(existingRecommendations);
          return;
        }
      }
      
      console.log('No existing recommendations or regenerating, getting new ones from OpenAI');
      // Get new ones from OpenAI
      const { data: analysisData, error: analysisError } = await supabase.functions.invoke('analyze-subreddits', {
        body: { websiteUrl }
      });
      
      if (analysisError) {
        throw new Error(analysisError.message);
      }
      
      if (analysisData?.recommendations && analysisData.recommendations.length > 0) {
        console.log('Received recommendations from edge function:', analysisData.recommendations);
        
        // If regenerating, delete existing recommendations first
        if (forceRegenerate) {
          const { error: deleteError } = await supabase
            .from('subreddit_recommendations')
            .delete()
            .eq('website_url', websiteUrl);
            
          if (deleteError) {
            console.error('Error deleting existing recommendations:', deleteError);
          }
        }
        
        // Store recommendations in Supabase
        const recommendationsToStore = analysisData.recommendations.map((rec: any) => ({
          website_url: websiteUrl,
          subreddit: rec.name,
          reason: rec.reason,
          postTitle: rec.postTitle,
          postContent: rec.postContent
        }));
        
        console.log('Storing recommendations in database:', recommendationsToStore);
        
        const { error: insertError } = await supabase
          .from('subreddit_recommendations')
          .insert(recommendationsToStore);
          
        if (insertError) {
          console.error('Error storing recommendations:', insertError);
          toast({
            title: 'Warning',
            description: 'Generated recommendations but failed to save them',
            variant: 'default',
          });
        }
        
        // Get the stored recommendations with their IDs
        const { data: storedRecommendations, error: storedError } = await supabase
          .from('subreddit_recommendations')
          .select('*')
          .eq('website_url', websiteUrl)
          .limit(5);
          
        if (storedError) {
          console.error('Error fetching stored recommendations:', storedError);
        }
        
        if (storedRecommendations && storedRecommendations.length > 0) {
          setRecommendations(storedRecommendations);
          if (forceRegenerate) {
            toast({
              title: 'Success',
              description: 'New subreddit recommendations have been generated',
            });
          }
        } else {
          // If we couldn't get stored recommendations, use the ones from the API directly
          setRecommendations(analysisData.recommendations.map((rec: any) => ({
            id: crypto.randomUUID(),
            subreddit: rec.name,
            reason: rec.reason,
            postTitle: rec.postTitle,
            postContent: rec.postContent
          })));
        }
      } else {
        console.log('No recommendations returned from edge function');
        throw new Error('No recommendations could be generated');
      }
    } catch (err: any) {
      console.error('Error fetching subreddit recommendations:', err);
      setError(err.message || 'Failed to fetch subreddit recommendations');
      toast({
        title: 'Error',
        description: 'Failed to load subreddit recommendations',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
      setIsRegenerating(false);
    }
  };
  
  useEffect(() => {
    fetchSubreddits();
  }, [websiteUrl]);
  
  const handleSubredditClick = (subreddit: string) => {
    window.open(`https://reddit.com/r/${subreddit}`, '_blank');
  };

  const handleRegenerate = () => {
    fetchSubreddits(true);
  };
  
  return (
    <Card id="subreddit-recommendations" className="mt-6 border-marketing-purple/30">
      <CardHeader className="bg-marketing-purple/5 flex flex-row items-center justify-between">
        <CardTitle className="text-xl">Recommended Subreddits</CardTitle>
        <Button 
          variant="outline" 
          size="sm"
          onClick={handleRegenerate}
          disabled={isLoading || isRegenerating}
          className="whitespace-nowrap flex gap-2 items-center"
        >
          <RefreshCw className={`h-4 w-4 ${isRegenerating ? 'animate-spin' : ''}`} />
          Regenerate
        </Button>
      </CardHeader>
      <CardContent className="pt-4">
        {(isLoading || isRegenerating) ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-2">
                <Skeleton className="h-8 w-full" />
              </div>
            ))}
          </div>
        ) : recommendations.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {recommendations.map((rec) => (
              <Button 
                key={rec.id} 
                variant="outline" 
                className="justify-between hover:bg-marketing-purple/10 hover:text-marketing-purple hover:border-marketing-purple/30"
                onClick={() => handleSubredditClick(rec.subreddit)}
              >
                <span>r/{rec.subreddit}</span>
                <ExternalLink className="h-4 w-4 ml-2" />
              </Button>
            ))}
          </div>
        ) : error ? (
          <div className="p-4 border rounded bg-red-50">
            <p className="text-red-600">{error}</p>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-2"
              onClick={handleRegenerate}
            >
              Try again
            </Button>
          </div>
        ) : (
          <p className="text-gray-500">No subreddit recommendations found.</p>
        )}
        
        {recommendations.length > 0 && (
          <div className="mt-4 pt-4 border-t text-sm text-gray-500">
            <p>Click on any subreddit to open it in a new tab.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SubredditRecommendations;
