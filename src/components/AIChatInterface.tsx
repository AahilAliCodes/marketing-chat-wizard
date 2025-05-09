
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
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'system',
      content: `I'm your marketing assistant for ${websiteUrl}. Ask me anything about the campaign recommendations!`,
      timestamp: new Date()
    }
  ]);
  const { sendMessageToAI, isLoading } = useChatWithAI();
  const bottomRef = useRef<HTMLDivElement>(null);

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
          <h3 className="text-lg font-medium">Marketing AI Chat</h3>
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
            placeholder="Ask about marketing strategies..."
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
