
// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SubredditRecommendation {
  name: string;
  reason: string;
  postTitle: string;
  postContent: string;
  subscribers?: string;
  engagement?: string; 
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not set in the environment");
    }

    const { websiteUrl, campaignType } = await req.json();

    if (!websiteUrl) {
      throw new Error("Website URL is required");
    }

    console.log(`Analyzing subreddits for: ${websiteUrl}, campaign type: ${campaignType || 'General'}`);

    // Call OpenAI API to analyze the website and suggest subreddits
    const recommendations = await analyzeWebsiteForSubreddits(websiteUrl, campaignType);

    return new Response(
      JSON.stringify({ recommendations }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in analyze-subreddits function:", error);
    return new Response(
      JSON.stringify({ error: error.message || "An unexpected error occurred" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

async function analyzeWebsiteForSubreddits(
  websiteUrl: string,
  campaignType?: string
): Promise<SubredditRecommendation[]> {
  try {
    const systemPrompt = `You are an expert Reddit marketing strategist who helps businesses identify the best subreddits for their content and marketing strategy. 
    Based on the website URL and campaign type provided, analyze what the business does and identify 4-6 relevant subreddits where they could effectively engage.
    
    For each subreddit, provide:
    1. The exact name (without the r/)
    2. A brief explanation of why it's relevant to their business
    3. A suggested post title that would work well in that community
    4. Suggested post content (about 3-5 sentences) that provides value to the community while subtly mentioning their business
    5. Estimated subscriber count (make a reasonable estimate)
    6. Expected engagement level (High, Medium, Low)
    
    Format your response as JSON without any additional explanation text.`;

    const userPrompt = `Website: ${websiteUrl}
    Campaign type: ${campaignType || 'General marketing'}
    
    Identify the most relevant subreddits for this business to engage with and create content that would work well in each community without being too promotional.`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || "Failed to get subreddit recommendations");
    }

    const data = await response.json();
    const result = JSON.parse(data.choices[0].message.content);
    
    return result.recommendations || [];
  } catch (error) {
    console.error("OpenAI API error:", error);
    throw error;
  }
}
