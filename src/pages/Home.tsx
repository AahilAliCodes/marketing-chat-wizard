
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const Home = () => {
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Fetch campaign recommendations on component mount
  useEffect(() => {
    const fetchRecommendations = async () => {
      setIsLoadingRecommendations(true);
      try {
        const { data, error } = await supabase
          .from('campaign_recommendations')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (error) {
          throw error;
        }
        
        if (data && data.length > 0) {
          setRecommendations(data);
        }
      } catch (error) {
        console.error('Error fetching recommendations:', error);
      } finally {
        setIsLoadingRecommendations(false);
      }
    };
    
    fetchRecommendations();
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
          
          {/* Campaign Recommendation Buttons */}
          <div className="flex flex-wrap gap-3 justify-center">
            {isLoadingRecommendations ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-marketing-purple" />
              </div>
            ) : recommendations.length > 0 ? (
              // Show unique recommendations by platform
              Array.from(new Set(recommendations.map(rec => rec.title)))
                .slice(0, 4) // Limit to 4 buttons for UI
                .map((title, index) => (
                  <button
                    key={index}
                    className={`px-6 py-3 rounded-lg text-sm md:text-base font-medium whitespace-nowrap
                      ${index === 0 ? "bg-marketing-purple text-white" : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"}`}
                  >
                    {title}
                  </button>
                ))
            ) : (
              // Default buttons if no recommendations available
              <>
                <button className="px-6 py-3 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 text-sm md:text-base font-medium whitespace-nowrap">
                  <Plus className="h-4 w-4 inline mr-2" />
                  New Chat
                </button>
                <button className="px-6 py-3 rounded-lg bg-marketing-purple text-white text-sm md:text-base font-medium whitespace-nowrap">
                  Social Media
                </button>
                <button className="px-6 py-3 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 text-sm md:text-base font-medium whitespace-nowrap">
                  Blog Content
                </button>
                <button className="px-6 py-3 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 text-sm md:text-base font-medium whitespace-nowrap">
                  Email Marketing
                </button>
              </>
            )}
          </div>
        </div>
        
        <div className="text-sm text-gray-500 max-w-2xl">
          Start crafting intelligent marketing campaigns that convert with our AI-powered platform. No credit card required to begin.
        </div>
      </main>
    </div>
  );
};

export default Home;
