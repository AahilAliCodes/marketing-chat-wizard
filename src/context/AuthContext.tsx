
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { SessionManager } from '@/utils/sessionManager';

type AuthContextType = {
  session: Session | null;
  user: User | null;
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  loading: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Set up auth listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Handle successful auth and redirect to previous page
        if (event === 'SIGNED_IN' && session?.user) {
          const returnUrl = sessionStorage.getItem('authReturnUrl') || '/dashboard';
          sessionStorage.removeItem('authReturnUrl');
          
          // Small delay to ensure state is updated
          setTimeout(() => {
            window.location.href = returnUrl;
          }, 100);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          emailRedirectTo: undefined // Disable email confirmation for demo
        }
      });
      
      if (error) {
        // Handle specific auth errors gracefully
        if (error.message.includes('Email not confirmed')) {
          toast({
            title: "Email confirmation required",
            description: "Please check your email and click the confirmation link to complete signup.",
            variant: "destructive"
          });
          return;
        }
        throw error;
      }
      
      // If user is immediately available (no email confirmation), they're signed in
      if (data.user && !data.user.email_confirmed_at) {
        toast({
          title: "Account created successfully",
          description: "You are now signed in!"
        });
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error creating account",
        description: error.message
      });
      throw error;
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        // Handle specific auth errors gracefully
        if (error.message.includes('Email not confirmed')) {
          toast({
            title: "Email confirmation required",
            description: "Please check your email and click the confirmation link before signing in.",
            variant: "destructive"
          });
          return;
        }
        throw error;
      }
      toast({
        title: "Welcome back",
        description: "You have successfully signed in"
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error signing in",
        description: error.message
      });
      throw error;
    }
  };

  const signOut = async () => {
    try {
      // Clear local state first
      setSession(null);
      setUser(null);
      
      // Clear session manager data
      SessionManager.clearAllSessionData();
      
      // Sign out from Supabase
      await supabase.auth.signOut();
      
      // Clear any remaining session data
      sessionStorage.clear();
      localStorage.removeItem('supabase.auth.token');
      
      toast({
        title: "Signed out",
        description: "You have been signed out successfully"
      });
      
      // Small delay to ensure state is updated before redirect
      setTimeout(() => {
        window.location.href = '/';
      }, 100);
      
    } catch (error: any) {
      console.error('Sign out error:', error);
      toast({
        variant: "destructive",
        title: "Error signing out",
        description: error.message
      });
    }
  };

  const value = {
    session,
    user,
    signUp,
    signIn,
    signOut,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
