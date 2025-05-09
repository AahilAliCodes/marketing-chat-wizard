
import React, { useState, useEffect } from 'react';
import { Rocket } from 'lucide-react';
import { Progress } from './ui/progress';

interface LoadingScreenProps {
  onComplete: () => void;
}

const loadingMessages = [
  "Finding your unfair advantage…",
  "Deploying battle-tested marketing tactics…",
  "Reverse-engineering virality…",
  "Digging through the internet for low-cost leverage…",
  "Sniffing out the channels where you might just pop off.",
  "Testing the waters so you don't shout into the void.",
  "Skimming the socials for signals worth chasing…",
  "Checking where your people already hang out…",
  "Gathering guerrilla tactics — quietly powerful, loudly effective.",
  "Scouting paths to attention — no guarantees, just insights.",
  "Looking for channels that don't cost a dime, just some hustle.",
  "Surfacing the playgrounds where brands go viral sometimes.",
  "Pulling from playbooks, not promising fireworks.",
  "Tracking down channels with whisper-level noise and word-of-mouth potential.",
  "Compiling places where smart brands quietly win big.",
  "Finding the paths of least resistance — and most curiosity.",
  "Mapping opportunities, not illusions.",
  "Hunting for the next organic breakout — cautiously optimistic.",
  "Analyzing market gaps and opportunities…",
  "Evaluating channel effectiveness and ROI potential…",
  "Identifying low-hanging fruit in your market…",
  "Calculating optimal budget allocation…",
  "Discovering untapped audience segments…",
  "Mapping out competitive advantages…",
  "Finding your brand's unique voice…",
  "Identifying growth levers and multipliers…",
  "Analyzing successful case studies in your space…",
  "Evaluating channel saturation and opportunity…",
  "Discovering viral content patterns…",
  "Mapping customer journey touchpoints…"
];

const LoadingScreen = ({ onComplete }: LoadingScreenProps) => {
  const [progress, setProgress] = useState(0);
  const [currentMessage, setCurrentMessage] = useState(loadingMessages[0]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (progress < 100) {
        setProgress((prev) => {
          // Increase progress by 1-3% randomly
          const increment = Math.floor(Math.random() * 3) + 1;
          return Math.min(prev + increment, 100);
        });

        // Change message randomly
        if (Math.random() > 0.7) {
          const randomIndex = Math.floor(Math.random() * loadingMessages.length);
          setCurrentMessage(loadingMessages[randomIndex]);
        }
      } else {
        // Once we reach 100%, wait a moment then call onComplete
        setTimeout(onComplete, 500);
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [progress, onComplete]);

  return (
    <div className="fixed inset-0 bg-marketing-purple flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md flex flex-col items-center">
        <div 
          className={`text-white mb-8 transition-transform duration-200 ${
            progress < 100 ? 'translate-y-0' : 'translate-y-20'
          }`}
        >
          <Rocket 
            size={60} 
            className={`mb-2 mx-auto text-white ${progress < 100 ? 'animate-bounce' : 'animate-ping'}`}
          />
        </div>
        
        <div className="w-full mb-6">
          <Progress 
            value={progress} 
            className="h-2 bg-white/20" 
          />
          <div className="flex justify-between mt-1 text-xs text-white/70">
            <span>Starting</span>
            <span>{progress}%</span>
            <span>Complete</span>
          </div>
        </div>
        
        <div className="h-16 flex items-center justify-center">
          <p className="text-white text-lg font-medium text-center animate-pulse">
            {currentMessage}
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;
