
import React from 'react';
import { Play } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import FormattedMessage from './FormattedMessage';
import { ChatMessage as ChatMessageType } from './types';

interface ChatMessageProps {
  message: ChatMessageType;
  showPlayButton: boolean;
  onPlayClick: () => void;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, showPlayButton, onPlayClick }) => {
  return (
    <Card 
      className={`${
        message.role === 'user' 
          ? 'bg-gray-100 border-gray-200' 
          : message.role === 'BLASTari' 
            ? 'bg-red-50 border-red-200' 
            : 'bg-red-100 border-red-200'
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
              onClick={onPlayClick}
            >
              <Play className="w-5 h-5 text-green-600" />
            </button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ChatMessage;
