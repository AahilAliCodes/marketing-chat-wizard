
import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Navigate } from 'react-router-dom';
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const formSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  joinWaitlist: z.boolean().default(false),
  feedback: z.string().optional(),
});

const Auth = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      joinWaitlist: false,
      feedback: "",
    },
  });

  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    
    try {
      // Simulate API call for waitlist signup
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Thanks for joining!",
        description: "We'll keep you updated on our progress.",
      });
      
      form.reset();
    } catch (error) {
      console.error("Waitlist signup error:", error);
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (user) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-white via-gray-50 to-purple-50 p-4">
      <div className="w-full max-w-md space-y-8 bg-white p-8 shadow-modern-xl rounded-2xl border border-gray-100">
        <div className="text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-marketing-purple to-marketing-darkPurple rounded-xl shadow-modern">
              <span className="text-white font-bold text-xl">B</span>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Join the Waitlist</h1>
          <div className="inline-flex items-center bg-gradient-to-r from-marketing-purple/10 to-purple-100 text-marketing-darkPurple font-medium px-3 py-1 rounded-full mb-4">
            <Sparkles className="w-4 h-4 mr-2" />
            Early Access
          </div>
          <p className="text-gray-600">Be the first to know when we launch our AI-powered Reddit marketing platform</p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email address</FormLabel>
                  <FormControl>
                    <Input 
                      type="email" 
                      placeholder="your@email.com" 
                      className="h-12 text-lg"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="joinWaitlist"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel className="text-sm font-normal">
                      Join waitlist and receive updates
                    </FormLabel>
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="feedback"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Comments or feedback (optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Tell us what you're looking for or any feedback..."
                      className="min-h-[80px] resize-none"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button 
              type="submit" 
              className="w-full h-12 text-lg bg-marketing-purple hover:bg-marketing-purple/90 shadow-modern" 
              disabled={isLoading}
            >
              {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
              Join Waitlist
            </Button>
          </form>
        </Form>

        <div className="text-center">
          <p className="text-xs text-gray-500">
            We respect your privacy. Unsubscribe at any time.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
