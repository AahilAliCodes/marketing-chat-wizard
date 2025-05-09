
import React, { useState } from 'react';
import { Send } from 'lucide-react';
import { useChat } from '@/context/ChatContext';

const ChatInput = () => {
  const [message, setMessage] = useState('');
  const { activeChannel, addMessage } = useChat();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    // Add user message
    addMessage(activeChannel, message, 'user');
    
    // Simulate assistant response (in a real app, this would call an API)
    setTimeout(() => {
      const responses = [
        "That's a great marketing question! Here's a strategy you could try...",
        "Based on current trends, I would recommend focusing on...",
        "Let me help you craft that content. Here's a template you can use...",
        "For your target audience, I'd suggest the following approach...",
        "Here are some key points to include in your marketing campaign..."
      ];
      
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      addMessage(activeChannel, randomResponse, 'assistant');
    }, 1000);

    // Clear input
    setMessage('');
  };

  return (
    <form onSubmit={handleSubmit} className="border-t p-4">
      <div className="flex gap-2 items-center bg-white border rounded-full px-4 py-2 focus-within:ring-2 focus-within:ring-marketing-purple focus-within:border-marketing-purple">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Write a prompt..."
          className="flex-1 outline-none text-sm"
        />
        <button 
          type="submit" 
          className="text-marketing-purple hover:text-marketing-darkPurple transition-colors"
          disabled={!message.trim()}
        >
          <Send className="h-5 w-5" />
        </button>
      </div>
    </form>
  );
};

export default ChatInput;
