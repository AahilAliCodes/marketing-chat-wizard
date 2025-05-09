
import React, { useRef, useEffect, useState } from 'react';
import { useChat } from '@/context/ChatContext';
import { useAuth } from '@/context/AuthContext';
import ChannelButton from './ChannelButton';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import { Button } from './ui/button';
import { Save, Send, Loader2, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useToast } from '@/hooks/use-toast';

const newChannelSchema = z.object({
  name: z.string().min(3, { message: "Channel name must be at least 3 characters" }),
  description: z.string().min(5, { message: "Description must be at least 5 characters" }),
});

const ChatArea = () => {
  const { 
    activeChannel, 
    channels, 
    setActiveChannel, 
    saveCurrentChannel,
    createNewChannel,
    isLoading 
  } = useChat();
  const { user, signIn, signUp } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [newChannelOpen, setNewChannelOpen] = useState(false);
  const [authForm, setAuthForm] = useState<'signin' | 'signup'>('signin');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const currentChannel = channels.find(c => c.id === activeChannel);

  const { 
    register, 
    handleSubmit, 
    reset,
    formState: { errors } 
  } = useForm({
    resolver: zodResolver(newChannelSchema),
    defaultValues: {
      name: '',
      description: ''
    }
  });

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentChannel?.messages]);

  const handleSendChat = () => {
    console.log("Sending chat transcript...");
    // This would typically connect to an email service or sharing functionality
  };

  const handleSaveChat = async () => {
    if (!user) {
      setAuthDialogOpen(true);
      return;
    }

    await saveCurrentChannel();
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);

    try {
      if (authForm === 'signin') {
        await signIn(authEmail, authPassword);
        setAuthDialogOpen(false);
      } else {
        await signUp(authEmail, authPassword);
        setAuthForm('signin');
      }
    } catch (error) {
      console.error("Auth error:", error);
    } finally {
      setAuthLoading(false);
    }
  };

  const onNewChannelSubmit = handleSubmit((data) => {
    createNewChannel(data.name, data.description);
    setNewChannelOpen(false);
    reset();
    toast({
      title: "Channel created",
      description: `Your new channel "${data.name}" has been created`
    });
  });

  return (
    <div className="flex flex-col h-screen flex-1">
      <div className="p-4 border-b">
        <div className="flex gap-3 overflow-x-auto py-2 pb-4">
          <Button
            onClick={() => setNewChannelOpen(true)}
            variant="outline"
            className="shrink-0 border-dashed border-gray-300 text-gray-500 hover:text-marketing-purple hover:border-marketing-purple"
          >
            <Plus className="mr-1 h-4 w-4" />
            New Chat
          </Button>
          {channels.map((channel) => (
            <ChannelButton
              key={channel.id}
              channel={channel}
              isActive={channel.id === activeChannel}
              onClick={() => setActiveChannel(channel.id)}
            />
          ))}
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
        {currentChannel?.messages.map((message) => (
          <ChatMessage key={message.id} message={message} />
        ))}
        <div ref={messagesEndRef} />
      </div>
      
      <ChatInput />

      <div className="border-t p-3 bg-white flex justify-center space-x-2">
        <Dialog open={authDialogOpen} onOpenChange={setAuthDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-marketing-purple">
                {authForm === 'signin' ? 'Sign In' : 'Create an Account'}
              </DialogTitle>
              <DialogDescription>
                {authForm === 'signin' 
                  ? 'Sign in to save your chats and access them anytime.'
                  : 'Create an account to save your chats and access them anytime.'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAuthSubmit} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  placeholder="Create a password"
                  className="w-full"
                  required
                />
              </div>
              <Button 
                type="submit" 
                className="w-full bg-marketing-purple hover:bg-marketing-purple/90"
                disabled={authLoading}
              >
                {authLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {authForm === 'signin' ? 'Sign In' : 'Create Account'}
              </Button>
              <div className="text-center text-sm text-gray-500">
                {authForm === 'signin' ? (
                  <>
                    Don't have an account?{" "}
                    <Button 
                      variant="link" 
                      className="text-marketing-purple p-0"
                      onClick={() => setAuthForm('signup')}
                    >
                      Sign up
                    </Button>
                  </>
                ) : (
                  <>
                    Already have an account?{" "}
                    <Button 
                      variant="link" 
                      className="text-marketing-purple p-0"
                      onClick={() => setAuthForm('signin')}
                    >
                      Sign in
                    </Button>
                  </>
                )}
              </div>
            </form>
          </DialogContent>
        </Dialog>

        <Sheet open={newChannelOpen} onOpenChange={setNewChannelOpen}>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Create New Chat</SheetTitle>
              <SheetDescription>
                Create a new chat channel to start a conversation
              </SheetDescription>
            </SheetHeader>
            <form onSubmit={onNewChannelSubmit} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  placeholder="E.g., Facebook Ads"
                  {...register("name")}
                />
                {errors.name && (
                  <p className="text-sm text-red-500">{errors.name.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  placeholder="E.g., Help with Facebook ad campaigns"
                  {...register("description")}
                />
                {errors.description && (
                  <p className="text-sm text-red-500">{errors.description.message}</p>
                )}
              </div>
              <Button type="submit" className="w-full bg-marketing-purple hover:bg-marketing-purple/90">
                Create Chat
              </Button>
            </form>
          </SheetContent>
        </Sheet>
        
        <Button 
          variant="outline" 
          size="sm" 
          className="text-marketing-purple hover:bg-marketing-purple/10"
          onClick={handleSaveChat}
          disabled={isLoading}
        >
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Save Chat
        </Button>
        
        <Button 
          variant="outline" 
          size="sm" 
          className="bg-marketing-purple text-white hover:bg-marketing-purple/90"
          onClick={handleSendChat}
        >
          <Send className="mr-2 h-4 w-4" />
          Send Chat
        </Button>
      </div>
    </div>
  );
};

export default ChatArea;
