import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { Skeleton } from '@/components/ui/skeleton';
import { RefreshCw, ArrowRight, TrendingUp, Users, MessageSquare, Shield, Info, Loader2, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { SessionManager } from '@/utils/sessionManager';

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
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(true);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);
  const [isGeneratingPosts, setIsGeneratingPosts] = useState(false);
  const [generationStep, setGenerationStep] = useState<string>('');
  const [postsError, setPostsError] = useState<string>('');
  const { toast } = useToast();
  const navigate = useNavigate();

  // Function to ensure unique subreddits
  const ensureUniqueSubreddits = (subreddits: SubredditData[]) => {
    const seen = new Set();
    const unique = [];
    
    for (const subreddit of subreddits) {
      const name = subreddit.subreddit.toLowerCase().trim();
      if (!seen.has(name)) {
        seen.add(name);
        unique.push(subreddit);
      }
    }
    
    console.log(`Filtered ${subreddits.length} -> ${unique.length} unique subreddits for display`);
    return unique;
  };

  const fetchStoredSubredditAnalytics = async () => {
    try {
      console.log('Fetching stored analytics for:', websiteUrl);
      setIsLoadingAnalytics(true);

      // First check session cache using dashboard-specific method
      const cachedData = SessionManager.getDashboardAnalytics(websiteUrl);
      
      if (cachedData && Array.isArray(cachedData) && cachedData.length > 0) {
        console.log('Found cached dashboard analytics data:', cachedData.length, 'subreddits');
        setSubredditData(cachedData);
        setIsLoadingAnalytics(false);
        return true;
      }

      // Fallback to legacy session keys
      const legacyCachedData = SessionManager.getSessionData(`analytics_${websiteUrl}`);
      if (legacyCachedData && Array.isArray(legacyCachedData) && legacyCachedData.length > 0) {
        console.log('Found legacy cached analytics data, migrating to dashboard format');
        setSubredditData(legacyCachedData);
        // Migrate to new format
        SessionManager.setDashboardAnalytics(websiteUrl, legacyCachedData);
        setIsLoadingAnalytics(false);
        return true;
      }

      // Then check database - use maybeSingle to avoid 406 errors when no data exists
      const { data: storedAnalytics, error } = await supabase
        .from('reddit_subreddit_analytics')
        .select('*')
        .eq('website_url', websiteUrl)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Database error fetching analytics:', error);
        setIsLoadingAnalytics(false);
        return false;
      }

      if (storedAnalytics && storedAnalytics.length > 0) {
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
        
        // Cache in session using dashboard-specific method
        SessionManager.setDashboardAnalytics(websiteUrl, formattedData);
        
        setIsLoadingAnalytics(false);
        return true;
      }

      setIsLoadingAnalytics(false);
      return false;
    } catch (error) {
      console.error('Error fetching stored analytics:', error);
      setIsLoadingAnalytics(false);
      return false;
    }
  };

  const fetchStoredRedditPosts = async () => {
    try {
      console.log('Fetching stored posts for:', websiteUrl);
      setIsLoadingPosts(true);

      // First check session cache using dashboard-specific method
      const cachedData = SessionManager.getDashboardPosts(websiteUrl);
      
      if (cachedData && Array.isArray(cachedData) && cachedData.length > 0) {
        console.log('Found cached dashboard posts data:', cachedData.length, 'posts');
        setRedditPosts(cachedData);
        setIsLoadingPosts(false);
        return true;
      }

      // Fallback to legacy session keys
      const legacyCachedData = SessionManager.getSessionData(`posts_${websiteUrl}`);
      if (legacyCachedData && Array.isArray(legacyCachedData) && legacyCachedData.length > 0) {
        console.log('Found legacy cached posts data, migrating to dashboard format');
        setRedditPosts(legacyCachedData);
        // Migrate to new format
        SessionManager.setDashboardPosts(websiteUrl, legacyCachedData);
        setIsLoadingPosts(false);
        return true;
      }

      // Then check database
      const { data: storedPosts, error } = await supabase
        .from('reddit_posts_analysis')
        .select('*')
        .eq('website_url', websiteUrl)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Database error fetching posts:', error);
        setIsLoadingPosts(false);
        return false;
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
        
        // Cache in session using dashboard-specific method
        SessionManager.setDashboardPosts(websiteUrl, formattedPosts);
        
        setIsLoadingPosts(false);
        return true;
      }

      setIsLoadingPosts(false);
      return false;
    } catch (error) {
      console.error('Error fetching stored posts:', error);
      setIsLoadingPosts(false);
      return false;
    }
  };

  const fetchSubredditAnalytics = async (forceRegenerate = false) => {
    if (!forceRegenerate) {
      const hasStoredData = await fetchStoredSubredditAnalytics();
      if (hasStoredData) {
        return;
      }
    }

    setIsLoadingAnalytics(true);
    if (forceRegenerate) {
      setIsRegenerating(true);
      setGenerationStep('Finding high-quality subreddits...');
    }

    try {
      console.log('Generating new subreddit analytics for:', websiteUrl);
      
      // Get currently displayed subreddits to exclude them from regeneration
      const excludeSubreddits = forceRegenerate ? subredditData.map(s => s.subreddit) : [];
      
      setGenerationStep('Analyzing subreddit recommendations...');
      
      const { data: analysisData, error: analysisError } = await supabase.functions.invoke('analyze-subreddits', {
        body: { 
          websiteUrl,
          forceRegenerate,
          excludeSubreddits
        }
      });
      
      if (analysisError) {
        throw new Error(analysisError.message);
      }

      if (analysisData?.recommendations && analysisData.recommendations.length > 0) {
        console.log(`Received ${analysisData.recommendations.length} subreddit recommendations`);
        
        setGenerationStep('Calculating engagement metrics...');
        
        // Take all recommendations for analytics (up to 3)
        const subredditsForAnalysis = analysisData.recommendations.slice(0, 3);
        
        // Ensure uniqueness before sending to analytics
        const uniqueSubreddits = ensureUniqueSubreddits(subredditsForAnalysis.map((r: any) => ({ subreddit: r.subreddit })));
        
        const { data: analyticsData, error: analyticsError } = await supabase.functions.invoke('reddit-analytics', {
          body: { 
            subreddits: uniqueSubreddits.map((r: any) => r.subreddit),
            websiteUrl
          }
        });
        
        if (analyticsError) {
          throw new Error(analyticsError.message);
        }
        
        console.log(`Received analytics for ${analyticsData.analytics?.length || 0} subreddits`);
        
        setGenerationStep('Processing analytics data...');
        
        // Apply more lenient filtering - reduced minimum thresholds
        const activeAnalytics = analyticsData.analytics?.filter((a: any) => {
          const minSubscribers = 500; // Reduced from 1000
          const minEngagementRate = 0.001; // Reduced from 0.005 (0.1% instead of 0.5%)
          
          return a.subscribers >= minSubscribers && a.engagement_rate >= minEngagementRate;
        }) || [];
        
        // Ensure uniqueness in the filtered results
        const uniqueActiveAnalytics = ensureUniqueSubreddits(activeAnalytics);
        
        console.log(`After filtering and deduplication: ${uniqueActiveAnalytics.length} active unique subreddits found`);
        
        let finalAnalytics = [];
        
        if (uniqueActiveAnalytics.length === 0) {
          // If still no results, take the top 3 by subscriber count regardless of thresholds
          const fallbackAnalytics = analyticsData.analytics
            ?.sort((a: any, b: any) => b.subscribers - a.subscribers)
            .slice(0, 3) || [];
          
          const uniqueFallback = ensureUniqueSubreddits(fallbackAnalytics);
          finalAnalytics = uniqueFallback;
          
          console.log(`Using fallback: ${uniqueFallback.length} unique subreddits by subscriber count`);
          
          toast({
            title: 'Analytics Generated',
            description: `Generated analytics for ${uniqueFallback.length} subreddits (using fallback criteria)`,
          });
        } else {
          // Sort by engagement rate and take top 3
          const topAnalytics = uniqueActiveAnalytics
            .sort((a: any, b: any) => b.engagement_rate - a.engagement_rate)
            .slice(0, 3);
          
          finalAnalytics = topAnalytics;
          
          toast({
            title: 'Analytics Generated',
            description: `Generated analytics for ${topAnalytics.length} high-quality unique subreddits`,
          });
        }
        
        setSubredditData(finalAnalytics);
        
        // Cache in session using dashboard-specific method
        SessionManager.setDashboardAnalytics(websiteUrl, finalAnalytics);
        
        if (forceRegenerate) {
          toast({
            title: 'Success',
            description: 'New unique subreddit analytics have been generated',
          });
        }
      } else {
        throw new Error('No subreddit recommendations received from analysis');
      }
    } catch (err: any) {
      console.error('Error fetching subreddit analytics:', err);
      toast({
        title: 'Error',
        description: err.message || 'Failed to load subreddit analytics',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingAnalytics(false);
      setIsRegenerating(false);
      setGenerationStep('');
    }
  };

  const fetchRedditPosts = async (forceRegenerate = false) => {
    if (subredditData.length === 0) return;
    
    if (!forceRegenerate) {
      const hasStoredPosts = await fetchStoredRedditPosts();
      if (hasStoredPosts) {
        return;
      }
    }
    
    setIsLoadingPosts(true);
    setIsGeneratingPosts(true);
    setGenerationStep('Analyzing relevant Reddit posts...');
    setPostsError(''); // Clear any previous errors
    
    try {
      console.log('Generating new Reddit posts for:', websiteUrl);
      
      const { data, error } = await supabase.functions.invoke('fetch-reddit-posts', {
        body: { 
          subreddits: subredditData.map(s => s.subreddit),
          websiteUrl
        }
      });
      
      if (error) {
        throw new Error(error.message);
      }
      
      setGenerationStep('Generating AI-powered comments...');
      
      const posts = data.posts || [];
      
      // Validate posts have required content
      const validPosts = posts.filter((post: RedditPost) => 
        post.title && post.title.trim().length > 0 && 
        post.content && post.content.trim().length > 0 &&
        post.aiComment && post.aiComment.trim().length > 0
      );
      
      if (validPosts.length === 0) {
        setPostsError('No valid posts with AI comments could be generated. This might be due to limited relevant content in the selected subreddits or temporary Reddit API issues.');
        return;
      }
      
      setRedditPosts(validPosts);
      
      // Cache in session using dashboard-specific method
      SessionManager.setDashboardPosts(websiteUrl, validPosts);
    } catch (err: any) {
      console.error('Error fetching Reddit posts:', err);
      const errorMessage = err.message || 'Failed to load Reddit posts';
      setPostsError(errorMessage);
      
      toast({
        title: 'Error Loading Posts',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoadingPosts(false);
      setIsGeneratingPosts(false);
      setGenerationStep('');
    }
  };

  const handleSubredditDrilldown = (subreddit: string) => {
    SessionManager.setSessionData('selected_subreddit', subreddit);
    navigate('/research');
  };

  useEffect(() => {
    if (websiteUrl) {
      fetchStoredSubredditAnalytics().then(hasData => {
        if (!hasData) {
          fetchSubredditAnalytics();
        }
      });
    }
  }, [websiteUrl]);

  useEffect(() => {
    if (subredditData.length > 0) {
      fetchStoredRedditPosts().then(hasData => {
        if (!hasData) {
          fetchRedditPosts();
        }
      });
    }
  }, [subredditData]);

  const handleRegenerate = async () => {
    // Clear cached data using dashboard-specific methods
    SessionManager.clearDashboardData(websiteUrl);
    
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
          <TooltipContent className="max-w-md p-4 bg-white border shadow-lg z-50" side="top">
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

  const LoadingCard = ({ title, step }: { title: string; step?: string }) => (
    <Card className="relative overflow-hidden border-2 bg-gradient-to-br from-marketing-purple/5 to-purple-50">
      <CardHeader className="bg-gradient-to-r from-marketing-purple/10 to-marketing-purple/5">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Loader2 className="h-6 w-6 animate-spin text-marketing-purple" />
            <span className="text-lg font-medium text-marketing-purple">{title}</span>
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="pt-6 space-y-4">
        {step && (
          <div className="flex items-center gap-2 mb-4">
            <div className="flex space-x-1">
              {[0, 1, 2].map((dot) => (
                <div 
                  key={dot}
                  className="w-2 h-2 bg-marketing-purple rounded-full animate-bounce" 
                  style={{ animationDelay: `${dot * 0.1}s` }}
                />
              ))}
            </div>
            <span className="text-sm text-gray-600 font-medium">{step}</span>
          </div>
        )}
        
        <div className="grid grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center gap-2">
              <Skeleton className="h-4 w-4 rounded" />
              <div className="flex-1">
                <Skeleton className="h-3 w-20 mb-1" />
                <Skeleton className="h-4 w-12" />
              </div>
            </div>
          ))}
        </div>
        
        <div>
          <Skeleton className="h-3 w-24 mb-2" />
          <div className="flex flex-wrap gap-1">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-6 w-16 rounded-full" />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const SubredditSkeleton = () => (
    <Card className="relative overflow-hidden border-2">
      <CardHeader className="bg-gradient-to-r from-marketing-purple/10 to-marketing-purple/5">
        <CardTitle className="flex items-center justify-between">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-8 w-8 rounded" />
        </CardTitle>
        <Skeleton className="h-4 w-24" />
      </CardHeader>
      
      <CardContent className="pt-4 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center gap-2">
              <Skeleton className="h-4 w-4" />
              <div className="flex-1">
                <Skeleton className="h-3 w-20 mb-1" />
                <Skeleton className="h-4 w-12" />
              </div>
            </div>
          ))}
        </div>
        
        <div>
          <Skeleton className="h-3 w-24 mb-2" />
          <div className="flex flex-wrap gap-1">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-6 w-16 rounded-full" />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const PostSkeleton = () => (
    <Card className="border hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between mb-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-8" />
        </div>
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-5 w-3/4" />
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-1">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
        <div className="border-t pt-3">
          <Skeleton className="h-3 w-32 mb-2" />
          <div className="space-y-1">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </div>
        <Skeleton className="h-8 w-full" />
      </CardContent>
    </Card>
  );

  const ErrorDisplay = ({ error }: { error: string }) => (
    <div className="text-center py-12 bg-red-50 rounded-lg border border-red-200">
      <div className="flex items-center justify-center mb-4">
        <AlertTriangle className="h-8 w-8 text-red-500" />
      </div>
      <h3 className="text-lg font-medium text-red-800 mb-2 font-helvetica">Unable to Load Posts</h3>
      <p className="text-red-600 mb-4 max-w-md mx-auto font-helvetica">{error}</p>
      <Button
        onClick={() => {
          setPostsError('');
          fetchRedditPosts(true);
        }}
        variant="outline"
        size="sm"
        className="border-red-300 text-red-700 hover:bg-red-50"
      >
        <RefreshCw className="h-4 w-4 mr-2" />
        Try Again
      </Button>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 font-helvetica">Reddit Analytics Dashboard</h1>
        <Button
          onClick={handleRegenerate}
          disabled={isLoadingAnalytics || isRegenerating}
          className="flex items-center gap-2 font-helvetica"
        >
          <RefreshCw className={`h-4 w-4 ${isRegenerating ? 'animate-spin' : ''}`} />
          Regenerate
        </Button>
      </div>

      {/* Subreddit Analytics Section with Enhanced Loading */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {(isLoadingAnalytics || isRegenerating) ? (
          <>
            <LoadingCard title="Analyzing Subreddits" step={generationStep} />
            <SubredditSkeleton />
            <SubredditSkeleton />
          </>
        ) : (
          subredditData.map((data, index) => (
            <Card key={`${data.subreddit}-${index}`} className="relative overflow-hidden border-2 hover:shadow-lg transition-shadow">
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
                        key={`${data.subreddit}-theme-${i}-${theme.word}`}
                        className="px-2 py-1 bg-gray-100 text-xs rounded-full"
                      >
                        {theme.word} ({theme.count})
                      </span>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Reddit Posts Section with Enhanced Loading */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900 font-helvetica">Relevant Posts & AI Comments</h2>
          {(isGeneratingPosts || isLoadingPosts) && (
            <div className="flex items-center gap-2 text-marketing-purple">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="text-sm font-medium font-helvetica">
                {generationStep || 'Loading posts...'}
              </span>
            </div>
          )}
        </div>
        
        {postsError ? (
          <ErrorDisplay error={postsError} />
        ) : isLoadingPosts ? (
          <div className="space-y-4">
            {(isGeneratingPosts || generationStep) && (
              <div className="flex items-center justify-center py-8 bg-gradient-to-r from-marketing-purple/5 to-purple-50 rounded-lg border">
                <div className="flex items-center gap-3">
                  <Loader2 className="h-6 w-6 animate-spin text-marketing-purple" />
                  <div className="text-center">
                    <p className="font-medium text-marketing-purple font-helvetica">
                      {generationStep || 'Analyzing relevant Reddit posts...'}
                    </p>
                    <p className="text-sm text-gray-600 font-helvetica">
                      {generationStep.includes('comments') ? 'Creating personalized engagement strategies' : 'Finding high-engagement opportunities'}
                    </p>
                  </div>
                </div>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, index) => (
                <PostSkeleton key={`post-skeleton-${index}`} />
              ))}
            </div>
          </div>
        ) : redditPosts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {redditPosts.map((post) => (
              <Card key={`post-${post.id}`} className="border hover:shadow-md transition-shadow">
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
            <p className="text-gray-500 font-helvetica">No relevant posts found.</p>
          </div>
        )}
      </div>

      {!isLoadingAnalytics && subredditData.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 font-helvetica">No subreddit data available. Try regenerating the analysis.</p>
        </div>
      )}
    </div>
  );
};

export default SubredditAnalytics;
