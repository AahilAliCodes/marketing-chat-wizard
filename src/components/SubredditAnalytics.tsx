
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, ArrowRight, TrendingUp, Users, MessageSquare, Shield } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SubredditData {
  subreddit: string;
  engagement_rate: number;
  visibility_score: number;
  active_posters: number;
  strictness_index: number;
  top_themes: Array<{ word: string; count: number }>;
  subscribers: number;
}

interface SubredditAnalyticsProps {
  websiteUrl: string;
}

const SubredditAnalytics: React.FC<SubredditAnalyticsProps> = ({ websiteUrl }) => {
  const [subredditData, setSubredditData] = useState<SubredditData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const { toast } = useToast();

  const fetchSubredditAnalytics = async (forceRegenerate = false) => {
    setIsLoading(!forceRegenerate);
    if (forceRegenerate) setIsRegenerating(true);

    try {
      // First get subreddit recommendations
      const { data: analysisData, error: analysisError } = await supabase.functions.invoke('analyze-subreddits', {
        body: { 
          websiteUrl,
          forceRegenerate
        }
      });
      
      if (analysisError) {
        throw new Error(analysisError.message);
      }

      if (analysisData?.recommendations && analysisData.recommendations.length > 0) {
        // Get top 3 subreddits
        const topSubreddits = analysisData.recommendations.slice(0, 3);
        
        // Call Reddit analytics function
        const { data: analyticsData, error: analyticsError } = await supabase.functions.invoke('reddit-analytics', {
          body: { 
            subreddits: topSubreddits.map((r: any) => r.subreddit)
          }
        });
        
        if (analyticsError) {
          throw new Error(analyticsError.message);
        }
        
        setSubredditData(analyticsData.analytics || []);
        
        if (forceRegenerate) {
          toast({
            title: 'Success',
            description: 'New subreddit analytics have been generated',
          });
        }
      }
    } catch (err: any) {
      console.error('Error fetching subreddit analytics:', err);
      toast({
        title: 'Error',
        description: 'Failed to load subreddit analytics',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
      setIsRegenerating(false);
    }
  };

  useEffect(() => {
    if (websiteUrl) {
      fetchSubredditAnalytics();
    }
  }, [websiteUrl]);

  const handleRegenerate = () => {
    fetchSubredditAnalytics(true);
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Reddit Analytics Dashboard</h1>
        <Button
          onClick={handleRegenerate}
          disabled={isLoading || isRegenerating}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isRegenerating ? 'animate-spin' : ''}`} />
          Regenerate
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {subredditData.map((data, index) => (
          <Card key={data.subreddit} className="relative overflow-hidden border-2 hover:shadow-lg transition-shadow">
            <CardHeader className="bg-gradient-to-r from-marketing-purple/10 to-marketing-purple/5">
              <CardTitle className="flex items-center justify-between">
                <span className="text-xl font-bold">r/{data.subreddit}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="p-1 h-8 w-8 hover:bg-marketing-purple/20"
                >
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </CardTitle>
              <div className="text-sm text-gray-600">
                {formatNumber(data.subscribers)} members
              </div>
            </CardHeader>
            
            <CardContent className="pt-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <div>
                    <div className="text-xs text-gray-500">Engagement Rate</div>
                    <div className="font-semibold">{(data.engagement_rate * 100).toFixed(2)}%</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-600" />
                  <div>
                    <div className="text-xs text-gray-500">Visibility Score</div>
                    <div className="font-semibold">{data.visibility_score.toFixed(0)}</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-purple-600" />
                  <div>
                    <div className="text-xs text-gray-500">Active Posters</div>
                    <div className="font-semibold">{data.active_posters}</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-orange-600" />
                  <div>
                    <div className="text-xs text-gray-500">Mod Strictness</div>
                    <div className="font-semibold">{(data.strictness_index * 100).toFixed(0)}%</div>
                  </div>
                </div>
              </div>
              
              <div>
                <div className="text-xs text-gray-500 mb-2">Top Content Themes</div>
                <div className="flex flex-wrap gap-1">
                  {data.top_themes.map((theme, i) => (
                    <span
                      key={i}
                      className="px-2 py-1 bg-gray-100 text-xs rounded-full"
                    >
                      {theme.word} ({theme.count})
                    </span>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {isLoading && subredditData.length === 0 && (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-marketing-purple mx-auto mb-4"></div>
          <p className="text-gray-500">Analyzing subreddits...</p>
        </div>
      )}

      {!isLoading && subredditData.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No subreddit data available. Try regenerating the analysis.</p>
        </div>
      )}
    </div>
  );
};

export default SubredditAnalytics;
