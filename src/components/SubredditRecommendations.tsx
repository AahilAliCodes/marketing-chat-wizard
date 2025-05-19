
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ExternalLink } from 'lucide-react';

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
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchSubreddits = async () => {
      if (!websiteUrl) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
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
        } else {
          console.log('No existing recommendations, getting new ones from OpenAI');
          // If no existing recommendations, get new ones from OpenAI
          const { data: analysisData, error: analysisError } = await supabase.functions.invoke('analyze-subreddits', {
            body: { websiteUrl }
          });
          
          if (analysisError) {
            throw new Error(analysisError.message);
          }
          
          if (analysisData?.recommendations && analysisData.recommendations.length > 0) {
            console.log('Received recommendations from edge function:', analysisData.recommendations);
            
            // Store recommendations in Supabase
            const recommendationsToStore = analysisData.recommendations.map((rec: any) => ({
              website_url: websiteUrl,
              subreddit: rec.name,
              reason: rec.reason
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
                variant: 'warning',
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
          }
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
      }
    };
    
    fetchSubreddits();
  }, [websiteUrl, toast]);
  
  const handleSubredditClick = (subreddit: string) => {
    window.open(`https://reddit.com/r/${subreddit}`, '_blank');
  };
  
  if (error) {
    return (
      <Card className="mt-6 border-red-200">
        <CardContent className="pt-6">
          <p className="text-red-500">{error}</p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="mt-6 border-marketing-purple/30">
      <CardHeader className="bg-marketing-purple/5">
        <CardTitle className="text-xl">Recommended Subreddits</CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        {isLoading ? (
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
