
import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Navigate } from 'react-router-dom';
import Topbar from '@/components/Topbar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, MessageCircle, Sparkles } from 'lucide-react';
import { useChatWithAI } from '@/hooks/useChatWithAI';
import { Badge } from '@/components/ui/badge';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const Chat = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const { sendMessageToAI, isLoading } = useChatWithAI();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Redirect to auth if not logged in
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isLoading) return;

    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');

    // Get AI response
    if (websiteUrl) {
      const response = await sendMessageToAI(websiteUrl, inputMessage, 'reddit');
      
      if (response) {
        const aiMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: response.response,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, aiMessage]);
      }
    } else {
      // If no website URL, provide a helpful response
      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "Hi! I'm your Reddit marketing assistant. To get started, please enter a website URL above so I can help you create targeted Reddit marketing strategies, find relevant subreddits, and craft engaging posts that will resonate with your audience.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMessage]);
    }
  };

  const quickPrompts = [
    "Help me find the best subreddits for my website",
    "Create engaging Reddit post ideas",
    "Analyze my target audience for Reddit marketing",
    "Write authentic Reddit comments for engagement"
  ];

  const handleQuickPrompt = (prompt: string) => {
    setInputMessage(prompt);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Topbar />
      
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-4">
            <MessageCircle className="h-8 w-8 text-marketing-purple" />
            <h1 className="text-3xl font-bold text-gray-900">Reddit Marketing Chat</h1>
            <Sparkles className="h-6 w-6 text-yellow-500" />
          </div>
          
          <div className="mb-4">
            <label htmlFor="website-url" className="block text-sm font-medium text-gray-700 mb-2">
              Website URL (optional but recommended)
            </label>
            <input
              id="website-url"
              type="url"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              placeholder="https://example.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-marketing-purple focus:border-transparent"
            />
          </div>
          
          <p className="text-gray-600">
            Get personalized Reddit marketing advice, subreddit recommendations, and post ideas for your brand.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border h-[600px] flex flex-col">
          <ScrollArea className="flex-1 p-6">
            {messages.length === 0 ? (
              <div className="text-center py-12">
                <MessageCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Start a conversation</h3>
                <p className="text-gray-500 mb-6">Ask me anything about Reddit marketing strategies!</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl mx-auto">
                  {quickPrompts.map((prompt, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      className="text-left h-auto p-3 hover:bg-marketing-purple/5 hover:border-marketing-purple"
                      onClick={() => handleQuickPrompt(prompt)}
                    >
                      {prompt}
                    </Button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[80%] ${message.role === 'user' ? 'order-2' : 'order-1'}`}>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant={message.role === 'user' ? 'default' : 'secondary'}>
                          {message.role === 'user' ? 'You' : 'AI Assistant'}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {message.timestamp.toLocaleTimeString()}
                        </span>
                      </div>
                      <Card className={message.role === 'user' ? 'bg-marketing-purple text-white' : 'bg-gray-50'}>
                        <CardContent className="p-4">
                          <div className="whitespace-pre-wrap break-words">
                            {message.content}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="max-w-[80%]">
                      <Badge variant="secondary" className="mb-2">AI Assistant</Badge>
                      <Card className="bg-gray-50">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2">
                            <div className="animate-pulse flex space-x-1">
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                            </div>
                            <span className="text-gray-500 text-sm">Thinking...</span>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                )}
              </div>
            )}
            <div ref={messagesEndRef} />
          </ScrollArea>

          <div className="border-t p-4">
            <form onSubmit={handleSubmit} className="flex gap-3">
              <Textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Ask about Reddit marketing strategies, subreddit recommendations, post ideas..."
                className="resize-none min-h-[50px] max-h-[120px]"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
              />
              <Button 
                type="submit" 
                disabled={!inputMessage.trim() || isLoading}
                className="self-end bg-marketing-purple hover:bg-marketing-purple/90"
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
            <p className="text-xs text-gray-500 mt-2">
              Press Enter to send, Shift+Enter for new line
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;
