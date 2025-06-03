
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Send, Sparkles, Globe, MessageSquare, BarChart3 } from 'lucide-react';
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
        
        <div className="w-full max-w-4xl bg-white rounded-2xl shadow-modern-xl border border-gray-100 p-8 mb-16">
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

        {/* Savings Section */}
        <div className="mb-16">
          <div className="text-6xl md:text-8xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-500 to-green-600 mb-4">
            $1,000+
          </div>
          <p className="text-xl text-gray-600 font-medium">saved in Reddit marketing</p>
        </div>

        {/* How It Works Cards */}
        <div className="w-full max-w-6xl">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-12">How it works</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Card 1 */}
            <Card className="border-2 hover:shadow-modern-lg transition-all duration-200 group">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 group-hover:from-blue-100 group-hover:to-blue-200 transition-all duration-200">
                <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl mb-4 mx-auto">
                  <Globe className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-xl font-semibold text-center">Enter your URL above</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <p className="text-gray-600 text-center leading-relaxed">
                  Simply paste your business website URL into the search bar and let our AI analyze your content and target audience.
                </p>
              </CardContent>
            </Card>

            {/* Card 2 */}
            <Card className="border-2 hover:shadow-modern-lg transition-all duration-200 group">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-purple-100 group-hover:from-purple-100 group-hover:to-purple-200 transition-all duration-200">
                <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-marketing-purple to-marketing-darkPurple rounded-xl mb-4 mx-auto">
                  <MessageSquare className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-xl font-semibold text-center">Get AI generated comments and posts</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <p className="text-gray-600 text-center leading-relaxed">
                  Our AI creates engaging Reddit posts and authentic comments tailored to your business and relevant subreddits.
                </p>
              </CardContent>
            </Card>

            {/* Card 3 */}
            <Card className="border-2 hover:shadow-modern-lg transition-all duration-200 group">
              <CardHeader className="bg-gradient-to-r from-green-50 to-green-100 group-hover:from-green-100 group-hover:to-green-200 transition-all duration-200">
                <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-xl mb-4 mx-auto">
                  <BarChart3 className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-xl font-semibold text-center">Deep Analytics</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <p className="text-gray-600 text-center leading-relaxed">
                  Access detailed subreddit analytics, engagement metrics, and optimal posting times to maximize your reach.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Home;
