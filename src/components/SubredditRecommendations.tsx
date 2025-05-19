
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
      // Call the edge function - it will check for existing recommendations
      // and only generate new ones if needed (or if forceRegenerate is true)
      const { data: analysisData, error: analysisError } = await supabase.functions.invoke('analyze-subreddits', {
        body: { 
          websiteUrl,
          forceRegenerate // Pass this flag to the edge function
        }
      });
      
      if (analysisError) {
        throw new Error(analysisError.message);
      }
      
      if (analysisData?.recommendations && analysisData.recommendations.length > 0) {
        setRecommendations(analysisData.recommendations);
        
        if (forceRegenerate) {
          toast({
            title: 'Success',
            description: 'New subreddit recommendations have been generated',
          });
        }
      } else {
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
    if (websiteUrl) {
      fetchSubreddits();
    }
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
