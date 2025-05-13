
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

    // Prepare the context for the AI
    let context = {
      website: websiteUrl,
      recommendations: recommendations || [],
      websiteAnalysis: websiteAnalysis || null,
      campaignType: campaignType || null
    };

    // Create personalized system prompt based on campaign type
    let systemPrompt = `You are a marketing assistant that provides short and concise answers based on campaign recommendations data for ${websiteUrl}.`;
    
    systemPrompt += ` Answer user questions specifically and directly related to the provided data.
      If you don't have enough information, say so rather than making things up.`;

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
            content: `User question: ${userMessage}\n\nKey recommendations: ${JSON.stringify(recommendations)}`
          }
        ],
        temperature: 0.5,
        max_tokens: 512
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
