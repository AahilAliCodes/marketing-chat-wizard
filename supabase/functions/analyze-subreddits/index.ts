// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
// @ts-ignore
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

// Create a Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const supabase = createClient(supabaseUrl, supabaseKey);

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

    // Check if we already have recommendations for this website
    const { data: existingRecommendations, error: fetchError } = await supabase
      .from('subreddit_recommendations')
      .select('*')
      .eq('website_url', websiteUrl);
      
    if (fetchError) {
      console.error('Error fetching existing recommendations:', fetchError);
    }
    
    // If we have existing recommendations, return those
    if (existingRecommendations && existingRecommendations.length > 0) {
      console.log('Found existing recommendations:', existingRecommendations.length);
      return new Response(
        JSON.stringify({ recommendations: existingRecommendations }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
    
    // Otherwise generate new recommendations
    const recommendations = await generateSubredditRecommendations(websiteUrl, campaignType);
    
    // Store the recommendations in Supabase
    const recommendationsToStore = recommendations.map((rec: any) => ({
      website_url: websiteUrl,
      subreddit: rec.name,
      reason: rec.reason,
    }));
    
    const { error: insertError } = await supabase
      .from('subreddit_recommendations')
      .insert(recommendationsToStore);
      
    if (insertError) {
      console.error('Error storing recommendations:', insertError);
    } else {
      console.log('Successfully stored', recommendationsToStore.length, 'recommendations');
    }
    
    // Fetch the stored recommendations to return with their IDs
    const { data: storedRecommendations, error: retriveError } = await supabase
      .from('subreddit_recommendations')
      .select('*')
      .eq('website_url', websiteUrl);
      
    if (retriveError) {
      console.error('Error retrieving stored recommendations:', retriveError);
      // If we can't retrieve the stored ones, just return the generated ones
      return new Response(
        JSON.stringify({ recommendations }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
    
    return new Response(
      JSON.stringify({ recommendations: storedRecommendations }),
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
            content: `You are an expert Reddit marketing strategist. Analyze the provided website and recommend 5 subreddits where the website owner should engage. Focus on communities that align with their target audience and would be receptive to their content without being overtly promotional. For each subreddit, provide the name and reason it's a good fit. Respond with JSON data that includes "subreddits" as an array of objects. Each object should have "name" and "reason" fields. The "name" field should not include the "r/" prefix.`
          },
          {
            role: "user",
            content: `Website URL: ${websiteUrl}\nCampaign Type: ${campaignType}\n\nPlease recommend 5 subreddits where this business can engage effectively. Return the data in JSON format with a "subreddits" array containing objects with "name" and "reason" fields. Do not include the "r/" prefix in the name field.`
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
