import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { RefreshCw, ArrowRight, TrendingUp, Users, MessageSquare, Shield, Info } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

interface SubredditData {
  subreddit: string;
  engagement_rate: number;
  visibility_score: number;
  active_posters: number;
  strictness_index: number;
  top_themes: Array<{ word: string; count: number }>;
  subscribers: number;
}

interface RedditPost {
  id: string;
  title: string;
  content: string;
  subreddit: string;
  author: string;
  score: number;
  url: string;
  aiComment: string;
}

interface SubredditAnalyticsProps {
  websiteUrl: string;
}

// ... keep existing code (KPI_EXPLANATIONS constant)
const KPI_EXPLANATIONS = {
  engagement_rate: {
    title: "Engagement Rate",
    description: "Metric Type: Percent or decimal (e.g., 0.12 or 12%)",
    goodRange: "Low (<5%) – Lurker-heavy subreddit\nMedium (5–15%) – Decent activity\nHigh (>15%) – Very interactive audience",
    significance: "Measures how active and responsive users are. High engagement means posts start discussions and people care. If engagement is low, posts may get ignored, even if the sub looks big."
  },
  visibility_score: {
    title: "Post Visibility Score",
    description: "Metric Type: Integer or scaled index (e.g., 500–2000+)",
    goodRange: "<500 – Posts get ignored\n500–1500 – Moderate reach\n1500+ – Highly visible posts",
    significance: "Tells you how likely your post is to reach the top. A high score means Reddit's algorithm amplifies content and users respond positively — a green light for marketing potential."
  },
  active_posters: {
    title: "Daily Active Posters",
    description: "Metric Type: Integer (e.g., 30 posters/day)",
    goodRange: "<10/day – Stale community\n10–100/day – Growing/active\n100+/day – Highly active sub",
    significance: "Shows how much fresh content is being created. You want to market in communities where new conversations happen daily — not where the same 5 users post once a week."
  },
  strictness_index: {
    title: "Moderator Strictness Index",
    description: "Metric Type: Ratio (e.g., 0.25 = 25% of posts removed)",
    goodRange: "<10% – Lenient/moderate modding\n10–30% – Cautious modding\n>30% – Highly strict; risky for marketers",
    significance: "Measures how harsh the mods are. A high index means posts — even helpful ones — can be deleted easily. Essential for avoiding wasted effort or account bans."
  },
  top_themes: {
    title: "Top Content Themes",
    description: "Metric Type: Keywords or topic clusters (e.g., \"weight loss\", \"testimonials\", \"supplements\")\n\nHow It's Extracted: NLP on top 100 posts in last 3 months",
    goodRange: "Clear, repeated patterns (e.g., same 3–5 themes dominate)\nMatch between themes and your product's messaging",
    significance: "Helps you blend in natively. If your comment mirrors what the sub already discusses, it gets accepted and even upvoted. Marketing works best when it's on-topic."
  }
};

const SubredditAnalytics: React.FC<SubredditAnalyticsProps> = ({ websiteUrl }) => {
  const [subredditData, setSubredditData] = useState<SubredditData[]>([]);
  const [redditPosts, setRedditPosts] = useState<RedditPost[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isLoadingPosts, setIsLoadingPosts] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const fetchStoredSubredditAnalytics = async () => {
    try {
      // First check if we have stored analytics for this website
      const { data: storedAnalytics, error } = await supabase
        .from('reddit_subreddit_analytics')
        .select('*')
        .eq('website_url', websiteUrl)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(error.message);
      }

      if (storedAnalytics && storedAnalytics.length > 0) {
        // Convert stored data to the expected format
        const formattedData = storedAnalytics.map(item => ({
          subreddit: item.subreddit,
          engagement_rate: parseFloat(item.engagement_rate.toString()),
          visibility_score: parseFloat(item.visibility_score.toString()),
          active_posters: item.active_posters,
          strictness_index: parseFloat(item.strictness_index.toString()),
          top_themes: item.top_themes as Array<{ word: string; count: number }>,
          subscribers: item.subscribers
        }));

        setSubredditData(formattedData);
        return true; // Data found and loaded
      }

      return false; // No stored data found
    } catch (error) {
      console.error('Error fetching stored analytics:', error);
      return false;
    }
  };

  const fetchStoredRedditPosts = async () => {
    try {
      const { data: storedPosts, error } = await supabase
        .from('reddit_posts_analysis')
        .select('*')
        .eq('website_url', websiteUrl)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(error.message);
      }

      if (storedPosts && storedPosts.length > 0) {
        const formattedPosts = storedPosts.map(post => ({
          id: post.id,
          title: post.title,
          content: post.content,
          subreddit: post.subreddit,
          author: post.author,
          score: post.score,
          url: post.url,
          aiComment: post.ai_comment
        }));

        setRedditPosts(formattedPosts);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error fetching stored posts:', error);
      return false;
    }
  };

  const storeSubredditAnalytics = async (analyticsData: SubredditData[]) => {
    try {
      // Clear existing analytics for this website
      await supabase
        .from('reddit_subreddit_analytics')
        .delete()
        .eq('website_url', websiteUrl);

      // Store new analytics
      const dataToStore = analyticsData.map(item => ({
        website_url: websiteUrl,
        subreddit: item.subreddit,
        engagement_rate: item.engagement_rate,
        visibility_score: item.visibility_score,
        active_posters: item.active_posters,
        strictness_index: item.strictness_index,
        top_themes: item.top_themes,
        subscribers: item.subscribers
      }));

      const { error } = await supabase
        .from('reddit_subreddit_analytics')
        .insert(dataToStore);

      if (error) {
        console.error('Error storing analytics:', error);
      }
    } catch (error) {
      console.error('Error storing analytics:', error);
    }
  };

  const storeRedditPosts = async (postsData: RedditPost[]) => {
    try {
      // Clear existing posts for this website
      await supabase
        .from('reddit_posts_analysis')
        .delete()
        .eq('website_url', websiteUrl);

      // Store new posts
      const dataToStore = postsData.map(post => ({
        website_url: websiteUrl,
        post_id: post.id,
        title: post.title,
        content: post.content,
        subreddit: post.subreddit,
        author: post.author,
        score: post.score,
        url: post.url,
        ai_comment: post.aiComment
      }));

      const { error } = await supabase
        .from('reddit_posts_analysis')
        .insert(dataToStore);

      if (error) {
        console.error('Error storing posts:', error);
      }
    } catch (error) {
      console.error('Error storing posts:', error);
    }
  };

  const fetchSubredditAnalytics = async (forceRegenerate = false) => {
    // If not forcing regeneration, try to load stored data first
    if (!forceRegenerate) {
      const hasStoredData = await fetchStoredSubredditAnalytics();
      if (hasStoredData) {
        return; // Use stored data
      }
    }

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
            subreddits: topSubreddits.map((r: any) => r.subreddit),
            websiteUrl
          }
        });
        
        if (analyticsError) {
          throw new Error(analyticsError.message);
        }
        
        const formattedAnalytics = analyticsData.analytics || [];
        setSubredditData(formattedAnalytics);
        
        // Store the analytics data
        await storeSubredditAnalytics(formattedAnalytics);
        
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

  const fetchRedditPosts = async (forceRegenerate = false) => {
    if (subredditData.length === 0) return;
    
    // If not forcing regeneration, try to load stored data first
    if (!forceRegenerate) {
      const hasStoredPosts = await fetchStoredRedditPosts();
      if (hasStoredPosts) {
        return; // Use stored data
      }
    }
    
    setIsLoadingPosts(true);
    try {
      const { data, error } = await supabase.functions.invoke('fetch-reddit-posts', {
        body: { 
          subreddits: subredditData.map(s => s.subreddit),
          websiteUrl
        }
      });
      
      if (error) {
        throw new Error(error.message);
      }
      
      const posts = data.posts || [];
      setRedditPosts(posts);
      
      // Store the posts data
      await storeRedditPosts(posts);
    } catch (err: any) {
      console.error('Error fetching Reddit posts:', err);
      toast({
        title: 'Error',
        description: 'Failed to load Reddit posts',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingPosts(false);
    }
  };

  const handleSubredditDrilldown = (subreddit: string) => {
    // Store the drilled down subreddit in sessionStorage
    sessionStorage.setItem('selected_subreddit', subreddit);
    navigate('/research');
  };

  useEffect(() => {
    if (websiteUrl) {
      fetchSubredditAnalytics();
    }
  }, [websiteUrl]);

  useEffect(() => {
    if (subredditData.length > 0) {
      fetchRedditPosts();
    }
  }, [subredditData]);

  const handleRegenerate = async () => {
    // Force regenerate both analytics and posts
    await fetchSubredditAnalytics(true);
    if (subredditData.length > 0) {
      await fetchRedditPosts(true);
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const InfoTooltip = ({ kpiKey }: { kpiKey: keyof typeof KPI_EXPLANATIONS }) => {
    const kpi = KPI_EXPLANATIONS[kpiKey];
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button className="inline-flex items-center justify-center">
              <Info className="h-4 w-4 text-gray-400 hover:text-gray-600 cursor-pointer" />
            </button>
          </TooltipTrigger>
          <TooltipContent className="max-w-md p-4" side="top">
            <div className="space-y-3">
              <h4 className="font-semibold text-lg">{kpi.title}</h4>
              <div>
                <p className="text-sm font-medium mb-1">{kpi.description}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Good Score Range:</p>
                <p className="text-xs whitespace-pre-line text-gray-700">{kpi.goodRange}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Significance:</p>
                <p className="text-xs text-gray-600">{kpi.significance}</p>
              </div>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
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
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="p-1 h-8 w-8 hover:bg-marketing-purple/20"
                    onClick={() => handleSubredditDrilldown(data.subreddit)}
                  >
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardTitle>
              <div className="text-sm text-gray-600">
                {formatNumber(data.subscribers)} members
              </div>
            </CardHeader>
            
            <CardContent className="pt-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <div className="flex-1">
                    <div className="flex items-center gap-1">
                      <div className="text-xs text-gray-500">Engagement Rate</div>
                      <InfoTooltip kpiKey="engagement_rate" />
                    </div>
                    <div className="font-semibold">{(data.engagement_rate * 100).toFixed(2)}%</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-600" />
                  <div className="flex-1">
                    <div className="flex items-center gap-1">
                      <div className="text-xs text-gray-500">Visibility Score</div>
                      <InfoTooltip kpiKey="visibility_score" />
                    </div>
                    <div className="font-semibold">{data.visibility_score.toFixed(0)}</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-purple-600" />
                  <div className="flex-1">
                    <div className="flex items-center gap-1">
                      <div className="text-xs text-gray-500">Active Posters</div>
                      <InfoTooltip kpiKey="active_posters" />
                    </div>
                    <div className="font-semibold">{data.active_posters}</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-orange-600" />
                  <div className="flex-1">
                    <div className="flex items-center gap-1">
                      <div className="text-xs text-gray-500">Mod Strictness</div>
                      <InfoTooltip kpiKey="strictness_index" />
                    </div>
                    <div className="font-semibold">{(data.strictness_index * 100).toFixed(0)}%</div>
                  </div>
                </div>
              </div>
              
              <div>
                <div className="flex items-center gap-1 mb-2">
                  <div className="text-xs text-gray-500">Top Content Themes</div>
                  <InfoTooltip kpiKey="top_themes" />
                </div>
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

      {/* Reddit Posts Section */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-gray-900">Relevant Posts & AI Comments</h2>
        
        {isLoadingPosts ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-marketing-purple mx-auto mb-4"></div>
            <p className="text-gray-500">Finding relevant posts...</p>
          </div>
        ) : redditPosts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {redditPosts.map((post) => (
              <Card key={post.id} className="border hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-marketing-purple">r/{post.subreddit}</span>
                    <span className="text-xs text-gray-500">↑ {post.score}</span>
                  </div>
                  <CardTitle className="text-lg leading-tight">{post.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-sm text-gray-600 line-clamp-3">
                    {post.content}
                  </div>
                  <div className="border-t pt-3">
                    <p className="text-xs font-medium text-gray-700 mb-2">AI Generated Comment:</p>
                    <p className="text-sm text-gray-800 italic">{post.aiComment}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => window.open(post.url, '_blank')}
                  >
                    View on Reddit
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">No relevant posts found.</p>
          </div>
        )}
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
