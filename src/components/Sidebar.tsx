
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Home, PieChart, LogOut, User, LogIn, LayoutDashboard } from 'lucide-react';
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

  return (
    <div className="h-screen w-16 md:w-64 bg-marketing-purple flex flex-col overflow-hidden">
      <div className="p-4 border-b border-white/20 flex justify-center md:justify-start">
        <Link to="/" className="flex items-center space-x-2">
          <div className="flex items-center justify-center w-8 h-8 bg-white rounded-md">
            <span className="text-marketing-purple font-bold">M</span>
          </div>
          <span className="text-white font-bold text-xl hidden md:block">Marketing AI</span>
        </Link>
      </div>
      <div className="flex flex-col flex-1 overflow-y-auto">
        <div className="p-2">
          <Button
            onClick={() => {
              setActiveItem('home');
              navigate('/');
            }}
            variant="ghost"
            className={`w-full justify-start mb-1 ${
              activeItem === 'home'
                ? 'bg-white/10 text-white'
                : 'text-gray-300 hover:bg-white/10 hover:text-white'
            }`}
          >
            <Home className="h-5 w-5 md:mr-2" />
            <span className="hidden md:inline">Home</span>
          </Button>
          <Button
            onClick={() => {
              setActiveItem('dashboard');
              navigate('/dashboard');
            }}
            variant="ghost"
            className={`w-full justify-start mb-1 ${
              activeItem === 'dashboard'
                ? 'bg-white/10 text-white'
                : 'text-gray-300 hover:bg-white/10 hover:text-white'
            }`}
          >
            <LayoutDashboard className="h-5 w-5 md:mr-2" />
            <span className="hidden md:inline">Dashboard</span>
          </Button>
          <Button
            onClick={() => {
              setActiveItem('runs');
              navigate('/runs');
            }}
            variant="ghost"
            className={`w-full justify-start ${
              activeItem === 'runs'
                ? 'bg-white/10 text-white'
                : 'text-gray-300 hover:bg-white/10 hover:text-white'
            }`}
          >
            <PieChart className="h-5 w-5 md:mr-2" />
            <span className="hidden md:inline">Runs</span>
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
          <Button
            onClick={handleSignIn}
            variant="ghost"
            className="w-full justify-start text-gray-300 hover:bg-white/10 hover:text-white"
          >
            <LogIn className="h-5 w-5 md:mr-2" />
            <span className="hidden md:inline">Sign In</span>
          </Button>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
