
import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import ChatArea from '@/components/ChatArea';
import { ChatProvider } from '@/context/ChatContext';
import { Toaster } from '@/components/ui/toaster';
import { useAuth } from '@/context/AuthContext';
import { Navigate } from 'react-router-dom';
import LoadingScreen from '@/components/LoadingScreen';

const Dashboard = () => {
  const [activeItem, setActiveItem] = useState<string>('home');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { user } = useAuth();

  // Simulate loading time
  useEffect(() => {
    // Show loading for at least 3 seconds
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 3000);
    
    return () => clearTimeout(timer);
  }, []);

  // Redirect to auth page if not logged in
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (isLoading) {
    return <LoadingScreen onComplete={() => setIsLoading(false)} />;
  }

  return (
    <ChatProvider>
      <div className="flex h-screen w-full">
        <Sidebar activeItem={activeItem} setActiveItem={setActiveItem} />
        <ChatArea />
      </div>
      <Toaster />
    </ChatProvider>
  );
};

export default Dashboard;
