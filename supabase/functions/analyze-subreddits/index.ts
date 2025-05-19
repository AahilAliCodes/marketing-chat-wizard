
// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
// @ts-ignore
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { websiteUrl, campaignType = "General" } = await req.json();
    
    if (!websiteUrl) {
      throw new Error("Website URL is required");
    }

    console.log(`Analyzing subreddits for: ${websiteUrl}, campaign type: ${campaignType}`);
    
    if (!OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not configured in the server");
    }

    const recommendations = await generateSubredditRecommendations(websiteUrl, campaignType);
    
    return new Response(
      JSON.stringify({ recommendations }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in analyze-subreddits function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

async function generateSubredditRecommendations(websiteUrl: string, campaignType: string) {
  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are an expert Reddit marketing strategist. Analyze the provided website and recommend 5 subreddits where the website owner should engage. Focus on communities that align with their target audience and would be receptive to their content without being overtly promotional. For each subreddit, provide the name, reason it's a good fit, a suggested post title, and content. Respond with JSON data.`
          },
          {
            role: "user",
            content: `Website URL: ${websiteUrl}\nCampaign Type: ${campaignType}\n\nPlease recommend 5 subreddits where this business can engage effectively. Return the data in JSON format.`
          }
        ],
        temperature: 0.7,
        max_tokens: 1200,
        response_format: { "type": "json_object" }
      }),
    });

    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error.message || "Error generating subreddit recommendations");
    }
    
    const content = data.choices[0].message.content;
    const parsed = JSON.parse(content);
    
    if (!parsed.subreddits || !Array.isArray(parsed.subreddits) || parsed.subreddits.length === 0) {
      throw new Error("Failed to generate valid subreddit recommendations");
    }
    
    return parsed.subreddits;
  } catch (error) {
    console.error("Error generating subreddit recommendations:", error);
    throw error;
  }
}
