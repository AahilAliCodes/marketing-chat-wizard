
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogOut, LogIn } from 'lucide-react';
import { Button } from './ui/button';
import { useAuth } from '@/context/AuthContext';

const Topbar = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
  };

  const handleSignIn = () => {
    navigate('/auth');
  };

  return (
    <div className="bg-marketing-purple border-b border-white/20 px-6 py-4">
      <div className="flex items-center justify-between">
        <Link to="/" className="flex items-center space-x-3">
          <div className="flex items-center justify-center w-8 h-8 bg-white rounded-md">
            <span className="text-marketing-purple font-bold text-lg">B</span>
          </div>
          <span className="text-white font-bold text-xl">BLASTari</span>
        </Link>
        
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
          )}
        </div>
      </div>
    </div>
  );
};

export default Topbar;
