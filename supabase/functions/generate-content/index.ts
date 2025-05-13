
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

    const { type, prompt } = await req.json();

    console.log(`Generating ${type} with prompt: ${prompt}`);

    switch (type) {
      case "image":
        return await generateImage(prompt);
      case "video":
        return await generateVideo(prompt);
      case "text":
        return await generateText(prompt);
      default:
        throw new Error(`Invalid content type: ${type}`);
    }
  } catch (error) {
    console.error("Error in generate-content function:", error);
    return new Response(
      JSON.stringify({ error: error.message || "An unexpected error occurred" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

// Generate image using DALL-E
async function generateImage(prompt: string) {
  try {
    const response = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "dall-e-3",
        prompt,
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
    return new Response(
      JSON.stringify({ url: data.data[0].url }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("DALL-E API error:", error);
    throw error;
  }
}

// Generate video using SORA
async function generateVideo(prompt: string) {
  try {
    // Note: As of now, SORA doesn't have a public API endpoint
    // This is a mock implementation that would be replaced with the actual API
    // when it becomes available
    console.log("SORA API is not yet publicly available, returning mock video");
    
    // For demo purposes, return a placeholder video
    return new Response(
      JSON.stringify({ 
        url: "https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
        note: "This is a placeholder as SORA API is not yet publicly available"
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("SORA API error:", error);
    throw error;
  }
}

// Generate text content
async function generateText(prompt: string) {
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
          { role: "system", content: "You are a helpful marketing assistant that reccomends marketing strategies based on user prompts. Keep your responses concise and to the point." },
          { role: "user", content: prompt }
        ],
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || "Failed to generate text");
    }

    const data = await response.json();
    return new Response(
      JSON.stringify({ text: data.choices[0].message.content }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("OpenAI API error:", error);
    throw error;
  }
}
