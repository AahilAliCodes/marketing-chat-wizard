
import React, { useState, useEffect } from 'react';
import { Share2, Save, CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { v4 as uuidv4 } from 'uuid';
import { ChatMessage } from './types';

interface ShareChatProps {
  websiteUrl: string;
  campaignType?: string;
  chatHistory: ChatMessage[];
}

const ShareChat: React.FC<ShareChatProps> = ({ websiteUrl, campaignType, chatHistory }) => {
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [copyingLink, setCopyingLink] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  // Reset the button state after timeout
  useEffect(() => {
    if (copied) {
      const timer = setTimeout(() => {
        setCopied(false);
        setShareLink(null);
      }, 5000); // Reset after 5 seconds
      
      return () => clearTimeout(timer);
    }
  }, [copied]);

  const handleShareChat = async () => {
    try {
      // Create a unique ID for sharing this chat
      const shareId = uuidv4().slice(0, 8);
      
      // Create a simple object with the chat data
      const shareData = {
        websiteUrl,
        campaignType,
        messages: chatHistory
      };
      
      // In a production app, you would save this to a database
      // For now, we'll use localStorage as a demo
      localStorage.setItem(`shared-chat-${shareId}`, JSON.stringify(shareData));
      
      // Generate shareable link
      const baseUrl = window.location.origin;
      const shareUrl = `${baseUrl}/shared-chat/${shareId}`;
      
      // Set the share link
      setShareLink(shareUrl);
      
      toast({
        title: "Chat link created",
        description: "Copy the link to share this conversation",
      });
    } catch (error) {
      console.error("Error sharing chat:", error);
      toast({
        variant: "destructive",
        title: "Error creating share link",
        description: "There was a problem generating your share link."
      });
    }
  };

  const copyShareLink = async () => {
    if (!shareLink) return;
    
    setCopyingLink(true);
    try {
      await navigator.clipboard.writeText(shareLink);
      setCopied(true);
      setCopyingLink(false);
      
      toast({
        title: "Link copied",
        description: "Share link copied to clipboard",
      });
    } catch (error) {
      console.error("Error copying link:", error);
      toast({
        variant: "destructive",
        title: "Copy failed",
        description: "Please try copying the link manually"
      });
      setCopyingLink(false);
    }
  };

  return (
    <div className="flex items-center justify-end gap-2">
      <Button
        variant="outline"
        size="sm"
        className="text-sm text-gray-600 hover:text-purple-800 hover:border-purple-800"
        onClick={() => {
          // TODO: Implement sign in functionality
          console.log('Sign in clicked');
        }}
      >
        <Save className="h-4 w-4 mr-2" />
        Sign in to save
      </Button>
      
      {shareLink && !copied ? (
        <div className="flex items-center gap-2">
          <div className="px-2 py-1 text-xs bg-gray-100 border border-gray-300 rounded-md truncate max-w-[150px]">
            {shareLink}
          </div>
          <Button
            variant="outline" 
            size="sm"
            className="text-sm text-gray-600 hover:text-green-600 hover:border-green-600"
            onClick={copyShareLink}
            disabled={copyingLink}
          >
            {copyingLink ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <CheckCircle className="h-4 w-4 mr-2" />
            )}
            Copy
          </Button>
        </div>
      ) : (
        <Button
          variant="outline"
          size="sm"
          className={`text-sm ${copied ? 'text-green-600 border-green-600' : 'text-gray-600 hover:text-purple-800 hover:border-purple-800'}`}
          onClick={handleShareChat}
          disabled={copied}
        >
          {copied ? (
            <>
              <CheckCircle className="h-4 w-4 mr-2" />
              Copied!
            </>
          ) : (
            <>
              <Share2 className="h-4 w-4 mr-2" />
              Share chat
            </>
          )}
        </Button>
      )}
    </div>
  );
};

export default ShareChat;
