import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @ts-ignore
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

const REDDIT_CLIENT_ID = Deno.env.get('REDDIT_CLIENT_ID');
const REDDIT_SECRET_KEY = Deno.env.get('REDDIT_SECRET_KEY');
const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

// Create a Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const supabase = createClient(supabaseUrl, supabaseKey);

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

    // Fetch website analysis for context
    const { data: websiteAnalysis, error: analysisError } = await supabase
      .from('website_analyses')
      .select('*')
      .eq('website_url', websiteUrl)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (analysisError) {
      console.error('Error fetching website analysis:', analysisError);
    }

    console.log('Website analysis found for posts:', websiteAnalysis ? 'Yes' : 'No');

    // Analyze the website using stored analysis or fallback
    console.log('Analyzing website for product context:', websiteUrl);
    const productAnalysis = websiteAnalysis ? formatWebsiteAnalysis(websiteAnalysis) : await analyzeWebsiteProduct(websiteUrl);

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
    const minPostsNeeded = 6;

    // Fetch posts from each subreddit with increased limits to ensure we get enough posts
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
                 post.data.score > 2 && // Lower threshold for more posts
                 !post.data.over_18 && // Avoid NSFW posts
                 !post.data.locked; // Avoid locked posts
        });

        // Take more posts per subreddit to ensure we reach the minimum
        const postsToProcess = relevantPosts.slice(0, Math.ceil(minPostsNeeded / subreddits.length) + 2);

        // Generate AI comments for relevant posts
        for (const post of postsToProcess) {
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

    // If we don't have enough posts, try with more lenient filtering
    if (allPosts.length < minPostsNeeded) {
      console.log(`Only found ${allPosts.length} posts, trying with more lenient filtering...`);
      
      for (const subreddit of subreddits) {
        if (allPosts.length >= minPostsNeeded) break;
        
        try {
          const postsResponse = await fetch(`https://oauth.reddit.com/r/${subreddit}/hot?limit=50`, {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'User-Agent': 'Subreddit Analysis Script by /u/smartkid18'
            }
          });
          
          const postsData = await postsResponse.json();
          const posts = postsData.data?.children || [];

          // More lenient filtering - just basic quality checks
          const backupPosts = posts.filter((post: any) => {
            const title = post.data.title.toLowerCase();
            const content = post.data.selftext?.toLowerCase() || '';
            const combinedText = `${title} ${content}`;
            
            // Skip posts we already have
            const alreadyExists = allPosts.some(existing => existing.id === post.data.id);
            if (alreadyExists) return false;
            
            // Basic quality filters
            return post.data.score > 1 && 
                   !post.data.over_18 && 
                   !post.data.locked &&
                   title.length > 10; // Ensure meaningful titles
          }).slice(0, minPostsNeeded - allPosts.length);

          // Generate AI comments for backup posts
          for (const post of backupPosts) {
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
              console.error(`Error generating AI comment for backup post ${post.data.id}:`, error);
            }
          }
        } catch (error) {
          console.error(`Error fetching backup posts from r/${subreddit}:`, error);
        }
      }
    }

    // Sort by relevance score and engagement potential, ensure minimum 6 posts
    const sortedPosts = allPosts
      .sort((a, b) => b.score - a.score)
      .slice(0, Math.max(minPostsNeeded, 12)); // Show 6-12 posts

    console.log(`Found ${sortedPosts.length} relevant posts`);

    // Store posts in database for future retrieval
    if (sortedPosts.length > 0) {
      try {
        const postsToStore = sortedPosts.map(post => ({
          website_url: websiteUrl,
          title: post.title,
          content: post.content,
          subreddit: post.subreddit,
          author: post.author,
          score: post.score,
          url: post.url,
          ai_comment: post.aiComment
        }));

        // Delete existing posts for this website
        await supabase
          .from('reddit_posts_analysis')
          .delete()
          .eq('website_url', websiteUrl);

        // Insert new posts
        const { error: insertError } = await supabase
          .from('reddit_posts_analysis')
          .insert(postsToStore);

        if (insertError) {
          console.error('Error storing posts:', insertError);
        } else {
          console.log(`Successfully stored ${postsToStore.length} posts for ${websiteUrl}`);
        }
      } catch (error) {
        console.error('Error in posts storage process:', error);
      }
    }

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

function formatWebsiteAnalysis(analysis: any) {
  return {
    productName: analysis.product_overview?.split(' ')[0] || 'Product',
    category: analysis.target_audience_type || 'general',
    mainBenefits: analysis.goals || ['improved efficiency'],
    targetAudience: analysis.target_audience_segments?.join(', ') || 'general users',
    keywords: [
      analysis.product_overview?.toLowerCase(),
      analysis.core_value_proposition?.toLowerCase(),
      ...analysis.target_audience_segments?.map((s: string) => s.toLowerCase()) || []
    ].filter(Boolean)
  };
}

async function analyzeWebsiteProduct(websiteUrl: string) {
  try {
    const response = await fetch(websiteUrl);
    const html = await response.text();
    
    // Extract text content (simplified)
    const textContent = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    const limitedContent = textContent.substring(0, 2000);

    // Extract domain name as fallback product name
    const urlObject = new URL(websiteUrl);
    const domainName = urlObject.hostname.replace('www.', '').split('.')[0];
    const fallbackProductName = domainName.charAt(0).toUpperCase() + domainName.slice(1);

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
            content: `Analyze the website content and extract key information about the main product/service. Return a JSON object with: productName (MUST be a real name, not "Unknown Product"), category, mainBenefits (array), targetAudience, and keywords (array). If you cannot determine the product name from the content, use the domain name: ${fallbackProductName}`
          },
          {
            role: 'user',
            content: `Website URL: ${websiteUrl}\nWebsite content: ${limitedContent}`
          }
        ],
        max_tokens: 300,
        temperature: 0.3
      }),
    });

    const analysisData = await analysisResponse.json();
    const analysis = analysisData.choices?.[0]?.message?.content;
    
    try {
      const parsedAnalysis = JSON.parse(analysis);
      // Ensure we never return "Unknown Product"
      if (!parsedAnalysis.productName || parsedAnalysis.productName === 'Unknown Product') {
        parsedAnalysis.productName = fallbackProductName;
      }
      return parsedAnalysis;
    } catch {
      return {
        productName: fallbackProductName,
        category: 'general',
        mainBenefits: ['improved efficiency'],
        targetAudience: 'general users',
        keywords: [fallbackProductName.toLowerCase(), 'product', 'service', 'solution']
      };
    }
  } catch (error) {
    console.error('Error analyzing website product:', error);
    // Extract domain name as fallback
    try {
      const urlObject = new URL(websiteUrl);
      const domainName = urlObject.hostname.replace('www.', '').split('.')[0];
      const fallbackProductName = domainName.charAt(0).toUpperCase() + domainName.slice(1);
      
      return {
        productName: fallbackProductName,
        category: 'general',
        mainBenefits: ['improved efficiency'],
        targetAudience: 'general users',
        keywords: [fallbackProductName.toLowerCase(), 'product', 'service', 'solution']
      };
    } catch {
      return {
        productName: 'Platform',
        category: 'general',
        mainBenefits: ['improved efficiency'],
        targetAudience: 'general users',
        keywords: ['platform', 'product', 'service', 'solution']
      };
    }
  }
}

function checkProductRelevance(text: string, productAnalysis: any): boolean {
  const keywords = productAnalysis.keywords || [];
  const category = productAnalysis.category?.toLowerCase() || '';
  const benefits = productAnalysis.mainBenefits || [];
  
  // Check if text contains product keywords
  const hasKeywords = keywords.some((keyword: string) => 
    keyword && text.includes(keyword.toLowerCase())
  );
  
  // Check if text relates to product category
  const hasCategory = category && text.includes(category);
  
  // Check if text mentions similar benefits/problems
  const hasBenefitRelation = benefits.some((benefit: string) => 
    benefit && (text.includes(benefit.toLowerCase()) || 
    text.includes(benefit.toLowerCase().replace('improved ', '').replace('better ', '')))
  );
  
  return hasKeywords || hasCategory || hasBenefitRelation;
}

async function generateStrategicComment(post: any, productAnalysis: any, subreddit: string): Promise<string> {
  const productName = productAnalysis.productName || 'Platform';
  
  const prompt = `You're writing a helpful Reddit comment in r/${subreddit}. 

Post title: "${post.data.title}"
Post content: "${post.data.selftext || 'No body text'}"

Product context:
- Product: ${productName}
- Category: ${productAnalysis.category}
- Main benefits: ${productAnalysis.mainBenefits?.join(', ')}

Write a 1-2 sentence comment that:
1. Sounds genuinely helpful and natural (like a real Reddit user)
2. Relates to their specific problem/question
3. Subtly mentions or asks about experiences with ${productName}
4. Uses casual Reddit language
5. Includes a question to encourage engagement
6. Avoids being promotional or salesy
7. Doesn't directly link or advertise
8. MUST use the actual product name "${productName}" not "Unknown Product"

Example approach: "I had a similar issue and found [general solution type] really helpful. Have you tried ${productName} or similar tools for this?"`;

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
          content: `You are an experienced Reddit user who gives authentic, helpful advice while being naturally curious about solutions others have tried. Always use the specific product name provided, never say "Unknown Product".` 
        },
        { role: 'user', content: prompt }
      ],
      max_tokens: 100,
      temperature: 0.7
    }),
  });

  const data = await response.json();
  let comment = data.choices?.[0]?.message?.content || `Could not generate comment for ${productName}`;
  
  // Clean quotes for JSON safety and ensure product name is used
  comment = comment.replace(/"/g, "'");
  
  // Final safety check to replace any "Unknown Product" mentions
  comment = comment.replace(/Unknown Product/g, productName);
  
  return comment;
}
