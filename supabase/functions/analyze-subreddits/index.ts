
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
    console.log(`Excluding ${excludeSubreddits.length} subreddits:`, excludeSubreddits);
    
    if (!OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not configured in the server");
    }

    // Fetch website analysis for context
    const { data: websiteAnalysis, error: analysisError } = await supabase
      .from('website_analyses')
      .select('*')
      .eq('website_url', websiteUrl)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (analysisError) {
      console.error('Error fetching website analysis:', analysisError);
    }

    console.log('Website analysis found:', websiteAnalysis ? 'Yes' : 'No');

    // For the new regeneration system, always generate new recommendations when forceRegenerate is true
    if (forceRegenerate) {
      console.log('Force regenerating recommendations with excluded subreddits:', excludeSubreddits);
      
      // Generate completely new recommendations
      const recommendations = await generateSubredditRecommendations(websiteUrl, campaignType, excludeSubreddits, 3, websiteAnalysis);
      
      // Ensure uniqueness and filter out excluded ones
      const filteredRecommendations = removeDuplicateSubreddits(recommendations)
        .filter(rec => !excludeSubreddits.map(s => s.toLowerCase()).includes(rec.name.toLowerCase()));
      
      if (filteredRecommendations.length === 0) {
        throw new Error('No new subreddit recommendations could be generated. All available subreddits may have been excluded.');
      }
      
      // Store the new recommendations as active (not cached)
      const recommendationsToStore = filteredRecommendations.map((rec: any) => ({
        website_url: websiteUrl,
        subreddit: rec.name,
        reason: rec.reason,
        is_cached: false
      }));
      
      const { error: insertError } = await supabase
        .from('subreddit_recommendations')
        .insert(recommendationsToStore);
        
      if (insertError) {
        console.error('Error storing new recommendations:', insertError);
      } else {
        console.log('Successfully stored', filteredRecommendations.length, 'new recommendations');
      }
      
      // Return the new recommendations
      const formattedRecommendations = filteredRecommendations.map((rec: any, index: number) => ({
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

    // Check if we already have active recommendations for this website (initial load)
    const { data: existingRecommendations, error: fetchError } = await supabase
      .from('subreddit_recommendations')
      .select('*')
      .eq('website_url', websiteUrl)
      .eq('is_cached', false);
      
    if (fetchError) {
      console.error('Error fetching existing recommendations:', fetchError);
    }
    
    // If we have existing active recommendations, return those
    if (existingRecommendations && existingRecommendations.length > 0) {
      console.log('Found existing active recommendations:', existingRecommendations.length);
      const uniqueExisting = removeDuplicateSubreddits(existingRecommendations, 'subreddit');
      return new Response(
        JSON.stringify({ recommendations: uniqueExisting }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
    
    // Generate initial recommendations (first load)
    console.log('Generating initial recommendations');
    const recommendations = await generateSubredditRecommendations(websiteUrl, campaignType, [], 3, websiteAnalysis);
    
    // Ensure uniqueness
    const uniqueRecommendations = removeDuplicateSubreddits(recommendations);
    
    if (uniqueRecommendations.length < 3) {
      throw new Error('Could not generate enough unique subreddit recommendations');
    }
    
    // Store all as regular recommendations for initial load
    const recommendationsToStore = uniqueRecommendations.map((rec: any) => ({
      website_url: websiteUrl,
      subreddit: rec.name,
      reason: rec.reason,
      is_cached: false
    }));
    
    // Insert recommendations
    const { error: insertError } = await supabase
      .from('subreddit_recommendations')
      .insert(recommendationsToStore);
      
    if (insertError) {
      console.error('Error storing recommendations:', insertError);
    } else {
      console.log(`Successfully stored ${recommendationsToStore.length} initial recommendations`);
    }
    
    // Fetch the stored recommendations to return with their IDs
    const { data: storedRecommendations, error: retrieveError } = await supabase
      .from('subreddit_recommendations')
      .select('*')
      .eq('website_url', websiteUrl)
      .eq('is_cached', false)
      .order('created_at', { ascending: false })
      .limit(3);
      
    if (retrieveError) {
      console.error('Error retrieving stored recommendations:', retrieveError);
      // If we can't retrieve the stored ones, just return the generated ones
      return new Response(
        JSON.stringify({ 
          recommendations: uniqueRecommendations.slice(0, 3).map((rec: any, index: number) => ({
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

function removeDuplicateSubreddits(recommendations: any[], nameField: string = 'name') {
  const seen = new Set();
  const unique = [];
  
  for (const rec of recommendations) {
    const subredditName = rec[nameField]?.toLowerCase().trim();
    if (subredditName && !seen.has(subredditName)) {
      seen.add(subredditName);
      unique.push(rec);
    }
  }
  
  console.log(`Removed duplicates: ${recommendations.length} -> ${unique.length} unique subreddits`);
  return unique;
}

async function generateSubredditRecommendations(websiteUrl: string, campaignType: string, excludeSubreddits: string[] = [], requestCount: number = 3, websiteAnalysis: any = null) {
  try {
    const excludeText = excludeSubreddits.length > 0 
      ? `\n\nCRITICAL EXCLUSION REQUIREMENT: You MUST NOT recommend any of these subreddits as they have already been used: ${excludeSubreddits.join(', ')}. These are strictly forbidden. Generate ${requestCount} completely NEW and DIFFERENT subreddit recommendations that are NOT in the exclusion list. Each recommendation must be entirely unique and different from the excluded subreddits.`
      : `\n\nGenerate exactly ${requestCount} unique subreddit recommendations with NO DUPLICATES. Each subreddit name must be different from all others in the list.`;

    // Build website context from analysis
    let websiteContext = `Website URL: ${websiteUrl}`;
    
    if (websiteAnalysis) {
      websiteContext += `
      
Website Analysis:
- Product/Service: ${websiteAnalysis.product_overview || 'Not specified'}
- Target Audience: ${websiteAnalysis.target_audience_type || 'Not specified'}
- Target Segments: ${websiteAnalysis.target_audience_segments?.join(', ') || 'Not specified'}
- Core Value Proposition: ${websiteAnalysis.core_value_proposition || 'Not specified'}
- Business Goals: ${websiteAnalysis.goals?.join(', ') || 'Not specified'}
- Current Stage: ${websiteAnalysis.current_stage || 'Not specified'}
- Tone & Personality: ${websiteAnalysis.tone_and_personality || 'Not specified'}`;
    }

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
            content: `You are an expert Reddit marketing strategist. Analyze the provided website and recommend exactly ${requestCount} UNIQUE subreddits where the website owner should engage. Each subreddit must be different and unique - NO DUPLICATES allowed. 

${excludeSubreddits.length > 0 ? 'CRITICAL: You are provided with a list of EXCLUDED subreddits that you MUST NOT recommend under any circumstances. These have already been used and you must find completely different alternatives.' : ''}

Focus on communities that align with their target audience and would be receptive to their content without being overtly promotional. Use the detailed website analysis provided to understand the ACTUAL business, product, and target audience - do not just rely on the domain name.

For each subreddit, provide the name and reason it's a good fit. Respond with JSON data that includes "subreddits" as an array of objects. Each object should have "name" and "reason" fields. The "name" field should not include the "r/" prefix. Prioritize well-established subreddits with active communities (1000+ members preferred).${excludeText}`
          },
          {
            role: "user",
            content: `${websiteContext}
            
Campaign Type: ${campaignType}

Please recommend exactly ${requestCount} UNIQUE subreddits where this business can engage effectively based on the website analysis above. Each subreddit must have a different name - absolutely NO DUPLICATES. Focus on active, well-established communities with good engagement rates that match the actual business described in the analysis. Return the data in JSON format with a "subreddits" array containing objects with "name" and "reason" fields. Do not include the "r/" prefix in the name field.${excludeText}`
          }
        ],
        temperature: 0.8,
        max_tokens: 3000,
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
    
    // Remove duplicates from the generated list and filter out excluded ones
    let uniqueRecommendations = removeDuplicateSubreddits(parsed.subreddits);
    
    // Double-check exclusions (case-insensitive)
    const excludedLowerCase = excludeSubreddits.map(s => s.toLowerCase());
    uniqueRecommendations = uniqueRecommendations.filter(rec => 
      !excludedLowerCase.includes(rec.name.toLowerCase())
    );
    
    // Ensure we return at least some recommendations, but cap at requested count
    const finalRecommendations = uniqueRecommendations.slice(0, requestCount);
    console.log(`Generated ${finalRecommendations.length} unique recommendations (requested: ${requestCount})`);
    
    if (finalRecommendations.length === 0) {
      throw new Error("No new subreddit recommendations could be generated after applying exclusions");
    }
    
    return finalRecommendations;
  } catch (error) {
    console.error("Error generating subreddit recommendations:", error);
    throw error;
  }
}
