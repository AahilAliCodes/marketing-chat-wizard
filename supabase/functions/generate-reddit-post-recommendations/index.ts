
// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

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
    if (!OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not set in the environment");
    }

    const { websiteUrl, forceRegenerate } = await req.json();
    
    if (!websiteUrl) {
      throw new Error("websiteUrl is required");
    }

    console.log(`Generating post recommendations for: ${websiteUrl}`);

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get website analysis data
    const { data: websiteAnalysis, error: analysisError } = await supabase
      .from('website_analyses')
      .select('*')
      .eq('website_url', websiteUrl)
      .maybeSingle();

    if (analysisError) {
      console.error('Error fetching website analysis:', analysisError);
      throw new Error('Failed to fetch website analysis');
    }

    if (!websiteAnalysis) {
      throw new Error('No website analysis found. Please analyze the website first.');
    }

    // Get subreddit recommendations for context
    const { data: subredditRecs, error: recsError } = await supabase
      .from('subreddit_recommendations')
      .select('*')
      .eq('website_url', websiteUrl)
      .order('created_at', { ascending: false })
      .limit(10);

    if (recsError) {
      console.error('Error fetching subreddit recommendations:', recsError);
    }

    const subreddits = subredditRecs?.map(r => r.subreddit) || [];

    // Generate post recommendations
    const posts = await generatePostRecommendations(websiteAnalysis, subreddits);

    // Store in database if force regenerate or no existing data
    if (forceRegenerate) {
      // Delete existing recommendations
      await supabase
        .from('reddit_post_recommendations')
        .delete()
        .eq('website_url', websiteUrl);
    }

    // Insert new recommendations
    const postInserts = posts.map(post => ({
      website_url: websiteUrl,
      subreddit: post.subreddit,
      title: post.title,
      content: post.content,
      reasoning: post.reasoning,
      subscribers: post.subscribers,
      engagement_tip: post.engagement_tip
    }));

    const { error: insertError } = await supabase
      .from('reddit_post_recommendations')
      .insert(postInserts);

    if (insertError) {
      console.error('Error storing post recommendations:', insertError);
    }

    console.log(`Generated ${posts.length} post recommendations`);
    
    return new Response(
      JSON.stringify({ posts }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in generate-reddit-post-recommendations function:", error);
    return new Response(
      JSON.stringify({ error: error.message || "An unexpected error occurred" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

async function generatePostRecommendations(websiteAnalysis: any, subreddits: string[]) {
  const systemPrompt = `You are an expert Reddit marketer who creates authentic, engaging posts that spark conversation while subtly featuring products. Your posts should:

1. Feel like genuine stories, opinions, or experiences - NOT sales pitches
2. Follow Reddit's informal, conversational tone
3. Include the product name naturally within the narrative
4. End with thought-provoking questions or insights
5. Be emotionally honest or practically useful
6. Avoid promotional or spammy language
7. Format for Reddit (clear title, story-style body)

For each subreddit, consider:
- Community norms and interests
- What type of content performs well there
- How to naturally integrate the product/service
- Appropriate tone and language for that community`;

  const userPrompt = `Website Analysis:
- Product/Service: ${websiteAnalysis.product_overview}
- Value Proposition: ${websiteAnalysis.core_value_proposition}
- Target Audience: ${websiteAnalysis.target_audience_segments?.join(', ')}
- Goals: ${websiteAnalysis.goals?.join(', ')}
- Tone: ${websiteAnalysis.tone_and_personality}

${subreddits.length > 0 ? `Target Subreddits: ${subreddits.join(', ')}` : 'Generate 10 relevant subreddits based on the analysis'}

Create 10 Reddit post recommendations. Each should be a complete, ready-to-post content piece that naturally mentions the product/service.

Format your response as a JSON object with a "posts" array containing objects with these fields:
- "subreddit": subreddit name (without r/)
- "title": engaging post title
- "content": full post body (use \\n for line breaks)
- "reasoning": why this approach works for this subreddit
- "subscribers": estimated subscriber count (e.g. "50K")
- "engagement_tip": specific tip for maximizing engagement`;

  try {
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
      throw new Error(error.error?.message || "Failed to generate post recommendations");
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    const result = JSON.parse(content);
    
    // Add unique IDs to each post
    const postsWithIds = (result.posts || []).map((post: any) => ({
      ...post,
      id: crypto.randomUUID()
    }));

    return postsWithIds.slice(0, 10); // Ensure we return exactly 10 posts
  } catch (error) {
    console.error("OpenAI API error:", error);
    throw error;
  }
}
