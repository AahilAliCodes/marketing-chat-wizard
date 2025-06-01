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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface LocationState {
  isAnalyzing?: boolean;
  websiteUrl?: string;
}

const Dashboard = () => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [websiteUrl, setWebsiteUrl] = useState<string>('');
  const [hasError, setHasError] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Get state from location if available
  const state = location.state as LocationState;

  const handleError = (error: any, context: string) => {
    console.error(`Error in ${context}:`, error);
    setHasError(true);
    setErrorMessage(error?.message || `An error occurred during ${context}`);
    setIsAnalyzing(false);
    setIsLoading(false);
  };

  const resetError = () => {
    setHasError(false);
    setErrorMessage('');
  };

  useEffect(() => {
    try {
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
              // Check database for existing analysis - use maybeSingle to avoid 406 errors
              const { data: dbAnalysis, error: dbError } = await supabase
                .from('website_analyses')
                .select('*')
                .eq('website_url', state.websiteUrl)
                .maybeSingle();
              
              if (dbError) {
                console.error('Database query error:', dbError);
                // Continue with analysis even if database check fails
              }
              
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
              console.log('Starting new website analysis for:', state.websiteUrl);
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
              
              console.log('Website analysis completed successfully');
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
            
            handleError(error, 'website analysis');
            
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
              // Fallback to database if no session data - use maybeSingle to avoid 406 errors
              const { data: recentAnalysis, error } = await supabase
                .from('website_analyses')
                .select('website_url')
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle();
              
              if (error) {
                console.error('Error fetching recent website:', error);
              }
              
              if (recentAnalysis) {
                setWebsiteUrl(recentAnalysis.website_url);
                SessionManager.setSessionData('current_analysis', {
                  websiteUrl: recentAnalysis.website_url,
                  timestamp: Date.now()
                });
              }
            }
          } catch (error) {
            handleError(error, 'fetching recent website');
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
    } catch (error) {
      handleError(error, 'dashboard initialization');
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

  // Show error UI if there's an error
  if (hasError) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Topbar />
        <div className="container mx-auto px-6 py-8">
          <Alert variant="destructive" className="max-w-2xl mx-auto">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="mb-4">
              {errorMessage}
            </AlertDescription>
            <div className="flex gap-2">
              <Button onClick={resetError} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
              <Button onClick={() => navigate('/')} size="sm">
                Go Home
              </Button>
            </div>
          </Alert>
        </div>
        <Toaster />
      </div>
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
            <p className="text-gray-600 mb-6">Please analyze a website first to view Reddit analytics.</p>
            <Button onClick={() => navigate('/')}>
              Analyze a Website
            </Button>
          </div>
        )}
      </div>
      <Toaster />
    </div>
  );
};

export default Dashboard;
