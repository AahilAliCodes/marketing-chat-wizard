
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ExternalLink, RefreshCw, Loader2 } from 'lucide-react';
import AgenticWorkflow from './AgenticWorkflow';

interface SubredditRecommendation {
  id: string;
  subreddit: string;
  reason?: string;
  postTitle?: string;
  postContent?: string;
  engagement_rate?: number;
  subscribers?: number;
  posts_per_day?: number;
}

interface SubredditRecommendationsProps {
  websiteUrl: string;
}

const SubredditRecommendations: React.FC<SubredditRecommendationsProps> = ({ websiteUrl }) => {
  const [recommendations, setRecommendations] = useState<SubredditRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isRegenerating, setIsRegenerating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [allPreviousSubreddits, setAllPreviousSubreddits] = useState<string[]>([]);
  const [showWorkflow, setShowWorkflow] = useState<boolean>(false);
  const [isGenerationComplete, setIsGenerationComplete] = useState<boolean>(false);
  const { toast } = useToast();

  const fetchAllPreviousSubreddits = async () => {
    try {
      const { data, error } = await supabase
        .from('subreddit_recommendations')
        .select('subreddit')
        .eq('website_url', websiteUrl);
      
      if (error) {
        console.error('Error fetching previous subreddits:', error);
        return [];
      }
      
      return data?.map(rec => rec.subreddit) || [];
    } catch (error) {
      console.error('Error in fetchAllPreviousSubreddits:', error);
      return [];
    }
  };

  const filterActiveSubreddits = (subreddits: SubredditRecommendation[]) => {
    return subreddits.filter(sub => {
      // Apply minimum activity thresholds
      const minSubscribers = 1000; // At least 1k subscribers
      const minEngagement = 0.5; // At least 0.5% engagement rate
      
      return (sub.subscribers && sub.subscribers >= minSubscribers) &&
             (sub.engagement_rate && sub.engagement_rate >= minEngagement);
    });
  };

  const fetchSubreddits = async (forceRegenerate = false) => {
    if (!websiteUrl) return;
    
    setIsLoading(!forceRegenerate);
    if (forceRegenerate) setIsRegenerating(true);
    setShowWorkflow(true);
    setIsGenerationComplete(false);
    setError(null);
    
    try {
      // Get all previously recommended subreddits for this website
      const previousSubreddits = await fetchAllPreviousSubreddits();
      setAllPreviousSubreddits(previousSubreddits);
      
      // Call the edge function - always exclude previous subreddits when regenerating
      const { data: analysisData, error: analysisError } = await supabase.functions.invoke('analyze-subreddits', {
        body: { 
          websiteUrl,
          forceRegenerate: true, // Always force regeneration to get new subreddits
          excludeSubreddits: forceRegenerate ? previousSubreddits : []
        }
      });
      
      if (analysisError) {
        throw new Error(analysisError.message);
      }
      
      if (analysisData?.recommendations && analysisData.recommendations.length > 0) {
        // Filter out inactive subreddits first
        const activeRecommendations = filterActiveSubreddits(analysisData.recommendations);
        
        if (activeRecommendations.length === 0) {
          throw new Error('No active subreddits found. All recommendations had insufficient activity.');
        }
        
        // Sort by engagement rate (highest first) and take top 3
        const sortedRecommendations = activeRecommendations
          .sort((a: SubredditRecommendation, b: SubredditRecommendation) => 
            (b.engagement_rate || 0) - (a.engagement_rate || 0)
          )
          .slice(0, 3);
        
        setRecommendations(sortedRecommendations);
        setIsGenerationComplete(true);
        
        if (forceRegenerate) {
          toast({
            title: 'Success',
            description: `Generated ${sortedRecommendations.length} new active subreddit recommendations`,
          });
        }
      } else {
        throw new Error('No recommendations could be generated');
      }
    } catch (err: any) {
      console.error('Error fetching subreddit recommendations:', err);
      setError(err.message || 'Failed to fetch subreddit recommendations');
      setIsGenerationComplete(true);
      toast({
        title: 'Error',
        description: 'Failed to load subreddit recommendations',
        variant: 'destructive',
      });
    }
  };
  
  const handleWorkflowComplete = () => {
    setShowWorkflow(false);
    setIsLoading(false);
    setIsRegenerating(false);
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

  const formatNumber = (num?: number) => {
    if (!num) return 'N/A';
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };
  
  return (
    <>
      <AgenticWorkflow 
        isVisible={showWorkflow} 
        isComplete={isGenerationComplete}
        onComplete={handleWorkflowComplete}
      />
      
      <Card id="subreddit-recommendations" className="mt-6 border-marketing-purple/30">
        <CardHeader className="bg-marketing-purple/5 flex flex-row items-center justify-between">
          <CardTitle className="text-xl font-helvetica">Recommended Subreddits</CardTitle>
          <div className="flex items-center gap-4">
            {websiteUrl && (
              <span className="text-sm text-gray-600 font-helvetica">
                Website: <span className="font-medium">{websiteUrl}</span>
              </span>
            )}
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleRegenerate}
              disabled={isLoading || isRegenerating || showWorkflow}
              className="whitespace-nowrap flex gap-2 items-center font-helvetica"
            >
              {isRegenerating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Regenerate
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          {(isLoading || isRegenerating) && !showWorkflow ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="border rounded-lg p-4">
                  <Skeleton className="h-6 w-32 mb-2" />
                  <div className="flex gap-4">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </div>
              ))}
            </div>
          ) : recommendations.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {recommendations.map((rec) => (
                <Card 
                  key={rec.id} 
                  className="border hover:shadow-md transition-shadow cursor-pointer hover:bg-marketing-purple/5"
                  onClick={() => handleSubredditClick(rec.subreddit)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-lg font-helvetica">r/{rec.subreddit}</h3>
                      <ExternalLink className="h-4 w-4 text-gray-400" />
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600 font-helvetica">Engagement Rate:</span>
                        <span className="font-medium text-green-600 font-helvetica">
                          {rec.engagement_rate ? `${rec.engagement_rate.toFixed(1)}%` : 'N/A'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 font-helvetica">Subscribers:</span>
                        <span className="font-medium font-helvetica">{formatNumber(rec.subscribers)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 font-helvetica">Posts/Day:</span>
                        <span className="font-medium font-helvetica">{formatNumber(rec.posts_per_day)}</span>
                      </div>
                    </div>
                    
                    {rec.reason && (
                      <div className="mt-3 pt-3 border-t">
                        <p className="text-xs text-gray-600 italic font-helvetica">{rec.reason}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : error ? (
            <div className="p-4 border rounded bg-red-50">
              <p className="text-red-600 font-helvetica">{error}</p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-2 font-helvetica"
                onClick={handleRegenerate}
              >
                Try again
              </Button>
            </div>
          ) : (
            <p className="text-gray-500 font-helvetica">No subreddit recommendations found.</p>
          )}
          
          {recommendations.length > 0 && (
            <div className="mt-4 pt-4 border-t text-sm text-gray-500">
              <p className="font-helvetica">Click on any subreddit to open it in a new tab. Sorted by engagement rate (highest to lowest).</p>
              {allPreviousSubreddits.length > 0 && (
                <p className="mt-1 font-helvetica">
                  Previously recommended: {allPreviousSubreddits.length} subreddit{allPreviousSubreddits.length !== 1 ? 's' : ''}
                </p>
              )}
              <p className="mt-1 text-xs text-gray-400 font-helvetica">
                Showing only active subreddits (1K+ subscribers, 0.5%+ engagement)
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
};

export default SubredditRecommendations;
