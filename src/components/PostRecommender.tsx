
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Bot, MessageSquare, Users, ExternalLink, RefreshCw, Lock, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { SessionManager } from '@/utils/sessionManager';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import AgenticWorkflow from './AgenticWorkflow';

interface RedditPost {
  id: string;
  subreddit: string;
  title: string;
  content: string;
  reasoning: string;
  subscribers?: string;
  engagement_tip?: string;
}

interface PostRecommenderProps {
  websiteUrl: string;
}

const PostRecommender: React.FC<PostRecommenderProps> = ({ websiteUrl }) => {
  const [posts, setPosts] = useState<RedditPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [showWorkflow, setShowWorkflow] = useState<boolean>(false);
  const [isGenerationComplete, setIsGenerationComplete] = useState<boolean>(false);
  const [isLoadingPosts, setIsLoadingPosts] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();

  const fetchStoredPosts = async () => {
    try {
      // First check session cache
      const sessionKey = `post_recommendations_${websiteUrl}`;
      const cachedData = SessionManager.getSessionData(sessionKey);
      
      if (cachedData && cachedData.length > 0) {
        console.log('Found cached post recommendations');
        setPosts(cachedData);
        setIsLoading(false);
        return true;
      }

      // Then check database - using raw query to avoid TypeScript issues
      const { data: storedPosts, error } = await supabase
        .from('reddit_post_recommendations' as any)
        .select('*')
        .eq('website_url', websiteUrl)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Database error fetching post recommendations:', error);
        setIsLoading(false);
        return false;
      }

      if (storedPosts && storedPosts.length > 0) {
        const formattedPosts = storedPosts.map((post: any) => ({
          id: post.id,
          subreddit: post.subreddit,
          title: post.title,
          content: post.content,
          reasoning: post.reasoning || '',
          subscribers: post.subscribers,
          engagement_tip: post.engagement_tip
        }));

        // Filter out posts with empty/invalid content
        const validPosts = formattedPosts.filter(post => 
          post.title && post.title.trim().length > 0 && 
          post.content && post.content.trim().length > 0 &&
          post.subreddit && post.subreddit.trim().length > 0
        );

        if (validPosts.length > 0) {
          setPosts(validPosts);
          
          // Cache in session
          SessionManager.setSessionData(sessionKey, validPosts);
          
          setIsLoading(false);
          return true;
        }
      }

      setIsLoading(false);
      return false;
    } catch (error) {
      console.error('Error fetching stored post recommendations:', error);
      setIsLoading(false);
      return false;
    }
  };

  const generatePostRecommendations = async (forceRegenerate = false) => {
    if (!forceRegenerate) {
      const hasStoredData = await fetchStoredPosts();
      if (hasStoredData) {
        return;
      }
    }

    setIsLoading(true);
    setIsLoadingPosts(true);
    if (forceRegenerate) setIsRegenerating(true);
    setShowWorkflow(true);
    setIsGenerationComplete(false);

    try {
      console.log('Generating new post recommendations for:', websiteUrl);
      
      const { data, error } = await supabase.functions.invoke('generate-reddit-post-recommendations', {
        body: { 
          websiteUrl,
          forceRegenerate
        }
      });
      
      if (error) {
        throw new Error(error.message);
      }

      if (data?.posts && data.posts.length > 0) {
        // Filter out posts with missing or empty content
        const validPosts = data.posts.filter((post: RedditPost) => 
          post.title && post.title.trim().length > 0 && 
          post.content && post.content.trim().length > 0 &&
          post.subreddit && post.subreddit.trim().length > 0
        );

        if (validPosts.length === 0) {
          throw new Error('No valid posts could be generated. Please try again.');
        }

        setPosts(validPosts);
        setIsGenerationComplete(true);
        
        // Cache in session
        SessionManager.setSessionData(`post_recommendations_${websiteUrl}`, validPosts);
        
        if (forceRegenerate) {
          toast({
            title: 'Success',
            description: `Generated ${validPosts.length} new post recommendations`,
          });
        }
      } else {
        throw new Error('No posts could be generated. Please try again.');
      }
    } catch (err: any) {
      console.error('Error generating post recommendations:', err);
      setIsGenerationComplete(true);
      toast({
        title: 'Error',
        description: err.message || 'Failed to generate post recommendations',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingPosts(false);
    }
  };

  const handleWorkflowComplete = () => {
    setShowWorkflow(false);
    setIsLoading(false);
    setIsRegenerating(false);
  };

  const handleRegenerate = async () => {
    if (!user) {
      // Store current page for return after auth
      sessionStorage.setItem('authReturnUrl', window.location.pathname);
      toast({
        title: 'Authentication Required',
        description: 'Please sign up for an account to access post generation features',
        variant: 'destructive',
      });
      navigate('/auth');
      return;
    }
    
    // Clear cached data
    SessionManager.removeSessionData(`post_recommendations_${websiteUrl}`);
    await generatePostRecommendations(true);
  };

  useEffect(() => {
    if (websiteUrl) {
      fetchStoredPosts().then(hasData => {
        if (!hasData) {
          generatePostRecommendations();
        }
      });
    }
  }, [websiteUrl]);

  const PostSkeleton = () => (
    <Card className="border hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between mb-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-16" />
        </div>
        <Skeleton className="h-6 w-full" />
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
        <div className="border-t pt-3">
          <Skeleton className="h-3 w-24 mb-2" />
          <Skeleton className="h-4 w-full" />
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 font-helvetica">Reddit Post Recommendations</h1>
          <p className="text-gray-600 mt-2 font-helvetica">AI-generated posts designed to spark engagement in relevant subreddits</p>
        </div>
        <div className="flex items-center gap-4">
          {websiteUrl && (
            <span className="text-sm text-gray-600 font-helvetica">
              Website: <span className="font-medium">{websiteUrl}</span>
            </span>
          )}
          {!user ? (
            <div className="flex items-center gap-2">
              <Button
                disabled
                className="flex items-center gap-2 opacity-50 cursor-not-allowed font-helvetica"
              >
                <Lock className="h-4 w-4" />
                <RefreshCw className="h-4 w-4" />
                Regenerate
              </Button>
              <div className="text-right">
                <p className="text-sm text-gray-600 font-helvetica">Join the waitlist to access</p>
                <Button
                  onClick={() => {
                    sessionStorage.setItem('authReturnUrl', window.location.pathname);
                    navigate('/auth');
                  }}
                  size="sm"
                  className="bg-marketing-purple hover:bg-marketing-purple/90 font-helvetica"
                >
                  Make an Account
                </Button>
              </div>
            </div>
          ) : (
            <Button
              onClick={handleRegenerate}
              disabled={isLoading || isRegenerating || showWorkflow || isLoadingPosts}
              className="flex items-center gap-2 font-helvetica"
            >
              {isRegenerating || isLoadingPosts ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              {isLoadingPosts ? 'Generating...' : 'Regenerate'}
            </Button>
          )}
        </div>
      </div>

      {/* Show embedded workflow while loading */}
      {showWorkflow && (
        <AgenticWorkflow 
          isVisible={showWorkflow} 
          isComplete={isGenerationComplete}
          onComplete={handleWorkflowComplete}
          embedded={true}
        />
      )}

      {/* Loading indicator for posts */}
      {isLoadingPosts && !showWorkflow && (
        <div className="flex items-center justify-center py-8">
          <div className="flex items-center gap-3 text-marketing-purple">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="font-medium font-helvetica">Generating relevant posts and AI comments...</span>
          </div>
        </div>
      )}

      {/* Only show content when not in workflow mode */}
      {!showWorkflow && !isLoadingPosts && (
        <>
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[...Array(6)].map((_, index) => (
                <PostSkeleton key={index} />
              ))}
            </div>
          ) : posts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {posts.map((post) => (
                <Card key={post.id} className="border hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-marketing-purple" />
                        <span className="text-sm font-medium text-marketing-purple font-helvetica">r/{post.subreddit}</span>
                      </div>
                      {post.subscribers && (
                        <span className="text-xs text-gray-500 font-helvetica">{post.subscribers} members</span>
                      )}
                    </div>
                    <CardTitle className="text-lg leading-tight font-helvetica">{post.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-sm text-gray-700 whitespace-pre-wrap max-h-32 overflow-y-auto font-helvetica">
                      {post.content}
                    </div>
                    
                    {post.reasoning && (
                      <div className="border-t pt-3">
                        <div className="flex items-center gap-2 mb-2">
                          <Bot className="h-4 w-4 text-blue-600" />
                          <p className="text-xs font-medium text-gray-700 font-helvetica">AI Strategy:</p>
                        </div>
                        <p className="text-xs text-gray-600 italic font-helvetica">{post.reasoning}</p>
                      </div>
                    )}

                    {post.engagement_tip && (
                      <div className="bg-blue-50 p-3 rounded-md">
                        <div className="flex items-center gap-2 mb-1">
                          <MessageSquare className="h-4 w-4 text-blue-600" />
                          <p className="text-xs font-medium text-blue-700 font-helvetica">Engagement Tip:</p>
                        </div>
                        <p className="text-xs text-blue-600 font-helvetica">{post.engagement_tip}</p>
                      </div>
                    )}

                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full font-helvetica"
                      onClick={() => window.open(`https://www.reddit.com/r/${post.subreddit}/submit`, '_blank')}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Post to r/{post.subreddit}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500 font-helvetica">No post recommendations available. Try generating new recommendations.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default PostRecommender;
