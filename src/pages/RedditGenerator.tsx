
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import Sidebar from '@/components/Sidebar';
import { Toaster } from '@/components/ui/toaster';
import LoadingScreen from '@/components/LoadingScreen';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ChevronLeft } from 'lucide-react';
import SubredditRecommender from '@/components/SubredditRecommender';
import { AnimatedRocket } from '@/components/chat/AnimatedRocket';

const RedditGenerator = () => {
  const [activeItem, setActiveItem] = useState<string>('reddit');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [websiteUrl, setWebsiteUrl] = useState<string>('');
  const [campaignType, setCampaignType] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [availableCampaigns, setAvailableCampaigns] = useState<Array<{id: string, title: string}>>([]);
  const [results, setResults] = useState<any[] | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // Load the most recent website from analysis if available
    const loadRecentWebsite = async () => {
      try {
        const { data: recentAnalysis } = await supabase
          .from('website_analyses')
          .select('website_url')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (recentAnalysis) {
          setWebsiteUrl(recentAnalysis.website_url);
          fetchCampaigns(recentAnalysis.website_url);
        }
      } catch (error) {
        console.error('Error loading recent website:', error);
      }
    };

    loadRecentWebsite();
  }, []);

  const fetchCampaigns = async (url: string) => {
    try {
      const { data, error } = await supabase
        .from('campaign_recommendations')
        .select('id, title')
        .eq('website_url', url);

      if (error) throw error;
      if (data) {
        setAvailableCampaigns(data);
        if (data.length > 0 && !campaignType) {
          setCampaignType(data[0].title);
        }
      }
    } catch (error) {
      console.error('Error fetching campaigns:', error);
    }
  };

  const handleBack = () => {
    navigate('/dashboard');
  };

  const handleAnalyze = async () => {
    if (!websiteUrl) {
      toast({
        title: 'Error',
        description: 'Please enter a website URL',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    setError(null);
    setResults(null);

    try {
      // Call the Supabase Edge Function to analyze the website for subreddit recommendations
      const { data, error } = await supabase.functions.invoke('analyze-subreddits', {
        body: { websiteUrl, campaignType },
      });

      if (error) throw error;

      setResults(data.recommendations);

      // Store results in Supabase
      if (data.recommendations && data.recommendations.length > 0) {
        const subredditInserts = data.recommendations.map((rec: any) => ({
          website_url: websiteUrl,
          subreddit: rec.name,
          reason: rec.reason
        }));

        const { error: insertError } = await supabase
          .from('subreddit_recommendations')
          .upsert(subredditInserts, { 
            onConflict: 'website_url,subreddit',
            ignoreDuplicates: false 
          });

        if (insertError) {
          console.error('Error storing subreddit recommendations:', insertError);
        }
      }
    } catch (err: any) {
      console.error('Analysis error:', err);
      setError(err.message || 'Failed to analyze website for Reddit recommendations');
      toast({
        title: 'Analysis Failed',
        description: err.message || 'Failed to analyze website for Reddit recommendations',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCampaignChange = (campaign: string) => {
    setCampaignType(campaign);
    // We're not automatically re-analyzing here, user has to click the button
  };

  return (
    <div className="flex h-screen w-full">
      <Sidebar activeItem={activeItem} setActiveItem={setActiveItem} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="p-6 border-b flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={handleBack} className="flex gap-2 items-center">
              <ChevronLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
            <h1 className="text-2xl font-bold">Reddit Marketing Strategy</h1>
          </div>
        </div>
        
        <div className="flex-1 p-6 overflow-y-auto bg-gray-50">
          <div className="max-w-6xl mx-auto">
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">Find the Best Subreddits for Your Marketing</h2>
              <div className="grid gap-4 mb-6 md:grid-cols-2">
                <div>
                  <Label htmlFor="website-url">Website URL</Label>
                  <Input
                    id="website-url"
                    placeholder="https://example.com"
                    value={websiteUrl}
                    onChange={(e) => setWebsiteUrl(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
                
                {availableCampaigns.length > 0 && (
                  <div>
                    <Label htmlFor="campaign-type">Campaign Type</Label>
                    <select
                      id="campaign-type"
                      className="w-full p-2 border rounded"
                      value={campaignType}
                      onChange={(e) => setCampaignType(e.target.value)}
                      disabled={isLoading}
                    >
                      {availableCampaigns.map((campaign) => (
                        <option key={campaign.id} value={campaign.title}>
                          {campaign.title}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
              
              <div className="flex justify-end">
                <Button 
                  onClick={handleAnalyze}
                  disabled={isLoading || !websiteUrl}
                  className="relative"
                >
                  {isLoading ? 'Analyzing...' : 'Find Best Subreddits'}
                  {!isLoading && <AnimatedRocket />}
                </Button>
              </div>
            </div>
            
            <SubredditRecommender
              websiteUrl={websiteUrl}
              campaignType={campaignType}
              isLoading={isLoading}
              error={error}
              results={results}
              availableCampaigns={availableCampaigns}
              onCampaignChange={handleCampaignChange}
            />
          </div>
        </div>
      </div>
      
      <Toaster />
    </div>
  );
};

export default RedditGenerator;
