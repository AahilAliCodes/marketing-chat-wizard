
import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Navigate, useLocation } from 'react-router-dom';
import Topbar from '@/components/Topbar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, MessageCircle, Sparkles, ToggleLeft, ToggleRight, MessageSquare } from 'lucide-react';
import { useChatWithAI } from '@/hooks/useChatWithAI';
import { Badge } from '@/components/ui/badge';
import { SessionManager } from '@/utils/sessionManager';
import { supabase } from '@/integrations/supabase/client';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface WebsiteAnalysis {
  website_url: string;
  business_description: string;
  target_audience: string;
  key_features: string[];
  marketing_angles: string[];
}

const Chat = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [isRedditMode, setIsRedditMode] = useState(true);
  const [websiteAnalysis, setWebsiteAnalysis] = useState<WebsiteAnalysis | null>(null);
  const { sendMessageToAI, isLoading } = useChatWithAI();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Redirect to auth if not logged in
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Load website context from location state, session, or database
  useEffect(() => {
    const loadWebsiteData = async () => {
      let currentWebsiteUrl = '';
      let currentAnalysis = null;

      // First try location state
      if (location.state?.websiteUrl) {
        currentWebsiteUrl = location.state.websiteUrl;
        if (location.state.websiteAnalysis) {
          currentAnalysis = location.state.websiteAnalysis;
        }
      }

      // If no location state, try session storage
      if (!currentWebsiteUrl) {
        const sessionAnalysis = SessionManager.getSessionData('current_analysis');
        if (sessionAnalysis?.websiteUrl) {
          currentWebsiteUrl = sessionAnalysis.websiteUrl;
        }
      }

      // If still no website URL, try to get the most recent analysis from database
      if (!currentWebsiteUrl) {
        try {
          const { data: recentAnalysis } = await supabase
            .from('website_analyses')
            .select('website_url')
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (recentAnalysis) {
            currentWebsiteUrl = recentAnalysis.website_url;
          }
        } catch (error) {
          console.error('Error fetching recent website:', error);
        }
      }

      // Now load the analysis for this website URL
      if (currentWebsiteUrl && !currentAnalysis) {
        // Check session first
        const sessionData = SessionManager.getSessionData(`analysis_${currentWebsiteUrl}`);
        if (sessionData) {
          currentAnalysis = sessionData;
        } else {
          // Check database
          try {
            const { data: dbAnalysis } = await supabase
              .from('website_analyses')
              .select('*')
              .eq('website_url', currentWebsiteUrl)
              .maybeSingle();

            if (dbAnalysis) {
              currentAnalysis = dbAnalysis;
              // Cache in session
              SessionManager.setSessionData(`analysis_${currentWebsiteUrl}`, dbAnalysis);
            }
          } catch (error) {
            console.error('Error loading website analysis:', error);
          }
        }
      }

      setWebsiteUrl(currentWebsiteUrl);
      setWebsiteAnalysis(currentAnalysis);
    };

    loadWebsiteData();
  }, [location.state]);

  // Load chat history from session storage
  useEffect(() => {
    const chatKey = `chat_${websiteUrl || 'general'}_${isRedditMode ? 'reddit' : 'marketing'}`;
    const savedChat = SessionManager.getSessionData(chatKey);
    
    if (savedChat && savedChat.messages) {
      const restoredMessages = savedChat.messages.map((msg: any) => ({
        ...msg,
        timestamp: new Date(msg.timestamp)
      }));
      setMessages(restoredMessages);
    } else {
      // Initialize with welcome message
      const welcomeMessage = {
        id: 'welcome',
        role: 'assistant' as const,
        content: getWelcomeMessage(),
        timestamp: new Date()
      };
      setMessages([welcomeMessage]);
    }
  }, [websiteUrl, isRedditMode]);

  // Save chat history to session storage
  useEffect(() => {
    if (messages.length > 0) {
      const chatKey = `chat_${websiteUrl || 'general'}_${isRedditMode ? 'reddit' : 'marketing'}`;
      SessionManager.setSessionData(chatKey, {
        messages,
        websiteUrl,
        isRedditMode,
        lastUpdated: new Date().toISOString()
      });
    }
  }, [messages, websiteUrl, isRedditMode]);

  const getWelcomeMessage = () => {
    if (websiteUrl && websiteAnalysis) {
      return isRedditMode 
        ? `Hi! I'm your Reddit marketing assistant for ${websiteUrl}. I have your website analysis and I'm ready to help you create targeted Reddit campaigns, find relevant subreddits, and craft authentic posts that will resonate with your audience. 🚀`
        : `Hello! I'm your marketing consultant for ${websiteUrl}. With your website analysis in hand, I can help you develop comprehensive marketing strategies across all channels - from social media to email marketing, SEO, and beyond. Let's grow your business! 📈`;
    } else if (websiteUrl) {
      return isRedditMode
        ? `Hi! I'm your Reddit marketing assistant for ${websiteUrl}. I'm ready to help you with Reddit marketing strategies, even without detailed analysis. What would you like to know? 🚀`
        : `Hello! I'm your marketing consultant for ${websiteUrl}. I'm ready to help you with marketing strategies. What can I assist you with today? 📈`;
    } else {
      return isRedditMode
        ? "Hi! I'm your Reddit marketing assistant. I'm here to help with any Reddit marketing questions you have. Feel free to ask me anything! 🚀"
        : "Hello! I'm your marketing consultant. I'm here to help with any marketing questions you have. What can I assist you with today? 📈";
    }
  };

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

    // Prepare context for AI with system instructions for response length and focus
    let enhancedMessage = inputMessage;
    const systemInstructions = isRedditMode 
      ? "You are a Reddit marketing expert. Provide concise, actionable advice in 5-6 sentences maximum. Focus specifically on Reddit strategies, subreddits, posting techniques, and Reddit community engagement. Do not mention other marketing channels unless directly asked."
      : "You are a general marketing consultant. Provide concise, actionable advice in 5-6 sentences maximum. Cover various marketing channels and strategies as appropriate for the question.";

    if (websiteAnalysis && websiteUrl) {
      const keyFeatures = websiteAnalysis.key_features || [];
      const marketingAngles = websiteAnalysis.marketing_angles || [];
      
      enhancedMessage = `${systemInstructions}

Website: ${websiteUrl}
Business: ${websiteAnalysis.business_description || 'Not available'}
Target Audience: ${websiteAnalysis.target_audience || 'Not available'}
Key Features: ${keyFeatures.join(', ')}
Marketing Angles: ${marketingAngles.join(', ')}

User Question: ${inputMessage}`;
    } else {
      enhancedMessage = `${systemInstructions}

User Question: ${inputMessage}`;
    }

    // Get AI response - always try to get a response, even without website context
    try {
      const campaignType = isRedditMode ? 'reddit' : 'general_marketing';
      const response = await sendMessageToAI(websiteUrl || 'general', enhancedMessage, campaignType);
      
      if (response) {
        const aiMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: response.response,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, aiMessage]);
      }
    } catch (error) {
      console.error('Error getting AI response:', error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I apologize, but I'm having trouble connecting to the AI service right now. Please try again in a moment.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  const handleModeToggle = () => {
    setIsRedditMode(!isRedditMode);
    // Clear current messages when switching modes
    const welcomeMessage = {
      id: `welcome-${Date.now()}`,
      role: 'assistant' as const,
      content: getWelcomeMessage(),
      timestamp: new Date()
    };
    setMessages([welcomeMessage]);
  };

  const getExamplePrompts = () => {
    if (isRedditMode) {
      return [
        "Find the best subreddits for my business",
        "Write a Reddit post that doesn't sound like an ad",
        "How do I build karma before promoting?",
        "Create a Reddit comment strategy",
        "What are Reddit's self-promotion rules?",
        "Generate post titles that get upvotes"
      ];
    } else {
      return [
        "Create a social media content calendar",
        "Write compelling email subject lines",
        "Develop a brand positioning strategy",
        "Plan an influencer marketing campaign",
        "Create a customer retention strategy",
        "Design a lead generation funnel"
      ];
    }
  };

  const handleExamplePrompt = (prompt: string) => {
    setInputMessage(prompt);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Topbar />
      
      <div className="flex-1 p-6">
        <div className="h-full max-w-6xl mx-auto flex flex-col">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <MessageCircle className="h-8 w-8 text-marketing-purple" />
                <h1 className="text-3xl font-bold text-gray-900">
                  {isRedditMode ? 'Reddit Marketing Chat' : 'Marketing Strategy Chat'}
                </h1>
                <Sparkles className="h-6 w-6 text-yellow-500" />
              </div>
              
              {/* Mode Toggle */}
              <div className="flex items-center gap-3">
                <span className={`text-sm font-medium ${!isRedditMode ? 'text-marketing-purple' : 'text-gray-500'}`}>
                  General Marketing
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleModeToggle}
                  className="p-1"
                >
                  {isRedditMode ? (
                    <ToggleRight className="h-6 w-6 text-marketing-purple" />
                  ) : (
                    <ToggleLeft className="h-6 w-6 text-gray-400" />
                  )}
                </Button>
                <span className={`text-sm font-medium ${isRedditMode ? 'text-marketing-purple' : 'text-gray-500'}`}>
                  Reddit Focus
                </span>
                <MessageSquare className="h-5 w-5 text-orange-500" />
              </div>
            </div>
            
            {websiteAnalysis && (
              <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Website Analysis Loaded:</strong> {websiteAnalysis.business_description}
                </p>
              </div>
            )}
            
            <p className="text-gray-600">
              {isRedditMode 
                ? "Get personalized Reddit marketing advice, subreddit recommendations, and post ideas."
                : "Get comprehensive marketing strategies across all channels and platforms."}
            </p>
          </div>

          {/* Chat Container */}
          <div className="flex-1 bg-white rounded-lg shadow-sm border flex flex-col">
            <ScrollArea className="flex-1 p-6">
              {messages.length === 0 ? (
                <div className="text-center py-12">
                  <MessageCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Start a conversation</h3>
                  <p className="text-gray-500 mb-6">
                    {isRedditMode ? "Ask me about Reddit marketing strategies!" : "Ask me about marketing strategies!"}
                  </p>
                  
                  {/* Example Prompts */}
                  <div className="mb-6">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Try these example prompts:</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl mx-auto">
                      {getExamplePrompts().map((prompt, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          className="text-left h-auto p-3 hover:bg-marketing-purple/5 hover:border-marketing-purple"
                          onClick={() => handleExamplePrompt(prompt)}
                        >
                          {prompt}
                        </Button>
                      ))}
                    </div>
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
                            {message.role === 'user' ? 'You' : (isRedditMode ? 'Reddit Assistant' : 'Marketing Assistant')}
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
                        <Badge variant="secondary" className="mb-2">
                          {isRedditMode ? 'Reddit Assistant' : 'Marketing Assistant'}
                        </Badge>
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

            {/* Example Prompts Bar - shown when there are messages */}
            {messages.length > 0 && (
              <div className="border-t border-b px-4 py-2 bg-gray-50">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="h-4 w-4 text-marketing-purple" />
                  <span className="text-xs font-medium text-gray-600">Quick prompts:</span>
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {getExamplePrompts().slice(0, 4).map((prompt, index) => (
                    <Button
                      key={index}
                      variant="ghost"
                      size="sm"
                      className="flex-shrink-0 text-xs h-7 px-2 hover:bg-marketing-purple/10"
                      onClick={() => handleExamplePrompt(prompt)}
                    >
                      {prompt}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Input Form */}
            <div className="border-t p-4">
              <form onSubmit={handleSubmit} className="flex gap-3">
                <Textarea
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder={`Ask about ${isRedditMode ? 'Reddit marketing strategies' : 'marketing strategies'}...`}
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
    </div>
  );
};

export default Chat;
