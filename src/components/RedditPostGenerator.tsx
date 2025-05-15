
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Image, FileText } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { AspectRatio } from '@/components/ui/aspect-ratio';

export interface RedditPost {
  id: string;
  title: string;
  content: string;
  imageUrl: string;
  subreddit: string;
  dateGenerated: string;
}

interface RedditPostGeneratorProps {
  websiteUrl: string;
  onGenerate?: (posts: RedditPost[]) => void;
  generatedCount?: number;
  onLimitReached?: () => void;
}

const FREE_POST_LIMIT = 4;

const RedditPostGenerator: React.FC<RedditPostGeneratorProps> = ({ 
  websiteUrl, 
  onGenerate, 
  generatedCount = 0,
  onLimitReached 
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [numPosts, setNumPosts] = useState(4);
  const { toast } = useToast();
  
  const generatePosts = async () => {
    if (!websiteUrl) {
      toast({
        title: "Missing website URL",
        description: "Please provide a website URL to generate Reddit posts",
        variant: "destructive"
      });
      return;
    }

    // Check if generating more posts would exceed the free limit
    const requestedPosts = numPosts || 4;
    const totalPostsAfterGeneration = generatedCount + requestedPosts;
    
    if (totalPostsAfterGeneration > FREE_POST_LIMIT) {
      // If we already have some generated posts, only allow generating up to the limit
      if (generatedCount < FREE_POST_LIMIT) {
        const remainingPosts = FREE_POST_LIMIT - generatedCount;
        setNumPosts(remainingPosts);
        toast({
          title: "Free limit adjustment",
          description: `You can only generate ${remainingPosts} more posts with your free account`,
        });
      } else {
        // If we've already reached the limit, show the upgrade dialog
        if (onLimitReached) {
          onLimitReached();
        }
        return;
      }
    }

    setIsGenerating(true);
    
    try {
      // First check if we already have generated posts for this URL
      const { data: existingPosts, error: fetchError } = await supabase
        .from('generated_reddit_posts')
        .select('*')
        .eq('website_url', websiteUrl);
      
      if (fetchError) {
        console.error('Error fetching existing posts:', fetchError);
        throw new Error(fetchError.message);
      }
      
      // If we have existing posts, use those instead of generating new ones
      if (existingPosts && existingPosts.length > 0) {
        console.log('Found existing posts:', existingPosts);
        const formattedPosts = existingPosts.map(post => ({
          id: post.id,
          title: post.title,
          content: post.content,
          imageUrl: post.image_url,
          subreddit: post.subreddit,
          dateGenerated: post.created_at
        }));
        
        if (onGenerate) {
          onGenerate(formattedPosts);
        }
        
        toast({
          title: "Existing Posts Loaded",
          description: `Loaded ${formattedPosts.length} existing Reddit posts for this website`
        });
        
        setIsGenerating(false);
        return;
      }
      
      // If no existing posts, generate new ones, but respect the free limit
      const postsToGenerate = Math.min(numPosts, FREE_POST_LIMIT - generatedCount);
      
      console.log('Generating new posts for URL:', websiteUrl);
      const { data, error } = await supabase.functions.invoke('generate-reddit-posts', {
        body: { 
          websiteUrl,
          prompt: prompt || "Create engaging Reddit posts that would perform well",
          numPosts: postsToGenerate
        },
      });

      if (error) {
        console.error('Function invoke error:', error);
        throw new Error(error.message);
      }
      
      console.log('Generated posts response:', data);
      
      if (data?.posts && data.posts.length > 0) {
        // Save the generated posts to the database
        const postsToInsert = data.posts.map(post => ({
          website_url: websiteUrl,
          title: post.title,
          content: post.content,
          image_url: post.imageUrl,
          subreddit: post.subreddit
        }));
        
        console.log('Saving posts to database:', postsToInsert);
        
        const { error: insertError } = await supabase
          .from('generated_reddit_posts')
          .insert(postsToInsert);
          
        if (insertError) {
          console.error('Error saving posts to database:', insertError);
          toast({
            title: "Storage Error",
            description: "Generated posts couldn't be saved to the database",
            variant: "destructive"
          });
        } else {
          console.log('Successfully saved posts to database');
        }
        
        if (onGenerate) {
          onGenerate(data.posts);
        }
        
        toast({
          title: "Posts Generated",
          description: `Successfully created ${data.posts.length} Reddit posts`
        });
        
        // If this generation brings us to the limit, notify the user
        if (generatedCount + data.posts.length >= FREE_POST_LIMIT) {
          toast({
            title: "Free Limit Reached",
            description: "You've reached your free limit of 4 Reddit posts. Upgrade to generate more.",
          });
        }
      }
      
    } catch (error) {
      console.error('Failed to generate posts:', error);
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Failed to generate Reddit posts",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Calculate remaining posts
  const remainingPosts = Math.max(0, FREE_POST_LIMIT - generatedCount);
  const atFreeLimit = generatedCount >= FREE_POST_LIMIT;

  return (
    <div className="space-y-4">
      <div className="flex flex-col space-y-4">
        <div>
          <label htmlFor="prompt" className="block text-sm font-medium text-gray-700 mb-1">
            Generation Prompt (Optional)
          </label>
          <Input
            id="prompt"
            placeholder="Create engaging Reddit posts for this website that..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="w-full"
          />
          <p className="text-xs text-gray-500 mt-1">
            Provide specific instructions for the AI to follow when creating posts
          </p>
        </div>
        
        <div>
          <label htmlFor="numPosts" className="block text-sm font-medium text-gray-700 mb-1">
            Number of Posts
          </label>
          <div className="flex items-center gap-2">
            <Input
              id="numPosts"
              type="number"
              min={1}
              max={atFreeLimit ? 0 : Math.min(8, remainingPosts)}
              value={numPosts}
              onChange={(e) => setNumPosts(parseInt(e.target.value) || 4)}
              className="w-32"
              disabled={atFreeLimit}
            />
            <span className="text-sm text-gray-500">
              {atFreeLimit
                ? "Free limit reached"
                : `${remainingPosts} remaining in free plan`}
            </span>
          </div>
        </div>
      </div>

      {atFreeLimit ? (
        <Button 
          onClick={onLimitReached} 
          className="bg-marketing-purple hover:bg-marketing-purple/90"
        >
          Upgrade to Generate More Posts
        </Button>
      ) : (
        <Button 
          onClick={generatePosts} 
          disabled={isGenerating || !websiteUrl}
          className="bg-marketing-purple hover:bg-marketing-purple/90"
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
              Generating Posts...
            </>
          ) : (
            <>
              Generate Reddit Posts
            </>
          )}
        </Button>
      )}

      {!atFreeLimit && (
        <p className="text-xs text-gray-500 mt-2">
          Free accounts can generate up to 4 Reddit posts per website. Upgrade for unlimited posts.
        </p>
      )}
    </div>
  );
};

export default RedditPostGenerator;
