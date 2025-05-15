
import { supabase } from "@/integrations/supabase/client";
import { ChatHistory } from "@/components/chat/types";

/**
 * Saves a chat interaction to the user's history
 */
export const saveChatHistory = async (websiteUrl: string, userPrompt: string, aiResponse: string) => {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  
  if (userError || !userData.user) {
    console.log("User not authenticated, history not saved");
    return;
  }

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
    throw error;
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

  const { data, error } = await supabase
    .from('user_chat_history')
    .select('*')
    .eq('user_id', userData.user.id)
    .eq('website_url', websiteUrl)
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Error loading chat history:", error);
    throw error;
  }

  return data.map(item => ({
    website_url: item.website_url,
    user_prompt: item.user_prompt,
    ai_response: item.ai_response,
    created_at: new Date(item.created_at)
  }));
};
