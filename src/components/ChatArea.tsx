
import React, { useRef, useEffect, useState } from 'react';
import { useChat } from '@/context/ChatContext';
import ChannelButton from './ChannelButton';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import { Button } from './ui/button';
import { Save } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

const ChatArea = () => {
  const { activeChannel, channels, setActiveChannel } = useChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  
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

      <div className="border-t p-3 bg-white flex justify-center">
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="text-marketing-purple hover:bg-marketing-purple/10">
              <Save className="mr-2 h-4 w-4" />
              Save Chat
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-marketing-purple">Create an Account</DialogTitle>
              <DialogDescription>
                Create an account to save your chats and access them anytime.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">Email</label>
                <input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-marketing-purple"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium">Password</label>
                <input
                  id="password"
                  type="password"
                  placeholder="Create a password"
                  className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-marketing-purple"
                />
              </div>
              <Button className="w-full bg-marketing-purple hover:bg-marketing-purple/90">
                Create Account
              </Button>
              <div className="text-center text-sm text-gray-500">
                Already have an account? <span className="text-marketing-purple cursor-pointer hover:underline">Sign in</span>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default ChatArea;
