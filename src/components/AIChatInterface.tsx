
import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, MessageSquare } from 'lucide-react';
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

  const getCampaignIcon = () => {
    switch (campaignType) {
      case 'Community Building on Discord':
        return <Users className="h-5 w-5" />;
      case 'Create Viral Content on TikTok':
        return <Video className="h-5 w-5" />;
      case 'Content Marketing':
        return <FileText className="h-5 w-5" />;
      default:
        return <MessageSquare className="h-5 w-5" />;
    }
  };

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
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="bg-marketing-purple/10 p-2 rounded-full">
            {getCampaignIcon()}
          </div>
          <div>
            <h3 className="text-xl font-medium">
              {campaignType ? `${campaignType}` : 'Marketing AI Chat'}
            </h3>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span>Website: {websiteUrl}</span>
              {campaignType && (
                <Badge variant="outline" className="ml-1">
                  {campaignType}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <ScrollArea className="flex-1 pr-4 mb-6 overflow-y-auto">
        <div className="space-y-4">
          {chatHistory.map((message) => (
            <Card 
              key={message.id} 
              className={`${
                message.role === 'user' 
                  ? 'bg-gray-100 border-gray-200' 
                  : message.role === 'system' 
                    ? 'bg-marketing-purple/5 border-marketing-purple/20' 
                    : 'bg-marketing-purple/10 border-marketing-purple/30'
              }`}
            >
              <CardContent className="p-4">
                <p className="text-xs font-medium text-gray-600 mb-2">
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
        <div className="flex items-center gap-3">
          <Textarea
            className="flex-1 min-h-[60px] max-h-[120px] resize-none border-2 focus:border-marketing-purple/50"
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
            className="h-[60px] px-6"
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
