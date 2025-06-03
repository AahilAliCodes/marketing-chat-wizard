import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Send, Sparkles, Globe, MessageSquare, BarChart3, FileText, TrendingUp, Users, Award } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const Home = () => {
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleAnalyzeWebsite = async () => {
    if (!websiteUrl) {
      toast({
        title: 'Error',
        description: 'Please enter a website URL',
        variant: 'destructive',
      });
      return;
    }

    const lowercaseUrl = websiteUrl.toLowerCase();

    if (!/^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/.test(lowercaseUrl)) {
      toast({
        title: 'Invalid URL',
        description: 'Please enter a valid website URL',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsLoading(true);
      
      const formattedUrl = lowercaseUrl.startsWith('http') ? lowercaseUrl : `https://${lowercaseUrl}`;
      
      navigate('/dashboard', { 
        state: { 
          isAnalyzing: true,
          websiteUrl: formattedUrl 
        }
      });
    } catch (error) {
      setIsLoading(false);
      console.error('Error:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to analyze website',
        variant: 'destructive',
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAnalyzeWebsite();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setWebsiteUrl(e.target.value.toLowerCase());
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-white via-gray-50 to-purple-50">
      <header className="container mx-auto p-6 flex justify-between items-center">
        <div className="flex items-center group">
          <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-marketing-purple to-marketing-darkPurple rounded-xl mr-3 shadow-modern group-hover:scale-105 transition-transform duration-200">
            <span className="text-white font-bold text-lg">B</span>
          </div>
          <span className="text-2xl font-semibold text-gray-900 tracking-tight">BLASTari</span>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-6 py-16 md:py-24 flex flex-col items-center text-center">
        <div className="inline-flex items-center bg-gradient-to-r from-marketing-purple/10 to-purple-100 text-marketing-darkPurple font-medium px-4 py-2 rounded-full mb-8 shadow-modern">
          <Sparkles className="w-4 h-4 mr-2" />
          AI-Powered Reddit Posts
        </div>
        
        <h1 className="text-5xl md:text-7xl font-bold mb-8 max-w-6xl leading-tight">
          Autopilot <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-red-600">Reddit</span> Posts
        </h1>
        
        <p className="text-xl text-gray-600 mb-12 max-w-2xl leading-relaxed">
          Turn Reddit threads into growth channels with AI-crafted posts. Start for free — no credit card required.
        </p>
        
        <div className="w-full max-w-4xl bg-white rounded-2xl shadow-modern-xl border border-gray-100 p-8 mb-8">
          <div className="bg-gray-50 border border-gray-200 rounded-xl flex items-center p-4 focus-within:ring-2 focus-within:ring-marketing-purple focus-within:border-marketing-purple transition-all duration-200 hover:shadow-modern">
            <input 
              type="text" 
              placeholder="Enter your business website URL" 
              className="flex-1 p-3 outline-none text-gray-700 bg-transparent text-lg placeholder:text-gray-400"
              value={websiteUrl}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              disabled={isLoading}
            />
            <button 
              onClick={handleAnalyzeWebsite}
              disabled={isLoading}
              className="text-marketing-purple hover:text-marketing-darkPurple p-3 hover:bg-marketing-purple/10 rounded-lg transition-all duration-200 btn-modern"
            >
              <Send className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Increased Spacing between URL input and Big Number */}
        <div className="py-24"></div>

        {/* Big Number */}
        <div className="mb-24">
          <div className="text-6xl md:text-8xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-marketing-purple to-marketing-darkPurple mb-4">
            $1,000+
          </div>
          <p className="text-2xl text-gray-600 font-medium">saved in Reddit marketing</p>
        </div>

        {/* How It Works Section */}
        <div className="w-full max-w-7xl">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">How It Works</h2>
          <p className="text-xl text-gray-600 mb-16 max-w-3xl mx-auto">
            Transform your business into a Reddit marketing machine in just a few simple steps
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Card 1: Enter URL */}
            <Card className="border-2 border-gray-200 hover:border-marketing-purple hover:shadow-modern-xl transition-all duration-300 bg-white">
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Globe className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-xl text-gray-900">1. Enter Your URL</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-gray-600 mb-4">Simply paste your website URL above to get started</p>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm text-gray-500">
                  https://yoursite.com
                </div>
              </CardContent>
            </Card>

            {/* Card 2: AI Generated Content */}
            <Card className="border-2 border-gray-200 hover:border-marketing-purple hover:shadow-modern-xl transition-all duration-300 bg-white">
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-xl text-gray-900">2. Get AI Content</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-gray-600 mb-4">AI generates relevant posts and comments for your business</p>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-left">
                  <div className="text-xs text-gray-500 mb-2">r/entrepreneur</div>
                  <div className="text-sm font-medium text-gray-800 mb-2">💡 Business Growth Tips</div>
                  <div className="text-xs text-gray-600">"Great insights on scaling..."</div>
                </div>
              </CardContent>
            </Card>

            {/* Card 3: Deep Analytics */}
            <Card className="border-2 border-gray-200 hover:border-marketing-purple hover:shadow-modern-xl transition-all duration-300 bg-white">
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <BarChart3 className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-xl text-gray-900">3. Deep Analytics</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-gray-600 mb-4">Get detailed insights about subreddit performance</p>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs text-gray-600">Top Keywords</span>
                    <TrendingUp className="h-3 w-3 text-green-500" />
                  </div>
                  <div className="flex gap-1 flex-wrap">
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">startup</span>
                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">growth</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Card 4: Reddit Posts */}
            <Card className="border-2 border-gray-200 hover:border-marketing-purple hover:shadow-modern-xl transition-all duration-300 bg-white">
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 bg-gradient-to-r from-red-500 to-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <FileText className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-xl text-gray-900">4. Ready Posts</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-gray-600 mb-4">Get perfectly crafted Reddit posts ready to publish</p>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-left">
                  <div className="flex items-center gap-2 mb-2">
                    <Award className="h-4 w-4 text-orange-500" />
                    <span className="text-sm font-medium text-gray-800">Success Story</span>
                  </div>
                  <div className="text-xs text-gray-600">"How I grew my startup from 0 to 100k users..."</div>
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      2.5k upvotes
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Home;
