
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Bot, MessageSquare, Users, ExternalLink, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { SessionManager } from '@/utils/sessionManager';

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
  const { toast } = useToast();

  const fetchStoredPosts = async () => {
    try {
      // First check session cache
      const sessionKey = `post_recommendations_${websiteUrl}`;
      const cachedData = SessionManager.getSessionData(sessionKey);
      
      if (cachedData) {
        console.log('Found cached post recommendations');
        setPosts(cachedData);
        setIsLoading(false);
        return true;
      }

      // Then check database
      const { data: storedPosts, error } = await supabase
        .from('reddit_post_recommendations')
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
        const formattedPosts = storedPosts.map(post => ({
          id: post.id,
          subreddit: post.subreddit,
          title: post.title,
          content: post.content,
          reasoning: post.reasoning || '',
          subscribers: post.subscribers,
          engagement_tip: post.engagement_tip
        }));

        setPosts(formattedPosts);
        
        // Cache in session
        SessionManager.setSessionData(sessionKey, formattedPosts);
        
        setIsLoading(false);
        return true;
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
    if (forceRegenerate) setIsRegenerating(true);

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
        setPosts(data.posts);
        
        // Cache in session
        SessionManager.setSessionData(`post_recommendations_${websiteUrl}`, data.posts);
        
        if (forceRegenerate) {
          toast({
            title: 'Success',
            description: 'New post recommendations have been generated',
          });
        }
      }
    } catch (err: any) {
      console.error('Error generating post recommendations:', err);
      toast({
        title: 'Error',
        description: 'Failed to generate post recommendations',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
      setIsRegenerating(false);
    }
  };

  const handleRegenerate = async () => {
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
          <h1 className="text-3xl font-bold text-gray-900">Reddit Post Recommendations</h1>
          <p className="text-gray-600 mt-2">AI-generated posts designed to spark engagement in relevant subreddits</p>
        </div>
        <Button
          onClick={handleRegenerate}
          disabled={isLoading || isRegenerating}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isRegenerating ? 'animate-spin' : ''}`} />
          Regenerate
        </Button>
      </div>

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
                    <span className="text-sm font-medium text-marketing-purple">r/{post.subreddit}</span>
                  </div>
                  {post.subscribers && (
                    <span className="text-xs text-gray-500">{post.subscribers} members</span>
                  )}
                </div>
                <CardTitle className="text-lg leading-tight">{post.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm text-gray-700 whitespace-pre-wrap max-h-32 overflow-y-auto">
                  {post.content}
                </div>
                
                {post.reasoning && (
                  <div className="border-t pt-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Bot className="h-4 w-4 text-blue-600" />
                      <p className="text-xs font-medium text-gray-700">AI Strategy:</p>
                    </div>
                    <p className="text-xs text-gray-600 italic">{post.reasoning}</p>
                  </div>
                )}

                {post.engagement_tip && (
                  <div className="bg-blue-50 p-3 rounded-md">
                    <div className="flex items-center gap-2 mb-1">
                      <MessageSquare className="h-4 w-4 text-blue-600" />
                      <p className="text-xs font-medium text-blue-700">Engagement Tip:</p>
                    </div>
                    <p className="text-xs text-blue-600">{post.engagement_tip}</p>
                  </div>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
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
          <p className="text-gray-500">No post recommendations available. Try generating new recommendations.</p>
        </div>
      )}
    </div>
  );
};

export default PostRecommender;
