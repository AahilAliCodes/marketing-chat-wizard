import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
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
import { v4 as uuidv4 } from 'uuid';

interface LocationState {
  isAnalyzing?: boolean;
  websiteUrl?: string;
  pendingChatData?: any[];
  chatWebsiteUrl?: string;
  chatCampaignType?: string;
}

interface CampaignOption {
  id: string;
  title: string;
  description: string;
  platform: string;
  insights: string[];
  roi: string;
  difficulty: string;
  budget: string;
  icon: React.ReactNode;
}

const Dashboard = () => {
  const [activeItem, setActiveItem] = useState<string>('home');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [websiteUrl, setWebsiteUrl] = useState<string>('');
  const [activeCampaign, setActiveCampaign] = useState<string | null>(null);
  const [campaignOptions, setCampaignOptions] = useState<CampaignOption[]>([]);
  const { user } = useAuth();
  const location = useLocation();
  const { toast } = useToast();
  
  // Function to get icon based on platform
  const getPlatformIcon = (platform: string) => {
    const platformLower = platform.toLowerCase();
    if (platformLower.includes('discord')) return <Users className="h-6 w-6" />;
    if (platformLower.includes('tiktok') || platformLower.includes('video')) return <Video className="h-6 w-6" />;
    if (platformLower.includes('content') || platformLower.includes('blog') || platformLower.includes('medium')) return <FileText className="h-6 w-6" />;
    return <MessageSquare className="h-6 w-6" />;
  };

  // Fetch campaign recommendations from Supabase
  const fetchCampaignRecommendations = async (url: string) => {
    try {
      const { data: recommendations, error } = await supabase
        .from('campaign_recommendations')
        .select('*')
        .eq('website_url', url);

      if (error) {
        throw error;
      }

      if (recommendations) {
        const formattedRecommendations = recommendations.map(rec => ({
          id: rec.id,
          title: rec.title,
          description: rec.description,
          platform: rec.platform,
          insights: rec.insights,
          roi: rec.roi,
          difficulty: rec.difficulty,
          budget: rec.budget,
          icon: getPlatformIcon(rec.platform)
        }));
        setCampaignOptions(formattedRecommendations);
      }
    } catch (error) {
      console.error('Error fetching campaign recommendations:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch campaign recommendations',
        variant: 'destructive',
      });
    }
  };

  // Handle pending chat data after authentication
  useEffect(() => {
    const locationState = location.state as LocationState;
    
    if (user && locationState?.pendingChatData) {
      const savePendingChatData = async () => {
        try {
          // Create a new channel for this conversation
          const { data: channelData, error: channelError } = await supabase
            .from('user_chat_channels')
            .insert({
              name: locationState.chatCampaignType || 'Marketing Chat',
              description: `Chat about ${locationState.chatWebsiteUrl}`,
              user_id: user.id
            })
            .select('id')
            .single();

          if (channelError) {
            console.error('Error creating channel:', channelError);
            return;
          }

          const channelId = channelData.id;
          
          // Save all messages in the pending chat data
          const messages = locationState.pendingChatData.map(msg => ({
            id: msg.id || `msg-${uuidv4()}`,
            channel_id: channelId,
            role: msg.role === 'BLASTari' ? 'assistant' : msg.role,
            content: msg.content,
            created_at: new Date(msg.timestamp).toISOString()
          }));

          if (messages.length > 0) {
            const { error: messagesError } = await supabase
              .from('chat_messages')
              .insert(messages);

            if (messagesError) {
              console.error('Error saving messages:', messagesError);
              return;
            }
          }

          toast({
            title: "Chat saved",
            description: "Your conversation has been saved to your account"
          });
        } catch (error) {
          console.error('Error saving pending chat data:', error);
          toast({
            variant: "destructive",
            title: "Error saving chat",
            description: "There was a problem saving your conversation"
          });
        }
      };

      savePendingChatData();
    }
  }, [user, location.state, toast]);

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
            // Fetch campaign recommendations for existing analysis
            await fetchCampaignRecommendations(state.websiteUrl);
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

            // Fetch the newly generated recommendations
            await fetchCampaignRecommendations(state.websiteUrl);
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
            await fetchCampaignRecommendations(recentAnalysis.website_url);
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
          <div className="p-6 border-b flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4 mb-2 md:mb-0">
              <h1 className="text-3xl font-bold">Campaign Recommendations</h1>
              {activeCampaign && (
                <Button
                  variant="outline"
                  onClick={() => setActiveCampaign(null)}
                  className="whitespace-nowrap flex gap-2 items-center"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Back to All Campaigns
                </Button>
              )}
            </div>
            <p className="text-gray-600 mt-2 md:mt-0">Website: {websiteUrl}</p>
          </div>
          
          {!activeCampaign ? (
            <div className="grid md:grid-cols-3 gap-8 mb-8 px-4 md:px-12">
              {campaignOptions.map((campaign) => (
                <div
                  key={campaign.id}
                  className="relative flex flex-col border-2 rounded-2xl shadow-[0_0_16px_0_rgba(128,90,213,0.25)] hover:shadow-[0_0_32px_4px_rgba(128,90,213,0.45)] transition-all overflow-hidden bg-gradient-to-br from-white via-purple-50 to-purple-100 border-marketing-purple/30"
                >
                  <div 
                    onClick={() => setActiveCampaign(campaign.id)}
                    className="p-8 flex flex-col items-center text-center hover:border-marketing-purple hover:bg-marketing-purple/10 transition-all cursor-pointer"
                  >
                    <div className="bg-marketing-purple/10 p-4 rounded-full mb-6 shadow-[0_0_12px_0_rgba(128,90,213,0.15)]">
                      {campaign.icon}
                    </div>
                    <h3 className="text-xl font-semibold mb-3 text-marketing-purple drop-shadow">{campaign.title}</h3>
                    <div className="text-sm text-gray-500 mb-4">
                      <span className="font-medium">Platform:</span> {campaign.platform}
                    </div>
                    <div className="text-sm text-gray-600 w-full mb-4">{campaign.description}</div>
                  </div>
                  
                  <div className="px-8 pb-6">
                    <div className="text-sm text-gray-500 pt-2 border-t mt-2">
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <span className="font-medium">ROI:</span> {campaign.roi}
                        </div>
                        <div>
                          <span className="font-medium">Difficulty:</span> {campaign.difficulty}
                        </div>
                        <div>
                          <span className="font-medium">Budget:</span> {campaign.budget}
                        </div>
                      </div>
                      <div className="mt-4">
                        <span className="font-medium">Key Insights:</span>
                        <ul className="list-disc list-inside mt-2">
                          {campaign.insights.map((insight, index) => (
                            <li key={index} className="text-gray-700">{insight}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
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
          )}
        </div>
      ) : (
        null
      )}
      
      <Toaster />
    </div>
  );
};

export default Dashboard;
