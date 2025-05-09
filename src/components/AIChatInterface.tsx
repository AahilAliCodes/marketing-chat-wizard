
import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { useChatWithAI } from '@/hooks/useChatWithAI';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

interface AIChatInterfaceProps {
  websiteUrl: string;
  campaignType?: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

const AIChatInterface: React.FC<AIChatInterfaceProps> = ({ websiteUrl, campaignType }) => {
  const [userMessage, setUserMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const { sendMessageToAI, isLoading } = useChatWithAI();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Generate welcome message based on campaign type
    let welcomeMessage = `I'm your marketing assistant for ${websiteUrl}.`;
    
    if (campaignType === 'Community Building on Discord') {
      welcomeMessage = `I'm your Discord community building specialist. Let's create an engaging community strategy for ${websiteUrl}! Ask me about setting up channels, moderation strategies, engagement activities, or any other Discord community questions.`;
    } 
    else if (campaignType === 'Create Viral Content on TikTok') {
      welcomeMessage = `I'm your TikTok content marketing specialist for ${websiteUrl}. Ask me about creating viral videos, trending hashtags, content planning, or any other TikTok marketing strategies!`;
    }
    else if (campaignType === 'Content Marketing') {
      welcomeMessage = `I'm your content marketing strategist for ${websiteUrl}. Let's develop high-quality articles, blogs, and resources! Ask me about SEO optimization, publishing platforms, content calendars, or topic ideas.`;
    }
    
    setChatHistory([{
      id: 'welcome',
      role: 'system',
      content: welcomeMessage,
      timestamp: new Date()
    }]);
  }, [websiteUrl, campaignType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userMessage.trim() || isLoading) return;

    // Add user message to chat
    const newUserMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: userMessage,
      timestamp: new Date()
    };
    
    setChatHistory(prev => [...prev, newUserMessage]);
    setUserMessage('');

    // Get AI response
    const response = await sendMessageToAI(websiteUrl, userMessage, campaignType);
    
    if (response) {
      const aiMessage: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: response.response,
        timestamp: new Date()
      };
      
      setChatHistory(prev => [...prev, aiMessage]);
    }
  };

  // Scroll to bottom when chat history changes
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-medium">
            {campaignType ? `${campaignType} AI Chat` : 'Marketing AI Chat'}
          </h3>
          <p className="text-sm text-gray-500">
            Website: {websiteUrl}
            {campaignType && (
              <Badge variant="outline" className="ml-2">
                {campaignType}
              </Badge>
            )}
          </p>
        </div>
      </div>
      
      <ScrollArea className="flex-1 pr-4 mb-4">
        <div className="space-y-4">
          {chatHistory.map((message) => (
            <Card key={message.id} className={`${message.role === 'user' ? 'bg-gray-100' : message.role === 'system' ? 'bg-gray-50 border-marketing-purple/20' : 'bg-marketing-purple/10'}`}>
              <CardContent className="p-3">
                <p className="text-xs text-gray-500 mb-1">
                  {message.role === 'user' ? 'You' : message.role === 'system' ? 'System' : 'AI Assistant'}
                </p>
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              </CardContent>
            </Card>
          ))}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>
      
      <form onSubmit={handleSubmit} className="mt-auto">
        <div className="flex items-center gap-2">
          <Textarea
            className="flex-1 min-h-[60px] max-h-[120px] resize-none"
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
            className="h-[60px]"
            disabled={!userMessage.trim() || isLoading}
          >
            {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default AIChatInterface;
