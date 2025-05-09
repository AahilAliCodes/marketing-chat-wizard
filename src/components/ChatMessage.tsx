
import React from 'react';
import { cn } from '@/lib/utils';
import { MessageType } from '@/context/ChatContext';

interface ChatMessageProps {
  message: MessageType;
}

const ChatMessage = ({ message }: ChatMessageProps) => {
  const isUser = message.role === 'user';
  
  return (
    <div className={cn(
      "mb-4 max-w-[80%] px-4 py-3 rounded-lg",
      isUser ? "ml-auto bg-marketing-purple text-white rounded-tr-none" : "mr-auto bg-gray-100 text-gray-800 rounded-tl-none"
    )}>
      <div className="text-sm">
        {message.content}
      </div>
      <div className={cn(
        "text-xs mt-1", 
        isUser ? "text-white/80" : "text-gray-500"
      )}>
        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </div>
    </div>
  );
};

export default ChatMessage;
