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
      console.error("OPENAI_API_KEY is not set in the environment");
      throw new Error("OPENAI_API_KEY is not set in the environment");
    }

    const { websiteUrl, prompt, numPosts, customImage } = await req.json();
    
    if (!websiteUrl) {
      console.error("websiteUrl is required");
      throw new Error("websiteUrl is required");
    }

    console.log(`Generating ${numPosts || 4} Reddit posts for ${websiteUrl}`);
    const posts = await generateRedditPosts(websiteUrl, prompt, numPosts || 4, customImage);
    console.log(`Generated ${posts.length} Reddit posts`);
    
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

async function generateRedditPosts(websiteUrl: string, customPrompt: string, numPosts: number, customImage?: string): Promise<any[]> {
  try {
    console.log("Starting post content generation");
    // Step 1: Generate post content using GPT
    const postsData = await generatePostContent(websiteUrl, customPrompt, numPosts);
    console.log("Post content generated successfully");
    
    const generatedPosts = [];
    
    // Step 2: For each post, generate an image (or use the custom one)
    for (const postData of postsData) {
      console.log(`Processing post: ${postData.title}`);
      
      let imageUrl;
      
      if (customImage) {
        // If a custom image was provided, use it instead of generating one
        console.log("Using custom image instead of generating one");
        imageUrl = customImage;
      } else {
        // Otherwise generate an image with DALL-E
        console.log(`Generating image for post: ${postData.title}`);
        imageUrl = await generateImageForPost(postData.imagePrompt);
        console.log(`Image generated with URL: ${imageUrl}`);
      }
      
      generatedPosts.push({
        id: crypto.randomUUID(),
        title: postData.title,
        content: postData.content,
        subreddit: postData.subreddit,
        imageUrl,
        dateGenerated: new Date().toISOString()
      });
    }
    
    console.log("All posts generated successfully");
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
  
  Format your response strictly as a JSON object with a "posts" array containing ${numPosts} objects. Each object must have these fields: "title", "content", "subreddit", and "imagePrompt".`;

  try {
    console.log("Making OpenAI API call for post content");
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
      console.error("OpenAI API error response:", error);
      throw new Error(error.error?.message || "Failed to generate post content");
    }

    const data = await response.json();
    console.log("OpenAI API response received");
    
    const content = data.choices[0].message.content;
    console.log("Parsing JSON response");
    const result = JSON.parse(content);
    
    // Make sure we're returning exactly the number of posts requested
    return (result.posts || []).slice(0, numPosts);
  } catch (error) {
    console.error("OpenAI API error:", error);
    throw error;
  }
}

async function generateImageForPost(imagePrompt: string): Promise<string> {
  try {
    console.log("Making DALL-E API call for image generation");
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
      console.error("DALL-E API error response:", error);
      throw new Error(error.error?.message || "Failed to generate image");
    }

    const data = await response.json();
    console.log("DALL-E API response received");
    return data.data[0].url;
  } catch (error) {
    console.error("DALL-E API error:", error);
    throw error;
  }
}
