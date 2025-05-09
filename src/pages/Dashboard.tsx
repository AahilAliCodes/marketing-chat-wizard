
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

interface LocationState {
  isAnalyzing?: boolean;
  websiteUrl?: string;
}

interface CampaignRecommendation {
  id: string;
  title: string;
  platform: string;
  description: string;
  insights: string[];
  roi: string;
  difficulty: string;
  budget: string;
  website_url: string;
}

const Dashboard = () => {
  const [activeItem, setActiveItem] = useState<string>('home');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [campaignRecommendations, setCampaignRecommendations] = useState<CampaignRecommendation[]>([]);
  const { user } = useAuth();
  const location = useLocation();
  const { toast } = useToast();
  
  // Get state from location if available
  const state = location.state as LocationState;

  useEffect(() => {
    if (state?.isAnalyzing && state?.websiteUrl) {
      setIsAnalyzing(true);
      
      const analyzeWebsite = async () => {
        const startTime = Date.now();
        
        try {
          // First check if this website has already been analyzed
          const { data: existingAnalysis, error } = await supabase
            .from('website_analyses')
            .select('*')
            .eq('website_url', state.websiteUrl)
            .maybeSingle();
          
          if (error) {
            throw new Error(error.message);
          }
          
          if (existingAnalysis) {
            // Website already exists in the database, fetch recommendations
            const { data: existingRecommendations, error: recError } = await supabase
              .from('campaign_recommendations')
              .select('*')
              .eq('website_url', state.websiteUrl);
            
            if (recError) {
              throw new Error(recError.message);
            }
            
            // Store the recommendations in state
            setCampaignRecommendations(existingRecommendations || []);
            
            // Show success toast with indication that existing data was used
            toast({
              title: 'Analysis Retrieved',
              description: 'Previously analyzed website data has been loaded',
            });
            
            console.log('Using existing analysis:', existingAnalysis);
            console.log('Using existing recommendations:', existingRecommendations);
          } else {
            // Website not yet analyzed, call the edge function
            const { data, error: funcError } = await supabase.functions.invoke('analyze-website', {
              body: { url: state.websiteUrl },
            });
            
            if (funcError) {
              throw new Error(funcError.message);
            }
            
            // Store the recommendations
            if (data?.recommendations) {
              setCampaignRecommendations(data.recommendations);
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
      // Simulate loading time if not analyzing
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 3000);
      
      return () => clearTimeout(timer);
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
    <ChatProvider>
      <div className="flex h-screen w-full">
        <Sidebar activeItem={activeItem} setActiveItem={setActiveItem} />
        <ChatArea />
      </div>
      <Toaster />
    </ChatProvider>
  );
};

export default Dashboard;
