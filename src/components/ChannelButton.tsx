
import React from 'react';
import { cn } from '@/lib/utils';
import { type ChannelType } from '@/context/ChatContext';

interface ChannelButtonProps {
  channel: ChannelType;
  isActive: boolean;
  onClick: () => void;
}

const ChannelButton = ({ channel, isActive, onClick }: ChannelButtonProps) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col items-start p-4 rounded-lg transition-all duration-200 min-w-[220px] max-w-[280px] border-2",
        isActive 
          ? "border-marketing-purple bg-marketing-lightPurple shadow-sm"
          : "border-gray-200 hover:border-gray-300 bg-white"
      )}
    >
      <div className="font-medium mb-1 text-marketing-darkGray">{channel.name}</div>
      <div className="text-xs text-gray-500 truncate w-full">{channel.description}</div>
    </button>
  );
};

export default ChannelButton;
