
import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Send } from 'lucide-react';

const Home = () => {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-white to-gray-50">
      <header className="container mx-auto p-4 flex justify-between items-center">
        <div className="flex items-center">
          <div className="flex items-center justify-center w-8 h-8 bg-marketing-purple rounded-md mr-2">
            <span className="text-white font-bold">M</span>
          </div>
          <span className="text-xl font-bold">MarketGPT</span>
        </div>
        <Link to="/auth" className="text-marketing-purple font-medium">
          Sign In
        </Link>
      </header>

      <main className="flex-1 container mx-auto px-4 py-16 md:py-24 flex flex-col items-center text-center">
        <div className="bg-marketing-purple/10 text-marketing-purple font-medium px-4 py-2 rounded-full mb-6">
          AI-Powered Marketing Assistant
        </div>
        
        <h1 className="text-4xl md:text-6xl font-bold mb-6 max-w-5xl">
          Launch <span className="text-marketing-purple">high-performing</span> ad campaigns in seconds
        </h1>
        
        <p className="text-lg md:text-xl text-gray-600 mb-12 max-w-3xl">
          MarketGPT uses AI to analyze your business needs and create optimized marketing strategies tailored to your specific goals.
        </p>
        
        <div className="w-full max-w-3xl bg-white rounded-xl shadow-lg p-8 mb-12">
          <div className="bg-white border border-gray-200 rounded-lg flex items-center p-2 mb-6 focus-within:ring-2 focus-within:ring-marketing-purple focus-within:border-marketing-purple">
            <input 
              type="text" 
              placeholder="Enter your business website URL" 
              className="flex-1 p-2 outline-none text-gray-700"
            />
            <Link to="/dashboard" className="text-marketing-purple hover:text-marketing-purple/80 p-2">
              <Send className="h-5 w-5" />
            </Link>
          </div>
        </div>
        
        <div className="text-sm text-gray-500 max-w-2xl">
          Start crafting intelligent marketing campaigns that convert with our AI-powered platform. No credit card required to begin.
        </div>
      </main>
    </div>
  );
};

export default Home;
