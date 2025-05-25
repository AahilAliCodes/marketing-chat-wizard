
import React from 'react';
import { MessageSquare, Users, Video, FileText } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ChatHeaderProps {
  campaignType?: string;
  websiteUrl: string;
  isChannelConversation?: boolean;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({ campaignType, websiteUrl, isChannelConversation }) => {
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

  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-3">
        <div className="bg-marketing-purple/10 p-2 rounded-full">
          {getCampaignIcon()}
        </div>
        <div>
          <h3 className="text-xl font-medium">
            {isChannelConversation 
              ? 'Saved Conversation' 
              : campaignType 
                ? `${campaignType}` 
                : 'Marketing AI Chat'
            }
          </h3>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span className="truncate max-w-[200px]">Website: {websiteUrl}</span>
            {campaignType && !isChannelConversation && (
              <Badge variant="outline" className="ml-1">
                {campaignType}
              </Badge>
            )}
            {isChannelConversation && (
              <Badge variant="secondary" className="ml-1">
                Saved
              </Badge>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatHeader;
