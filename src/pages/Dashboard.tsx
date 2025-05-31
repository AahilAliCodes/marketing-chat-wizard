import React, { useState, useEffect } from 'react';
import Topbar from '@/components/Topbar';
import SubredditAnalytics from '@/components/SubredditAnalytics';
import LoadingScreen from '@/components/LoadingScreen';
import { useAuth } from '@/context/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { SessionManager } from '@/utils/sessionManager';
import { Toaster } from '@/components/ui/toaster';

interface LocationState {
  isAnalyzing?: boolean;
  websiteUrl?: string;
}

const Dashboard = () => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [websiteUrl, setWebsiteUrl] = useState<string>('');
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Get state from location if available
  const state = location.state as LocationState;

  useEffect(() => {
    // Initialize session for this analysis
    const sessionId = SessionManager.getSessionId();
    console.log('Current session ID:', sessionId);
    
    if (state?.isAnalyzing && state?.websiteUrl) {
      setIsAnalyzing(true);
      setWebsiteUrl(state.websiteUrl);
      
      // Store current website analysis in session
      SessionManager.setSessionData('current_analysis', {
        websiteUrl: state.websiteUrl,
        timestamp: Date.now()
      });
      
      const analyzeWebsite = async () => {
        const startTime = Date.now();
        
        try {
          // First check if this website has already been analyzed for this session
          let existingAnalysis = SessionManager.getSessionData(`analysis_${state.websiteUrl}`);
          
          if (!existingAnalysis) {
            // Check database for existing analysis
            const { data: dbAnalysis } = await supabase
              .from('website_analyses')
              .select('*')
              .eq('website_url', state.websiteUrl)
              .single();
            
            if (dbAnalysis) {
              existingAnalysis = dbAnalysis;
              // Cache in session
              SessionManager.setSessionData(`analysis_${state.websiteUrl}`, dbAnalysis);
            }
          }
          
          if (existingAnalysis) {
            // Website already exists in the database or session
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
            
            // Cache the new analysis in session
            SessionManager.setSessionData(`analysis_${state.websiteUrl}`, data);
            
            // Show success toast
            toast({
              title: 'Analysis Complete',
              description: 'Website has been analyzed and ready for Reddit analytics',
            });
          }
          
        } catch (error: any) {
          console.error('Analysis error:', error);
          
          // Check for the specific edge function error
          if (error.message?.includes('Edge Function returned a non-2xx status code') || 
              error.message?.includes('Extracted content is too short') ||
              error.message?.includes('website might be blocking access')) {
            // Navigate to the analysis error page
            navigate('/analysis-error');
            return;
          }
          
          // Provide specific feedback based on other errors
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
      // If not analyzing, try to get the most recent website URL from session first, then database
      const fetchRecentWebsite = async () => {
        try {
          // First check session storage
          const sessionAnalysis = SessionManager.getSessionData('current_analysis');
          
          if (sessionAnalysis && sessionAnalysis.websiteUrl) {
            setWebsiteUrl(sessionAnalysis.websiteUrl);
          } else {
            // Fallback to database if no session data
            const { data: recentAnalysis } = await supabase
              .from('website_analyses')
              .select('website_url')
              .order('created_at', { ascending: false })
              .limit(1)
              .single();
            
            if (recentAnalysis) {
              setWebsiteUrl(recentAnalysis.website_url);
              SessionManager.setSessionData('current_analysis', {
                websiteUrl: recentAnalysis.website_url,
                timestamp: Date.now()
              });
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
  }, [state?.isAnalyzing, state?.websiteUrl, toast, navigate]);

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
    <div className="min-h-screen bg-gray-50">
      <Topbar />
      <div className="container mx-auto px-6 py-8">
        {websiteUrl ? (
          <SubredditAnalytics websiteUrl={websiteUrl} />
        ) : (
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Welcome to Reddit Analytics</h1>
            <p className="text-gray-600">Please analyze a website first to view Reddit analytics.</p>
          </div>
        )}
      </div>
      <Toaster />
    </div>
  );
};

export default Dashboard;
