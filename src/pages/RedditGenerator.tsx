
import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import { Toaster } from '@/components/ui/toaster';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import RedditPostGenerator, { RedditPost } from '@/components/RedditPostGenerator';
import RedditPostsDisplay from '@/components/RedditPostsDisplay';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const RedditGenerator = () => {
  const [activeItem, setActiveItem] = useState<string>('reddit');
  const [websiteUrl, setWebsiteUrl] = useState<string>('');
  const [generatedPosts, setGeneratedPosts] = useState<RedditPost[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState<boolean>(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch the most recent website URL that was analyzed
    const fetchRecentWebsite = async () => {
      try {
        console.log('Fetching recent website analysis');
        const { data: recentAnalysis, error: analysisError } = await supabase
          .from('website_analyses')
          .select('website_url')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
        
        if (analysisError) {
          console.error('Error fetching recent website:', analysisError);
          setIsLoading(false);
          return;
        }
        
        if (recentAnalysis) {
          console.log('Found recent website:', recentAnalysis.website_url);
          setWebsiteUrl(recentAnalysis.website_url);
          
          // Check if there are any existing generated posts for this URL
          console.log('Checking for existing posts for URL:', recentAnalysis.website_url);
          const { data: existingPosts, error: postsError } = await supabase
            .from('generated_reddit_posts')
            .select('*')
            .eq('website_url', recentAnalysis.website_url);
          
          if (postsError) {
            console.error('Error fetching existing posts:', postsError);
          }
          
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
            
            setGeneratedPosts(formattedPosts);
            
            toast({
              title: "Existing Posts Loaded",
              description: `Loaded ${formattedPosts.length} existing Reddit posts for this website`
            });
          } else {
            console.log('No existing posts found');
          }
        }
      } catch (error) {
        console.error('Error in fetchRecentWebsite:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchRecentWebsite();
  }, [toast]);

  const handleGenerate = (posts: RedditPost[]) => {
    setGeneratedPosts(posts);
  };

  const handleBack = () => {
    navigate('/dashboard');
  };

  const handleUpgrade = () => {
    setShowUpgradeDialog(false);
    navigate('/dashboard'); // This should navigate to a billing or subscription page
    toast({
      title: "Upgrade Required",
      description: "This would normally take you to a billing page to upgrade your subscription."
    });
  };

  return (
    <div className="flex h-screen w-full">
      <Sidebar activeItem={activeItem} setActiveItem={setActiveItem} />
      <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="icon" 
              onClick={handleBack}
              className="h-9 w-9"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl font-bold text-marketing-darkPurple">
              Reddit Post Generator
            </h1>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h2 className="text-lg font-semibold mb-4">Generate Reddit Posts</h2>
            <p className="text-gray-500 mb-6">
              Generate engaging Reddit posts with text and images for your website: {websiteUrl}
            </p>
            
            <RedditPostGenerator 
              websiteUrl={websiteUrl} 
              onGenerate={handleGenerate}
              generatedCount={generatedPosts.length}
              onLimitReached={() => setShowUpgradeDialog(true)}
            />
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h2 className="text-lg font-semibold mb-4">Generated Posts</h2>
            {isLoading ? (
              <div className="text-center py-8">
                <p className="text-gray-500">Loading...</p>
              </div>
            ) : (
              <RedditPostsDisplay posts={generatedPosts} />
            )}
          </div>
        </div>
      </div>
      
      <Dialog open={showUpgradeDialog} onOpenChange={setShowUpgradeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Free Limit Reached</DialogTitle>
            <DialogDescription className="pt-4">
              You've reached the limit of 4 free Reddit posts. Upgrade your account to generate more posts and access premium features.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setShowUpgradeDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpgrade} className="bg-marketing-purple hover:bg-marketing-purple/90">
              Upgrade Now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Toaster />
    </div>
  );
};

export default RedditGenerator;
