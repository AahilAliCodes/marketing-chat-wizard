
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Send, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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
          AI-Powered Reddit Marketing
        </div>
        
        <h1 className="text-5xl md:text-7xl font-bold mb-8 max-w-6xl leading-tight">
          Autopilot <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-red-600">Reddit</span> ad campaigns — zero karma needed
        </h1>
        
        <p className="text-xl text-gray-600 mb-12 max-w-2xl leading-relaxed">
          Start crafting intelligent marketing campaigns that convert with our AI-powered platform. No credit card required to begin.
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
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl">
          {[
            {
              title: "AI Analysis",
              description: "Deep website content analysis to understand your business"
            },
            {
              title: "Smart Targeting",
              description: "Discover high-engagement subreddits for your niche"
            },
            {
              title: "Auto Generation",
              description: "Create authentic Reddit posts that drive traffic"
            }
          ].map((feature, index) => (
            <div key={index} className="bg-white/60 glass rounded-xl p-6 text-center shadow-modern hover:shadow-modern-lg transition-all duration-300 hover:-translate-y-1">
              <h3 className="font-semibold text-gray-900 mb-2">{feature.title}</h3>
              <p className="text-gray-600 text-sm leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default Home;
