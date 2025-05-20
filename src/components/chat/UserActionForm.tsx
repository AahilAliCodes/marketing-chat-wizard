
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Share2, User, Save, Loader2, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ChatMessage } from './types';

interface UserActionFormProps {
  websiteUrl: string;
  campaignType?: string;
  chatHistory: ChatMessage[];
  onSuccess?: (actionType: string, data?: any) => void;
}

type FormState = {
  firstName: string;
  lastName: string;
  email: string;
};

const UserActionForm: React.FC<UserActionFormProps> = ({ 
  websiteUrl, 
  campaignType, 
  chatHistory,
  onSuccess 
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formState, setFormState] = useState<FormState>({
    firstName: '',
    lastName: '',
    email: '',
  });
  const [actionType, setActionType] = useState<'share' | 'save'>('share');
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormState(prev => ({ ...prev, [name]: value }));
  };

  const openDialog = (type: 'share' | 'save') => {
    setActionType(type);
    setIsDialogOpen(true);
    setCopied(false);
    setShareLink(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formState.email || !formState.firstName || !formState.lastName) {
      toast({
        title: "Missing information",
        description: "Please fill out all fields",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Create a unique ID for sharing or saving
      const shareId = Math.random().toString(36).substring(2, 10);
      
      // Process based on action type
      if (actionType === 'share') {
        // Save chat data in localStorage for now
        const shareData = {
          websiteUrl,
          campaignType,
          messages: chatHistory
        };
        
        // Save to localStorage
        localStorage.setItem(`shared-chat-${shareId}`, JSON.stringify(shareData));
        
        // Generate shareable link
        const baseUrl = window.location.origin;
        const shareUrl = `${baseUrl}/shared-chat/${shareId}`;
        setShareLink(shareUrl);
      }
      
      // Save user action to Supabase
      const { error } = await supabase.from('user_actions').insert({
        email: formState.email,
        first_name: formState.firstName,
        last_name: formState.lastName,
        action_type: actionType,
        website_url: websiteUrl,
        chat_data: actionType === 'share' ? chatHistory : null
      });

      if (error) throw error;
      
      if (actionType === 'save') {
        toast({
          title: "Information saved!",
          description: "We'll be in touch with you soon.",
        });
        setIsDialogOpen(false);
        if (onSuccess) onSuccess('save', formState);
      } else {
        toast({
          title: "Chat link created",
          description: "Copy the link to share this conversation",
        });
        if (onSuccess) onSuccess('share', { shareId });
      }
    } catch (error) {
      console.error("Error processing action:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "There was a problem processing your request."
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyShareLink = async () => {
    if (!shareLink) return;
    
    try {
      await navigator.clipboard.writeText(shareLink);
      setCopied(true);
      toast({
        title: "Link copied",
        description: "Share link copied to clipboard",
      });
      
      // Close dialog after a delay
      setTimeout(() => {
        setIsDialogOpen(false);
      }, 2000);
    } catch (error) {
      console.error("Error copying link:", error);
      toast({
        variant: "destructive",
        title: "Copy failed",
        description: "Please try copying the link manually"
      });
    }
  };

  return (
    <>
      <div className="flex items-center justify-end gap-2">
        <Button
          variant="outline"
          size="sm"
          className="text-sm text-gray-600 hover:text-purple-800 hover:border-purple-800"
          onClick={() => openDialog('save')}
        >
          <Save className="h-4 w-4 mr-2" />
          Save conversation
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="text-sm text-gray-600 hover:text-purple-800 hover:border-purple-800"
          onClick={() => openDialog('share')}
        >
          <Share2 className="h-4 w-4 mr-2" />
          Share chat
        </Button>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {actionType === 'share' ? 'Share this conversation' : 'Save your conversation'}
            </DialogTitle>
            <DialogDescription>
              {actionType === 'share' 
                ? 'Enter your details to create a shareable link to this conversation.' 
                : 'Enter your details to save this conversation and get marketing assistance.'}
            </DialogDescription>
          </DialogHeader>

          {!shareLink ? (
            <form onSubmit={handleSubmit} className="space-y-4 py-2">
              <div className="grid gap-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First name</Label>
                    <Input
                      id="firstName"
                      name="firstName"
                      value={formState.firstName}
                      onChange={handleInputChange}
                      placeholder="John"
                      disabled={isSubmitting}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last name</Label>
                    <Input
                      id="lastName"
                      name="lastName"
                      value={formState.lastName}
                      onChange={handleInputChange}
                      placeholder="Doe"
                      disabled={isSubmitting}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formState.email}
                    onChange={handleInputChange}
                    placeholder="john@example.com"
                    disabled={isSubmitting}
                    required
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {actionType === 'share' 
                    ? 'Create share link' 
                    : 'Save conversation'
                  }
                </Button>
              </div>
            </form>
          ) : (
            <div className="py-4 space-y-4">
              <div className="flex items-center justify-between space-x-2">
                <div className="bg-gray-100 p-2 rounded-md text-sm flex-1 truncate">
                  {shareLink}
                </div>
                <Button 
                  onClick={copyShareLink} 
                  disabled={copied}
                  className={copied ? "bg-green-600 hover:bg-green-700" : ""}
                >
                  {copied ? (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Copied!
                    </>
                  ) : "Copy"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default UserActionForm;
