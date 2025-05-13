
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

type AuthContextType = {
  session: Session | null;
  user: User | null;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
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
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_, session) => {
        setSession(session);
        setUser(session?.user ?? null);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUpWithEmail = async (email: string, password: string) => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth`
        }
      });
      
      if (error) throw error;

      toast({
        title: "Sign up successful",
        description: "Please check your email for verification instructions."
      });
      
      // Add this message specifically for development without email verification
      console.info("Note: For development, you might need to disable email confirmation in the Supabase dashboard.");
      
    } catch (error: any) {
      console.error("Sign up error:", error);
      toast({
        variant: "destructive",
        title: "Sign up error",
        description: error.message || "Failed to sign up. Please try again."
      });
      throw error; // Re-throw to allow the UI to handle it
    } finally {
      setLoading(false);
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) throw error;

      toast({
        title: "Signed in",
        description: "You have been successfully signed in"
      });
    } catch (error: any) {
      console.error("Sign in error:", error);
      toast({
        variant: "destructive",
        title: "Sign in error",
        description: error.message || "Failed to sign in. Please check your credentials."
      });
      throw error; // Re-throw to allow the UI to handle it
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth`,
        },
      });
      
      if (error) throw error;

      toast({
        title: "Google authentication",
        description: "Redirecting to Google for authentication..."
      });
    } catch (error: any) {
      console.error("Google authentication error:", error);
      toast({
        variant: "destructive",
        title: "Authentication error",
        description: error.message || "Failed to start Google authentication."
      });
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      toast({
        title: "Signed out",
        description: "You have been successfully signed out"
      });
    } catch (error: any) {
      console.error("Sign out error:", error);
      toast({
        variant: "destructive",
        title: "Error signing out",
        description: error.message || "Failed to sign out. Please try again."
      });
    }
  };

  const value = {
    session,
    user,
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
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
