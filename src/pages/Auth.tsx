
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Navigate, useLocation } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Loader2 } from 'lucide-react';
import { FcGoogle } from 'react-icons/fc';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

const Auth = () => {
  const { user, signInWithGoogle, signInWithEmail, signUpWithEmail, loading } = useAuth();
  const location = useLocation();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [formLoading, setFormLoading] = useState(false);

  // Handle OAuth callback
  useEffect(() => {
    const handleOAuthCallback = async () => {
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        toast({
          variant: "destructive",
          title: "Authentication error",
          description: error.message
        });
        console.error("Error getting session:", error);
      } else if (data?.session) {
        toast({
          title: "Authentication successful",
          description: "You have been successfully signed in"
        });
      }
    };

    // Only run on mount when it might be an OAuth redirect
    handleOAuthCallback();
  }, [toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({
        variant: "destructive",
        title: "Missing fields",
        description: "Please enter both email and password"
      });
      return;
    }
    
    setFormLoading(true);
    
    try {
      if (isLogin) {
        await signInWithEmail(email, password);
      } else {
        await signUpWithEmail(email, password);
      }
    } finally {
      setFormLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-marketing-purple" />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md space-y-8 bg-white p-8 shadow-lg rounded-lg">
        <div className="text-center">
          <Avatar className="h-12 w-12 mx-auto mb-2">
            <AvatarImage src="/placeholder.svg" alt="BLASTari logo" />
            <AvatarFallback className="bg-marketing-purple text-white">B</AvatarFallback>
          </Avatar>
          <h1 className="text-3xl font-bold text-marketing-purple">BLASTari</h1>
          <p className="mt-2 text-gray-600">{isLogin ? "Sign in to continue" : "Create your account"}</p>
        </div>

        <div className="space-y-6">
          {/* Email/Password Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@example.com"
                required
                autoComplete={isLogin ? "username" : "email"}
                className="focus:border-marketing-purple focus:ring-marketing-purple"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input 
                id="password" 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete={isLogin ? "current-password" : "new-password"}
                className="focus:border-marketing-purple focus:ring-marketing-purple"
              />
            </div>
            <Button 
              type="submit" 
              className="w-full bg-marketing-purple hover:bg-purple-700"
              disabled={formLoading}
            >
              {formLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              {isLogin ? 'Sign In' : 'Sign Up'}
            </Button>
          </form>

          <div className="text-center">
            <button
              onClick={() => setIsLogin(!isLogin)} 
              className="text-sm text-marketing-purple hover:underline"
              type="button"
            >
              {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
            </button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-2 text-gray-500">Or continue with</span>
            </div>
          </div>

          <Button
            onClick={signInWithGoogle}
            className="w-full flex items-center justify-center gap-2 bg-white text-gray-700 hover:bg-gray-100 border border-gray-300"
            type="button"
          >
            <FcGoogle className="h-5 w-5" />
            Sign in with Google
          </Button>

          <p className="text-center text-sm text-gray-500">
            By signing in, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
