
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'BLASTari';
  content: string;
  timestamp: Date;
}

interface SharedChatData {
  websiteUrl: string;
  campaignType?: string;
  messages: ChatMessage[];
}

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
              {content.map((line, lineIndex) => {
                // Handle bullet points
                if (line.trim().startsWith('-')) {
                  const parts = line.split('**');
                  return (
                    <div key={lineIndex} className="flex items-start gap-2 mb-3">
                      <span className="text-purple-800 mt-1.5">•</span>
                      <div className="text-gray-700">
                        {parts.map((part, partIndex) => (
                          partIndex % 2 === 0 ? (
                            <span key={partIndex}>{part.replace(/^-\s*/, '')}</span>
                          ) : (
                            <span key={partIndex} className="font-medium text-purple-800">{part}</span>
                          )
                        ))}
                      </div>
                    </div>
                  );
                }
                // Handle bold text
                if (line.includes('**')) {
                  const parts = line.split('**');
                  return (
                    <div key={lineIndex} className="mb-3 text-gray-700">
                      {parts.map((part, partIndex) => (
                        partIndex % 2 === 0 ? (
                          <span key={partIndex}>{part}</span>
                        ) : (
                          <span key={partIndex} className="font-medium text-purple-800">{part}</span>
                        )
                      ))}
                    </div>
                  );
                }
                // Handle numbered lists
                if (/^\d+\./.test(line.trim())) {
                  return (
                    <div key={lineIndex} className="flex items-start gap-2 mb-3">
                      <span className="text-purple-800 mt-1.5 min-w-[1.5rem]">{line.match(/^\d+/)?.[0]}.</span>
                      <div className="text-gray-700">
                        {line.replace(/^\d+\.\s*/, '')}
                      </div>
                    </div>
                  );
                }
                return <div key={lineIndex} className="mb-3 text-gray-700">{line}</div>;
              })}
            </div>
          </div>
        );
      }
      
      // Handle regular text
      return <div key={index} className="mb-3 text-gray-700">{section}</div>;
    });
  };

  return (
    <div className="prose prose-sm max-w-none">
      {formatContent(content)}
    </div>
  );
};

const SharedChat: React.FC = () => {
  const { chatId } = useParams<{ chatId: string }>();
  const [chatData, setChatData] = useState<SharedChatData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!chatId) {
      setError("Invalid chat ID");
      setLoading(false);
      return;
    }

    try {
      // Attempt to retrieve the shared chat data from localStorage
      const storedData = localStorage.getItem(`shared-chat-${chatId}`);
      
      if (storedData) {
        const parsedData = JSON.parse(storedData);
        
        // Convert string timestamps back to Date objects
        const processedMessages = parsedData.messages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }));
        
        setChatData({
          ...parsedData,
          messages: processedMessages
        });
      } else {
        setError("Chat not found");
      }
    } catch (err) {
      console.error("Error loading shared chat:", err);
      setError("Failed to load chat data");
    } finally {
      setLoading(false);
    }
  }, [chatId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-12 w-12 rounded-full bg-marketing-purple/30 mb-4"></div>
          <div className="h-4 w-48 bg-gray-200 rounded mb-2"></div>
          <div className="h-3 w-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error || !chatData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8 max-w-md">
          <div className="bg-red-100 text-red-800 p-4 rounded-lg mb-6">
            <h2 className="text-xl font-bold mb-2">Chat Not Found</h2>
            <p>{error || "This shared chat could not be found or has expired."}</p>
          </div>
          <Link to="/">
            <Button>
              <ChevronLeft className="mr-2 h-4 w-4" />
              Return to Homepage
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="mb-6 flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold mb-2">Shared Marketing Chat</h1>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">Website: {chatData.websiteUrl}</span>
                {chatData.campaignType && (
                  <Badge variant="outline" className="ml-1">
                    {chatData.campaignType}
                  </Badge>
                )}
              </div>
            </div>
            <Link to="/">
              <Button variant="outline" size="sm">
                <ChevronLeft className="mr-2 h-4 w-4" />
                Home
              </Button>
            </Link>
          </div>

          <ScrollArea className="h-[70vh] pr-4">
            <div className="space-y-4 mb-6">
              {chatData.messages.map((message) => (
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
                      {message.role === 'user' ? 'User' : message.role === 'BLASTari' ? 'BLASTari' : 'AI Assistant'}
                    </p>
                    <div className="relative">
                      {message.role === 'assistant' ? (
                        <FormattedMessage content={message.content} />
                      ) : (
                        <div className="text-sm break-words whitespace-pre-wrap">{message.content}</div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
          
          <div className="border-t pt-4 mt-4">
            <p className="text-sm text-gray-500">
              This is a read-only view of a shared chat conversation.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SharedChat;
