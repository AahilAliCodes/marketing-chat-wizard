
import React from 'react';
import { cn } from '@/lib/utils';
import { MessageType } from '@/types/chat';
import { Play } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ChatMessageProps {
  message: MessageType;
}

const ChatMessage = ({ message }: ChatMessageProps) => {
  const isUser = message.role === 'user';
  const navigate = useNavigate();
  
  const handlePlayClick = () => {
    navigate('/runs');
  };
  
  return (
    <div className={cn(
      "mb-4 max-w-[80%] px-4 py-3 rounded-lg relative",
      isUser ? "ml-auto bg-marketing-purple text-white rounded-tr-none" : "mr-auto bg-gray-100 text-gray-800 rounded-tl-none"
    )}>
      <div className="text-sm">
        {message.content}
      </div>
      <div className={cn(
        "text-xs mt-1 flex items-center justify-between", 
        isUser ? "text-white/80" : "text-gray-500"
      )}>
        <span>{message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        
        {!isUser && (
          <button
            onClick={handlePlayClick}
            className="ml-2 p-1 rounded-full bg-marketing-purple text-white hover:bg-marketing-purple/80 transition-colors"
            title="Run this prompt"
          >
            <Play size={14} />
          </button>
        )}
      </div>
    </div>
  );
};

export default ChatMessage;
