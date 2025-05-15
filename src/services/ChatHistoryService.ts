
import { supabase } from "@/integrations/supabase/client";
import { ChatHistory } from "@/components/chat/types";
import { toast } from "@/hooks/use-toast";

/**
 * Saves a chat interaction to the user's history
 */
export const saveChatHistory = async (websiteUrl: string, userPrompt: string, aiResponse: string) => {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  
  if (userError || !userData.user) {
    console.log("User not authenticated, history not saved");
    return false;
  }

  try {
    const { error } = await supabase
      .from('user_chat_history')
      .insert({
        user_id: userData.user.id,
        website_url: websiteUrl,
        user_prompt: userPrompt,
        ai_response: aiResponse
      });

    if (error) {
      console.error("Error saving chat history:", error);
      toast({
        title: "History Not Saved",
        description: "There was a problem saving your chat history.",
        variant: 'destructive',
      });
      return false;
    }

    console.log("Chat history saved successfully");
    return true;
  } catch (err) {
    console.error("Exception while saving chat history:", err);
    return false;
  }
};

/**
 * Loads chat history for a specific website
 */
export const loadChatHistory = async (websiteUrl: string): Promise<ChatHistory[]> => {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  
  if (userError || !userData.user) {
    console.log("User not authenticated, cannot load history");
    return [];
  }

  try {
    console.log(`Attempting to load chat history for website: ${websiteUrl}`);
    
    const { data, error } = await supabase
      .from('user_chat_history')
      .select('*')
      .eq('user_id', userData.user.id)
      .eq('website_url', websiteUrl)
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error loading chat history:", error);
      toast({
        title: "History Not Loaded",
        description: "There was a problem loading your chat history.",
        variant: 'destructive',
      });
      return [];
    }

    console.log(`Successfully loaded ${data.length} history items for ${websiteUrl}`);
    
    return data.map(item => ({
      website_url: item.website_url,
      user_prompt: item.user_prompt,
      ai_response: item.ai_response,
      created_at: new Date(item.created_at)
    }));
  } catch (err) {
    console.error("Exception while loading chat history:", err);
    return [];
  }
};
