
import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { LogOut, LogIn } from 'lucide-react';
import { Button } from './ui/button';
import { useAuth } from '@/context/AuthContext';

const Topbar = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = async () => {
    await signOut();
  };

  const handleSignIn = () => {
    navigate('/auth');
  };

  return (
    <div className="bg-marketing-purple border-b border-white/20 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-8">
          <Link to="/" className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-8 h-8 bg-white rounded-md">
              <span className="text-marketing-purple font-bold text-lg">B</span>
            </div>
            <span className="text-white font-bold text-xl">BLASTari</span>
          </Link>
          
          {user && (
            <nav className="flex items-center space-x-6">
              <Link 
                to="/dashboard" 
                className={`text-white hover:text-white/80 transition-colors ${
                  location.pathname === '/dashboard' ? 'border-b-2 border-white pb-1' : ''
                }`}
              >
                Home
              </Link>
              <Link 
                to="/research" 
                className={`text-white hover:text-white/80 transition-colors ${
                  location.pathname === '/research' ? 'border-b-2 border-white pb-1' : ''
                }`}
              >
                Posts
              </Link>
              <Link 
                to="/chat" 
                className={`text-white hover:text-white/80 transition-colors ${
                  location.pathname === '/chat' ? 'border-b-2 border-white pb-1' : ''
                }`}
              >
                Chat
              </Link>
            </nav>
          )}
        </div>
        
        <div className="flex items-center gap-4">
          {user ? (
            <>
              <span className="text-white text-sm opacity-80">
                {user.email}
              </span>
              <Button
                onClick={handleSignOut}
                variant="ghost"
                className="text-white hover:bg-white/10"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </>
          ) : (
            <Button
              onClick={handleSignIn}
              variant="ghost"
              className="text-white hover:bg-white/10"
            >
              <LogIn className="h-4 w-4 mr-2" />
              Sign In
            </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Topbar;
