
import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import ChatArea from '@/components/ChatArea';
import { ChatProvider } from '@/context/ChatContext';
import { Toaster } from '@/components/ui/toaster';
import { useAuth } from '@/context/AuthContext';
import { useLocation } from 'react-router-dom';
import LoadingScreen from '@/components/LoadingScreen';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import AIChatInterface from '@/components/AIChatInterface';
import { Button } from '@/components/ui/button';

interface LocationState {
  isAnalyzing?: boolean;
  websiteUrl?: string;
}

interface CampaignRecommendation {
  title: string;
  platform: string;
  description: string;
  insights: string[];
  roi: string;
  difficulty: "Easy" | "Medium" | "Hard";
  budget: string;
}

const Dashboard = () => {
  const [activeItem, setActiveItem] = useState<string>('home');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [websiteUrl, setWebsiteUrl] = useState<string>('');
  const [campaignTitles, setCampaignTitles] = useState<string[]>([]);
  const [activeCampaign, setActiveCampaign] = useState<string | null>(null);
  const { user } = useAuth();
  const location = useLocation();
  const { toast } = useToast();
  
  // Get state from location if available
  const state = location.state as LocationState;

  useEffect(() => {
    if (state?.isAnalyzing && state?.websiteUrl) {
      setIsAnalyzing(true);
      setWebsiteUrl(state.websiteUrl);
      
      const analyzeWebsite = async () => {
        const startTime = Date.now();
        
        try {
          // First check if this website has already been analyzed
          const { data: existingAnalysis } = await supabase
            .from('website_analyses')
            .select('*')
            .eq('website_url', state.websiteUrl)
            .single();
          
          if (existingAnalysis) {
            // Website already exists in the database, fetch recommendations
            const { data: existingRecommendations } = await supabase
              .from('campaign_recommendations')
              .select('*')
              .eq('website_url', state.websiteUrl);
            
            // Show success toast with indication that existing data was used
            toast({
              title: 'Analysis Retrieved',
              description: 'Previously analyzed website data has been loaded',
            });
            
            console.log('Using existing analysis:', existingAnalysis);
            console.log('Using existing recommendations:', existingRecommendations);
          } else {
            // Website not yet analyzed, call the edge function
            const { data, error } = await supabase.functions.invoke('analyze-website', {
              body: { url: state.websiteUrl },
            });
            
            if (error) {
              throw new Error(error.message);
            }
            
            // Show success toast
            toast({
              title: 'Analysis Complete',
              description: 'Website has been analyzed and recommendations generated',
            });
          }
          
        } catch (error: any) {
          console.error('Analysis error:', error);
          
          // Provide specific feedback based on the error
          let errorMessage = 'Failed to analyze website';
          
          if (error.message?.includes('OpenAI API key is not configured')) {
            errorMessage = 'OpenAI API key is not configured in the server. This is a demo limitation.';
          } else if (error instanceof Error) {
            errorMessage = error.message;
          }
          
          toast({
            title: 'Analysis Failed',
            description: errorMessage,
            variant: 'destructive',
          });
        } finally {
          // Keep loading for at least 3 seconds total
          const remainingTime = Math.max(0, 3000 - (Date.now() - startTime));
          setTimeout(() => {
            setIsAnalyzing(false);
            setIsLoading(false);
          }, remainingTime);
        }
      };
      
      analyzeWebsite();
    } else {
      // If not analyzing, still try to get the most recent website URL from database
      const fetchRecentWebsite = async () => {
        try {
          const { data: recentAnalysis } = await supabase
            .from('website_analyses')
            .select('website_url')
            .order('created_at', { ascending: false })
            .limit(1)
            .single();
          
          if (recentAnalysis) {
            setWebsiteUrl(recentAnalysis.website_url);
            
            // Fetch campaign titles
            const { data: recommendations } = await supabase
              .from('campaign_recommendations')
              .select('title')
              .eq('website_url', recentAnalysis.website_url);
              
            if (recommendations && recommendations.length > 0) {
              // Extract unique titles
              const uniqueTitles = [...new Set(recommendations.map(rec => rec.title))];
              setCampaignTitles(uniqueTitles);
            }
          }
        } catch (error) {
          console.error('Error fetching recent website:', error);
        } finally {
          // Simulate loading time if not analyzing
          const timer = setTimeout(() => {
            setIsLoading(false);
          }, 1000);
          
          return () => clearTimeout(timer);
        }
      };
      
      fetchRecentWebsite();
    }
  }, [state?.isAnalyzing, state?.websiteUrl, toast]);

  // Show loading screen during loading or analysis
  if (isLoading || isAnalyzing) {
    return (
      <LoadingScreen 
        onComplete={() => {
          if (!isAnalyzing) {
            setIsLoading(false);
          }
        }}
      />
    );
  }

  return (
    <div className="flex h-screen w-full">
      <Sidebar activeItem={activeItem} setActiveItem={setActiveItem} />
      
      {activeItem === 'home' ? (
        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="p-4 border-b">
            <h1 className="text-2xl font-bold mb-2">Campaign Recommendations</h1>
            <p className="text-gray-600 mb-4">Website: {websiteUrl}</p>
            
            <div className="flex gap-2 overflow-x-auto pb-2">
              <Button
                variant={activeCampaign === null ? "default" : "outline"}
                onClick={() => setActiveCampaign(null)}
                className="whitespace-nowrap"
              >
                All Campaigns
              </Button>
              
              {campaignTitles.map((title) => (
                <Button
                  key={title}
                  variant={activeCampaign === title ? "default" : "outline"}
                  onClick={() => setActiveCampaign(title)}
                  className="whitespace-nowrap"
                >
                  {title}
                </Button>
              ))}
            </div>
          </div>
          
          <div className="flex-1 p-4 overflow-y-auto">
            <AIChatInterface 
              websiteUrl={websiteUrl} 
              campaignType={activeCampaign || undefined} 
            />
          </div>
        </div>
      ) : (
        <ChatArea />
      )}
      
      <Toaster />
    </div>
  );
};

export default Dashboard;
