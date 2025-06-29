
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PieChart, LogOut, LogIn, LayoutDashboard } from 'lucide-react';
import { Button } from './ui/button';
import { useAuth } from '@/context/AuthContext';

interface SidebarProps {
  activeItem: string;
  setActiveItem: (item: string) => void;
}

const Sidebar = ({ activeItem, setActiveItem }: SidebarProps) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
  };

  const handleSignIn = () => {
    navigate('/auth');
  };

  const handleDashboardClick = () => {
    setActiveItem('home');
    navigate('/dashboard');
  };

  return (
    <div className="relative h-screen w-12 md:w-40 bg-marketing-purple flex flex-col overflow-hidden">
      <div className="p-2 border-b border-white/20 flex justify-center md:justify-start">
        <Link to="/" className="flex items-center space-x-2">
          <div className="flex items-center justify-center w-7 h-7 bg-white rounded-md">
            <span className="text-marketing-purple font-bold">B</span>
          </div>
          <span className="text-white font-bold text-lg hidden md:block">BLASTari</span>
        </Link>
      </div>
      <div className="flex flex-col flex-1 overflow-y-auto">
        <div className="p-1">
          <Button
            onClick={handleDashboardClick}
            variant="ghost"
            className={`w-full justify-start mb-1 ${
              activeItem === 'dashboard' || activeItem === 'home'
                ? 'bg-white/10 text-white'
                : 'text-gray-300 hover:bg-white/10 hover:text-white'
            }`}
          >
            <LayoutDashboard className="h-5 w-5 md:mr-2" />
            <span className="hidden md:inline">Dashboard</span>
          </Button>
          <Button
            onClick={() => {
              setActiveItem('reddit');
              navigate('/reddit-generator');
            }}
            variant="ghost"
            className={`w-full justify-start ${
              activeItem === 'runs' || activeItem === 'reddit'
                ? 'bg-white/10 text-white'
                : 'text-gray-300 hover:bg-white/10 hover:text-white'
            }`}
          >
            <PieChart className="h-5 w-5 md:mr-2" />
            <span className="hidden md:inline">Reddit Posts</span>
          </Button>
        </div>
      </div>
      <div className="p-4">
        {user ? (
          <>
            <div className="mb-2 px-2 py-1 rounded-md text-center md:text-left">
              <div className="text-white text-xs md:text-sm opacity-80 truncate hidden md:block">
                {user.email}
              </div>
            </div>
            <Button
              onClick={handleSignOut}
              variant="ghost"
              className="w-full justify-start text-gray-300 hover:bg-white/10 hover:text-white"
            >
              <LogOut className="h-5 w-5 md:mr-2" />
              <span className="hidden md:inline">Sign Out</span>
            </Button>
          </>
        ) : (
          <div className="flex items-center">
            <Button
              onClick={handleSignIn}
              variant="ghost"
              className="w-full justify-start text-gray-300 hover:bg-white/10 hover:text-white"
            >
              <LogIn className="h-5 w-5 md:mr-2" />
              <span className="hidden md:inline">Sign In</span>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
