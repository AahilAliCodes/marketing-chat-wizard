
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageSquare, Calendar, User } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useChat } from '@/context/ChatContext';
import { getUserChannels } from '@/services/ChatService';
import { useToast } from '@/hooks/use-toast';

interface SavedConversation {
  id: string;
  name: string;
  description: string;
  updated_at: string;
  messageCount: number;
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

  useEffect(() => {
    const fetchConversations = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        const userChannels = await getUserChannels();
        
        if (userChannels) {
          const formattedConversations = userChannels.map(channel => ({
            id: channel.id,
            name: channel.name,
            description: channel.description || '',
            updated_at: channel.updated_at,
            messageCount: 0 // Will be populated when channel is loaded
          }));
          
          setConversations(formattedConversations);
        }
      } catch (error) {
        console.error('Error fetching conversations:', error);
        toast({
          variant: "destructive",
          title: "Error loading conversations",
          description: "There was a problem loading your saved conversations."
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchConversations();
  }, [user, toast]);

  const handleSelectConversation = (channelId: string) => {
    onSelectConversation(channelId);
  };

  if (!user) {
    return (
      <Card className="mb-6">
        <CardContent className="p-6 text-center">
          <User className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600 mb-4">Sign in to view your saved conversations</p>
        </CardContent>
      </Card>
    );
  }

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
      </CardHeader>
      <CardContent>
        {conversations.length === 0 ? (
          <div className="text-center py-8">
            <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600 mb-2">No saved conversations yet</p>
            <p className="text-sm text-gray-500">Start a conversation and save it to see it here</p>
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
                    <h4 className="font-medium text-gray-900 mb-1">{conversation.name}</h4>
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
