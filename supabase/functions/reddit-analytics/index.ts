
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

    // Check if we have stored analytics for this website that are recent (within 24 hours)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: existingAnalytics, error: fetchError } = await supabase
      .from('reddit_subreddit_analytics')
      .select('*')
      .eq('website_url', websiteUrl)
      .gte('created_at', oneDayAgo);

    if (fetchError) {
      console.error('Error fetching existing analytics:', fetchError);
    }

    // If we have recent analytics data, return it
    if (existingAnalytics && existingAnalytics.length > 0) {
      console.log('Found existing analytics data for', websiteUrl);
      const formattedAnalytics = existingAnalytics.map(item => ({
        subreddit: item.subreddit,
        engagement_rate: parseFloat(item.engagement_rate.toString()),
        visibility_score: parseFloat(item.visibility_score.toString()),
        active_posters: item.active_posters,
        strictness_index: parseFloat(item.strictness_index.toString()),
        top_themes: item.top_themes,
        subscribers: item.subscribers
      }));

      return new Response(JSON.stringify({ analytics: formattedAnalytics }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('No recent analytics found, generating new data for', websiteUrl);

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

    const analytics = await Promise.all(
      subreddits.map(async (subreddit: string) => {
        try {
          // Get subreddit info
          const subredditInfoResponse = await fetch(`https://oauth.reddit.com/r/${subreddit}/about`, {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'User-Agent': 'Subreddit Analysis Script by /u/smartkid18'
            }
          });
          const subredditInfo = await subredditInfoResponse.json();

          // Get recent posts
          const postsResponse = await fetch(`https://oauth.reddit.com/r/${subreddit}/new?limit=100`, {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'User-Agent': 'Subreddit Analysis Script by /u/smartkid18'
            }
          });
          const postsData = await postsResponse.json();
          const posts = postsData.data?.children || [];

          // Calculate metrics
          const totalUpvotes = posts.reduce((sum: number, post: any) => sum + (post.data.score || 0), 0);
          const totalComments = posts.reduce((sum: number, post: any) => sum + (post.data.num_comments || 0), 0);
          const totalPosts = posts.length;

          const engagementPerPost = totalPosts > 0 ? (totalUpvotes + totalComments) / totalPosts : 0;
          const estimatedActiveUsers = subredditInfo.data?.active_user_count || 10000;
          const engagementRate = estimatedActiveUsers > 0 ? engagementPerPost / estimatedActiveUsers : 0;

          const avgUpvotes = totalPosts > 0 ? totalUpvotes / totalPosts : 0;
          const avgUpvoteRatio = totalPosts > 0 ? 
            posts.reduce((sum: number, post: any) => sum + (post.data.upvote_ratio || 0), 0) / totalPosts : 0;
          const visibilityScore = avgUpvotes * avgUpvoteRatio;

          const uniqueAuthors = new Set();
          posts.forEach((post: any) => {
            if (post.data.author && post.data.author !== '[deleted]') {
              uniqueAuthors.add(post.data.author);
            }
          });

          const removedCount = posts.filter((post: any) => 
            post.data.removed_by_category || 
            post.data.selftext === '[removed]' || 
            post.data.selftext === '[deleted]'
          ).length;
          const strictnessIndex = totalPosts > 0 ? removedCount / totalPosts : 0;

          // Extract top themes from titles
          const words: string[] = [];
          posts.forEach((post: any) => {
            if (post.data.title) {
              const titleWords = post.data.title.toLowerCase().match(/\b\w+\b/g) || [];
              words.push(...titleWords);
            }
          });

          const stopwords = new Set(['the', 'and', 'to', 'of', 'a', 'in', 'for', 'is', 'on', 'with', 'by', 'at', 'an', 'this', 'that', 'it']);
          const filtered = words.filter(w => !stopwords.has(w) && w.length > 2);
          
          const wordCounts: { [key: string]: number } = {};
          filtered.forEach(word => {
            wordCounts[word] = (wordCounts[word] || 0) + 1;
          });

          const topThemes = Object.entries(wordCounts)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 4)
            .map(([word, count]) => ({ word, count }));

          return {
            subreddit,
            engagement_rate: engagementRate,
            visibility_score: visibilityScore,
            active_posters: uniqueAuthors.size,
            strictness_index: strictnessIndex,
            top_themes: topThemes,
            subscribers: subredditInfo.data?.subscribers || 0
          };
        } catch (error) {
          console.error(`Error analyzing r/${subreddit}:`, error);
          return {
            subreddit,
            engagement_rate: 0,
            visibility_score: 0,
            active_posters: 0,
            strictness_index: 0,
            top_themes: [],
            subscribers: 0
          };
        }
      })
    );

    // Store the analytics in the database
    const analyticsToStore = analytics.map(item => ({
      website_url: websiteUrl,
      subreddit: item.subreddit,
      engagement_rate: item.engagement_rate,
      visibility_score: item.visibility_score,
      active_posters: item.active_posters,
      strictness_index: item.strictness_index,
      top_themes: item.top_themes,
      subscribers: item.subscribers
    }));

    const { error: insertError } = await supabase
      .from('reddit_subreddit_analytics')
      .insert(analyticsToStore);

    if (insertError) {
      console.error('Error storing analytics:', insertError);
    } else {
      console.log('Successfully stored analytics for', websiteUrl);
    }

    return new Response(JSON.stringify({ analytics }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in reddit-analytics function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
