
import "https://deno.land/x/xhr@0.1.0/mod.ts";
// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @ts-ignore
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.2";
// @ts-ignore
const supabaseUrl = Deno.env.get('SUPABASE_URL') || "https://phgrwmrxcryhkkmjkpqc.supabase.co";
// @ts-ignore
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || "";
// @ts-ignore
const openaiApiKey = Deno.env.get('OPENAI_API_KEY') || "";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!openaiApiKey || openaiApiKey.trim() === "") {
      return new Response(
        JSON.stringify({ error: "OpenAI API key is not configured" }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { websiteUrl, userMessage, campaignType } = await req.json();
    
    if (!websiteUrl || !userMessage) {
      return new Response(
        JSON.stringify({ error: "Website URL and user message are required" }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Getting recommendations for ${websiteUrl} and campaign type ${campaignType || 'all'}`);

    // Check if this is the special "Make me a marketing plan" prompt
    const isMarketingPlanRequest = userMessage.toLowerCase().includes("make me a marketing plan");

    // Fetch recommendations from the database
    let query = supabase
      .from('campaign_recommendations')
      .select('*')
      .eq('website_url', websiteUrl);
    
    if (campaignType) {
      // If a specific campaign type is requested, try to find it in the title
      query = query.ilike('title', `%${campaignType}%`);
    }

    const { data: recommendations, error: recommendationsError } = await query;

    if (recommendationsError) {
      console.error('Error fetching recommendations:', recommendationsError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch campaign recommendations" }), 
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Also fetch website analysis for additional context
    const { data: websiteAnalysis, error: analysisError } = await supabase
      .from('website_analyses')
      .select('*')
      .eq('website_url', websiteUrl)
      .single();

    if (analysisError && analysisError.code !== 'PGRST116') {
      console.error('Error fetching website analysis:', analysisError);
    }

    // Fetch subreddit recommendations if they exist
    const { data: subredditRecommendations, error: subredditError } = await supabase
      .from('subreddit_recommendations')
      .select('*')
      .eq('website_url', websiteUrl);

    if (subredditError) {
      console.error('Error fetching subreddit recommendations:', subredditError);
    }

    // Prepare the context for the AI
    let context = {
      website: websiteUrl,
      recommendations: recommendations || [],
      websiteAnalysis: websiteAnalysis || null,
      campaignType: campaignType || null,
      subreddits: subredditRecommendations || []
    };

    let systemPrompt;
    let maxTokens = 400;

    if (isMarketingPlanRequest) {
      // Special handling for marketing plan requests
      systemPrompt = `You are a Reddit marketing strategist creating a comprehensive 7-day marketing plan for ${websiteUrl}.
      
      Create a detailed 7-day Reddit marketing plan that includes:
      
      1. **Overview & Strategy** - Brief analysis of the website and target audience
      2. **Targeted Subreddits** - List 5-7 specific subreddits with subscriber counts and relevance
      3. **7-Day Content Calendar** - One post per day with:
         - Day X: Post title
         - Target subreddit
         - Post type (discussion, showcase, educational, etc.)
         - Key talking points
         - Optimal posting time
      
      Format as a structured plan with clear sections and actionable daily tasks. Be specific and practical.`;
      
      maxTokens = 1500; // Increase token limit for comprehensive plan
    } else {
      // Regular conversational prompt
      systemPrompt = `You are a friendly marketing assistant for ${websiteUrl}. 
        
        Provide natural, conversational responses that directly answer the user's questions. 
        
        Guidelines:
        - Answer questions directly without always formatting as numbered lists
        - Use step-by-step formats only when the user specifically asks for steps or a process
        - Be conversational and personable in your tone
        - Keep responses concise but informative (3-5 sentences unless more detail is needed)
        - Provide specific, actionable advice tailored to their website
        - Use bullet points sparingly and only when listing multiple related items
        - Focus on being helpful rather than overly structured
        
        When appropriate, mention relevant campaign data, but don't just recite statistics. 
        Explain the practical implications and how to act on the information.`;
    }

    // Call OpenAI API with the recommendations and user message
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: `User question: ${userMessage}\n\nAvailable campaign recommendations: ${JSON.stringify(recommendations)}\n\nWebsite analysis: ${JSON.stringify(websiteAnalysis)}\n\nSubreddit recommendations: ${JSON.stringify(subredditRecommendations || [])}`
          }
        ],
        temperature: 0.7,
        max_tokens: maxTokens
      }),
    });

    const openaiData = await response.json();
    
    if (!response.ok) {
      console.error('OpenAI API error:', openaiData);
      return new Response(
        JSON.stringify({ error: `OpenAI API error: ${openaiData.error?.message || 'Unknown error'}` }), 
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiResponse = openaiData.choices[0].message.content;

    return new Response(
      JSON.stringify({ 
        response: aiResponse,
        context: context
      }), 
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    console.error('Error in chat-with-recommendations function:', error);
    return new Response(
      JSON.stringify({ error: error.message }), 
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
