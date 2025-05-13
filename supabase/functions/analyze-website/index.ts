import "https://deno.land/x/xhr@0.1.0/mod.ts";
// @ts-ignore
import { serve } from "https://deno.land/std/http/server.ts";
// @ts-ignore
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.43.2/+esm";

const supabaseUrl = "https://phgrwmrxcryhkkmjkpqc.supabase.co";
// @ts-ignore
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
// @ts-ignore
const openaiApiKey = Deno.env.get("OPENAI_API_KEY") || "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";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface WebsiteAnalysis {
  productOverview: string;
  coreValueProposition: string;
  targetAudience: {
    type: "Consumers" | "Business" | "Government";
    segments: string[];
  };
  currentStage: string;
  goals: string[];
  suggestedBudget: string;
  strengths: string[];
  constraints: string[];
  preferredChannels: string[];
  toneAndPersonality: string;
}

interface CampaignRecommendation {
  title: string;
  platform: string;
  description: string;
  insights: string[];
  roi: string;
  difficulty: "Easy" | "Medium" | "Hard";
  budget: string;
}

const campaignTypes = [
  "Viral Marketing", "Public Relations", "Unconventional PR", 
  "Search Engine Marketing", "Social & Display Ads", "Offline Ads", 
  "Search Engine Optimization", "Content Marketing", "Email Marketing", 
  "Engineering as Marketing", "Targeting Blogs", "Business Development", 
  "Sales", "Affiliate Programs", "Existing Platforms", "Trade Shows", 
  "Offline Events", "Speaking Engagements", "Community Building"
];

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

    const { url } = await req.json();
    if (!url) {
      return new Response(
        JSON.stringify({ error: "URL is required" }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Starting website fetch for:', url);

    // Fetch website content using a CORS proxy
    console.log('Fetching website content...');
    const corsProxy = 'https://api.codetabs.com/v1/proxy?quest=';
    const response = await fetch(`${corsProxy}${url}`, {
      method: 'GET',
      headers: {
        'Accept': 'text/html',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    if (!response.ok) {
      console.error('Response status:', response.status);
      console.error('Response status text:', response.statusText);
      const errorText = await response.text();
      console.error('Error response:', errorText);
      throw new Error(`Failed to fetch website: ${response.status} ${response.statusText}`);
    }

    const html = await response.text();
    console.log('Successfully fetched website content');

    // Extract and clean text content
    console.log('Cleaning content...');
    let content = html
      // Remove script tags and their content
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      // Remove style tags and their content
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      // Remove HTML comments
      .replace(/<!--[\s\S]*?-->/g, '')
      // Remove all HTML tags
      .replace(/<[^>]*>/g, ' ')
      // Remove extra whitespace
      .replace(/\s+/g, ' ')
      // Remove common UI elements
      .replace(/(menu|navigation|header|footer|sidebar|button|link|search|login|sign up|sign in|register|subscribe|newsletter|cookie|privacy|terms|copyright|all rights reserved)/gi, '')
      // Remove URLs
      .replace(/https?:\/\/[^\s]+/g, '')
      // Remove email addresses
      .replace(/[\w.-]+@[\w.-]+\.\w+/g, '')
      // Remove special characters
      .replace(/[^\w\s.,!?-]/g, ' ')
      // Remove multiple spaces
      .replace(/\s+/g, ' ')
      // Remove multiple periods
      .replace(/\.+/g, '.')
      // Remove multiple commas
      .replace(/,+/g, ',')
      // Remove multiple dashes
      .replace(/-+/g, '-')
      // Remove multiple question marks
      .replace(/\?+/g, '?')
      // Remove multiple exclamation marks
      .replace(/!+/g, '!')
      // Trim whitespace
      .trim();

    // Remove short lines (likely UI elements or navigation)
    content = content
      .split('\n')
      .filter(line => line.trim().length > 20)
      .join('\n');

    // Remove duplicate lines
    content = [...new Set(content.split('\n'))].join('\n');

    // Limit content to 1000 characters
    content = content.slice(0, 1000);
    console.log('Content cleaned and limited, length:', content.length);

    if (content.length < 100) {
      throw new Error('Extracted content is too short. The website might be blocking access.');
    }

    // Call OpenAI API for analysis
    console.log('Analyzing content with OpenAI...');
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
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
            content: 'You are a marketing analysis expert. Analyze this website content and provide a structured analysis as a clean JSON object with the following fields:\nproductOverview: string (Brief description in 1-2 sentences)\ncoreValueProposition: string (Most unique/urgent benefit)\ntargetAudience: {type: "Consumers" | "Business" | "Government", segments: string[]}\ncurrentStage: string (Stage of product like "MVP live", "Some beta users", etc)\ngoals: string[] (e.g., ["Awareness", "Waitlist signups", "App downloads"])\nsuggestedBudget: string (Suggested budget range)\nstrengths: string[] (Key advantages)\nconstraints: string[] (Limitations and risks)\npreferredChannels: string[] (e.g., ["Paid ads", "Content marketing", "PR"])\ntoneAndPersonality: string (Brand feel in marketing)'
          },
          {
            role: 'user',
            content: `Analyze this website content:\n\n${content}`
          }
        ],
        temperature: 0.7,
      }),
    });

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.json();
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const openaiData = await openaiResponse.json();
    console.log('OpenAI analysis received');

    // Parse the response - with improved error handling for JSON parsing
    const analysisResponse = openaiData.choices[0].message.content;
    
    // Extract JSON from response (in case it's wrapped in markdown code blocks)
    let jsonText = analysisResponse;
    
    // Check if the response contains a JSON code block
    const jsonMatch = analysisResponse.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (jsonMatch && jsonMatch[1]) {
      jsonText = jsonMatch[1];
    }
    
    let analysis: WebsiteAnalysis;
    try {
      analysis = JSON.parse(jsonText);
      console.log('Analysis parsed successfully');
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      console.log('Raw content that failed to parse:', jsonText);
      
      // Fallback: Create a basic analysis object with error information
      analysis = {
        productOverview: "Could not analyze product",
        coreValueProposition: "Unknown (analysis failed)",
        targetAudience: {
          type: "Consumers",
          segments: ["General audience"]
        },
        currentStage: "Unknown",
        goals: ["Website visibility"],
        suggestedBudget: "$500-1000",
        strengths: ["Online presence"],
        constraints: ["Limited information available"],
        preferredChannels: ["Social media", "Content marketing"],
        toneAndPersonality: "Professional"
      };
      
      console.log('Using fallback analysis data');
    }

    // Generate initial campaign recommendations with default budget
    console.log('Generating campaign recommendations...');
    const recommendationsResponse = await fetch('https://api.openai.com/v1/chat/completions', {
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
            content: `You are a marketing campaign expert. Based on the company analysis, recommend the best 3 FREE campaign types from this list: ${campaignTypes.join(', ')}. For each campaign, provide:
1. A title that includes the campaign type
2. A suitable platform (e.g., "Google Ads", "Instagram", "LinkedIn", etc.)
3. A brief description
4. 3 specific insights about why this campaign would work for this company
5. A realistic ROI estimate (e.g., "2.5x") - THIS FIELD IS REQUIRED AND MUST BE A STRING

Make concise recommendations. (150 words or less)
Format the response as a clean JSON array of campaign objects without any markdown formatting.`
          },
          {
            role: 'user',
            content: `Here's the company analysis:\n\n${JSON.stringify(analysis, null, 2)}`
          }
        ],
        temperature: 0.7,
      }),
    });

    if (!recommendationsResponse.ok) {
      const errorData = await recommendationsResponse.json();
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const recommendationsData = await recommendationsResponse.json();
    const recommendationsText = recommendationsData.choices[0].message.content;
    
    // Extract JSON from recommendations response
    let recommendationsJson = recommendationsText;
    const recJsonMatch = recommendationsText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (recJsonMatch && recJsonMatch[1]) {
      recommendationsJson = recJsonMatch[1];
    }
    
    let recommendations: CampaignRecommendation[];
    try {
      recommendations = JSON.parse(recommendationsJson);
    } catch (parseError) {
      console.error('Recommendations parse error:', parseError);
      
      // Fallback recommendations
      recommendations = [
        {
          title: "Content Marketing Strategy",
          platform: "Blog / Website",
          description: "Create valuable content that attracts and engages the target audience.",
          insights: ["Builds authority in the industry", "Improves SEO ranking", "Creates shareable assets"],
          roi: "2.0x",
          difficulty: "Medium",
          budget: "$0-500"
        },
        {
          title: "Social Media Engagement",
          platform: "Instagram / LinkedIn",
          description: "Build community through regular, engaging social posts.",
          insights: ["Increases brand awareness", "Creates direct customer communication", "Provides market insights"],
          roi: "1.8x",
          difficulty: "Easy",
          budget: "$0-200"
        },
        {
          title: "Email Marketing Campaign",
          platform: "MailChimp / SendGrid",
          description: "Develop targeted email sequences for leads and customers.",
          insights: ["High conversion rates", "Direct access to interested audience", "Measurable results"],
          roi: "3.0x",
          difficulty: "Medium",
          budget: "$0-100"
        }
      ];
    }
    
    // Validate recommendations
    const validatedRecommendations = recommendations.map(rec => ({
      ...rec,
      roi: rec.roi || "2.0x", // Default ROI if missing
      difficulty: rec.difficulty || "Medium", // Default difficulty if missing
      budget: rec.budget || "$0-500" // Default budget if missing
    }));

    console.log('Campaign recommendations generated successfully');

    // Save analysis to Supabase
    const { data: analysisData, error: analysisError } = await supabase
      .from('website_analyses')
      .insert({
        website_url: url,
        product_overview: analysis.productOverview,
        core_value_proposition: analysis.coreValueProposition,
        target_audience_type: analysis.targetAudience.type,
        target_audience_segments: analysis.targetAudience.segments,
        current_stage: analysis.currentStage,
        goals: analysis.goals,
        suggested_budget: analysis.suggestedBudget,
        strengths: analysis.strengths,
        constraints: analysis.constraints,
        preferred_channels: analysis.preferredChannels,
        tone_and_personality: analysis.toneAndPersonality
      })
      .select()
      .single();

    if (analysisError) {
      console.error('Error saving analysis to Supabase:', analysisError);
      throw new Error(`Error saving analysis: ${analysisError.message}`);
    }

    // Save recommendations to Supabase
    const recommendationsPromises = validatedRecommendations.map(rec =>
      supabase.from('campaign_recommendations').insert({
        website_url: url,
        title: rec.title,
        platform: rec.platform,
        description: rec.description,
        insights: rec.insights,
        roi: rec.roi,
        difficulty: rec.difficulty,
        budget: rec.budget
      })
    );

    await Promise.all(recommendationsPromises);

    return new Response(
      JSON.stringify({ 
        success: true, 
        analysis: analysisData,
        recommendations: validatedRecommendations
      }), 
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    console.error('Error in analyze-website function:', error);
    return new Response(
      JSON.stringify({ error: error.message }), 
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
