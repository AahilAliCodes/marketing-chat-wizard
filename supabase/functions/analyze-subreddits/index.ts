
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

    // Check if we have cached recommendations
    const { data: cachedRecommendations, error: cacheError } = await supabase
      .from('subreddit_recommendations')
      .select('*')
      .eq('website_url', websiteUrl)
      .eq('is_cached', true)
      .order('created_at', { ascending: false });

    if (cacheError) {
      console.error('Error fetching cached recommendations:', cacheError);
    }

    // If forceRegenerate is true, try to use cached recommendations first
    if (forceRegenerate) {
      console.log('Force regenerating recommendations with excluded subreddits:', excludeSubreddits);
      
      // Check if we have enough cached recommendations that haven't been used
      const availableCached = cachedRecommendations?.filter(rec => 
        !excludeSubreddits.includes(rec.subreddit.toLowerCase())
      ) || [];

      console.log(`Found ${availableCached.length} available cached recommendations`);

      if (availableCached.length >= 3) {
        // Use cached recommendations
        const selectedCached = availableCached.slice(0, 3);
        
        // Mark these as used by adding them to regular recommendations
        const recommendationsToStore = selectedCached.map((rec: any) => ({
          website_url: websiteUrl,
          subreddit: rec.subreddit,
          reason: rec.reason,
          is_cached: false
        }));
        
        const { error: insertError } = await supabase
          .from('subreddit_recommendations')
          .insert(recommendationsToStore);
          
        if (insertError) {
          console.error('Error storing cached recommendations as used:', insertError);
        } else {
          console.log('Successfully used', selectedCached.length, 'cached recommendations');
        }
        
        // Return the cached recommendations
        const formattedRecommendations = selectedCached.map((rec: any, index: number) => ({
          id: `cached-${Date.now()}-${index}`,
          subreddit: rec.subreddit,
          reason: rec.reason
        }));
        
        return new Response(
          JSON.stringify({ recommendations: formattedRecommendations }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      } else {
        // Not enough cached recommendations, generate new ones
        console.log('Not enough cached recommendations, generating new ones');
        
        // Generate 15 new recommendations
        const recommendations = await generateSubredditRecommendations(websiteUrl, campaignType, excludeSubreddits, 15, websiteAnalysis);
        
        // Ensure uniqueness
        const uniqueRecommendations = removeDuplicateSubreddits(recommendations);
        
        if (uniqueRecommendations.length < 3) {
          throw new Error('Could not generate enough unique subreddit recommendations');
        }
        
        // Take top 3 for immediate use
        const topRecommendations = uniqueRecommendations.slice(0, 3);
        const remainingRecommendations = uniqueRecommendations.slice(3);
        
        // Store top 3 as regular recommendations
        const topRecommendationsToStore = topRecommendations.map((rec: any) => ({
          website_url: websiteUrl,
          subreddit: rec.name,
          reason: rec.reason,
          is_cached: false
        }));
        
        // Store remaining as cached recommendations
        const cachedRecommendationsToStore = remainingRecommendations.map((rec: any) => ({
          website_url: websiteUrl,
          subreddit: rec.name,
          reason: rec.reason,
          is_cached: true
        }));
        
        // Clear old cached recommendations first
        await supabase
          .from('subreddit_recommendations')
          .delete()
          .eq('website_url', websiteUrl)
          .eq('is_cached', true);
        
        // Insert new recommendations
        const allRecommendationsToStore = [...topRecommendationsToStore, ...cachedRecommendationsToStore];
        
        const { error: insertError } = await supabase
          .from('subreddit_recommendations')
          .insert(allRecommendationsToStore);
          
        if (insertError) {
          console.error('Error storing new recommendations:', insertError);
        } else {
          console.log(`Successfully stored ${topRecommendationsToStore.length} active and ${cachedRecommendationsToStore.length} cached recommendations`);
        }
        
        // Return the top 3 recommendations
        const formattedRecommendations = topRecommendations.map((rec: any, index: number) => ({
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
    }

    // Check if we already have active recommendations for this website
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
    
    // Otherwise generate new recommendations (initial load - 15 recommendations)
    console.log('Generating initial recommendations');
    const recommendations = await generateSubredditRecommendations(websiteUrl, campaignType, [], 15, websiteAnalysis);
    
    // Ensure uniqueness
    const uniqueRecommendations = removeDuplicateSubreddits(recommendations);
    
    if (uniqueRecommendations.length < 3) {
      throw new Error('Could not generate enough unique subreddit recommendations');
    }
    
    // Take top 3 for immediate use
    const topRecommendations = uniqueRecommendations.slice(0, 3);
    const remainingRecommendations = uniqueRecommendations.slice(3);
    
    // Store top 3 as regular recommendations
    const topRecommendationsToStore = topRecommendations.map((rec: any) => ({
      website_url: websiteUrl,
      subreddit: rec.name,
      reason: rec.reason,
      is_cached: false
    }));
    
    // Store remaining as cached recommendations
    const cachedRecommendationsToStore = remainingRecommendations.map((rec: any) => ({
      website_url: websiteUrl,
      subreddit: rec.name,
      reason: rec.reason,
      is_cached: true
    }));
    
    // Insert all recommendations
    const allRecommendationsToStore = [...topRecommendationsToStore, ...cachedRecommendationsToStore];
    
    const { error: insertError } = await supabase
      .from('subreddit_recommendations')
      .insert(allRecommendationsToStore);
      
    if (insertError) {
      console.error('Error storing recommendations:', insertError);
    } else {
      console.log(`Successfully stored ${topRecommendationsToStore.length} active and ${cachedRecommendationsToStore.length} cached recommendations`);
    }
    
    // Fetch the stored active recommendations to return with their IDs
    const { data: storedRecommendations, error: retrieveError } = await supabase
      .from('subreddit_recommendations')
      .select('*')
      .eq('website_url', websiteUrl)
      .eq('is_cached', false);
      
    if (retrieveError) {
      console.error('Error retrieving stored recommendations:', retrieveError);
      // If we can't retrieve the stored ones, just return the generated ones
      return new Response(
        JSON.stringify({ 
          recommendations: topRecommendations.map((rec: any, index: number) => ({
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

async function generateSubredditRecommendations(websiteUrl: string, campaignType: string, excludeSubreddits: string[] = [], requestCount: number = 15, websiteAnalysis: any = null) {
  try {
    const excludeText = excludeSubreddits.length > 0 
      ? `\n\nIMPORTANT: Do NOT recommend any of these subreddits as they have already been suggested: ${excludeSubreddits.join(', ')}. Make sure all ${requestCount} recommendations are completely different from these excluded subreddits. Generate ${requestCount} completely NEW and UNIQUE subreddit recommendations with NO DUPLICATES.`
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
    
    // Remove duplicates from the generated list
    const uniqueRecommendations = removeDuplicateSubreddits(parsed.subreddits);
    
    // Ensure we return at least some recommendations, but cap at requested count
    const finalRecommendations = uniqueRecommendations.slice(0, requestCount);
    console.log(`Generated ${finalRecommendations.length} unique recommendations (requested: ${requestCount})`);
    
    return finalRecommendations;
  } catch (error) {
    console.error("Error generating subreddit recommendations:", error);
    throw error;
  }
}
