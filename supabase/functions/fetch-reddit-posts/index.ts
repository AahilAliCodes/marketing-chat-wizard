
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

const REDDIT_CLIENT_ID = Deno.env.get('REDDIT_CLIENT_ID');
const REDDIT_SECRET_KEY = Deno.env.get('REDDIT_SECRET_KEY');
const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 200,
      headers: corsHeaders 
    });
  }

  try {
    const { subreddits, websiteUrl } = await req.json();

    if (!REDDIT_CLIENT_ID || !REDDIT_SECRET_KEY) {
      throw new Error('Reddit API credentials not configured');
    }

    if (!OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured');
    }

    // Get Reddit access token
    const authResponse = await fetch('https://www.reddit.com/api/v1/access_token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(`${REDDIT_CLIENT_ID}:${REDDIT_SECRET_KEY}`)}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Subreddit Analysis Script by /u/smartkid18'
      },
      body: 'grant_type=client_credentials'
    });

    const authData = await authResponse.json();
    const accessToken = authData.access_token;

    const allPosts = [];

    // Fetch posts from each subreddit
    for (const subreddit of subreddits) {
      try {
        const postsResponse = await fetch(`https://oauth.reddit.com/r/${subreddit}/hot?limit=50`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'User-Agent': 'Subreddit Analysis Script by /u/smartkid18'
          }
        });
        
        const postsData = await postsResponse.json();
        const posts = postsData.data?.children || [];

        // Filter posts that might be relevant for marketing
        const relevantPosts = posts.filter((post: any) => {
          const title = post.data.title.toLowerCase();
          const content = post.data.selftext?.toLowerCase() || '';
          
          // Keywords that indicate potential for product discussion
          const marketingKeywords = [
            'recommend', 'suggestion', 'help', 'advice', 'tired', 'fatigue', 
            'problem', 'issue', 'struggle', 'looking for', 'need', 'best',
            'supplement', 'product', 'brand', 'experience', 'review'
          ];
          
          return marketingKeywords.some(keyword => 
            title.includes(keyword) || content.includes(keyword)
          ) && post.data.score > 5; // Only posts with some engagement
        }).slice(0, 3); // Limit to 3 posts per subreddit

        // Generate AI comments for relevant posts
        for (const post of relevantPosts) {
          try {
            const prompt = `You're a helpful Reddit user in /r/${subreddit}. Respond to this post naturally with a casual, helpful comment that could open the door for subtle product discussion later. Don't mention any specific products or brands.

Post title: "${post.data.title}"
Post body: "${post.data.selftext || 'No body text'}"

Write a 1-2 sentence response that:
- Sounds like a genuine Reddit user
- Is helpful and empathetic
- Relates to common experiences
- Avoids being promotional
- Uses casual Reddit language`;

            const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${OPENAI_API_KEY}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [
                  { role: 'system', content: 'You are a helpful, casual Reddit user who gives authentic advice.' },
                  { role: 'user', content: prompt }
                ],
                max_tokens: 150,
                temperature: 0.8
              }),
            });

            const aiData = await openAIResponse.json();
            const aiComment = aiData.choices?.[0]?.message?.content || 'Could not generate comment';

            allPosts.push({
              id: post.data.id,
              title: post.data.title,
              content: post.data.selftext || 'No content',
              subreddit: subreddit,
              author: post.data.author,
              score: post.data.score,
              url: `https://reddit.com${post.data.permalink}`,
              aiComment: aiComment.replace(/"/g, "'") // Clean quotes
            });
          } catch (error) {
            console.error(`Error generating AI comment for post ${post.data.id}:`, error);
          }
        }
      } catch (error) {
        console.error(`Error fetching posts from r/${subreddit}:`, error);
      }
    }

    // Sort by score and limit total results
    const sortedPosts = allPosts
      .sort((a, b) => b.score - a.score)
      .slice(0, 9); // Limit to 9 total posts

    return new Response(JSON.stringify({ posts: sortedPosts }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in fetch-reddit-posts function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
