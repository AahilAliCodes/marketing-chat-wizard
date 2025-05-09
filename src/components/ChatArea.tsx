
import React, { useRef, useEffect } from 'react';
import { useChat } from '@/context/ChatContext';
import ChannelButton from './ChannelButton';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';

const ChatArea = () => {
  const { activeChannel, channels, setActiveChannel } = useChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const currentChannel = channels.find(c => c.id === activeChannel);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentChannel?.messages]);

  return (
    <div className="flex flex-col h-screen flex-1">
      <div className="p-4 border-b">
        <div className="flex gap-3 overflow-x-auto py-2 pb-4">
          {channels.map((channel) => (
            <ChannelButton
              key={channel.id}
              channel={channel}
              isActive={channel.id === activeChannel}
              onClick={() => setActiveChannel(channel.id)}
            />
          ))}
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
        {currentChannel?.messages.map((message) => (
          <ChatMessage key={message.id} message={message} />
        ))}
        <div ref={messagesEndRef} />
      </div>
      
      <ChatInput />
    </div>
  );
};

export default ChatArea;
