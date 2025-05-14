
// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
// @ts-ignore
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

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

    const { websiteUrl, prompt, numPosts } = await req.json();
    
    if (!websiteUrl) {
      throw new Error("websiteUrl is required");
    }

    const posts = await generateRedditPosts(websiteUrl, prompt, numPosts || 4);
    
    return new Response(
      JSON.stringify({ posts }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in generate-reddit-posts function:", error);
    return new Response(
      JSON.stringify({ error: error.message || "An unexpected error occurred" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

interface RedditPostData {
  title: string;
  content: string;
  subreddit: string;
  imagePrompt: string;
}

async function generateRedditPosts(websiteUrl: string, customPrompt: string, numPosts: number): Promise<any[]> {
  try {
    // Step 1: Generate post content using GPT
    const postsData = await generatePostContent(websiteUrl, customPrompt, numPosts);
    const generatedPosts = [];
    
    // Step 2: For each post, generate an image
    for (const postData of postsData) {
      const imageUrl = await generateImageForPost(postData.imagePrompt);
      
      generatedPosts.push({
        id: crypto.randomUUID(),
        title: postData.title,
        content: postData.content,
        subreddit: postData.subreddit,
        imageUrl,
        dateGenerated: new Date().toISOString()
      });
    }
    
    return generatedPosts;
  } catch (error) {
    console.error("Error generating Reddit posts:", error);
    throw error;
  }
}

async function generatePostContent(websiteUrl: string, customPrompt: string, numPosts: number): Promise<RedditPostData[]> {
  const systemPrompt = `You are an expert Reddit marketer. Analyze the provided website URL and create ${numPosts} engaging Reddit posts that would perform well. 
  Each post should include:
  1. A catchy title that would grab Reddit users' attention
  2. The content of the post (keep it concise, authentic, and in line with Reddit's culture)
  3. The best subreddit to post it in (use real subreddits with active communities)
  4. A brief description for an image that would complement the post well
  
  Don't mention that you're AI or that this is generated content. Make it sound natural and authentic, like a real Reddit user wrote it.`;
  
  const userPrompt = `Website URL: ${websiteUrl}
  
  ${customPrompt || "Create engaging Reddit posts for this website that would perform well and drive traffic."}
  
  Format your response strictly as a JSON array with objects containing title, content, subreddit, and imagePrompt fields.`;

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
      throw new Error(error.error?.message || "Failed to generate post content");
    }

    const data = await response.json();
    const result = JSON.parse(data.choices[0].message.content);
    
    return result.posts || [];
  } catch (error) {
    console.error("OpenAI API error:", error);
    throw error;
  }
}

async function generateImageForPost(imagePrompt: string): Promise<string> {
  try {
    const response = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "dall-e-3",
        prompt: `Create an engaging Reddit post image: ${imagePrompt}. Make it look like it belongs in a professional Reddit advertisement. Avoid text overlay.`,
        n: 1,
        size: "1024x1024",
        quality: "standard",
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || "Failed to generate image");
    }

    const data = await response.json();
    return data.data[0].url;
  } catch (error) {
    console.error("DALL-E API error:", error);
    throw error;
  }
}
