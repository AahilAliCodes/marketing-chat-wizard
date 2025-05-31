import React, { useState, useEffect } from 'react';
import Topbar from '@/components/Topbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, TrendingUp, Users, MessageSquare, Activity, Award, Eye, Info, Clock, Tag, BarChart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';

interface DeepAnalytics {
  subreddit: string;
  postVolume: {
    daily: number;
    weekly: number;
    total: number;
  };
  avgUpvotes: number;
  avgComments: number;
  topPosters: Array<{ author: string; posts: number }>;
  topCommenters: Array<{ author: string; engagement: number }>;
  avgUpvoteRatio: number;
  karmaDistribution: {
    low: number;
    medium: number;
    high: number;
    viral: number;
  };
  flairDistribution: Array<{ flair: string; count: number }>;
  activeHours: {
    peakHour: number;
    distribution: Array<{ hour: number; count: number }>;
  };
  topKeywords: Array<{ word: string; count: number }>;
  generatedAt: string;
}

const Research = () => {
  const [selectedSubreddit, setSelectedSubreddit] = useState<string | null>(null);
  const [deepAnalytics, setDeepAnalytics] = useState<DeepAnalytics | null>(null);
  const [isLoadingDeepAnalytics, setIsLoadingDeepAnalytics] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check if user drilled down from a specific subreddit
    const storedSubreddit = sessionStorage.getItem('selected_subreddit');
    if (storedSubreddit) {
      setSelectedSubreddit(storedSubreddit);
    }
  }, []);

  // Fetch deep analytics when a subreddit is selected
  useEffect(() => {
    if (selectedSubreddit) {
      fetchDeepAnalytics(selectedSubreddit);
    }
  }, [selectedSubreddit]);

  const fetchDeepAnalytics = async (subreddit: string) => {
    setIsLoadingDeepAnalytics(true);
    try {
      console.log('Fetching deep analytics for:', subreddit);
      const { data, error } = await supabase.functions.invoke('subreddit-deep-analytics', {
        body: { subreddit }
      });

      if (error) {
        throw new Error(error.message);
      }

      setDeepAnalytics(data.analytics);
      toast({
        title: 'Analytics Generated',
        description: `Deep analytics for r/${subreddit} have been generated successfully`,
      });
    } catch (error: any) {
      console.error('Error fetching deep analytics:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate deep analytics for this subreddit',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingDeepAnalytics(false);
    }
  };

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

  const formatHour = (hour: number) => {
    if (hour === 0) return '12 AM';
    if (hour < 12) return `${hour} AM`;
    if (hour === 12) return '12 PM';
    return `${hour - 12} PM`;
  };

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
      
      {isLoadingDeepAnalytics ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(10)].map((_, index) => (
            <Card key={index} className="border-2">
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-20 mb-2" />
                <Skeleton className="h-4 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : deepAnalytics ? (
        <div className="space-y-8">
          {/* Main Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="border-2 hover:shadow-lg transition-shadow">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100">
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                  Post Volume
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="text-2xl font-bold text-blue-600 mb-1">{deepAnalytics.postVolume.daily}</div>
                <p className="text-sm text-gray-600">posts today</p>
                <p className="text-xs text-gray-500">{deepAnalytics.postVolume.weekly} this week</p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:shadow-lg transition-shadow">
              <CardHeader className="bg-gradient-to-r from-green-50 to-green-100">
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-green-600" />
                  Avg Upvotes
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="text-2xl font-bold text-green-600 mb-1">{deepAnalytics.avgUpvotes}</div>
                <p className="text-sm text-gray-600">per post</p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:shadow-lg transition-shadow">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-purple-100">
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-purple-600" />
                  Avg Comments
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="text-2xl font-bold text-purple-600 mb-1">{deepAnalytics.avgComments}</div>
                <p className="text-sm text-gray-600">per post</p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:shadow-lg transition-shadow">
              <CardHeader className="bg-gradient-to-r from-orange-50 to-orange-100">
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-orange-600" />
                  Upvote Ratio
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="text-2xl font-bold text-orange-600 mb-1">{deepAnalytics.avgUpvoteRatio}%</div>
                <p className="text-sm text-gray-600">average</p>
              </CardContent>
            </Card>
          </div>

          {/* Top Contributors */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-600" />
                  Top Posters
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Posts</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {deepAnalytics.topPosters.slice(0, 5).map((poster, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">u/{poster.author}</TableCell>
                        <TableCell>{poster.posts}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-green-600" />
                  Top Engagement
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Engagement</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {deepAnalytics.topCommenters.slice(0, 5).map((commenter, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">u/{commenter.author}</TableCell>
                        <TableCell>{commenter.engagement}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          {/* Karma Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart className="h-5 w-5 text-purple-600" />
                Post Karma Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{deepAnalytics.karmaDistribution.low}</div>
                  <p className="text-sm text-gray-600">Low (&lt;10)</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{deepAnalytics.karmaDistribution.medium}</div>
                  <p className="text-sm text-gray-600">Medium (10-99)</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{deepAnalytics.karmaDistribution.high}</div>
                  <p className="text-sm text-gray-600">High (100-999)</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{deepAnalytics.karmaDistribution.viral}</div>
                  <p className="text-sm text-gray-600">Viral (1000+)</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Activity and Content Analysis */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-indigo-600" />
                  Peak Activity Hours
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-indigo-600 mb-2">
                  {formatHour(deepAnalytics.activeHours.peakHour)}
                </div>
                <p className="text-sm text-gray-600 mb-4">Most active posting time</p>
                <div className="space-y-2">
                  {deepAnalytics.activeHours.distribution
                    .sort((a, b) => b.count - a.count)
                    .slice(0, 5)
                    .map((hour, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span>{formatHour(hour.hour)}</span>
                        <span className="font-medium">{hour.count} posts</span>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Tag className="h-5 w-5 text-pink-600" />
                  Popular Flairs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {deepAnalytics.flairDistribution.slice(0, 8).map((flair, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span className="truncate mr-2">{flair.flair}</span>
                      <span className="font-medium">{flair.count}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Top Keywords */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-cyan-600" />
                Top Keywords in Titles
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {deepAnalytics.topKeywords.slice(0, 20).map((keyword, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-gray-100 text-sm rounded-full border"
                  >
                    {keyword.word} ({keyword.count})
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-500">Click "Back to Dashboard" and select a subreddit to view deep analytics.</p>
        </div>
      )}
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
