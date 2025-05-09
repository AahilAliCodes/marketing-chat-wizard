
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
import { MessageSquare, Users, Video, FileText, ChevronLeft } from 'lucide-react';

interface LocationState {
  isAnalyzing?: boolean;
  websiteUrl?: string;
}

interface CampaignOption {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}

const Dashboard = () => {
  const [activeItem, setActiveItem] = useState<string>('home');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [websiteUrl, setWebsiteUrl] = useState<string>('');
  const [activeCampaign, setActiveCampaign] = useState<string | null>(null);
  const { user } = useAuth();
  const location = useLocation();
  const { toast } = useToast();
  
  // Define campaign options with better icons
  const campaignOptions: CampaignOption[] = [
    {
      id: 'discord',
      title: 'Community Building on Discord',
      description: 'Set up a Discord server to engage users right away, fostering immediate interaction and support.',
      icon: <Users className="h-6 w-6" />
    },
    {
      id: 'tiktok',
      title: 'Create Viral Content on TikTok',
      description: 'Develop short, engaging videos that highlight user interactions and drive traffic quickly.',
      icon: <Video className="h-6 w-6" />
    },
    {
      id: 'contentMarketing',
      title: 'Content Marketing',
      description: 'Start publishing insightful articles on Medium addressing common queries and support topics.',
      icon: <FileText className="h-6 w-6" />
    }
  ];
  
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
            // Website already exists in the database
            toast({
              title: 'Analysis Retrieved',
              description: 'Previously analyzed website data has been loaded',
            });
            
            console.log('Using existing analysis:', existingAnalysis);
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
          <div className="p-6 border-b">
            <h1 className="text-3xl font-bold mb-2">Campaign Recommendations</h1>
            <p className="text-gray-600 mb-8">Website: {websiteUrl}</p>
            
            {!activeCampaign ? (
              <div className="grid md:grid-cols-3 gap-8 mb-8">
                {campaignOptions.map((campaign) => (
                  <Button
                    key={campaign.id}
                    variant="outline"
                    onClick={() => setActiveCampaign(campaign.id)}
                    className="p-8 h-auto flex flex-col items-center text-center border-2 hover:border-marketing-purple hover:bg-marketing-purple/5 transition-all shadow-sm hover:shadow-md"
                  >
                    <div className="bg-marketing-purple/10 p-4 rounded-full mb-6">
                      {campaign.icon}
                    </div>
                    <h3 className="text-xl font-medium mb-3">{campaign.title}</h3>
                    <p className="text-sm text-gray-500">{campaign.description}</p>
                  </Button>
                ))}
              </div>
            ) : (
              <div className="flex gap-2 overflow-x-auto pb-4 mb-4">
                <Button
                  variant="outline"
                  onClick={() => setActiveCampaign(null)}
                  className="whitespace-nowrap flex gap-2 items-center"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Back to All Campaigns
                </Button>
                
                <Button
                  variant="default"
                  className="whitespace-nowrap"
                >
                  {campaignOptions.find(c => c.id === activeCampaign)?.title}
                </Button>
              </div>
            )}
          </div>
          
          <div className="flex-1 p-6 overflow-y-auto bg-gray-50">
            {activeCampaign && (
              <div className="bg-white rounded-lg shadow-sm border p-6 h-full">
                <AIChatInterface 
                  websiteUrl={websiteUrl} 
                  campaignType={campaignOptions.find(c => c.id === activeCampaign)?.title || undefined} 
                />
              </div>
            )}
          </div>
        </div>
      ) : (
        <ChatProvider>
          <ChatArea />
        </ChatProvider>
      )}
      
      <Toaster />
    </div>
  );
};

export default Dashboard;
