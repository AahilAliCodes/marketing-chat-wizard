
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Image, FileText, Upload } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

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
  const [useCustomImage, setUseCustomImage] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          title: "File too large",
          description: "The image must be less than 5MB",
          variant: "destructive"
        });
        return;
      }
      setSelectedFile(file);
      // Create a preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setUploadedImageUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const uploadImage = async () => {
    if (!selectedFile) return null;
    
    setIsUploading(true);
    try {
      const fileName = `${Date.now()}-${selectedFile.name}`;
      const { data, error } = await supabase.storage
        .from('reddit-images')
        .upload(fileName, selectedFile);
      
      if (error) throw error;
      
      const { data: urlData } = supabase.storage
        .from('reddit-images')
        .getPublicUrl(data.path);
        
      setIsUploading(false);
      return urlData.publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: "Upload Failed",
        description: "Failed to upload image. Please try again.",
        variant: "destructive"
      });
      setIsUploading(false);
      return null;
    }
  };
  
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
    const requestedPosts = numPosts || 1;
    const totalPostsAfterGeneration = generatedCount + requestedPosts;
    
    if (!useCustomImage && totalPostsAfterGeneration > FREE_POST_LIMIT) {
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
      // If using a custom image, upload it first
      let customImageUrl = null;
      if (useCustomImage && selectedFile) {
        customImageUrl = await uploadImage();
        if (!customImageUrl) {
          setIsGenerating(false);
          return;
        }
      }
      
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
      if (!useCustomImage && existingPosts && existingPosts.length > 0) {
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
      const postsToGenerate = useCustomImage ? 
        numPosts : 
        Math.min(numPosts, FREE_POST_LIMIT - generatedCount);
      
      console.log('Generating new posts for URL:', websiteUrl);
      console.log('Number of posts to generate:', postsToGenerate);
      console.log('Using prompt:', prompt || "Default prompt");
      
      const { data, error } = await supabase.functions.invoke('generate-reddit-posts', {
        body: { 
          websiteUrl,
          prompt: prompt || "Create engaging Reddit posts that would perform well",
          numPosts: postsToGenerate,
          customImage: customImageUrl
        },
      });

      if (error) {
        console.error('Function invoke error:', error);
        throw new Error(error.message);
      }
      
      console.log('Generated posts response:', data);
      
      if (data?.posts && data.posts.length > 0) {
        // Only save to database if not using custom image
        if (!useCustomImage) {
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
        }
        
        if (onGenerate) {
          onGenerate(data.posts);
        }
        
        toast({
          title: "Posts Generated",
          description: `Successfully created ${data.posts.length} Reddit posts`
        });
        
        // If this generation brings us to the limit and we're not using a custom image, notify the user
        if (!useCustomImage && generatedCount + data.posts.length >= FREE_POST_LIMIT) {
          toast({
            title: "Free Limit Reached",
            description: "You've reached your free limit of 4 Reddit posts. Upgrade to generate more or use your own images.",
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
  const atFreeLimit = !useCustomImage && generatedCount >= FREE_POST_LIMIT;

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
              max={useCustomImage ? 8 : (atFreeLimit ? 0 : Math.min(8, remainingPosts))}
              value={numPosts}
              onChange={(e) => setNumPosts(parseInt(e.target.value) || 1)}
              className="w-32"
              disabled={atFreeLimit && !useCustomImage}
            />
            <span className="text-sm text-gray-500">
              {!useCustomImage && (atFreeLimit
                ? "Free limit reached"
                : `${remainingPosts} remaining in free plan`)}
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="useCustomImage" 
              checked={useCustomImage} 
              onCheckedChange={(checked) => setUseCustomImage(checked === true)}
            />
            <Label htmlFor="useCustomImage">Use my own image (unlimited posts)</Label>
          </div>
          
          {useCustomImage && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Input
                  id="imageUpload"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="w-full"
                />
                <Upload className="h-5 w-5 text-gray-400" />
              </div>
              
              {uploadedImageUrl && (
                <div className="mt-2 border rounded-md p-2">
                  <p className="text-xs text-gray-500 mb-2">Preview:</p>
                  <div className="h-40 w-full">
                    <AspectRatio ratio={16/9} className="bg-gray-100 rounded-md overflow-hidden">
                      <img 
                        src={uploadedImageUrl} 
                        alt="Preview" 
                        className="object-contain w-full h-full"
                      />
                    </AspectRatio>
                  </div>
                </div>
              )}
              
              <p className="text-xs text-gray-500">
                Upload your own image and generate unlimited posts. Image must be less than 5MB.
              </p>
            </div>
          )}
        </div>
      </div>

      {atFreeLimit && !useCustomImage ? (
        <Button 
          onClick={onLimitReached} 
          className="bg-marketing-purple hover:bg-marketing-purple/90"
        >
          Upgrade to Generate More Posts
        </Button>
      ) : (
        <Button 
          onClick={generatePosts} 
          disabled={isGenerating || !websiteUrl || (useCustomImage && !selectedFile)}
          className="bg-marketing-purple hover:bg-marketing-purple/90"
        >
          {isGenerating || isUploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
              {isUploading ? "Uploading Image..." : "Generating Posts..."}
            </>
          ) : (
            <>
              Generate Reddit Posts
            </>
          )}
        </Button>
      )}

      {!atFreeLimit && !useCustomImage && (
        <p className="text-xs text-gray-500 mt-2">
          Free accounts can generate up to 4 Reddit posts per website. Upgrade for unlimited posts or use your own images.
        </p>
      )}
      
      {useCustomImage && (
        <p className="text-xs text-gray-500 mt-2">
          Using your own image lets you generate unlimited posts without hitting the free limit.
        </p>
      )}
    </div>
  );
};

export default RedditPostGenerator;
