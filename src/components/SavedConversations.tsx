
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageSquare, Calendar, User } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useChat } from '@/context/ChatContext';
import { getUserChannels } from '@/services/ChatService';
import { useToast } from '@/hooks/use-toast';
import { SessionManager } from '@/utils/sessionManager';

interface SavedConversation {
  id: string;
  name: string;
  description: string;
  updated_at: string;
  messageCount: number;
  isSession?: boolean; // To distinguish session-based conversations
}

interface SavedConversationsProps {
  onSelectConversation: (channelId: string) => void;
}

const SavedConversations: React.FC<SavedConversationsProps> = ({ onSelectConversation }) => {
  const [conversations, setConversations] = useState<SavedConversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const { channels, loadUserChannels } = useChat();
  const { toast } = useToast();

  const getSessionConversations = () => {
    const sessionId = SessionManager.getSessionId();
    const sessionConversations: SavedConversation[] = [];
    
    // Get all localStorage keys that contain session chat data
    Object.keys(localStorage).forEach(key => {
      if (key.includes(`${sessionId}_chat_`) && !key.includes('current_analysis')) {
        try {
          const chatData = JSON.parse(localStorage.getItem(key) || '{}');
          if (chatData.messages && chatData.messages.length > 1) { // More than just welcome message
            const websiteUrl = chatData.websiteUrl || 'Unknown Website';
            const campaignType = chatData.campaignType || 'General Marketing';
            
            sessionConversations.push({
              id: key,
              name: `${campaignType} - ${websiteUrl}`,
              description: `${chatData.messages.length} messages`,
              updated_at: chatData.lastUpdated || new Date().toISOString(),
              messageCount: chatData.messages.length,
              isSession: true
            });
          }
        } catch (error) {
          console.error('Error parsing session chat data:', error);
        }
      }
    });
    
    // Sort by last updated
    return sessionConversations.sort((a, b) => 
      new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    );
  };

  useEffect(() => {
    const fetchConversations = async () => {
      setIsLoading(true);
      let allConversations: SavedConversation[] = [];
      
      // Get session-based conversations (for both authenticated and non-authenticated users)
      const sessionConversations = getSessionConversations();
      allConversations = [...sessionConversations];

      // If user is authenticated, also get database conversations
      if (user) {
        try {
          const userChannels = await getUserChannels();
          
          if (userChannels) {
            const dbConversations = userChannels.map(channel => ({
              id: channel.id,
              name: channel.name,
              description: channel.description || '',
              updated_at: channel.updated_at,
              messageCount: 0, // Will be populated when channel is loaded
              isSession: false
            }));
            
            allConversations = [...dbConversations, ...allConversations];
          }
        } catch (error) {
          console.error('Error fetching user channels:', error);
          toast({
            variant: "destructive",
            title: "Error loading saved conversations",
            description: "There was a problem loading your database conversations."
          });
        }
      }
      
      setConversations(allConversations);
      setIsLoading(false);
    };

    fetchConversations();
  }, [user, toast]);

  const handleSelectConversation = (conversationId: string) => {
    const conversation = conversations.find(c => c.id === conversationId);
    
    if (conversation?.isSession) {
      // For session-based conversations, we need to handle differently
      // We'll use a special prefix to indicate this is a session conversation
      onSelectConversation(`session_${conversationId}`);
    } else {
      // Regular database conversation
      onSelectConversation(conversationId);
    }
  };

  if (isLoading) {
    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Saved Conversations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Saved Conversations ({conversations.length})
        </CardTitle>
        {!user && conversations.length > 0 && (
          <p className="text-sm text-gray-500">
            Sign in to sync your conversations across devices
          </p>
        )}
      </CardHeader>
      <CardContent>
        {conversations.length === 0 ? (
          <div className="text-center py-8">
            <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600 mb-2">No saved conversations yet</p>
            <p className="text-sm text-gray-500">Start a conversation to see it here</p>
          </div>
        ) : (
          <div className="space-y-3">
            {conversations.map((conversation) => (
              <div
                key={conversation.id}
                className="border rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => handleSelectConversation(conversation.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-gray-900">{conversation.name}</h4>
                      {conversation.isSession && (
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          Local
                        </span>
                      )}
                    </div>
                    {conversation.description && (
                      <p className="text-sm text-gray-600 mb-2">{conversation.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(conversation.updated_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectConversation(conversation.id);
                    }}
                  >
                    Open
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SavedConversations;
