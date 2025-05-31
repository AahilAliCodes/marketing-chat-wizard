
import React, { useState, useEffect } from 'react';
import Topbar from '@/components/Topbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, TrendingUp, Users, MessageSquare, Activity, Award, Eye } from 'lucide-react';
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

  const PlatformWideMetrics = () => (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Platform-Wide Research Metrics</h1>
      <p className="text-gray-600 text-lg">These apply platform-wide or across categories, helping marketers understand audience behavior, ad ROI, brand reputation, and competitive positioning.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="border-2 hover:shadow-lg transition-shadow">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              Brand Mention Volume
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <p className="text-sm text-gray-600 mb-2">
              <strong>Metric:</strong> Number of times a brand/product is mentioned across Reddit
            </p>
            <p className="text-sm text-gray-700">
              <strong>Why it matters:</strong> Measures brand awareness and buzz. High mentions = high organic exposure (positive or negative).
            </p>
          </CardContent>
        </Card>

        <Card className="border-2 hover:shadow-lg transition-shadow">
          <CardHeader className="bg-gradient-to-r from-green-50 to-green-100">
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-green-600" />
              Brand Sentiment Score
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <p className="text-sm text-gray-600 mb-2">
              <strong>Metric:</strong> Average sentiment polarity (e.g., -1 to +1)
            </p>
            <p className="text-sm text-gray-700">
              <strong>Why it matters:</strong> Helps marketers understand how Reddit feels about their brand. Tracks reputation and public perception shifts over time.
            </p>
          </CardContent>
        </Card>

        <Card className="border-2 hover:shadow-lg transition-shadow">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-purple-100">
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-purple-600" />
              Category Engagement Rate
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <p className="text-sm text-gray-600 mb-2">
              <strong>Metric:</strong> Avg. Upvotes + Comments per Post in a Category
            </p>
            <p className="text-sm text-gray-700">
              <strong>Why it matters:</strong> Identifies high-engagement verticals where marketing content can thrive.
            </p>
          </CardContent>
        </Card>

        <Card className="border-2 hover:shadow-lg transition-shadow">
          <CardHeader className="bg-gradient-to-r from-orange-50 to-orange-100">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-orange-600" />
              Top Trending Subreddits
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <p className="text-sm text-gray-600 mb-2">
              <strong>Metric:</strong> Growth rate (subs/day or posts/day)
            </p>
            <p className="text-sm text-gray-700">
              <strong>Why it matters:</strong> Lets marketers ride trends early. Useful for new product launches, niche targeting, or viral campaigns.
            </p>
          </CardContent>
        </Card>

        <Card className="border-2 hover:shadow-lg transition-shadow">
          <CardHeader className="bg-gradient-to-r from-red-50 to-red-100">
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-red-600" />
              Ad Performance Benchmarks
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <p className="text-sm text-gray-600 mb-2">
              <strong>Metric:</strong> CPM, CPC, CTR from Reddit Ads Manager
            </p>
            <p className="text-sm text-gray-700">
              <strong>Why it matters:</strong> Gives ROI context vs. other platforms. Reddit usually has lower CPM but requires tailored, native-style ads.
            </p>
          </CardContent>
        </Card>

        <Card className="border-2 hover:shadow-lg transition-shadow">
          <CardHeader className="bg-gradient-to-r from-indigo-50 to-indigo-100">
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-indigo-600" />
              Keyword Virality Score
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <p className="text-sm text-gray-600 mb-2">
              <strong>Metric:</strong> Mentions × Avg. Upvotes per Mention
            </p>
            <p className="text-sm text-gray-700">
              <strong>Why it matters:</strong> Identifies hot topics, pain points, or interests to target organically or with ads.
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-2 border-marketing-purple/30 bg-gradient-to-r from-marketing-purple/5 to-marketing-purple/10">
        <CardHeader>
          <CardTitle className="text-2xl text-marketing-purple">💡 Reddit Marketing Opportunity Score</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-700 mb-4">
            A custom index combining: Brand mentions, Sentiment, Category engagement, Keyword virality, and Subreddit trend velocity.
          </p>
          <p className="text-sm text-gray-600">
            <strong>Useful to:</strong> Prioritize Reddit vs. other channels or assess vertical-specific potential (e.g., health, fintech, gaming).
          </p>
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
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              Post Volume
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <p className="text-sm text-gray-600 mb-2">
              <strong>What it is:</strong> Total number of posts in a subreddit over a time period
            </p>
            <p className="text-sm text-gray-700">
              <strong>How to get it:</strong> Fetch the latest 100–1000 posts using .new(), .hot(), or .top()
            </p>
          </CardContent>
        </Card>

        <Card className="border-2 hover:shadow-lg transition-shadow">
          <CardHeader className="bg-gradient-to-r from-green-50 to-green-100">
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-green-600" />
              Average Upvotes per Post
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <p className="text-sm text-gray-600 mb-2">
              <strong>What it is:</strong> Total upvotes ÷ number of posts
            </p>
            <p className="text-sm text-gray-700">
              <strong>How to get it:</strong> For each post: .score → then take the average
            </p>
          </CardContent>
        </Card>

        <Card className="border-2 hover:shadow-lg transition-shadow">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-purple-100">
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-purple-600" />
              Average Comments per Post
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <p className="text-sm text-gray-600 mb-2">
              <strong>What it is:</strong> Total comments ÷ number of posts
            </p>
            <p className="text-sm text-gray-700">
              <strong>How to get it:</strong> For each post: .num_comments → then take the average
            </p>
          </CardContent>
        </Card>

        <Card className="border-2 hover:shadow-lg transition-shadow">
          <CardHeader className="bg-gradient-to-r from-orange-50 to-orange-100">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-orange-600" />
              Top Posters
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <p className="text-sm text-gray-600 mb-2">
              <strong>What it is:</strong> Most active submitters over a time window
            </p>
            <p className="text-sm text-gray-700">
              <strong>How to get it:</strong> Track .author.name across posts, count frequency
            </p>
          </CardContent>
        </Card>

        <Card className="border-2 hover:shadow-lg transition-shadow">
          <CardHeader className="bg-gradient-to-r from-red-50 to-red-100">
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-red-600" />
              Average Upvote Ratio
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <p className="text-sm text-gray-600 mb-2">
              <strong>What it is:</strong> Ratio of upvotes to total votes
            </p>
            <p className="text-sm text-gray-700">
              <strong>How to get it:</strong> From each submission: .upvote_ratio
            </p>
          </CardContent>
        </Card>

        <Card className="border-2 hover:shadow-lg transition-shadow">
          <CardHeader className="bg-gradient-to-r from-indigo-50 to-indigo-100">
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-indigo-600" />
              Active Hours Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <p className="text-sm text-gray-600 mb-2">
              <strong>What it is:</strong> Timestamps of post creation grouped by hour
            </p>
            <p className="text-sm text-gray-700">
              <strong>How to get it:</strong> Each post: .created_utc → convert to datetime → group by hour
            </p>
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
