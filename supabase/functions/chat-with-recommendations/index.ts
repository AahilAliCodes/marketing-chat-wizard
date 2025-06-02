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

    // Check if this is an action prompt (starts with action words)
    const actionWords = ['create', 'make', 'do', 'give', 'write', 'build', 'develop', 'design', 'generate', 'produce', 'craft', 'compose', 'plan', 'outline', 'draft', 'prepare', 'setup', 'configure', 'implement', 'execute', 'launch', 'start', 'begin', 'initiate', 'establish', 'form', 'construct', 'formulate', 'devise'];
    const isActionPrompt = actionWords.some(word => userMessage.toLowerCase().trim().startsWith(word));

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
      // Special handling for marketing plan requests - different for Reddit vs General
      if (campaignType === 'reddit') {
        systemPrompt = `You are a Reddit marketing strategist creating a comprehensive 7-day Reddit marketing plan for ${websiteUrl}.
        
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
        // General marketing plan using Traction methodologies
        systemPrompt = `You are a marketing strategist creating a comprehensive marketing plan for ${websiteUrl} using the Traction methodology by Gabriel Weinberg.
        
        Create a strategic marketing plan that includes:
        
        1. **Business Overview** - Brief analysis of the website, product/service, and target market
        
        2. **Traction Channel Analysis** - Evaluate and prioritize the most relevant channels from the 19 Traction channels:
           - Viral Marketing, Public Relations, Unconventional PR
           - Search Engine Marketing, Social & Display Ads, Offline Ads
           - Search Engine Optimization, Content Marketing, Email Marketing
           - Engineering as Marketing, Targeting Blogs, Business Development
           - Sales, Affiliate Programs, Existing Platforms
           - Trade Shows, Offline Events, Speaking Engagements, Community Building
        
        3. **The Bullseye Framework Implementation**:
           - **Outer Ring**: List 6-8 potential traction channels worth exploring
           - **Middle Ring**: Identify 2-3 most promising channels for testing
           - **Inner Ring**: Select 1 primary channel to focus on initially
        
        4. **Testing Strategy** - Specific experiments to run for the top 3 channels
        
        5. **Metrics & Goals** - Key performance indicators for each channel
        
        6. **Implementation Timeline** - 90-day roadmap with milestones
        
        Format as a strategic document with clear sections, actionable steps, and specific recommendations tailored to the business.`;
        
        maxTokens = 2000; // Increase token limit for comprehensive strategy
      }
    } else if (isActionPrompt) {
      // Action-oriented responses - actually create the deliverable
      systemPrompt = `You are a practical marketing assistant for ${websiteUrl}. 
        
        The user has requested you to create something specific. Your job is to actually create the exact deliverable they asked for, not explain how to do it.
        
        CRITICAL INSTRUCTIONS:
        - DO NOT explain the process or give tips
        - DO NOT provide meta-commentary about what you're doing
        - CREATE the actual content they requested
        - If they ask you to "write" something, write the full content
        - If they ask you to "create" something, create the complete item
        - If they ask you to "make" something, make the finished product
        - Format your response as if it's the final deliverable
        
        Examples:
        - If asked to "write a Reddit post", provide the actual post with title and body
        - If asked to "create an email", write the complete email with subject and content
        - If asked to "make a social media caption", write the actual caption
        - If asked to "generate headlines", list the actual headlines
        
        Be direct, practical, and deliver exactly what they asked for without explanation.`;
        
      maxTokens = 800; // More tokens for detailed action responses
    } else {
      // Question-oriented responses - short and informative
      systemPrompt = `You are a friendly marketing assistant for ${websiteUrl}. 
        
        The user has asked a question. Provide a concise, informative response.
        
        Guidelines:
        - Answer questions directly in 5-6 sentences maximum
        - Be conversational and personable in your tone
        - Provide specific, actionable advice when possible
        - Focus on being helpful and informative
        - Don't use lengthy explanations or step-by-step processes unless specifically asked
        - Get straight to the point while being thorough
        
        When appropriate, mention relevant campaign data, but keep responses concise and focused.`;
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
