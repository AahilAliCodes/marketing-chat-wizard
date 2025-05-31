
import React, { useState, useEffect } from 'react';
import Topbar from '@/components/Topbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { ArrowLeft, TrendingUp, Users, MessageSquare, Activity, Award, Eye, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';

const Research = () => {
  const [selectedSubreddit, setSelectedSubreddit] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user drilled down from a specific subreddit
    const storedSubreddit = sessionStorage.getItem('selected_subreddit');
    if (storedSubreddit) {
      setSelectedSubreddit(storedSubreddit);
    }
  }, []);

  const handleBackToDashboard = () => {
    // Clear the stored subreddit when going back
    sessionStorage.removeItem('selected_subreddit');
    navigate('/dashboard');
  };

  const InfoTooltip = ({ title, description }: { title: string; description: string }) => (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button className="inline-flex items-center justify-center">
            <Info className="h-4 w-4 text-gray-400 hover:text-gray-600 cursor-pointer" />
          </button>
        </TooltipTrigger>
        <TooltipContent className="max-w-md p-4" side="top">
          <div className="space-y-2">
            <h4 className="font-semibold text-sm">{title}</h4>
            <p className="text-xs text-gray-600 whitespace-pre-line">{description}</p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );

  const PlatformWideMetrics = () => (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Platform-Wide Research Metrics</h1>
      <p className="text-gray-600 text-lg">These apply platform-wide or across categories, helping marketers understand audience behavior, ad ROI, brand reputation, and competitive positioning.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="border-2 hover:shadow-lg transition-shadow">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100">
            <CardTitle className="flex items-center gap-2 justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                Brand Mention Volume
              </div>
              <InfoTooltip 
                title="Brand Mention Volume"
                description="Number of times a brand/product is mentioned across Reddit\n\nWhy it matters: Measures brand awareness and buzz. High mentions = high organic exposure (positive or negative)."
              />
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="text-3xl font-bold text-blue-600 mb-2">2,847</div>
            <p className="text-sm text-gray-600">mentions this month</p>
          </CardContent>
        </Card>

        <Card className="border-2 hover:shadow-lg transition-shadow">
          <CardHeader className="bg-gradient-to-r from-green-50 to-green-100">
            <CardTitle className="flex items-center gap-2 justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-green-600" />
                Brand Sentiment Score
              </div>
              <InfoTooltip 
                title="Brand Sentiment Score"
                description="Average sentiment polarity (e.g., -1 to +1)\n\nWhy it matters: Helps marketers understand how Reddit feels about their brand. Tracks reputation and public perception shifts over time."
              />
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="text-3xl font-bold text-green-600 mb-2">+0.73</div>
            <p className="text-sm text-gray-600">positive sentiment</p>
          </CardContent>
        </Card>

        <Card className="border-2 hover:shadow-lg transition-shadow">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-purple-100">
            <CardTitle className="flex items-center gap-2 justify-between">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-purple-600" />
                Category Engagement Rate
              </div>
              <InfoTooltip 
                title="Category Engagement Rate"
                description="Avg. Upvotes + Comments per Post in a Category\n\nWhy it matters: Identifies high-engagement verticals where marketing content can thrive."
              />
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="text-3xl font-bold text-purple-600 mb-2">145.2</div>
            <p className="text-sm text-gray-600">avg engagement per post</p>
          </CardContent>
        </Card>

        <Card className="border-2 hover:shadow-lg transition-shadow">
          <CardHeader className="bg-gradient-to-r from-orange-50 to-orange-100">
            <CardTitle className="flex items-center gap-2 justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-orange-600" />
                Top Trending Subreddits
              </div>
              <InfoTooltip 
                title="Top Trending Subreddits"
                description="Growth rate (subs/day or posts/day)\n\nWhy it matters: Lets marketers ride trends early. Useful for new product launches, niche targeting, or viral campaigns."
              />
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="text-3xl font-bold text-orange-600 mb-2">+12.4%</div>
            <p className="text-sm text-gray-600">weekly growth rate</p>
          </CardContent>
        </Card>

        <Card className="border-2 hover:shadow-lg transition-shadow">
          <CardHeader className="bg-gradient-to-r from-red-50 to-red-100">
            <CardTitle className="flex items-center gap-2 justify-between">
              <div className="flex items-center gap-2">
                <Award className="h-5 w-5 text-red-600" />
                Ad Performance Benchmarks
              </div>
              <InfoTooltip 
                title="Ad Performance Benchmarks"
                description="CPM, CPC, CTR from Reddit Ads Manager\n\nWhy it matters: Gives ROI context vs. other platforms. Reddit usually has lower CPM but requires tailored, native-style ads."
              />
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="text-3xl font-bold text-red-600 mb-2">$2.45</div>
            <p className="text-sm text-gray-600">average CPM</p>
          </CardContent>
        </Card>

        <Card className="border-2 hover:shadow-lg transition-shadow">
          <CardHeader className="bg-gradient-to-r from-indigo-50 to-indigo-100">
            <CardTitle className="flex items-center gap-2 justify-between">
              <div className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-indigo-600" />
                Keyword Virality Score
              </div>
              <InfoTooltip 
                title="Keyword Virality Score"
                description="Mentions × Avg. Upvotes per Mention\n\nWhy it matters: Identifies hot topics, pain points, or interests to target organically or with ads."
              />
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="text-3xl font-bold text-indigo-600 mb-2">8,924</div>
            <p className="text-sm text-gray-600">virality index</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-2 border-marketing-purple/30 bg-gradient-to-r from-marketing-purple/5 to-marketing-purple/10">
        <CardHeader>
          <CardTitle className="text-2xl text-marketing-purple flex items-center justify-between">
            💡 Reddit Marketing Opportunity Score
            <InfoTooltip 
              title="Reddit Marketing Opportunity Score"
              description="A custom index combining: Brand mentions, Sentiment, Category engagement, Keyword virality, and Subreddit trend velocity.\n\nUseful to: Prioritize Reddit vs. other channels or assess vertical-specific potential (e.g., health, fintech, gaming)."
            />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold text-marketing-purple mb-2">87/100</div>
          <p className="text-gray-700">Excellent opportunity for Reddit marketing in your vertical</p>
        </CardContent>
      </Card>
    </div>
  );

  const SubredditDrilldown = ({ subreddit }: { subreddit: string }) => (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          onClick={handleBackToDashboard}
          variant="outline"
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Button>
        <h1 className="text-3xl font-bold text-gray-900">r/{subreddit} Deep Analytics</h1>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="border-2 hover:shadow-lg transition-shadow">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100">
            <CardTitle className="flex items-center gap-2 justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                Post Volume
              </div>
              <InfoTooltip 
                title="Post Volume"
                description="What it is: Total number of posts in a subreddit over a time period\n\nHow to get it: Fetch the latest 100–1000 posts using .new(), .hot(), or .top()"
              />
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="text-3xl font-bold text-blue-600 mb-2">1,247</div>
            <p className="text-sm text-gray-600">posts this month</p>
          </CardContent>
        </Card>

        <Card className="border-2 hover:shadow-lg transition-shadow">
          <CardHeader className="bg-gradient-to-r from-green-50 to-green-100">
            <CardTitle className="flex items-center gap-2 justify-between">
              <div className="flex items-center gap-2">
                <Award className="h-5 w-5 text-green-600" />
                Average Upvotes per Post
              </div>
              <InfoTooltip 
                title="Average Upvotes per Post"
                description="What it is: Total upvotes ÷ number of posts\n\nHow to get it: For each post: .score → then take the average"
              />
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="text-3xl font-bold text-green-600 mb-2">42.8</div>
            <p className="text-sm text-gray-600">average upvotes</p>
          </CardContent>
        </Card>

        <Card className="border-2 hover:shadow-lg transition-shadow">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-purple-100">
            <CardTitle className="flex items-center gap-2 justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-purple-600" />
                Average Comments per Post
              </div>
              <InfoTooltip 
                title="Average Comments per Post"
                description="What it is: Total comments ÷ number of posts\n\nHow to get it: For each post: .num_comments → then take the average"
              />
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="text-3xl font-bold text-purple-600 mb-2">18.3</div>
            <p className="text-sm text-gray-600">average comments</p>
          </CardContent>
        </Card>

        <Card className="border-2 hover:shadow-lg transition-shadow">
          <CardHeader className="bg-gradient-to-r from-orange-50 to-orange-100">
            <CardTitle className="flex items-center gap-2 justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-orange-600" />
                Top Posters
              </div>
              <InfoTooltip 
                title="Top Posters"
                description="What it is: Most active submitters over a time window\n\nHow to get it: Track .author.name across posts, count frequency"
              />
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="text-3xl font-bold text-orange-600 mb-2">127</div>
            <p className="text-sm text-gray-600">active contributors</p>
          </CardContent>
        </Card>

        <Card className="border-2 hover:shadow-lg transition-shadow">
          <CardHeader className="bg-gradient-to-r from-red-50 to-red-100">
            <CardTitle className="flex items-center gap-2 justify-between">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-red-600" />
                Average Upvote Ratio
              </div>
              <InfoTooltip 
                title="Average Upvote Ratio"
                description="What it is: Ratio of upvotes to total votes\n\nHow to get it: From each submission: .upvote_ratio"
              />
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="text-3xl font-bold text-red-600 mb-2">89.4%</div>
            <p className="text-sm text-gray-600">upvote ratio</p>
          </CardContent>
        </Card>

        <Card className="border-2 hover:shadow-lg transition-shadow">
          <CardHeader className="bg-gradient-to-r from-indigo-50 to-indigo-100">
            <CardTitle className="flex items-center gap-2 justify-between">
              <div className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-indigo-600" />
                Active Hours Analysis
              </div>
              <InfoTooltip 
                title="Active Hours Analysis"
                description="What it is: Timestamps of post creation grouped by hour\n\nHow to get it: Each post: .created_utc → convert to datetime → group by hour"
              />
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="text-3xl font-bold text-indigo-600 mb-2">2-4 PM</div>
            <p className="text-sm text-gray-600">peak posting hours</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Topbar />
      <div className="container mx-auto px-6 py-8">
        {selectedSubreddit ? (
          <SubredditDrilldown subreddit={selectedSubreddit} />
        ) : (
          <PlatformWideMetrics />
        )}
      </div>
      <Toaster />
    </div>
  );
};

export default Research;
