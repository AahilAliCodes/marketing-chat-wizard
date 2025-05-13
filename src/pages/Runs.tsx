import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import { Toaster } from '@/components/ui/toaster';
import { useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Loader2, Image, Film, FileText, ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import SubredditRecommender from '@/components/SubredditRecommender';

interface LocationState {
  messageContent?: string;
  messageRole?: 'user' | 'assistant';
  timestamp?: Date;
  previousMessage?: string;
  action?: string;
  websiteUrl?: string;
  campaignType?: string;
}

type ContentType = 'image' | 'video' | 'text' | null;
type GenerationStatus = 'idle' | 'loading' | 'success' | 'error';

interface SubredditRecommendation {
  name: string;
  reason: string;
  postTitle: string;
  postContent: string;
  subscribers?: string;
  engagement?: string;
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
  icon?: React.ReactNode;
}

const Runs = () => {
  const [activeItem, setActiveItem] = useState<string>('runs');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [contentType, setContentType] = useState<ContentType>(null);
  const [generatedContent, setGeneratedContent] = useState<string | null>(null);
  const [status, setStatus] = useState<GenerationStatus>('idle');
  const [originalMessage, setOriginalMessage] = useState<string>('');
  
  // Subreddit recommendations state
  const [isAnalyzingSubreddits, setIsAnalyzingSubreddits] = useState<boolean>(false);
  const [subredditAnalysisError, setSubredditAnalysisError] = useState<string | null>(null);
  const [subredditRecommendations, setSubredditRecommendations] = useState<SubredditRecommendation[] | null>(null);
  const [selectedCampaignType, setSelectedCampaignType] = useState<string | undefined>(undefined);
  const [campaignOptions, setCampaignOptions] = useState<CampaignOption[]>([]);
  
  const location = useLocation();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // Detect content type from message
  const detectContentType = (message: string): ContentType => {
    const imageKeywords = ['image', 'picture', 'photo', 'draw', 'diagram', 'generate an image', 'make a picture', 'create an image', 'design', 'illustration'];
    const videoKeywords = ['video', 'animation', 'animate', 'film', 'movie', 'make a video', 'create a video', 'produce a video', 'record', 'tiktok', 'reel'];
    
    const lowerMessage = message.toLowerCase();
    
    if (imageKeywords.some(keyword => lowerMessage.includes(keyword))) {
      return 'image';
    } else if (videoKeywords.some(keyword => lowerMessage.includes(keyword))) {
      return 'video';
    }
    
    return 'text';
  };
  
  // Fetch campaign options for a website
  const fetchCampaignOptions = async (websiteUrl: string) => {
    try {
      const { data, error } = await supabase
        .from('campaign_recommendations')
        .select('*')
        .eq('website_url', websiteUrl);
      
      if (error) {
        throw error;
      }
      
      if (data) {
        const options = data.map(rec => ({
          id: rec.id,
          title: rec.title,
          description: rec.description,
          platform: rec.platform,
          insights: rec.insights,
          roi: rec.roi,
          difficulty: rec.difficulty,
          budget: rec.budget
        }));
        
        setCampaignOptions(options);
        
        // Set the selected campaign type if provided in state or use the first option
        const state = location.state as LocationState;
        if (state?.campaignType) {
          setSelectedCampaignType(state.campaignType);
        } else if (options.length > 0) {
          setSelectedCampaignType(options[0].title);
        }
      }
    } catch (error) {
      console.error('Error fetching campaign options:', error);
    }
  };
  
  // Process the message or action from location state
  useEffect(() => {
    const state = location.state as LocationState;
    
    if (state?.action === 'analyze_subreddits' && state?.websiteUrl) {
      // Handle subreddit analysis
      setIsAnalyzingSubreddits(true);
      
      // Fetch campaign options for this website
      fetchCampaignOptions(state.websiteUrl);
      
      // Set initial campaign type if provided
      if (state.campaignType) {
        setSelectedCampaignType(state.campaignType);
        analyzeSubreddits(state.websiteUrl, state.campaignType);
      } else {
        // Will be updated once campaign options are fetched
        analyzeSubreddits(state.websiteUrl);
      }
    } else if (state?.messageContent) {
      // Handle regular content generation
      setOriginalMessage(state.messageContent);
      const detectedType = detectContentType(state.messageContent);
      setContentType(detectedType);
      
      // Automatically start generation
      handleGenerate(state.messageContent, detectedType);
    }
  }, [location.state]);
  
  // Handle campaign selection change
  const handleCampaignChange = (campaignType: string) => {
    const state = location.state as LocationState;
    if (state?.websiteUrl) {
      setSelectedCampaignType(campaignType);
      setIsAnalyzingSubreddits(true);
      setSubredditRecommendations(null);
      analyzeSubreddits(state.websiteUrl, campaignType);
    }
  };
  
  const analyzeSubreddits = async (websiteUrl: string, campaignType?: string) => {
    try {
      setIsAnalyzingSubreddits(true);
      setSubredditAnalysisError(null);

      // Call the edge function to analyze subreddits
      const { data, error } = await supabase.functions.invoke('analyze-subreddits', {
        body: { websiteUrl, campaignType },
      });

      if (error) {
        throw new Error(error.message || 'Failed to analyze subreddits');
      }

      setSubredditRecommendations(data.recommendations);
      toast({
        title: "Analysis Complete",
        description: "Subreddit recommendations generated successfully",
      });
    } catch (error) {
      console.error('Subreddit analysis error:', error);
      setSubredditAnalysisError(error instanceof Error ? error.message : 'An unknown error occurred');
      
      toast({
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : "Failed to analyze subreddits",
        variant: 'destructive',
      });
    } finally {
      // Keep loading for at least 8 seconds to show the animation
      setTimeout(() => {
        setIsAnalyzingSubreddits(false);
      }, 8000);
    }
  };
  
  const handleGenerate = async (message: string, type: ContentType) => {
    if (!message || isGenerating) return;
    
    setIsGenerating(true);
    setStatus('loading');
    
    try {
      let result;
      const state = location.state as LocationState;
      const context = state.previousMessage ? `Context: ${state.previousMessage}\n\nRequest: ${message}` : message;
      
      switch (type) {
        case 'image':
          result = await generateImage(context);
          break;
        case 'video':
          result = await generateVideo(context);
          break;
        case 'text':
          result = await generateText(context);
          break;
        default:
          throw new Error('Invalid content type');
      }
      
      setGeneratedContent(result);
      setStatus('success');
      
      toast({
        title: "Content generated successfully",
        description: `Your ${type} has been created based on the message.`,
      });
    } catch (error) {
      console.error('Generation error:', error);
      setStatus('error');
      
      toast({
        title: "Generation failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };
  
  const generateImage = async (prompt: string): Promise<string> => {
    const { data, error } = await supabase.functions.invoke('generate-content', {
      body: { type: 'image', prompt },
    });
    
    if (error) throw new Error(error.message || 'Failed to generate image');
    return data.url;
  };
  
  const generateVideo = async (prompt: string): Promise<string> => {
    const { data, error } = await supabase.functions.invoke('generate-content', {
      body: { type: 'video', prompt },
    });
    
    if (error) throw new Error(error.message || 'Failed to generate video');
    return data.url;
  };
  
  const generateText = async (prompt: string): Promise<string> => {
    const { data, error } = await supabase.functions.invoke('generate-content', {
      body: { type: 'text', prompt },
    });
    
    if (error) throw new Error(error.message || 'Failed to generate text');
    return data.text;
  };
  
  const handleBack = () => {
    navigate(-1);
  };
  
  const renderContentTypeIcon = () => {
    switch (contentType) {
      case 'image':
        return <Image className="h-6 w-6 text-marketing-purple" />;
      case 'video':
        return <Film className="h-6 w-6 text-marketing-purple" />;
      default:
        return <FileText className="h-6 w-6 text-marketing-purple" />;
    }
  };
  
  const renderContent = () => {
    if (status === 'loading') {
      return (
        <div className="flex flex-col items-center justify-center p-10 border rounded-lg bg-white">
          <Loader2 className="h-10 w-10 text-marketing-purple animate-spin mb-4" />
          <p className="text-gray-600">Generating {contentType} content...</p>
          <p className="text-xs text-gray-500 mt-2">This may take a moment</p>
        </div>
      );
    }
    
    if (status === 'error') {
      return (
        <div className="p-6 border rounded-lg bg-white">
          <p className="text-red-500 mb-2">Error generating content</p>
          <Button 
            onClick={() => handleGenerate(originalMessage, contentType)}
            className="bg-marketing-purple hover:bg-marketing-purple/90"
          >
            Try Again
          </Button>
        </div>
      );
    }
    
    if (status === 'success' && generatedContent) {
      switch (contentType) {
        case 'image':
          return <img src={generatedContent} alt="Generated content" className="max-w-full rounded-lg shadow-md" />;
        case 'video':
          return (
            <video controls className="max-w-full rounded-lg shadow-md">
              <source src={generatedContent} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          );
        default:
          return (
            <div className="p-6 border rounded-lg bg-white whitespace-pre-wrap">
              {generatedContent}
            </div>
          );
      }
    }
    
    return (
      <div className="text-center p-6 border rounded-lg bg-white">
        <p className="text-gray-600">No content generated yet</p>
      </div>
    );
  };

  return (
    <div className="flex h-screen w-full">
      <Sidebar activeItem={activeItem} setActiveItem={setActiveItem} />
      <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="icon" 
              onClick={handleBack}
              className="h-9 w-9"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl font-bold text-marketing-darkPurple">
              {location.state?.action === 'analyze_subreddits' ? 'Reddit Strategy Assistant' : 'Content Generation'}
            </h1>
          </div>
          
          {!isGenerating && contentType && !location.state?.action && (
            <Button 
              onClick={() => handleGenerate(originalMessage, contentType)}
              className="bg-marketing-purple hover:bg-marketing-purple/90"
              disabled={isGenerating}
            >
              {isGenerating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Regenerate
            </Button>
          )}
        </div>
        
        {/* Display either subreddit analysis or content generation UI */}
        {location.state?.action === 'analyze_subreddits' ? (
          <SubredditRecommender 
            websiteUrl={location.state?.websiteUrl || ''}
            campaignType={selectedCampaignType}
            isLoading={isAnalyzingSubreddits}
            error={subredditAnalysisError}
            results={subredditRecommendations}
            availableCampaigns={campaignOptions}
            onCampaignChange={handleCampaignChange}
          />
        ) : (
          <>
            {originalMessage && (
              <div className="mb-6 p-4 border bg-white rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  {renderContentTypeIcon()}
                  <h2 className="font-medium">Original Message</h2>
                </div>
                <p className="text-gray-600">{originalMessage}</p>
              </div>
            )}
            
            <div className="bg-white rounded-lg shadow mb-6">
              <div className="p-4 border-b">
                <h2 className="font-medium">Generated Content</h2>
                <p className="text-sm text-gray-500">
                  {contentType === 'image' && 'Using OpenAI DALL-E to generate an image'}
                  {contentType === 'video' && 'Using OpenAI SORA to generate a video'}
                  {contentType === 'text' && 'Using OpenAI to generate text content'}
                </p>
              </div>
              <div className="p-6">
                {renderContent()}
              </div>
            </div>
          </>
        )}
      </div>
      <Toaster />
    </div>
  );
};

export default Runs;
