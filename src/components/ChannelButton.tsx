
import React from 'react';
import { ChannelType } from '@/context/ChatContext';
import { cn } from '@/lib/utils';
import { Save } from 'lucide-react';

interface ChannelButtonProps {
  channel: ChannelType;
  isActive: boolean;
  onClick: () => void;
  isSaved?: boolean;
}

const ChannelButton = ({ channel, isActive, onClick, isSaved = false }: ChannelButtonProps) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-3 py-2 rounded-md text-sm font-medium whitespace-nowrap flex items-center gap-2",
        isActive
          ? "bg-marketing-purple text-white"
          : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
      )}
    >
      {isSaved && <Save className="h-3 w-3" />}
      {channel.name}
    </button>
  );
};

export default ChannelButton;
