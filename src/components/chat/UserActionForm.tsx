
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Save, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { SessionManager } from '@/utils/sessionManager';
import { ChatMessage } from './types';
import emailjs from '@emailjs/browser';

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
  const { toast } = useToast();
  const { user } = useAuth();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormState(prev => ({ ...prev, [name]: value }));
  };

  const openDialog = () => {
    setIsDialogOpen(true);
  };

  const sendEmailJS = async (formData: FormState) => {
    try {
      const templateParams = {
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email,
        website_url: websiteUrl,
        to_name: 'BLASTari Team',
      };

      await emailjs.send(
        'service_xf5afsv',
        'template_id9cr7b',
        templateParams,
        '1WiAueT4yS6U1Q_E4'
      );
      
      console.log('Email sent successfully via EmailJS');
    } catch (error) {
      console.error('EmailJS error:', error);
      throw new Error('Failed to send email notification');
    }
  };

  const fetchUserData = async () => {
    try {
      // Fetch subreddit recommendations
      const { data: subreddits } = await supabase
        .from('subreddit_recommendations')
        .select('*')
        .eq('website_url', websiteUrl);

      // Fetch reddit posts
      const { data: redditPosts } = await supabase
        .from('generated_reddit_posts')
        .select('*')
        .eq('website_url', websiteUrl);

      return {
        subredditRecommendations: subreddits || [],
        redditPosts: redditPosts || []
      };
    } catch (error) {
      console.error('Error fetching user data:', error);
      return {
        subredditRecommendations: [],
        redditPosts: []
      };
    }
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
      // Get session data and user-specific data
      const sessionId = SessionManager.getSessionId();
      const userData = await fetchUserData();

      // Prepare comprehensive user action data
      const userActionData = {
        email: formState.email,
        first_name: formState.firstName,
        last_name: formData.lastName,
        action_type: 'save',
        website_url: websiteUrl,
        chat_data: chatHistory,
        user_id: user?.id || null,
        session_id: sessionId,
        subreddit_recommendations: userData.subredditRecommendations,
        reddit_posts: userData.redditPosts
      };

      // Save comprehensive user action to Supabase
      const { error } = await supabase
        .from('user_actions')
        .insert(userActionData);

      if (error) throw error;

      // Store in session for persistence
      SessionManager.setSessionData('user_action', userActionData);

      // Send email via EmailJS
      await sendEmailJS(formState);
      
      toast({
        title: "Information saved!",
        description: "We'll be in touch with you soon.",
      });
      setIsDialogOpen(false);
      if (onSuccess) onSuccess('save', formState);
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

  return (
    <>
      <div className="flex items-center justify-end gap-2">
        <Button
          variant="outline"
          size="sm"
          className="text-sm text-gray-600 hover:text-purple-800 hover:border-purple-800"
          onClick={openDialog}
        >
          <Save className="h-4 w-4 mr-2" />
          Save conversation
        </Button>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              Save your conversation
            </DialogTitle>
            <DialogDescription>
              Enter your details to save this conversation and get marketing assistance.
            </DialogDescription>
          </DialogHeader>

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
                Save conversation
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default UserActionForm;
