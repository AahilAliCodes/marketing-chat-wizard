
import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, MessageSquare, Users, Video, FileText, Play, Sparkles, Share2, Save, SendHorizontal, Rocket, Link, CheckCircle } from 'lucide-react';
import { useChatWithAI } from '@/hooks/useChatWithAI';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { v4 as uuidv4 } from 'uuid';

interface AIChatInterfaceProps {
  websiteUrl: string;
  campaignType?: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'BLASTari';
  content: string;
  timestamp: Date;
}

interface RecommendedPrompt {
  text: string;
  description: string;
}

const recommendedPrompts: Record<string, RecommendedPrompt[]> = {
  'Community Building on Discord': [
    { text: "Create a welcome message for my Discord server", description: "Server onboarding" },
    { text: "Generate a list of engagement activities for my Discord community", description: "Community activities" },
    { text: "Write a server rules template for my Discord", description: "Server rules" },
    { text: "Create a weekly event schedule for my Discord server", description: "Event planning" },
    { text: "Generate a list of icebreaker questions for my Discord community", description: "Community bonding" }
  ],
  'Create Viral Content on TikTok': [
    { text: "Create a viral TikTok script about {website}", description: "Viral content" },
    { text: "Generate 5 trending TikTok video ideas for {website}", description: "Content ideas" },
    { text: "Write a hook script for a TikTok about {website}", description: "Engagement hooks" },
    { text: "Create a TikTok transition sequence for {website}", description: "Visual effects" },
    { text: "Generate a week's worth of TikTok content for {website}", description: "Content calendar" }
  ],
  'Content Marketing': [
    { text: "Write a blog post outline about {website}", description: "Content structure" },
    { text: "Create a social media content calendar for {website}", description: "Content planning" },
    { text: "Generate 10 blog post ideas for {website}", description: "Content ideas" },
    { text: "Write an email newsletter template for {website}", description: "Email marketing" },
    { text: "Create a content repurposing strategy for {website}", description: "Content reuse" }
  ],
  'default': [
    { text: "Create a marketing plan for {website}", description: "Strategy planning" },
    { text: "Generate a social media strategy for {website}", description: "Social strategy" },
    { text: "Write a brand voice guide for {website}", description: "Brand guidelines" },
    { text: "Create a content marketing strategy for {website}", description: "Content strategy" },
    { text: "Generate a list of marketing channels for {website}", description: "Channel strategy" }
  ]
};

const RecommendedPrompts: React.FC<{ 
  campaignType?: string;
  onSelectPrompt: (prompt: string) => void;
  websiteUrl: string;
}> = ({ campaignType, onSelectPrompt, websiteUrl }) => {
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
            className="flex-shrink-0 text-left p-2 rounded-md border border-gray-200 hover:border-marketing-purple/50 hover:bg-marketing-purple/5 transition-colors"
          >
            <p className="text-xs font-medium text-gray-900 line-clamp-1">{formatPrompt(prompt.text)}</p>
          </button>
        ))}
      </div>
    </div>
  );
};

const FormattedMessage: React.FC<{ content: string }> = ({ content }) => {
  const formatContent = (text: string) => {
    // Split by headers (###)
    const sections = text.split(/(?=###)/);
    
    return sections.map((section, index) => {
      // Check if this is a header section
      if (section.startsWith('###')) {
        const [header, ...content] = section.split('\n');
        const headerText = header.replace('###', '').trim();
        
        return (
          <div key={index} className="mb-6">
            <h3 className="text-lg font-semibold mb-3 bg-gradient-to-r from-purple-800 to-purple-600 bg-clip-text text-transparent">
              {headerText}
            </h3>
            <div className="pl-4 border-l-2 border-purple-200">
              {content.join('\n').split('\n').map((line, lineIndex) => {
                // Handle bullet points (lines starting with -)
                if (line.trim().startsWith('-')) {
                  return (
                    <div key={lineIndex} className="flex items-start gap-2 mb-3">
                      <span className="text-purple-800 mt-1.5">•</span>
                      <div className="text-gray-700">
                        {line.replace(/^-\s*/, '').replace(/\*\*/g, '').replace(/\*/g, '')}
                      </div>
                    </div>
                  );
                }
                // Handle numbered lists
                if (/^\d+\./.test(line.trim())) {
                  return (
                    <div key={lineIndex} className="flex items-start gap-2 mb-3">
                      <span className="text-purple-800 mt-1.5 min-w-[1.5rem]">{line.match(/^\d+/)?.[0]}.</span>
                      <div className="text-gray-700">
                        {line.replace(/^\d+\.\s*/, '').replace(/\*\*/g, '').replace(/\*/g, '')}
                      </div>
                    </div>
                  );
                }
                // Handle regular text (remove all markdown formatting)
                return (
                  <div key={lineIndex} className="mb-3 text-gray-700">
                    {line.replace(/\*\*/g, '').replace(/\*/g, '')}
                  </div>
                );
              })}
            </div>
          </div>
        );
      }
      
      // Process plain text sections (non-header sections)
      const lines = section.split('\n');
      return (
        <div key={index} className="mb-3">
          {lines.map((line, lineIndex) => {
            // Handle bullet points
            if (line.trim().startsWith('-')) {
              return (
                <div key={lineIndex} className="flex items-start gap-2 mb-3">
                  <span className="text-purple-800 mt-1.5">•</span>
                  <div className="text-gray-700">
                    {line.replace(/^-\s*/, '').replace(/\*\*/g, '').replace(/\*/g, '')}
                  </div>
                </div>
              );
            }
            // Handle numbered lists
            if (/^\d+\./.test(line.trim())) {
              return (
                <div key={lineIndex} className="flex items-start gap-2 mb-3">
                  <span className="text-purple-800 mt-1.5 min-w-[1.5rem]">{line.match(/^\d+/)?.[0]}.</span>
                  <div className="text-gray-700">
                    {line.replace(/^\d+\.\s*/, '').replace(/\*\*/g, '').replace(/\*/g, '')}
                  </div>
                </div>
              );
            }
            // Regular text (remove markdown formatting)
            return (
              <div key={lineIndex} className="mb-3 text-gray-700">
                {line.replace(/\*\*/g, '').replace(/\*/g, '')}
              </div>
            );
          })}
        </div>
      );
    });
  };

  return (
    <div className="prose prose-sm max-w-none">
      {formatContent(content)}
    </div>
  );
};

const AnimatedRocket: React.FC = () => {
  return (
    <div className="absolute left-4 bottom-4 animate-bounce">
      <div className="relative">
        <Rocket className="h-6 w-6 text-purple-600 animate-pulse" />
        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-purple-600 rounded-full animate-ping" />
      </div>
    </div>
  );
};

const AIChatInterface: React.FC<AIChatInterfaceProps> = ({ websiteUrl, campaignType }) => {
  const [userMessage, setUserMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const { sendMessageToAI, isLoading } = useChatWithAI();
  const bottomRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [copyingLink, setCopyingLink] = useState(false);

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
    let welcomeMessage = `Hi there! I'm your marketing assistant for ${websiteUrl} — here to help you craft campaigns, boost visibility, and grow your brand one step at a time. Let's make something amazing together! 🚀`;
    
    
    setChatHistory([{
      id: 'welcome',
      role: 'BLASTari',
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

  const handlePromptSelect = (prompt: string) => {
    setUserMessage(prompt);
  };

  const handleShareChat = async () => {
    try {
      // Create a unique ID for sharing this chat
      const shareId = uuidv4().slice(0, 8);
      
      // Create a simple object with the chat data
      const shareData = {
        websiteUrl,
        campaignType,
        messages: chatHistory
      };
      
      // In a production app, you would save this to a database
      // For now, we'll use localStorage as a demo
      localStorage.setItem(`shared-chat-${shareId}`, JSON.stringify(shareData));
      
      // Generate shareable link
      const baseUrl = window.location.origin;
      const shareUrl = `${baseUrl}/shared-chat/${shareId}`;
      
      // Set the share link
      setShareLink(shareUrl);
      
      toast({
        title: "Chat link created",
        description: "Copy the link to share this conversation",
      });
    } catch (error) {
      console.error("Error sharing chat:", error);
      toast({
        variant: "destructive",
        title: "Error creating share link",
        description: "There was a problem generating your share link."
      });
    }
  };

  const copyShareLink = async () => {
    if (!shareLink) return;
    
    setCopyingLink(true);
    try {
      await navigator.clipboard.writeText(shareLink);
      toast({
        title: "Link copied",
        description: "Share link copied to clipboard",
      });
    } catch (error) {
      console.error("Error copying link:", error);
      toast({
        variant: "destructive",
        title: "Copy failed",
        description: "Please try copying the link manually"
      });
    } finally {
      setCopyingLink(false);
    }
  };

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
              <span className="truncate max-w-[200px]">Website: {websiteUrl}</span>
              {campaignType && (
                <Badge variant="outline" className="ml-1">
                  {campaignType}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <ScrollArea className="flex-1 pr-4 mb-6 overflow-y-auto relative">
        <div className="space-y-4">
          {chatHistory.map((message, idx) => {
            // Only show play button for assistant messages, and only if previous message was from user
            const showPlayButton = message.role === 'assistant' && idx > 0 && chatHistory[idx - 1].role === 'user';
            return (
              <Card 
                key={message.id} 
                className={`${
                  message.role === 'user' 
                    ? 'bg-gray-100 border-gray-200' 
                    : message.role === 'BLASTari' 
                      ? 'bg-marketing-purple/5 border-marketing-purple/20' 
                      : 'bg-marketing-purple/10 border-marketing-purple/30'
                }`}
              >
                <CardContent className="p-4">
                  <p className="text-xs font-medium text-gray-600 mb-2">
                    {message.role === 'user' ? 'You' : message.role === 'BLASTari' ? 'BLASTari' : 'AI Assistant'}
                  </p>
                  <div className="relative">
                    {message.role === 'assistant' ? (
                      <FormattedMessage content={message.content} />
                    ) : (
                      <div className="text-sm break-words whitespace-pre-wrap">{message.content}</div>
                    )}
                    {showPlayButton && (
                      <button
                        type="button"
                        className="absolute top-0 right-0 p-2 rounded-full hover:bg-green-100 focus:outline-none"
                        aria-label="Generate content from this chat"
                        onClick={() => {
                          // Send user message and assistant response to the Runs page
                          navigate('/runs', {
                            state: {
                              messageContent: chatHistory[idx - 1].content, // user message
                              messageRole: 'user',
                              previousMessage: message.content // assistant response
                            }
                          });
                        }}
                      >
                        <Play className="w-5 h-5 text-green-600" />
                      </button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
          <div ref={bottomRef} />
          {isLoading && <AnimatedRocket />}
        </div>
      </ScrollArea>
      
      <form onSubmit={handleSubmit} className="mt-auto">
        <RecommendedPrompts 
          campaignType={campaignType} 
          onSelectPrompt={handlePromptSelect}
          websiteUrl={websiteUrl}
        />
        <div className="flex flex-col gap-3">
          <div className="relative">
            <Textarea
              className="flex-1 min-h-[60px] max-h-[120px] resize-none border-2 border-purple-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 pr-12 transition-all"
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
              className="absolute right-2 bottom-2 h-10 w-10 p-0 bg-purple-600 hover:bg-purple-700"
              disabled={!userMessage.trim() || isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin text-white" />
              ) : (
                <SendHorizontal className="h-5 w-5 text-white" />
              )}
            </Button>
          </div>
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              className="text-sm text-gray-600 hover:text-purple-800 hover:border-purple-800"
              onClick={() => {
                // TODO: Implement sign in functionality
                console.log('Sign in clicked');
              }}
            >
              <Save className="h-4 w-4 mr-2" />
              Sign in to save
            </Button>
            
            {shareLink ? (
              <div className="flex items-center gap-2">
                <div className="px-2 py-1 text-xs bg-gray-100 border border-gray-300 rounded-md truncate max-w-[150px]">
                  {shareLink}
                </div>
                <Button
                  variant="outline" 
                  size="sm"
                  className="text-sm text-gray-600 hover:text-green-600 hover:border-green-600"
                  onClick={copyShareLink}
                  disabled={copyingLink}
                >
                  {copyingLink ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle className="h-4 w-4 mr-2" />
                  )}
                  Copy
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="text-sm text-gray-600 hover:text-purple-800 hover:border-purple-800"
                onClick={handleShareChat}
              >
                <Share2 className="h-4 w-4 mr-2" />
                Share chat
              </Button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
};

export default AIChatInterface;
