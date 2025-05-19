
import React, { useState } from 'react';
import { SendHorizontal, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import RecommendedPrompts from './RecommendedPrompts';

interface ChatInputFormProps {
  onSubmit: (message: string) => void;
  isLoading: boolean;
  websiteUrl: string;
  campaignType?: string;
}

const ChatInputForm: React.FC<ChatInputFormProps> = ({ 
  onSubmit, 
  isLoading, 
  websiteUrl, 
  campaignType 
}) => {
  const [userMessage, setUserMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userMessage.trim() || isLoading) return;
    
    onSubmit(userMessage);
    setUserMessage('');
  };

  const handlePromptSelect = (prompt: string) => {
    setUserMessage(prompt);
  };

  return (
    <form onSubmit={handleSubmit} className="mt-auto">
      <RecommendedPrompts 
        campaignType={campaignType} 
        onSelectPrompt={handlePromptSelect}
        websiteUrl={websiteUrl}
      />
      <div className="relative">
        <Textarea
          className="flex-1 min-h-[60px] max-h-[120px] resize-none border-2 border-red-200 focus:border-red-600 focus:ring-2 focus:ring-red-200 pr-12 transition-all"
          placeholder={`Ask about ${campaignType || 'marketing strategies'}...`}
          value={userMessage}
          onChange={(e) => setUserMessage(e.target.value)}
          disabled={isLoading}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e);
            }
          }}
        />
        <Button 
          type="submit" 
          className="absolute right-2 bottom-2 h-10 w-10 p-0 bg-red-600 hover:bg-red-700"
          disabled={!userMessage.trim() || isLoading}
        >
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin text-white" />
          ) : (
            <SendHorizontal className="h-5 w-5 text-white" />
          )}
        </Button>
      </div>
    </form>
  );
};

export default ChatInputForm;
