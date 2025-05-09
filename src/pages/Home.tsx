
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const Home = () => {
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [recentWebsiteUrl, setRecentWebsiteUrl] = useState<string | null>(null);
  const [campaignButtons, setCampaignButtons] = useState<string[]>([]);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Fetch recent website and campaign titles when component mounts
  useEffect(() => {
    const fetchRecentData = async () => {
      try {
        const { data: recentAnalysis } = await supabase
          .from('website_analyses')
          .select('website_url')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
        
        if (recentAnalysis) {
          setRecentWebsiteUrl(recentAnalysis.website_url);
          
          // Fetch campaign titles
          const { data: recommendations } = await supabase
            .from('campaign_recommendations')
            .select('title')
            .eq('website_url', recentAnalysis.website_url);
            
          if (recommendations && recommendations.length > 0) {
            // Extract unique titles, limit to 4
            const uniqueTitles = [...new Set(recommendations.map(rec => rec.title))].slice(0, 4);
            setCampaignButtons(uniqueTitles);
          }
        }
      } catch (error) {
        console.error('Error fetching recent data:', error);
      }
    };
    
    fetchRecentData();
  }, []);

  const handleAnalyzeWebsite = async () => {
    if (!websiteUrl) {
      toast({
        title: 'Error',
        description: 'Please enter a website URL',
        variant: 'destructive',
      });
      return;
    }

    // Simple URL validation
    if (!/^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/.test(websiteUrl)) {
      toast({
        title: 'Invalid URL',
        description: 'Please enter a valid website URL',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsLoading(true);
      
      // Format URL with https if not provided
      const formattedUrl = websiteUrl.startsWith('http') ? websiteUrl : `https://${websiteUrl}`;
      
      // Navigate to dashboard with loading state
      navigate('/dashboard', { 
        state: { 
          isAnalyzing: true,
          websiteUrl: formattedUrl 
        }
      });
    } catch (error) {
      setIsLoading(false);
      console.error('Error:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to analyze website',
        variant: 'destructive',
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAnalyzeWebsite();
    }
  };
  
  const handleCampaignClick = (campaignTitle: string) => {
    if (recentWebsiteUrl) {
      navigate('/dashboard', { 
        state: { 
          websiteUrl: recentWebsiteUrl,
          campaignTitle: campaignTitle 
        }
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-white to-gray-50">
      <header className="container mx-auto p-4 flex justify-between items-center">
        <div className="flex items-center">
          <div className="flex items-center justify-center w-8 h-8 bg-marketing-purple rounded-md mr-2">
            <span className="text-white font-bold">M</span>
          </div>
          <span className="text-xl font-bold">MarketGPT</span>
        </div>
        <Link to="/auth" className="text-marketing-purple font-medium">
          Sign In
        </Link>
      </header>

      <main className="flex-1 container mx-auto px-4 py-16 md:py-24 flex flex-col items-center text-center">
        <div className="bg-marketing-purple/10 text-marketing-purple font-medium px-4 py-2 rounded-full mb-6">
          AI-Powered Marketing Assistant
        </div>
        
        <h1 className="text-4xl md:text-6xl font-bold mb-6 max-w-5xl">
          Launch <span className="text-marketing-purple">high-performing</span> ad campaigns in seconds
        </h1>
        
        <p className="text-lg md:text-xl text-gray-600 mb-12 max-w-3xl">
          MarketGPT uses AI to analyze your business needs and create optimized marketing strategies tailored to your specific goals.
        </p>
        
        <div className="w-full max-w-3xl bg-white rounded-xl shadow-lg p-8 mb-12">
          <div className="bg-white border border-gray-200 rounded-lg flex items-center p-2 mb-6 focus-within:ring-2 focus-within:ring-marketing-purple focus-within:border-marketing-purple">
            <input 
              type="text" 
              placeholder="Enter your business website URL" 
              className="flex-1 p-2 outline-none text-gray-700"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isLoading}
            />
            <button 
              onClick={handleAnalyzeWebsite}
              disabled={isLoading}
              className="text-marketing-purple hover:text-marketing-purple/80 p-2"
            >
              <Send className="h-5 w-5" />
            </button>
          </div>
          
          {recentWebsiteUrl && campaignButtons.length > 0 && (
            <div className="border-t pt-6">
              <h3 className="text-lg font-medium mb-3">Continue exploring your marketing strategy</h3>
              <p className="text-sm text-gray-500 mb-4">For: {recentWebsiteUrl}</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {campaignButtons.map((title, index) => (
                  <Button 
                    key={title}
                    variant={index % 2 === 0 ? "default" : "outline"}
                    className={index % 2 === 0 ? "border border-marketing-purple bg-marketing-purple hover:bg-marketing-purple/90" : "border border-marketing-purple text-marketing-purple hover:bg-marketing-purple/10"}
                    onClick={() => handleCampaignClick(title)}
                  >
                    {title} <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                ))}
              </div>
              
              <Button 
                variant="link" 
                className="mt-4 text-marketing-purple"
                onClick={() => navigate('/dashboard')}
              >
                View all campaigns
              </Button>
            </div>
          )}
        </div>
        
        <div className="text-sm text-gray-500 max-w-2xl">
          Start crafting intelligent marketing campaigns that convert with our AI-powered platform. No credit card required to begin.
        </div>
      </main>
    </div>
  );
};

export default Home;
