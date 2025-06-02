
import React from 'react';
import { Sparkles } from 'lucide-react';

interface RecommendedPrompt {
  text: string;
  description: string;
  isSpecial?: boolean;
}

interface RecommendedPromptsProps {
  campaignType?: string;
  onSelectPrompt: (prompt: string) => void;
  websiteUrl: string;
}

const recommendedPrompts: Record<string, RecommendedPrompt[]> = {
  'Community Building on Discord': [
    { text: "Make me a marketing plan", description: "Complete marketing strategy", isSpecial: true },
    { text: "Create a welcome message for my Discord server", description: "Server onboarding" },
    { text: "Generate a list of engagement activities for my Discord community", description: "Community activities" },
    { text: "Write a server rules template for my Discord", description: "Server rules" },
    { text: "Create a weekly event schedule for my Discord server", description: "Event planning" }
  ],
  'Create Viral Content on TikTok': [
    { text: "Make me a marketing plan", description: "Complete marketing strategy", isSpecial: true },
    { text: "Create a viral TikTok script about {website}", description: "Viral content" },
    { text: "Generate 5 trending TikTok video ideas for {website}", description: "Content ideas" },
    { text: "Write a hook script for a TikTok about {website}", description: "Engagement hooks" },
    { text: "Create a TikTok transition sequence for {website}", description: "Visual effects" }
  ],
  'Content Marketing': [
    { text: "Make me a marketing plan", description: "Complete marketing strategy", isSpecial: true },
    { text: "Write a blog post outline about {website}", description: "Content structure" },
    { text: "Create a social media content calendar for {website}", description: "Content planning" },
    { text: "Generate 10 blog post ideas for {website}", description: "Content ideas" },
    { text: "Write an email newsletter template for {website}", description: "Email marketing" }
  ],
  'default': [
    { text: "Make me a marketing plan", description: "Complete marketing strategy", isSpecial: true },
    { text: "Create a marketing plan for {website}", description: "Strategy planning" },
    { text: "Generate a social media strategy for {website}", description: "Social strategy" },
    { text: "Write a brand voice guide for {website}", description: "Brand guidelines" },
    { text: "Create a content marketing strategy for {website}", description: "Content strategy" }
  ]
};

const RecommendedPrompts: React.FC<RecommendedPromptsProps> = ({ 
  campaignType, 
  onSelectPrompt, 
  websiteUrl 
}) => {
  const prompts = campaignType ? recommendedPrompts[campaignType] || recommendedPrompts.default : recommendedPrompts.default;

  const formatPrompt = (prompt: string) => {
    return prompt.replace(/{website}/g, websiteUrl);
  };

  return (
    <div className="mb-3">
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="h-3 w-3 text-marketing-purple" />
        <h4 className="text-xs font-medium text-gray-700">Quick Prompts</h4>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-2">
        {prompts.map((prompt, index) => (
          <button
            key={index}
            onClick={() => onSelectPrompt(formatPrompt(prompt.text))}
            className={`flex-shrink-0 text-left p-2 rounded-md border transition-colors ${
              prompt.isSpecial 
                ? 'bg-green-500 border-green-600 text-white hover:bg-green-600' 
                : 'border-gray-200 hover:border-marketing-purple/50 hover:bg-marketing-purple/5'
            }`}
          >
            <p className={`text-xs font-medium line-clamp-1 ${
              prompt.isSpecial ? 'text-white' : 'text-gray-900'
            }`}>
              {formatPrompt(prompt.text)}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
};

export default RecommendedPrompts;
