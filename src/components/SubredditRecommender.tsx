
import React, { useState, useEffect } from 'react';
import { Bot, Brain, MessageSquare, List, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

interface SubredditRecommendation {
  name: string;
  reason: string;
  postTitle: string;
  postContent: string;
  subscribers?: string;
  engagement?: string;
}

interface SubredditRecommenderProps {
  websiteUrl: string;
  campaignType?: string;
  isLoading: boolean;
  error: string | null;
  results: SubredditRecommendation[] | null;
}

const SubredditRecommender: React.FC<SubredditRecommenderProps> = ({
  websiteUrl,
  campaignType,
  isLoading,
  error,
  results
}) => {
  const [currentStep, setCurrentStep] = useState<number>(0);
  const steps = [
    "Analyzing website content...",
    "Identifying target audience...",
    "Mapping to Reddit communities...",
    "Evaluating community relevance...",
    "Drafting post strategy...",
    "Finalizing recommendations..."
  ];

  useEffect(() => {
    if (isLoading) {
      const interval = setInterval(() => {
        setCurrentStep(prev => (prev + 1) % steps.length);
      }, 2000);
      return () => clearInterval(interval);
    } else {
      setCurrentStep(steps.length - 1);
    }
  }, [isLoading]);

  if (error) {
    return (
      <div className="p-6 border rounded-lg bg-red-50 text-red-800">
        <div className="flex items-center gap-2 mb-2">
          <Brain className="h-5 w-5" />
          <h3 className="font-medium">Analysis Error</h3>
        </div>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-6">
      <Card className="border-marketing-purple/30">
        <CardHeader className="bg-marketing-purple/10">
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            <span>Reddit Strategy AI</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="mb-4">
            <h3 className="text-lg font-medium mb-2">Analysis Parameters</h3>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-gray-100 p-2 rounded">
                <p className="text-xs font-medium text-gray-500">Website</p>
                <p className="text-sm truncate">{websiteUrl}</p>
              </div>
              <div className="bg-gray-100 p-2 rounded">
                <p className="text-xs font-medium text-gray-500">Campaign Focus</p>
                <p className="text-sm truncate">{campaignType || "General Marketing"}</p>
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-4">
              <div className="h-2 bg-gray-200 rounded overflow-hidden">
                <div 
                  className="h-full bg-marketing-purple transition-all"
                  style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                />
              </div>
              <div className="flex items-center gap-3">
                <Bot className="h-6 w-6 animate-pulse text-marketing-purple" />
                <div>
                  <h4 className="font-medium">{steps[currentStep]}</h4>
                  <p className="text-sm text-gray-500">Step {currentStep + 1} of {steps.length}</p>
                </div>
              </div>
            </div>
          ) : results ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-4">
                <MessageSquare className="h-5 w-5 text-marketing-purple" />
                <h3 className="font-medium">AI Reasoning</h3>
              </div>
              <p className="text-sm text-gray-700 mb-6 leading-relaxed">
                Based on analysis of {websiteUrl}, I've identified several Reddit communities that align with your target audience and {campaignType || "marketing goals"}. Each recommendation includes a suggested post title and content tailored to generate engagement without appearing overtly promotional. These communities were selected based on relevance, activity levels, and receptiveness to your type of content.
              </p>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {results && !isLoading && (
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <List className="h-5 w-5" />
                <span>Recommended Subreddits</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-4">
                  {results.map((subreddit, index) => (
                    <div key={index} className="p-3 border rounded-lg hover:border-marketing-purple/50 hover:bg-marketing-purple/5 transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Search className="h-4 w-4 text-marketing-purple" />
                          <h4 className="font-medium">r/{subreddit.name}</h4>
                        </div>
                        {subreddit.subscribers && (
                          <Badge variant="outline" className="text-xs">
                            {subreddit.subscribers} members
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{subreddit.reason}</p>
                      <div className="mt-3 text-xs text-gray-500">
                        {subreddit.engagement && (
                          <div className="flex justify-between">
                            <span>Engagement:</span>
                            <span className="font-medium text-marketing-purple">{subreddit.engagement}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                <span>Post Recommendations</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-6">
                  {results.map((subreddit, index) => (
                    <div key={index} className="p-3 border rounded-lg">
                      <p className="text-xs font-medium text-gray-500 mb-1">r/{subreddit.name}</p>
                      <h4 className="font-medium mb-2">{subreddit.postTitle}</h4>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{subreddit.postContent}</p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default SubredditRecommender;
