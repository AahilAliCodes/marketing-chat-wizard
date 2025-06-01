
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
    <div className="bg-gradient-to-r from-marketing-purple to-marketing-darkPurple border-b border-white/10 px-6 py-4 shadow-modern">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-8">
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="flex items-center justify-center w-9 h-9 bg-white rounded-xl shadow-modern group-hover:scale-105 transition-transform duration-200">
              <span className="text-marketing-purple font-bold text-xl">B</span>
            </div>
            <span className="text-white font-semibold text-xl tracking-tight">BLASTari</span>
          </Link>
          
          <nav className="flex items-center space-x-1">
            {[
              { path: '/dashboard', label: 'Home' },
              { path: '/research', label: 'Posts' },
              { path: '/chat', label: 'Chat' }
            ].map(({ path, label }) => (
              <Link 
                key={path}
                to={path} 
                className={`text-white/90 hover:text-white hover:bg-white/10 transition-all duration-200 px-4 py-2 rounded-lg font-medium ${
                  location.pathname === path ? 'bg-white/20 text-white shadow-modern' : ''
                }`}
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>
        
        <div className="flex items-center gap-4">
          {user ? (
            <>
              <span className="text-white/80 text-sm font-medium bg-white/10 px-3 py-1.5 rounded-lg">
                {user.email}
              </span>
              <Button
                onClick={handleSignOut}
                variant="ghost"
                className="text-white hover:bg-white/10 hover:text-white border border-white/20 hover:border-white/30 transition-all duration-200"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </>
          ) : (
            <Button
              onClick={handleSignIn}
              variant="ghost"
              className="text-white hover:bg-white/10 hover:text-white border border-white/20 hover:border-white/30 transition-all duration-200"
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
