
import React, { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import ChatArea from '@/components/ChatArea';
import { ChatProvider } from '@/context/ChatContext';

const Index = () => {
  const [activeItem, setActiveItem] = useState<string>('home');

  return (
    <ChatProvider>
      <div className="flex h-screen w-full">
        <Sidebar activeItem={activeItem} setActiveItem={setActiveItem} />
        <ChatArea />
      </div>
    </ChatProvider>
  );
};

export default Index;
