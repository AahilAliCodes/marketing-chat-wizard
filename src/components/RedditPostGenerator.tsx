
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
}

const RedditPostGenerator: React.FC<RedditPostGeneratorProps> = ({ websiteUrl, onGenerate }) => {
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

    setIsGenerating(true);
    
    try {
      // First check if we already have generated posts for this URL
      const { data: existingPosts, error: fetchError } = await supabase
        .from('generated_reddit_posts')
        .select('*')
        .eq('website_url', websiteUrl);
      
      if (fetchError) {
        console.error('Error fetching existing posts:', fetchError);
      }
      
      // If we have existing posts, use those instead of generating new ones
      if (existingPosts && existingPosts.length > 0) {
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
      
      // If no existing posts, generate new ones
      const { data, error } = await supabase.functions.invoke('generate-reddit-posts', {
        body: { 
          websiteUrl,
          prompt: prompt || "Create engaging Reddit posts that would perform well",
          numPosts: numPosts || 4
        },
      });

      if (error) {
        throw new Error(error.message);
      }
      
      if (data?.posts && data.posts.length > 0) {
        // Save the generated posts to the database
        const postsToInsert = data.posts.map(post => ({
          website_url: websiteUrl,
          title: post.title,
          content: post.content,
          image_url: post.imageUrl,
          subreddit: post.subreddit
        }));
        
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
        }
        
        if (onGenerate) {
          onGenerate(data.posts);
        }
        
        toast({
          title: "Posts Generated",
          description: `Successfully created ${data.posts.length} Reddit posts`
        });
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
          <Input
            id="numPosts"
            type="number"
            min={1}
            max={8}
            value={numPosts}
            onChange={(e) => setNumPosts(parseInt(e.target.value) || 4)}
            className="w-32"
          />
        </div>
      </div>

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
    </div>
  );
};

export default RedditPostGenerator;
