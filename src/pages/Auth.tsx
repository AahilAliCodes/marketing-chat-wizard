
import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { Navigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Loader2 } from 'lucide-react';
import { FcGoogle } from 'react-icons/fc';

const Auth = () => {
  const { user, signInWithGoogle, loading } = useAuth();

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
          <h1 className="text-3xl font-bold text-marketing-purple">AI Marketing Assistant</h1>
          <p className="mt-2 text-gray-600">Sign in to save your chats</p>
        </div>

        <div className="space-y-6">
          <Button
            onClick={signInWithGoogle}
            className="w-full flex items-center justify-center gap-2 bg-white text-gray-700 hover:bg-gray-100 border border-gray-300"
          >
            <FcGoogle className="h-5 w-5" />
            Sign in with Google
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-2 text-gray-500">No account setup required</span>
            </div>
          </div>

          <p className="text-center text-sm text-gray-500">
            We use Google authentication to provide a secure and seamless experience.
            Your chats will be saved to your account automatically.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
