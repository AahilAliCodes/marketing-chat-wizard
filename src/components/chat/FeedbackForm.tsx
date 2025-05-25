
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { MessageSquare, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import emailjs from '@emailjs/browser';

interface FeedbackFormProps {
  websiteUrl?: string;
}

type FormState = {
  name: string;
  email: string;
  feedback: string;
};

const FeedbackForm: React.FC<FeedbackFormProps> = ({ websiteUrl }) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formState, setFormState] = useState<FormState>({
    name: '',
    email: '',
    feedback: '',
  });
  const { toast } = useToast();
  const { user } = useAuth();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormState(prev => ({ ...prev, [name]: value }));
  };

  const openDialog = () => {
    setIsDialogOpen(true);
  };

  const sendEmailJS = async (formData: FormState) => {
    try {
      const templateParams = {
        from_name: formData.name,
        from_email: formData.email,
        feedback: formData.feedback,
        website_url: websiteUrl || 'Not specified',
        to_name: 'BLASTari Team',
      };

      await emailjs.send(
        'service_xf5afsv',
        'template_id9cr7b',
        templateParams,
        '1WiAueT4yS6U1Q_E4'
      );
      
      console.log('Feedback email sent successfully via EmailJS');
    } catch (error) {
      console.error('EmailJS error:', error);
      throw new Error('Failed to send feedback email');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formState.email || !formState.name || !formState.feedback) {
      toast({
        title: "Missing information",
        description: "Please fill out all fields",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Save feedback to Supabase
      const { error } = await supabase
        .from('user_feedback')
        .insert({
          name: formState.name,
          email: formState.email,
          feedback: formState.feedback,
          website_url: websiteUrl,
          user_id: user?.id || null
        });

      if (error) throw error;

      // Send email via EmailJS
      await sendEmailJS(formState);
      
      toast({
        title: "Feedback submitted!",
        description: "Thank you for your feedback. We'll be in touch soon.",
      });
      
      setIsDialogOpen(false);
      setFormState({ name: '', email: '', feedback: '' });
    } catch (error) {
      console.error("Error submitting feedback:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "There was a problem submitting your feedback."
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
          <MessageSquare className="h-4 w-4 mr-2" />
          Submit feedback
        </Button>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              Submit feedback
            </DialogTitle>
            <DialogDescription>
              Share your thoughts about your experience with our AI marketing assistant.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  name="name"
                  value={formState.name}
                  onChange={handleInputChange}
                  placeholder="Your name"
                  disabled={isSubmitting}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formState.email}
                  onChange={handleInputChange}
                  placeholder="your@email.com"
                  disabled={isSubmitting}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="feedback">Feedback</Label>
                <Textarea
                  id="feedback"
                  name="feedback"
                  value={formState.feedback}
                  onChange={handleInputChange}
                  placeholder="Share your thoughts, suggestions, or report any issues..."
                  disabled={isSubmitting}
                  required
                  rows={4}
                />
              </div>
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Submit feedback
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default FeedbackForm;
