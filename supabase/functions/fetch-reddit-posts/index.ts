
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

    // First, analyze the website to understand the main product
    console.log('Analyzing website for product context:', websiteUrl);
    const productAnalysis = await analyzeWebsiteProduct(websiteUrl);

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
        console.log(`Fetching posts from r/${subreddit}`);
        const postsResponse = await fetch(`https://oauth.reddit.com/r/${subreddit}/hot?limit=100`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'User-Agent': 'Subreddit Analysis Script by /u/smartkid18'
          }
        });
        
        const postsData = await postsResponse.json();
        const posts = postsData.data?.children || [];

        // Enhanced filtering for product relevance
        const relevantPosts = posts.filter((post: any) => {
          const title = post.data.title.toLowerCase();
          const content = post.data.selftext?.toLowerCase() || '';
          const combinedText = `${title} ${content}`;
          
          // Check for product-specific relevance
          const productRelevance = checkProductRelevance(combinedText, productAnalysis);
          
          // Keywords that indicate potential for product discussion
          const engagementKeywords = [
            'recommend', 'suggestion', 'help', 'advice', 'looking for', 'need', 'best',
            'experience', 'review', 'thoughts', 'opinions', 'anyone tried', 'what do you think',
            'struggling with', 'problem', 'issue', 'alternative', 'better way'
          ];
          
          const hasEngagementKeywords = engagementKeywords.some(keyword => 
            combinedText.includes(keyword)
          );
          
          return productRelevance && hasEngagementKeywords && 
                 post.data.score > 3 && // Lower threshold for more posts
                 !post.data.over_18 && // Avoid NSFW posts
                 !post.data.locked; // Avoid locked posts
        }).slice(0, 4); // Limit to 4 posts per subreddit

        // Generate AI comments for relevant posts
        for (const post of relevantPosts) {
          try {
            const aiComment = await generateStrategicComment(post, productAnalysis, subreddit);

            allPosts.push({
              id: post.data.id,
              title: post.data.title,
              content: post.data.selftext || 'No content',
              subreddit: subreddit,
              author: post.data.author,
              score: post.data.score,
              url: `https://reddit.com${post.data.permalink}`,
              aiComment: aiComment
            });
          } catch (error) {
            console.error(`Error generating AI comment for post ${post.data.id}:`, error);
          }
        }
      } catch (error) {
        console.error(`Error fetching posts from r/${subreddit}:`, error);
      }
    }

    // Sort by relevance score and engagement potential
    const sortedPosts = allPosts
      .sort((a, b) => b.score - a.score)
      .slice(0, 9); // Limit to 9 total posts

    console.log(`Found ${sortedPosts.length} relevant posts`);

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

async function analyzeWebsiteProduct(websiteUrl: string) {
  try {
    const response = await fetch(websiteUrl);
    const html = await response.text();
    
    // Extract text content (simplified)
    const textContent = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    const limitedContent = textContent.substring(0, 2000);

    const analysisResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'Analyze the website content and extract key information about the main product/service. Return a JSON object with: productName, category, mainBenefits (array), targetAudience, and keywords (array).'
          },
          {
            role: 'user',
            content: `Website content: ${limitedContent}`
          }
        ],
        max_tokens: 300,
        temperature: 0.3
      }),
    });

    const analysisData = await analysisResponse.json();
    const analysis = analysisData.choices?.[0]?.message?.content;
    
    try {
      return JSON.parse(analysis);
    } catch {
      return {
        productName: 'Unknown Product',
        category: 'general',
        mainBenefits: ['improved efficiency'],
        targetAudience: 'general users',
        keywords: ['product', 'service', 'solution']
      };
    }
  } catch (error) {
    console.error('Error analyzing website product:', error);
    return {
      productName: 'Unknown Product',
      category: 'general',
      mainBenefits: ['improved efficiency'],
      targetAudience: 'general users',
      keywords: ['product', 'service', 'solution']
    };
  }
}

function checkProductRelevance(text: string, productAnalysis: any): boolean {
  const keywords = productAnalysis.keywords || [];
  const category = productAnalysis.category?.toLowerCase() || '';
  const benefits = productAnalysis.mainBenefits || [];
  
  // Check if text contains product keywords
  const hasKeywords = keywords.some((keyword: string) => 
    text.includes(keyword.toLowerCase())
  );
  
  // Check if text relates to product category
  const hasCategory = category && text.includes(category);
  
  // Check if text mentions similar benefits/problems
  const hasBenefitRelation = benefits.some((benefit: string) => 
    text.includes(benefit.toLowerCase()) || 
    text.includes(benefit.toLowerCase().replace('improved ', '').replace('better ', ''))
  );
  
  return hasKeywords || hasCategory || hasBenefitRelation;
}

async function generateStrategicComment(post: any, productAnalysis: any, subreddit: string): Promise<string> {
  const prompt = `You're writing a helpful Reddit comment in r/${subreddit}. 

Post title: "${post.data.title}"
Post content: "${post.data.selftext || 'No body text'}"

Product context:
- Product: ${productAnalysis.productName}
- Category: ${productAnalysis.category}
- Main benefits: ${productAnalysis.mainBenefits?.join(', ')}

Write a 1-2 sentence comment that:
1. Sounds genuinely helpful and natural (like a real Reddit user)
2. Relates to their specific problem/question
3. Subtly mentions or asks about experiences with ${productAnalysis.productName || 'similar tools'} 
4. Uses casual Reddit language
5. Includes a question to encourage engagement
6. Avoids being promotional or salesy
7. Doesn't directly link or advertise

Example approach: "I had a similar issue and found [general solution type] really helpful. Have you tried ${productAnalysis.productName} or similar tools for this?"`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { 
          role: 'system', 
          content: 'You are an experienced Reddit user who gives authentic, helpful advice while being naturally curious about solutions others have tried.' 
        },
        { role: 'user', content: prompt }
      ],
      max_tokens: 100,
      temperature: 0.7
    }),
  });

  const data = await response.json();
  const comment = data.choices?.[0]?.message?.content || 'Could not generate comment';
  
  return comment.replace(/"/g, "'"); // Clean quotes for JSON safety
}
