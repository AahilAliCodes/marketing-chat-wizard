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

const Dashboard = () => {
  const [activeItem, setActiveItem] = useState<string>('home');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const { user } = useAuth();
  const location = useLocation();
  const { toast } = useToast();
  
  // Get state from location if available
  const state = location.state as LocationState;

  useEffect(() => {
    if (state?.isAnalyzing && state?.websiteUrl) {
      setIsAnalyzing(true);
      
      const analyzeWebsite = async () => {
        try {
          // Call the Supabase Edge Function
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
          
        } catch (error) {
          console.error('Analysis error:', error);
          toast({
            title: 'Analysis Failed',
            description: error instanceof Error ? error.message : 'Failed to analyze website',
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
      
      const startTime = Date.now();
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
