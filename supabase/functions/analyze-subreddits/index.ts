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
    const { websiteUrl, campaignType = "General", forceRegenerate = false, excludeSubreddits = [] } = await req.json();
    
    if (!websiteUrl) {
      throw new Error("Website URL is required");
    }

    console.log(`Analyzing subreddits for: ${websiteUrl}, campaign type: ${campaignType}, forceRegenerate: ${forceRegenerate}`);
    
    if (!OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not configured in the server");
    }

    // If forceRegenerate is true, generate exactly 15 new unique recommendations
    if (forceRegenerate) {
      console.log('Force regenerating recommendations with excluded subreddits:', excludeSubreddits);
      
      // Generate 15 new recommendations with exclusions
      const recommendations = await generateSubredditRecommendations(websiteUrl, campaignType, excludeSubreddits, 15);
      
      // Store the new recommendations in Supabase
      const recommendationsToStore = recommendations.map((rec: any) => ({
        website_url: websiteUrl,
        subreddit: rec.name,
        reason: rec.reason,
      }));
      
      const { error: insertError } = await supabase
        .from('subreddit_recommendations')
        .insert(recommendationsToStore);
        
      if (insertError) {
        console.error('Error storing new recommendations:', insertError);
      } else {
        console.log('Successfully stored', recommendationsToStore.length, 'new recommendations');
      }
      
      // Return the new recommendations with generated IDs
      const formattedRecommendations = recommendations.map((rec: any, index: number) => ({
        id: `new-${Date.now()}-${index}`,
        subreddit: rec.name,
        reason: rec.reason
      }));
      
      return new Response(
        JSON.stringify({ recommendations: formattedRecommendations }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
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
    
    // Otherwise generate new recommendations (initial load - 15 recommendations)
    const recommendations = await generateSubredditRecommendations(websiteUrl, campaignType, [], 15);
    
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
    const { data: storedRecommendations, error: retrieveError } = await supabase
      .from('subreddit_recommendations')
      .select('*')
      .eq('website_url', websiteUrl);
      
    if (retrieveError) {
      console.error('Error retrieving stored recommendations:', retrieveError);
      // If we can't retrieve the stored ones, just return the generated ones
      return new Response(
        JSON.stringify({ 
          recommendations: recommendations.map((rec: any, index: number) => ({
            id: `temp-${index}`,
            subreddit: rec.name,
            reason: rec.reason
          }))
        }),
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

async function generateSubredditRecommendations(websiteUrl: string, campaignType: string, excludeSubreddits: string[] = [], requestCount: number = 15) {
  try {
    const excludeText = excludeSubreddits.length > 0 
      ? `\n\nIMPORTANT: Do NOT recommend any of these subreddits as they have already been suggested: ${excludeSubreddits.join(', ')}. Make sure all ${requestCount} recommendations are completely different from these excluded subreddits. Generate ${requestCount} completely NEW and UNIQUE subreddit recommendations.`
      : `\n\nGenerate exactly ${requestCount} unique subreddit recommendations.`;

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
            content: `You are an expert Reddit marketing strategist. Analyze the provided website and recommend exactly ${requestCount} subreddits where the website owner should engage. Focus on communities that align with their target audience and would be receptive to their content without being overtly promotional. For each subreddit, provide the name and reason it's a good fit. Respond with JSON data that includes "subreddits" as an array of objects. Each object should have "name" and "reason" fields. The "name" field should not include the "r/" prefix. Prioritize well-established subreddits with active communities (1000+ members preferred).${excludeText}`
          },
          {
            role: "user",
            content: `Website URL: ${websiteUrl}\nCampaign Type: ${campaignType}\n\nPlease recommend exactly ${requestCount} subreddits where this business can engage effectively. Focus on active, well-established communities with good engagement rates. Return the data in JSON format with a "subreddits" array containing objects with "name" and "reason" fields. Do not include the "r/" prefix in the name field.${excludeText}`
          }
        ],
        temperature: 0.8,
        max_tokens: 2000,
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
    
    // Ensure we return exactly the requested count
    const recommendations = parsed.subreddits.slice(0, requestCount);
    console.log(`Generated ${recommendations.length} recommendations (requested: ${requestCount})`);
    
    return recommendations;
  } catch (error) {
    console.error("Error generating subreddit recommendations:", error);
    throw error;
  }
}
